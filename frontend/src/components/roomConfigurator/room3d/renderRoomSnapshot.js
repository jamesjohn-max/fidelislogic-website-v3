import * as THREE from "three";
import { WALL_T, buildRoomScene, cutAwayWalls, overviewCameraPose } from "./buildRoomScene";
import { ROOMZ_SIZE, WIRED_SIZE } from "./roomzScheduler";
import { placedCameras, placedScreens } from "../../../lib/roomSightlines";

export const SNAPSHOT_WATERMARK = "Made using Room Planner from Fidelis Logic";

// Stills of the finished room for the PDF report, rendered off screen at print size:
//   overview the whole room from above a corner, near walls and ceiling lifted off, so
//            everyone seated and every device shows;
//   outside  standing back in the corridor by the entrance: the door with the room's
//            name, any room scheduler beside it (and again close up, inset), and the
//            rest of the wall made see-through so the whole room shows behind them.
// Each is marked in its top-left corner with where it was made. Returns
// { outside, overview } as 2D canvases (outside is null when the plan has no door),
// or null when the browser can't render 3D.
export async function renderRoomSnapshots({ room, layoutResult, tableOffset, seats, devices, finishes, audioPreference, roomName }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch {
    return null;
  }
  const screens = placedScreens(devices, room);
  const cameras = placedCameras(devices, screens);
  const built = buildRoomScene({ room, layoutResult, tableOffset, seats, screens, cameras, devices, finishes, audioPreference, roomName });
  const extras = [];
  try {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping; // keeps whites white
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    // A light backdrop reads better on a white page than the on-screen navy.
    renderer.setClearColor(0xeef2f6);
    built.overlays.visible = false;
    // Both pictures look from outside the room, where the window view would float.
    built.views.forEach((v) => { v.visible = false; });
    built.walls.forEach((w) => { w.visible = true; });
    built.wallItems.forEach(({ object }) => { object.visible = true; });

    const outside = built.entrance ? renderOutside(renderer, built, room, extras) : null;
    const overview = renderOverview(renderer, built, room, screens, devices.door);
    return { outside, overview };
  } finally {
    extras.forEach((o) => {
      o.geometry?.dispose();
      if (o.material !== built.materials.wall) o.material?.dispose();
    });
    built.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

// Renders the scene from `camera` at a size and copies it out, so the renderer can be
// reused for the next view.
function capture(renderer, scene, camera, width, height) {
  renderer.setSize(width, height, false);
  renderer.render(scene, camera);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.getContext("2d").drawImage(renderer.domElement, 0, 0);
  return c;
}

// Zooms a positioned camera out (or in) until every one of `points` is in the picture,
// keeping the picture's proportions: the view is offset to the box those points cover.
function frameToPoints(camera, points, W, H, margin = 0.06) {
  const px = points.map((c) => {
    const p = c.clone().project(camera);
    return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H };
  });
  let x0 = Math.min(...px.map((p) => p.x)), x1 = Math.max(...px.map((p) => p.x));
  let y0 = Math.min(...px.map((p) => p.y)), y1 = Math.max(...px.map((p) => p.y));
  const m = margin * Math.max(x1 - x0, y1 - y0);
  x0 -= m; x1 += m; y0 -= m; y1 += m;
  let bw = x1 - x0, bh = y1 - y0;
  if (bw / bh > W / H) {
    const nh = bw / (W / H);
    y0 -= (nh - bh) / 2;
    bh = nh;
  } else {
    const nw = bh * (W / H);
    x0 -= (nw - bw) / 2;
    bw = nw;
  }
  camera.setViewOffset(W, H, x0, y0, bw, bh);
}

// The room's outline in 3D: its floor corners and the tops of its walls.
function roomCorners(room) {
  const hx = room.length / 2 + WALL_T, hz = room.width / 2 + WALL_T;
  const pts = [];
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
    pts.push(new THREE.Vector3(sx * hx, 0, sz * hz), new THREE.Vector3(sx * hx, room.height, sz * hz));
  }));
  return pts;
}

function renderOutside(renderer, built, room, extras) {
  const { scene, walls, materials } = built;
  const { wall, door, scheduler, schedulerWired, out, along } = built.entrance;
  const W = 1800, H = 1100;

  // The entrance wall turned to faint glass, outlined, so the room shows through it...
  const entranceWall = walls.find((w) => w.userData.wall === wall);
  const solid = entranceWall.material;
  const glass = new THREE.MeshStandardMaterial({ color: solid.color, transparent: true, opacity: 0.1, depthWrite: false, roughness: 0.1 });
  entranceWall.material = glass;
  entranceWall.castShadow = false;
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(entranceWall.geometry), new THREE.LineBasicMaterial({ color: 0x64748b }));
  outline.position.copy(entranceWall.position);
  scene.add(outline);
  // ...except a solid stretch round the door and scheduler, so they read as mounted on
  // a wall rather than floating in the room.
  const alongOf = (p) => p.clone().sub(door).dot(along);
  const ends = [-0.75, 0.75];
  if (scheduler) ends.push(alongOf(scheduler) - 0.35, alongOf(scheduler) + 0.35);
  const from = Math.min(...ends), to = Math.max(...ends);
  const surround = new THREE.Mesh(new THREE.BoxGeometry(to - from, room.height, WALL_T + 0.002), solid);
  surround.position.copy(door).addScaledVector(along, (from + to) / 2).addScaledVector(out, WALL_T / 2).setY(room.height / 2);
  surround.rotation.y = Math.atan2(-along.z, along.x);
  surround.castShadow = true;
  surround.receiveShadow = true;
  scene.add(surround);
  // A corridor floor to stand on, and light on the corridor side of the wall.
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0xcfd5dc, roughness: 0.9 }));
  corridor.rotation.x = -Math.PI / 2;
  corridor.position.y = -0.004;
  corridor.receiveShadow = true;
  scene.add(corridor);
  const front = new THREE.DirectionalLight(0xffffff, 1.0);
  scene.add(front, front.target);
  extras.push(glass, outline, corridor, surround);
  built.ceiling.visible = true;
  materials.ceilingDevice.opacity = 1;

  // Stand well back in the corridor, off to the side of the entrance away from the
  // room's middle, looking at the door and its scheduler with the whole room behind
  // them through the glass. How far back follows the room's size, so a big room still
  // fits in the frame; the inset below keeps the scheduler legible.
  const doorFace = door.clone().addScaledVector(out, WALL_T);
  const entrance = scheduler ? doorFace.clone().lerp(scheduler.clone(), 0.4) : doorFace.clone();
  // Aim between the entrance and the middle of the room, so both are in the picture.
  const focus = entrance.clone().lerp(new THREE.Vector3(0, 0, 0), 0.45).setY(1.12);
  const middle = new THREE.Vector3().sub(door).dot(along);
  const away = middle > 0 ? -1 : 1;
  const tilt = 0.5;
  const dir = out.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(along, away * Math.sin(tilt)).normalize();
  const camera = new THREE.PerspectiveCamera(58, W / H, 0.05, 200);
  // Back off by the room's own diagonal, then frame to whatever is still outside the
  // picture, so the whole room, the door and its scheduler are always all in it.
  const back = Math.min(Math.max(0.62 * Math.hypot(room.length, room.width), 4.2), 11);
  camera.position.copy(focus).addScaledVector(dir, back).setY(1.75);
  camera.lookAt(focus);
  camera.updateMatrixWorld();
  frameToPoints(camera, [...roomCorners(room), doorFace, ...(scheduler ? [scheduler] : [])], W, H, 0.08);
  camera.updateMatrixWorld();
  front.position.copy(camera.position).add(new THREE.Vector3(0, 2.5, 0));
  front.target.position.copy(focus);

  const canvas = capture(renderer, scene, camera, W, H);

  // The scheduler close up, inset in the bottom corner away from the door, so its
  // screen reads on the page.
  if (scheduler) {
    const IW = 470, IH = 385;
    const close = new THREE.PerspectiveCamera(30, IW / IH, 0.01, 20);
    // Far enough back to frame whichever panel is on the wall.
    close.position.copy(scheduler).addScaledVector(out, schedulerWired ? WIRED_SIZE.w * 1.7 : ROOMZ_SIZE.h * 2.1).add(new THREE.Vector3(0, 0.02, 0));
    close.lookAt(scheduler);
    const inset = capture(renderer, scene, close, IW, IH);
    const doorOnScreen = doorFace.clone().setY(1).project(camera).x;
    const g = canvas.getContext("2d");
    const pad = 28;
    const x = doorOnScreen > 0 ? pad + 8 : W - IW - pad;
    const y = H - IH - pad - 34;
    g.fillStyle = "#ffffff";
    g.shadowColor = "rgba(15,23,42,0.25)";
    g.shadowBlur = 18;
    g.beginPath();
    g.roundRect(x - 8, y - 8, IW + 16, IH + 16 + 34, 14);
    g.fill();
    g.shadowBlur = 0;
    g.save();
    g.beginPath();
    g.roundRect(x, y, IW, IH, 8);
    g.clip();
    g.drawImage(inset, x, y);
    g.restore();
    g.fillStyle = "#334155";
    g.font = `600 22px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    g.textBaseline = "middle";
    g.fillText(schedulerWired ? "Wired Room Display" : "ROOMZ Wireless Room Scheduler", x + 4, y + IH + 21);
  }

  drawWatermark(canvas.getContext("2d"), W);

  // Put the wall back for the next view.
  entranceWall.material = solid;
  entranceWall.castShadow = true;
  scene.remove(outline, corridor, front, front.target, surround);
  return canvas;
}

// The whole room from above one corner (the one that keeps the screen's and door's
// walls in view), near walls and ceiling lifted off, framed tightly round the room.
function renderOverview(renderer, built, room, screens, doors) {
  const W = 1800, H = 1100;
  built.ceiling.visible = false;
  // Ceiling mics and speakers stay visible, faded so the table shows through.
  built.materials.ceilingDevice.opacity = 0.35;

  const { pos, target } = overviewCameraPose(room, screens, doors);
  // Same corner as the on-screen overview, but lower (about 34° up), so the room
  // spreads across the landscape picture instead of standing tall in the middle.
  const flat = pos.clone().sub(target).setY(0).normalize();
  const rise = (34 * Math.PI) / 180;
  const dir = flat.multiplyScalar(Math.cos(rise)).setY(Math.sin(rise));
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
  const radius = 0.5 * Math.hypot(room.length, room.width, room.height) + 0.5;
  camera.position.copy(target).addScaledVector(dir, radius / Math.sin((19 * Math.PI) / 180));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  cutAwayWalls(built.walls, camera.position, true, built.wallItems);

  // Crop to the room: its floor corners, and the tops of the walls still standing.
  const corners = roomCorners(room).filter(
    (c) => c.y === 0 || built.walls.some((w) => w.visible && w.userData.normal.dot(new THREE.Vector3(Math.sign(c.x), 0, Math.sign(c.z))) > 0)
  );
  frameToPoints(camera, corners, W, H, 0.05);

  const canvas = capture(renderer, built.scene, camera, W, H);
  drawWatermark(canvas.getContext("2d"), W);
  return canvas;
}

// Small, in the top-left corner: a translucent pill with the credit on it.
function drawWatermark(g, width) {
  const size = Math.round(width / 75);
  const padX = size * 0.8, padY = size * 0.5, inset = size;
  g.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  const textW = g.measureText(SNAPSHOT_WATERMARK).width;
  const w = textW + padX * 2 + size * 0.9, h = size + padY * 2;
  g.fillStyle = "rgba(15, 23, 42, 0.55)";
  g.beginPath();
  g.roundRect(inset, inset, w, h, h / 2);
  g.fill();
  // Brand dot, then the text.
  g.fillStyle = "#4badd4";
  g.beginPath();
  g.arc(inset + padX + size * 0.25, inset + h / 2, size * 0.25, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(255, 255, 255, 0.92)";
  g.textBaseline = "middle";
  g.fillText(SNAPSHOT_WATERMARK, inset + padX + size * 0.9, inset + h / 2 + 1);
}
