import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Armchair, Camera, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Box, Users } from "lucide-react";
import { buildRoomScene, cutAwayWalls, overviewCameraPose, toWorld } from "./buildRoomScene";
import { HEIGHTS, placedCameras, placedScreens, roomSightlineSummary, seatExperience } from "../../../lib/roomSightlines";

// The review step's 3D view: the plan built as a room you can orbit, then sit in any
// seat to see what it sees — the screens, who's in the way, and whether a camera gets
// your face — or look through any camera. Rendering only happens when something moves.

const RATING_COLOR = { good: 0x22c55e, fair: 0xf59e0b, poor: 0xef4444 };
const RATING_TEXT = { good: "text-emerald-300", fair: "text-amber-300", poor: "text-red-300" };
const RATING_DOT = { good: "bg-emerald-400", fair: "bg-amber-400", poor: "bg-red-400" };
const TWEEN_MS = 650;
const SEAT_FOV = 62;
// A seated view shows at least this much side to side, so a tall phone screen doesn't
// feel like looking through a letterbox.
const SEAT_MIN_HFOV = 75;
const seatFov = (aspect) =>
  Math.min(100, Math.max(SEAT_FOV, (2 * Math.atan(Math.tan((SEAT_MIN_HFOV * Math.PI) / 360) / aspect) * 180) / Math.PI));
const MAX_PITCH = 1.25;

const ease = (t) => 1 - Math.pow(1 - t, 3);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Yaw/pitch (camera rotation, order YXZ) that looks from `from` toward `to`.
function lookAngles(from, to) {
  const d = new THREE.Vector3().subVectors(to, from);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}
const quatFrom = ({ yaw, pitch }) => new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));

function Segmented({ value, onChange, options }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex rounded-lg border border-white/[0.08] bg-[color:var(--rc-panel-bar)] p-0.5 backdrop-blur-xl">
      {options.map(({ id, label, short, icon: Icon, disabled }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          disabled={disabled}
          onClick={() => onChange(id)}
          className={`flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-[background-color,color,transform] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${
            value === id ? "bg-blue-600 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          {short ? (
            <>
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </button>
      ))}
    </div>
  );
}

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-[background-color,color,transform] duration-100 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-30";

function Metric({ label, value, note, rating }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
      <p className={`mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums ${rating ? RATING_TEXT[rating] : "text-white"}`}>
        {rating && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${RATING_DOT[rating]}`} />}
        {value}
      </p>
      {note && <p className="mt-0.5 text-[11px] leading-snug text-white/45">{note}</p>}
    </div>
  );
}

function SeatReport({ experience, analysis }) {
  if (!analysis) {
    return <p className="text-xs leading-snug text-white/60">The view from this seat. Drag to look around.</p>;
  }
  const { best, seenBy, cameraRating } = experience;
  if (!best) {
    return <p className="text-xs leading-snug text-white/60">No screen in the plan yet. Add a display on the Video step to check sightlines.</p>;
  }
  const blocked = best.blockedShare > 0;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
      <Metric
        label={`Distance to ${best.screen.code}`}
        value={`${best.distance.toFixed(1)} m`}
        note={`${best.multiple.toFixed(1)}× picture height · ${best.distanceLabel}`}
        rating={best.ratings.distance}
      />
      <Metric
        label="Line of sight"
        value={blocked ? `${Math.round(best.blockedShare * 100)}% blocked` : "Clear"}
        note={blocked ? `By ${best.blockedBy.map((i) => `seat ${i + 1}`).join(", ")}` : "No heads in the way"}
        rating={best.ratings.sightline}
      />
      <Metric
        label="Viewing angle"
        value={`${Math.round(best.offAxis)}° off-centre`}
        note={best.offAxis > 90 ? "Behind the screen" : best.offAxis > 45 ? "Picture looks skewed" : "Straight on"}
        rating={best.ratings.angle}
      />
      <Metric label="Looking up" value={`${Math.round(Math.max(0, best.upward))}°`} note="To the top of the picture" rating={best.ratings.upward} />
      <Metric label="Head turn" value={`${Math.round(best.turn)}°`} note="From the way the chair faces" rating={best.ratings.turn} />
      <Metric
        label="On camera"
        value={cameraRating == null ? "No camera" : seenBy.length ? `Seen by ${seenBy.map((c) => c.code).join(", ")}` : "Not seen face-on"}
        note={cameraRating === "poor" ? "Far end sees their back or nothing" : cameraRating ? "Face in frame" : "Add one on the Video step"}
        rating={cameraRating || undefined}
      />
    </div>
  );
}

export default function RoomViewer3D({ room, layoutResult, tableOffset, seats, devices, finishes, audioPreference, roomName, analysis = true }) {
  const containerRef = useRef(null);
  const three = useRef(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("overview");
  const [seatIndex, setSeatIndex] = useState(0);
  const [camIndex, setCamIndex] = useState(0);
  const [showPeople, setShowPeople] = useState(true);
  // The seat's full read-out, or just its headline, so more of the view shows.
  // Folded on a phone, where it would cover most of the view.
  const [detailsOpen, setDetailsOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches);
  const [sceneVersion, setSceneVersion] = useState(0);

  const screens = useMemo(() => placedScreens(devices, room), [devices, room]);
  const cameras = useMemo(() => placedCameras(devices, screens), [devices, screens]);
  const ctx = useMemo(() => ({ seats, screens, cameras }), [seats, screens, cameras]);
  const safeSeat = seats.length ? Math.min(seatIndex, seats.length - 1) : -1;
  const experience = useMemo(() => (safeSeat >= 0 ? seatExperience(safeSeat, ctx) : null), [safeSeat, ctx]);
  const summary = useMemo(() => (analysis && screens.length && seats.length ? roomSightlineSummary(ctx) : null), [analysis, ctx, screens.length, seats.length]);
  const viewCams = cameras;
  const safeCam = viewCams.length ? Math.min(camIndex, viewCams.length - 1) : -1;

  // --- renderer, camera and controls: once -----------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setError("3D view isn't available in this browser (WebGL is turned off or unsupported).");
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping; // keeps whites white
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x0b1220);
    renderer.domElement.className = "block h-full w-full touch-none select-none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.prepend(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 1.5;
    controls.maxDistance = 60;
    controls.screenSpacePanning = false;

    const state = {
      renderer,
      camera,
      controls,
      built: null,
      dirty: true,
      tween: null,
      mode: "overview",
      look: { yaw: 0, pitch: 0 },
      lookEnabled: false,
      overviewPose: null,
      sightlines: null,
      invalidate() { state.dirty = true; },
    };
    three.current = state;
    controls.addEventListener("change", state.invalidate);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (state.onResize) state.onResize();
      camera.updateProjectionMatrix();
      state.dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const t = state.tween;
      if (t) {
        const k = t.duration ? Math.min(1, (now - t.start) / t.duration) : 1;
        const e = ease(k);
        camera.position.lerpVectors(t.fromPos, t.toPos, e);
        camera.quaternion.slerpQuaternions(t.fromQuat, t.toQuat, e);
        camera.fov = t.fromFov + (t.toFov - t.fromFov) * e;
        camera.updateProjectionMatrix();
        state.dirty = true;
        if (k >= 1) {
          state.tween = null;
          t.done?.();
        }
      } else if (state.mode === "overview" && controls.enabled) {
        controls.update();
      }
      if (!state.dirty || !state.built) return;
      state.dirty = false;
      // Cut away the walls between the camera and the room, so the overview sees in.
      cutAwayWalls(state.built.walls, camera.position, state.mode === "overview", state.built.wallItems);
      renderer.render(state.built.scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      state.built?.dispose();
      state.sightlines?.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      renderer.dispose();
      renderer.domElement.remove();
      three.current = null;
    };
  }, []);

  // --- the scene: rebuilt whenever the plan changes ----------------------------------
  useEffect(() => {
    const s = three.current;
    if (!s) return;
    s.built?.dispose();
    s.built = buildRoomScene({ room, layoutResult, tableOffset, seats, screens, cameras, devices, finishes, audioPreference, roomName });
    s.sightlines = null;
    s.dirty = true;
    setSceneVersion((v) => v + 1);
  }, [room, layoutResult, tableOffset, seats, screens, cameras, devices, finishes, audioPreference, roomName]);

  // Where the overview starts: behind the room from the main screen, looking in.
  const overviewPose = useCallback(() => overviewCameraPose(room, screens, devices.door), [room, screens, devices.door]);

  // Moves the camera to a pose, eased unless reduced motion is on.
  const flyTo = useCallback((toPos, toQuat, toFov, done) => {
    const s = three.current;
    const { camera } = s;
    s.tween = {
      start: performance.now(),
      duration: reducedMotion() ? 0 : TWEEN_MS,
      fromPos: camera.position.clone(),
      toPos,
      fromQuat: camera.quaternion.clone(),
      toQuat,
      fromFov: camera.fov,
      toFov,
      done,
    };
  }, []);

  const eyeOf = useCallback((i) => toWorld(room, seats[i].x, seats[i].y, HEIGHTS.seatedEye), [room, seats]);

  // --- apply the view: mode, seat, camera, people ----------------------------------
  useEffect(() => {
    const s = three.current;
    if (!s?.built) return;
    const { camera, controls, built } = s;
    const firstFrame = !s.initialised;
    s.initialised = true;
    const prevMode = s.mode;
    if (prevMode === "overview" && mode !== "overview" && !firstFrame) {
      s.overviewPose = { pos: camera.position.clone(), target: controls.target.clone() };
    }
    s.mode = mode;
    s.onResize = null;

    // People and highlights.
    const blockers = new Set(analysis && experience?.best ? experience.best.blockedBy : []);
    built.seatObjects.forEach(({ person, chair, headMeshes }, i) => {
      person.visible = showPeople && !(mode === "seat" && i === safeSeat);
      const blocking = blockers.has(i) && mode !== "camera";
      headMeshes.forEach(({ mesh, material }) => { mesh.material = blocking ? built.materials.blocker : material; });
      chair.traverse((o) => {
        if (!o.userData.upholstery) return;
        o.userData.baseMaterial = o.userData.baseMaterial || o.material;
        o.material = i === safeSeat && mode === "overview" ? built.materials.chairActive : o.userData.baseMaterial;
      });
    });
    built.ceiling.visible = mode !== "overview";
    // The view out of any windows only makes sense from inside the room.
    built.views.forEach((v) => { v.visible = mode !== "overview"; });
    built.materials.ceilingDevice.opacity = mode === "overview" ? 0.3 : 1;
    built.overlays.visible = mode === "overview";

    // Sightlines from the selected seat, in the overview.
    if (s.sightlines) {
      built.scene.remove(s.sightlines);
      s.sightlines.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      s.sightlines = null;
    }
    if (mode === "overview" && analysis && experience) {
      const g = new THREE.Group();
      const eye = eyeOf(safeSeat);
      const tube = (from, to, color, radius = 0.014, opacity = 0.95) => {
        const geo = new THREE.TubeGeometry(new THREE.LineCurve3(from, to), 1, radius, 8, false);
        g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false })));
      };
      experience.views.forEach((v, i) => {
        tube(eye, toWorld(room, v.screen.x, v.screen.y, v.screen.center), RATING_COLOR[v.rating], i === 0 ? 0.016 : 0.009, i === 0 ? 0.95 : 0.5);
      });
      experience.seenBy.forEach((c) => tube(toWorld(room, c.x, c.y, c.z), eye, 0x22d3ee, 0.008, 0.6));
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0x60a5fa, depthTest: false }));
      marker.position.copy(eye);
      g.add(marker);
      g.renderOrder = 10;
      g.traverse((o) => { o.renderOrder = 10; });
      built.scene.add(g);
      s.sightlines = g;
    }

    // Camera.
    s.lookEnabled = false;
    if (mode === "overview") {
      const pose = s.overviewPose || overviewPose();
      controls.target.copy(pose.target);
      if (firstFrame || prevMode === "overview") {
        if (firstFrame) {
          camera.position.copy(pose.pos);
          camera.fov = 50;
          camera.updateProjectionMatrix();
        }
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        const m = new THREE.Matrix4().lookAt(pose.pos, pose.target, new THREE.Vector3(0, 1, 0));
        flyTo(pose.pos, new THREE.Quaternion().setFromRotationMatrix(m), 50, () => {
          controls.enabled = true;
          controls.update();
        });
      }
    } else if (mode === "seat" && safeSeat >= 0) {
      controls.enabled = false;
      const eye = eyeOf(safeSeat);
      const seat = seats[safeSeat];
      // Look at the screen this seat watches best, or the way the chair faces.
      const best = experience?.best;
      const look = best && best.turn <= 120
        ? lookAngles(eye, toWorld(room, best.screen.x, best.screen.y, best.screen.center))
        : { yaw: -(seat.angle * Math.PI) / 180, pitch: -0.1 };
      s.look = look;
      s.onResize = () => { camera.fov = seatFov(camera.aspect); };
      flyTo(eye, quatFrom(look), seatFov(camera.aspect), () => { s.lookEnabled = true; });
    } else if (mode === "camera" && safeCam >= 0) {
      controls.enabled = false;
      const c = viewCams[safeCam];
      const a = (c.angle * Math.PI) / 180;
      const forward = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a));
      const pos = toWorld(room, c.x, c.y, c.z).add(forward.clone().multiplyScalar(0.08));
      // Tilted down toward the people at the table, a few metres out.
      const reach = Math.min(3, Math.max(room.length, room.width) * 0.45);
      const look = c.fov >= 360
        ? { yaw: -a, pitch: 0 }
        : lookAngles(pos, pos.clone().add(forward.multiplyScalar(reach)).setY(HEIGHTS.seatedEye - 0.1));
      s.look = look;
      // Match the lens's horizontal field of view (as far as a flat picture can show it).
      const vfov = () => {
        const h = (Math.min(c.fov >= 360 ? 100 : c.fov, 140) * Math.PI) / 180;
        return (2 * Math.atan(Math.tan(h / 2) / camera.aspect) * 180) / Math.PI;
      };
      s.onResize = () => { camera.fov = vfov(); };
      flyTo(pos, quatFrom(look), vfov(), () => { s.lookEnabled = c.fov >= 360; });
    }
    s.dirty = true;
  }, [mode, safeSeat, safeCam, showPeople, sceneVersion, experience, analysis, room, seats, viewCams, eyeOf, flyTo, overviewPose]);

  // --- look around (seat view, 360° cameras), zoom, and picking seats -----------------
  useEffect(() => {
    const s = three.current;
    if (!s) return undefined;
    const el = s.renderer.domElement;
    let drag = null;
    const down = (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      if (s.lookEnabled) el.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!s.lookEnabled || s.tween) return;
      const speed = (s.camera.fov / 60) * 0.005;
      s.look = { yaw: s.look.yaw + dx * speed, pitch: Math.max(-MAX_PITCH, Math.min(MAX_PITCH, s.look.pitch + dy * speed)) };
      s.camera.quaternion.copy(quatFrom(s.look));
      s.dirty = true;
    };
    const up = (e) => {
      const click = drag && drag.moved < 6;
      drag = null;
      if (!click || s.mode !== "overview" || !s.built) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, s.camera);
      const hit = ray.intersectObjects(s.built.seatObjects.map((o) => o.holder), true).find((h) => h.object.userData.seatIndex != null);
      if (hit) setSeatIndex(hit.object.userData.seatIndex);
    };
    const dbl = () => {
      if (s.mode === "overview" && s.built) setMode("seat");
    };
    // Scroll zooms the eye in seat and camera views (the overview's controls zoom there).
    const wheel = (e) => {
      if (s.mode === "overview" || s.tween) return;
      e.preventDefault();
      s.camera.fov = Math.max(20, Math.min(90, s.camera.fov + e.deltaY * 0.03));
      s.camera.updateProjectionMatrix();
      s.dirty = true;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => { drag = null; });
    el.addEventListener("dblclick", dbl);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("dblclick", dbl);
      el.removeEventListener("wheel", wheel);
    };
  }, [error]);

  const stepSeat = (d) => seats.length && setSeatIndex((i) => (Math.min(i, seats.length - 1) + d + seats.length) % seats.length);
  const stepCam = (d) => viewCams.length && setCamIndex((i) => (Math.min(i, viewCams.length - 1) + d + viewCams.length) % viewCams.length);

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      if (mode === "camera") stepCam(d);
      else stepSeat(d);
    } else if (e.key === "Escape" && mode !== "overview") {
      setMode("overview");
    } else if (e.key === "Enter" && mode === "overview" && seats.length) {
      setMode("seat");
    }
  };

  const hint =
    mode === "overview"
      ? "Drag to orbit, scroll or pinch to zoom. Click a chair to check its view, double-click to sit."
      : mode === "seat"
      ? "Drag to look around, scroll to zoom. ← → for the next seat."
      : safeCam >= 0 && viewCams[safeCam].fov >= 360
      ? "Drag to look around the 360° camera."
      : "What this camera frames. ← → for the next camera.";

  if (error) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-white/[0.08] bg-[color:var(--rc-panel)] p-6 text-center text-sm text-white/60">
        {error}
      </div>
    );
  }

  const cam = safeCam >= 0 ? viewCams[safeCam] : null;
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="application"
      aria-label="3D view of the room. Arrow keys move between seats, Enter sits in the selected seat, Escape returns to the overview."
      className="relative h-full w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[color:var(--rc-panel)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Top bar: which view, and whether people are drawn in. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { id: "overview", label: "Overview", icon: Box },
              { id: "seat", label: "Sit in a seat", short: "Seat", icon: Armchair, disabled: !seats.length },
              { id: "camera", label: "Camera view", short: "Camera", icon: Camera, disabled: !viewCams.length },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          aria-pressed={showPeople}
          className="pointer-events-auto flex min-h-[34px] items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[color:var(--rc-panel-bar)] px-2.5 text-xs font-semibold text-white/70 backdrop-blur-xl transition-[background-color,color,transform] duration-100 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97]"
        >
          {showPeople ? <Users aria-hidden="true" className="h-3.5 w-3.5" /> : <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{showPeople ? "People shown" : "People hidden"}</span>
          <span className="sm:hidden">{showPeople ? "People" : "Hidden"}</span>
        </button>
      </div>

      {/* Bottom: the seat (or camera) navigator and what it sees. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <div className="pointer-events-auto rounded-2xl border border-white/[0.08] bg-[color:var(--rc-panel-glass)] p-3 shadow-xl backdrop-blur-xl">
          {mode === "camera" && cam ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => stepCam(-1)} aria-label="Previous camera" className={iconButton} disabled={viewCams.length < 2}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="min-w-[8rem] text-center text-[13px] font-semibold text-white" aria-live="polite">
                  {cam.code} · {cam.kind === "tableCam" ? "360° camera" : cam.kind === "videoBar" ? "Video bar" : cam.kind === "allInOne" ? "All-in-one" : "Camera"} · {cam.fov >= 360 ? "360°" : `${cam.fov}°`}
                </p>
                <button type="button" onClick={() => stepCam(1)} aria-label="Next camera" className={iconButton} disabled={viewCams.length < 2}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {analysis && (
                <p className="text-right text-xs text-white/55">
                  Sees {seats.length - (summary?.unseen ?? 0)} of {seats.length} faces across all cameras
                </p>
              )}
            </div>
          ) : seats.length ? (
            <>
              <div className={`flex flex-wrap items-center justify-between gap-2 ${detailsOpen ? "mb-2.5" : ""}`}>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => stepSeat(-1)} aria-label="Previous seat" className={iconButton} disabled={seats.length < 2}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="min-w-[6.5rem] text-center text-[13px] font-semibold text-white" aria-live="polite">
                    Seat {safeSeat + 1} <span className="font-normal text-white/45">of {seats.length}</span>
                  </p>
                  <button type="button" onClick={() => stepSeat(1)} aria-label="Next seat" className={iconButton} disabled={seats.length < 2}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  {mode === "overview" ? (
                    <button
                      type="button"
                      onClick={() => setMode("seat")}
                      className="ml-1 flex min-h-[32px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-100 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.97]"
                    >
                      <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                      Sit here
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMode("overview")}
                      className="ml-1 flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 text-xs font-semibold text-white/80 transition-[background-color,transform] duration-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97]"
                    >
                      <Box aria-hidden="true" className="h-3.5 w-3.5" />
                      Stand up
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                {summary && (
                  <p className="flex items-center gap-2.5 text-[11px] font-medium text-white/55">
                    <span className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${RATING_DOT.good}`} />{summary.good} good</span>
                    <span className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${RATING_DOT.fair}`} />{summary.fair} fair</span>
                    <span className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${RATING_DOT.poor}`} />{summary.poor} poor</span>
                    {cameras.length > 0 && <span>· {summary.unseen} off camera</span>}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setDetailsOpen((v) => !v)}
                  aria-expanded={detailsOpen}
                  aria-label={detailsOpen ? "Hide seat details" : "Show seat details"}
                  className={iconButton}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${detailsOpen ? "" : "rotate-180"}`} />
                </button>
                </div>
              </div>
              {detailsOpen && <SeatReport experience={experience} analysis={analysis} />}
            </>
          ) : (
            <p className="text-xs text-white/60">No seats yet. Pick a layout to furnish the room.</p>
          )}
          {(detailsOpen || mode === "camera") && <p className="mt-2.5 hidden text-[11px] text-white/35 sm:block">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
