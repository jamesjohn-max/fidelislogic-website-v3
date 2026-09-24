import * as THREE from "three";
import { HEIGHTS, dirVector } from "../../../lib/roomSightlines";
import { AUDIO_PREFERENCES, SOUNDBAR_AUDIO, nearestEdge } from "../../../lib/roomConfiguratorEngine";
import { createPeopleKit } from "./buildPerson";
import { ROOMZ_SIZE, WIRED_SIZE, buildRoomzScheduler, buildWiredRoomPanel, roomzTexture, wiredPanelTexture } from "./roomzScheduler";
import {
  PALETTE,
  WALL_WHITE,
  WALL_BEHIND_SCREEN,
  floorFinish,
  ceilingColor as ceilingColorFor,
  topFinish,
  createStyleKit,
  officeChair,
  tableBase,
  glazing,
  ceilingLights,
} from "./interiorStyle";

// How thick the walls are: they're built outward from the room's measured size.
export const WALL_T = 0.12;
// Height of a room scheduler's centre beside the door.
const SCHEDULER_Y = 1.45;

// Builds the room as a three.js scene from the same plan the 2D canvas draws: walls,
// floor and ceiling in their finishes, the table group, every chair, and each device
// at a sensible height. Plan (x, y) maps to world (x, z) with the room centred on the
// origin; y is up. Everything is plain geometry, so it loads instantly.

const CEILING_MIC = AUDIO_PREFERENCES[0];

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...extra });

// The wall something faces out from, by the way it faces (0° = up the plan): a thing
// facing up the plan hangs on the bottom wall, and so on.
const wallFacing = (angle) => ["bottom", "left", "top", "right"][Math.round((((angle % 360) + 360) % 360) / 90) % 4];

// Which way something mounted on a wall faces into the room, taken from the wall it
// actually sits on rather than the angle stored with it. A door and its room scheduler
// are read from the corridor, so their sign and screen have to face out of the room
// whichever wall the door was dragged to (and however it was turned on the plan).
const WALL_INTO_ROOM = { top: 180, bottom: 0, left: 90, right: 270 };
const wallOf = (item, room) => item.edge || nearestEdge(item.x, item.y, room);
const facingIntoRoom = (item, room) => WALL_INTO_ROOM[wallOf(item, room)];

// Where the overview camera starts: raised over the corner that keeps the main
// screen's wall and the door's wall in view (those two are never cut away), looking
// in across the room toward the screen. Shared by the 3D view and the report's picture.
export function overviewCameraPose(room, screens, doors = []) {
  const span = Math.max(room.length, room.width);
  const target = new THREE.Vector3(0, 0.6, 0);
  // World x runs along the plan's x, world z along its y; the camera sits on the
  // opposite side from each wall it should see.
  let sx = 1, sz = 1;
  const keep = (wall) => {
    if (wall === "left") sx = 1;
    if (wall === "right") sx = -1;
    if (wall === "top") sz = 1;
    if (wall === "bottom") sz = -1;
  };
  const screenWall = screens[0] ? wallFacing(screens[0].angle) : null;
  const doorWall = doors[0] ? doors[0].edge || wallFacing(doors[0].angle || 0) : null;
  keep(doorWall);
  keep(screenWall); // the screen wins if the two pull opposite ways
  // Look mostly along the room toward the screen.
  const alongX = screenWall === "left" || screenWall === "right";
  const dir = new THREE.Vector3(sx * (alongX ? 1 : 0.6), 0, sz * (alongX ? 0.6 : 1)).normalize();
  const pos = target.clone().add(dir.multiplyScalar(span * 0.8)).add(new THREE.Vector3(0, span * 0.55 + room.height, 0));
  return { pos, target };
}

// Hides the walls between a camera outside the room and the room, so it sees in,
// and what's fixed to them (window glazing). Doors and room schedulers (`always`)
// stay, so they show from every angle.
export function cutAwayWalls(walls, cameraPosition, enabled = true, wallItems = []) {
  const hidden = new Set();
  walls.forEach((w) => {
    w.visible = !enabled || w.userData.normal.dot(new THREE.Vector3().subVectors(cameraPosition, w.position)) <= 0;
    if (!w.visible) hidden.add(w.userData.wall);
  });
  wallItems.forEach(({ object, wall, always }) => {
    object.visible = always || !hidden.has(wall);
  });
}

export function toWorld(room, x, y, h = 0) {
  return new THREE.Vector3(x - room.length / 2, h, y - room.width / 2);
}
// Turns an object built facing -z to face a plan angle.
const faceAngle = (obj, angleDeg) => {
  obj.rotation.y = -(angleDeg * Math.PI) / 180;
};

function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// The picture on each screen: a video call with the far-end people in tiles beside a
// shared slide, so how legible it is from a seat is something you can judge by eye.
function screenTexture(aspect) {
  const w = 1024;
  const h = aspect === "21:9" ? 439 : 576;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  g.fillStyle = "#0d1320";
  g.fillRect(0, 0, w, h);
  // Slide.
  const sw = w * 0.66, sh = h - 40;
  g.fillStyle = "#f4f6fa";
  g.fillRect(20, 20, sw, sh);
  g.fillStyle = "#1d4ed8";
  g.fillRect(20, 20, sw, sh * 0.16);
  g.fillStyle = "#ffffff";
  g.font = `600 ${Math.round(sh * 0.08)}px system-ui, sans-serif`;
  g.fillText("Quarterly review", 44, 20 + sh * 0.11);
  g.fillStyle = "#1f2937";
  // Body text at a typical presentation size (about 1/20 of the picture's height), then
  // the kind of small print a spreadsheet would have (about 1/40).
  g.font = `${Math.round(h / 20)}px system-ui, sans-serif`;
  ["Revenue up 12% on last quarter", "Two new regional partners", "Room refresh: 14 of 20 done"].forEach((line, i) => {
    g.fillText(`•  ${line}`, 44, 20 + sh * 0.3 + i * (h / 20) * 1.6);
  });
  g.fillStyle = "#4b5563";
  g.font = `${Math.round(h / 40)}px system-ui, sans-serif`;
  for (let i = 0; i < 4; i++) {
    g.fillText(`Region ${i + 1}   ·   Q1 ${120 + i * 7}   ·   Q2 ${131 + i * 5}   ·   Q3 ${140 + i * 9}   ·   Target ${150 + i * 6}`, 44, 20 + sh * 0.72 + i * (h / 40) * 1.7);
  }
  // Far-end participants.
  const tx = 40 + sw, tw = w - tx - 20, th = (sh - 20) / 3;
  const tones = ["#c58c68", "#8d5a3b", "#e0b594"];
  for (let i = 0; i < 3; i++) {
    const ty = 20 + i * (th + 10);
    const grad = g.createLinearGradient(0, ty, 0, ty + th);
    grad.addColorStop(0, "#2a3446");
    grad.addColorStop(1, "#1a2130");
    g.fillStyle = grad;
    g.fillRect(tx, ty, tw, th);
    g.fillStyle = "#3b4a63";
    g.beginPath();
    g.ellipse(tx + tw / 2, ty + th * 1.02, tw * 0.3, th * 0.42, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = tones[i];
    g.beginPath();
    g.arc(tx + tw / 2, ty + th * 0.42, th * 0.2, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildScreen(s, room, textures) {
  const group = new THREE.Group();
  const bezel = 0.025;
  const depth = s.category === "allInOne" ? 0.09 : 0.06;
  const frame = box(s.width + bezel * 2, s.height + bezel * 2, depth, mat(0x111316, { roughness: 0.4 }));
  group.add(frame);
  const key = s.aspect;
  if (!textures[key]) textures[key] = screenTexture(key);
  const picture = new THREE.Mesh(
    new THREE.PlaneGeometry(s.width, s.height),
    new THREE.MeshBasicMaterial({ map: textures[key], toneMapped: false })
  );
  picture.position.z = -depth / 2 - 0.001;
  picture.rotation.y = Math.PI;
  group.add(picture);
  if (s.category === "allInOne") {
    // Built-in camera and speaker bar.
    const bar = box(s.width * 0.4, 0.04, 0.05, mat(0x1b1d21));
    bar.position.set(0, s.height / 2 + bezel + 0.02, -depth / 2);
    group.add(bar);
  }
  group.position.copy(toWorld(room, s.x, s.y, s.center));
  // The picture is on the -z side, which faceAngle turns toward the room.
  faceAngle(group, s.angle);
  if (s.mount !== "wall") {
    // A cart: two legs and a foot.
    const legMat = mat(0x2a2d33, { metalness: 0.5, roughness: 0.4 });
    [-0.3, 0.3].forEach((dx) => {
      const leg = box(0.05, s.center, 0.05, legMat);
      leg.position.set(dx * s.width, -s.center / 2, depth / 2 + 0.03);
      group.add(leg);
    });
    const foot = box(s.width * 0.8, 0.04, 0.6, legMat);
    foot.position.set(0, -s.center + 0.02, depth / 2);
    group.add(foot);
  }
  group.userData = { kind: "screen", id: s.id };
  return group;
}

function buildCamera(c, room) {
  const group = new THREE.Group();
  const dark = mat(0x16181c, { roughness: 0.35 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x0a2a4a, roughness: 0.1, metalness: 0.6, emissive: 0x0b1e33 });
  if (c.kind === "tableCam") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 24), dark);
    body.castShadow = true;
    body.position.y = -0.11;
    group.add(body);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.05, 24), lens);
    ring.position.y = 0.0;
    group.add(ring);
  } else if (c.kind === "videoBar") {
    const bar = box(0.8, 0.08, 0.09, dark);
    group.add(bar);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.025, 20), lens);
    eye.position.set(0, 0, -0.046);
    eye.rotation.y = Math.PI;
    group.add(eye);
  } else if (c.kind === "camera") {
    const body = box(0.26, 0.1, 0.12, dark);
    group.add(body);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.032, 20), lens);
    eye.position.set(0, 0, -0.061);
    eye.rotation.y = Math.PI;
    group.add(eye);
  } else {
    return null; // built into its all-in-one, drawn with the screen
  }
  group.position.copy(toWorld(room, c.x, c.y, c.z));
  // Lenses are on the -z side: face them the way the camera aims.
  faceAngle(group, c.angle);
  return group;
}

// Field-of-view wedge on the floor, like the 2D plan's, for the overview.
function fovWedge(c, room) {
  if (c.fov >= 360) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 3, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(toWorld(room, c.x, c.y, 0.012));
    return ring;
  }
  const reach = Math.hypot(room.length, room.width);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const half = Math.min(c.fov, 179) / 2;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const a = c.angle - half + (2 * half * i) / steps;
    const d = dirVector(a);
    shape.lineTo(d.x * reach, d.y * reach);
  }
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  // Shape is in plan (x, y); lay it on the floor with plan y → world z.
  m.rotation.x = Math.PI / 2;
  m.position.copy(toWorld(room, c.x, c.y, 0.011));
  // Keep it inside the walls.
  m.material.clippingPlanes = roomClipPlanes(room);
  return m;
}

function roomClipPlanes(room) {
  const hx = room.length / 2, hz = room.width / 2;
  return [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), hx),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), hx),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), hz),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), hz),
  ];
}

function tableTop(shape, material, thickness = 0.05) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 48 });
  const m = new THREE.Mesh(geo, material);
  // Shape in plan (x, y) → lay flat, plan y → world z, top at table height.
  m.rotation.x = Math.PI / 2;
  m.position.y = HEIGHTS.table;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function rectShape(x, y, w, h) {
  const s = new THREE.Shape();
  s.moveTo(x, y);
  s.lineTo(x + w, y);
  s.lineTo(x + w, y + h);
  s.lineTo(x, y + h);
  s.closePath();
  return s;
}

// The table group, in plan coordinates relative to its centre (like layoutResult): the
// tops, on a light oak slab (long tables), a round pedestal (pods) or slim legs (desks).
function buildTables(tableShape, materials) {
  const group = new THREE.Group();
  const top = materials.top;
  const addTop = (shape) => group.add(tableTop(shape, top));
  const slab = (x, y, w, d) => group.add(tableBase("slab", { x, y, w, d }, materials));
  switch (tableShape.type) {
    case "rect": {
      const { w, h } = tableShape;
      addTop(rectShape(-w / 2, -h / 2, w, h));
      slab(0, 0, w, h);
      break;
    }
    case "ellipse": {
      const s = new THREE.Shape();
      s.absellipse(0, 0, tableShape.w / 2, tableShape.h / 2, 0, Math.PI * 2, false, 0);
      addTop(s);
      slab(0, 0, tableShape.w * 0.85, tableShape.h * 0.85);
      break;
    }
    case "segments":
      tableShape.segments.forEach((r) => {
        addTop(rectShape(r.x, r.y, r.w, r.h));
        slab(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      });
      break;
    case "desks":
      tableShape.desks.forEach((d) => {
        addTop(rectShape(d.x, d.y, d.w, d.h));
        group.add(tableBase("legs", { points: [{ x: d.x + 0.06, y: d.y + d.h / 2 }, { x: d.x + d.w - 0.06, y: d.y + d.h / 2 }] }, materials));
      });
      break;
    case "polygon": {
      const pts = tableShape.points;
      addTop(new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y))));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      slab((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.6, (y1 - y0) * 0.6);
      break;
    }
    case "pods":
      tableShape.tables.forEach((t) => {
        const s = new THREE.Shape();
        s.absarc(t.x, t.y, t.radius, 0, Math.PI * 2, false);
        addTop(s);
        group.add(tableBase("pedestal", { x: t.x, y: t.y, r: t.radius }, materials));
      });
      break;
    default:
      break;
  }
  return group;
}

// A door sign with the room's name, as a texture: light text on a dark plate, the
// name shrunk to fit on one line.
const PLATE_PX = { w: 640, h: 200 };
export const PLATE_M = { w: 0.56, h: 0.175 };
function nameplateTexture(name) {
  const c = document.createElement("canvas");
  c.width = PLATE_PX.w;
  c.height = PLATE_PX.h;
  const g = c.getContext("2d");
  g.fillStyle = "#1c2230";
  g.beginPath();
  g.roundRect(0, 0, c.width, c.height, 22);
  g.fill();
  g.fillStyle = "#4badd4";
  g.fillRect(c.width / 2 - 35, c.height - 34, 70, 6);
  g.fillStyle = "#ffffff";
  g.textBaseline = "middle";
  g.textAlign = "center";
  let size = 104;
  do {
    g.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    size -= 2;
  } while (g.measureText(name).width > c.width - 80 && size > 24);
  let text = name;
  // Still too long at the smallest size: cut it with an ellipsis.
  while (g.measureText(text).width > c.width - 80 && text.length > 1) text = text.slice(0, -2) + "…";
  g.fillText(text, c.width / 2, c.height / 2 - 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// A door filling its opening through the wall (the room side is local -z, the corridor
// +z), with the room's name on a sign on the corridor side only.
function buildDoor(d, room, materials, plate) {
  const group = new THREE.Group();
  const depth = WALL_T + 0.02;
  const leaf = box(0.9, HEIGHTS.door, depth, materials.door);
  leaf.position.set(0, HEIGHTS.door / 2, WALL_T / 2);
  group.add(leaf);
  [-0.01 - 0.02, WALL_T + 0.01 + 0.02].forEach((z) => {
    const handle = box(0.12, 0.02, 0.04, materials.metal);
    handle.position.set(0.33, 1.0, z);
    group.add(handle);
  });
  // A light frame round the opening on each side, so the door reads against any wall
  // or floor finish.
  [-0.012, WALL_T + 0.012].forEach((z) => {
    [
      [0.07, HEIGHTS.door + 0.07, -0.485, (HEIGHTS.door + 0.07) / 2],
      [0.07, HEIGHTS.door + 0.07, 0.485, (HEIGHTS.door + 0.07) / 2],
      [1.04, 0.07, 0, HEIGHTS.door + 0.035],
    ].forEach(([w, h, x, y]) => {
      const bar = box(w, h, 0.024, materials.doorFrame);
      bar.position.set(x, y, z);
      group.add(bar);
    });
  });
  if (plate) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(PLATE_M.w, PLATE_M.h), plate);
    sign.position.set(0, 1.62, WALL_T + 0.012);
    group.add(sign);
  }
  group.position.copy(toWorld(room, d.x, d.y, 0));
  faceAngle(group, facingIntoRoom(d, room));
  return group;
}

// Plan directions for something on a wall facing `angle` into the room: along the wall
// (toward the door handle's side) and out through it.
const alongWall = (angle) => {
  const r = (angle * Math.PI) / 180;
  return { x: Math.cos(r), y: Math.sin(r) };
};
const outOfRoom = (angle) => {
  const r = (angle * Math.PI) / 180;
  return { x: -Math.sin(r), y: Math.cos(r) };
};

// The room's panel on the corridor side of the wall, facing out, from a plan position
// on the wall facing into the room: a wireless ROOMZ scheduler, or a wired generic
// display with its cable dropped from the ceiling.
function placeScheduler(spot, room, textures) {
  const wired = !!spot.wired;
  const depth = wired ? WIRED_SIZE.d : ROOMZ_SIZE.d;
  const g = wired ? buildWiredRoomPanel(textures.wired, room.height - SCHEDULER_Y - WIRED_SIZE.h / 2) : buildRoomzScheduler(textures.roomz);
  const out = outOfRoom(spot.angle);
  const o = WALL_T + depth / 2 + 0.002;
  g.position.copy(toWorld(room, spot.x + out.x * o, spot.y + out.y * o, SCHEDULER_Y));
  faceAngle(g, (spot.angle + 180) % 360);
  return g;
}

// Small items: touch panels, mics, speakers, content sharing. (Booking panels are
// drawn as ROOMZ schedulers outside the room; see placeScheduler.)
function buildSmallDevice(category, item, room, ctx, materials) {
  const dark = materials.device;
  const g = new THREE.Group();
  let h = HEIGHTS.table;
  if (category === "microphone") {
    const ceiling = ctx.audioPreference === CEILING_MIC;
    if (ceiling) {
      // A flush ceiling tile array, barely proud of the ceiling.
      const panel = box(0.6, 0.02, 0.6, materials.ceilingDevice);
      g.add(panel);
      h = room.height - 0.01;
    } else {
      const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 24), dark);
      puck.castShadow = true;
      g.add(puck);
      h = HEIGHTS.table + 0.0125;
    }
  } else if (category === "speaker") {
    if (ctx.audioPreference === SOUNDBAR_AUDIO) {
      g.add(box(0.5, 0.1, 0.1, dark));
      h = 0.8;
    } else {
      const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 28), materials.ceilingDevice);
      g.add(grille);
      h = room.height - 0.01;
    }
  } else if (category === "touchPanel") {
    const panel = box(0.26, 0.17, 0.02, dark);
    panel.rotation.x = item.mount === "wall" ? 0 : 1.0; // on a table, tilted up
    g.add(panel);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.14), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    glow.position.z = -0.011;
    glow.rotation.y = Math.PI;
    panel.add(glow);
    h = item.mount === "wall" ? 1.3 : HEIGHTS.table + 0.08;
  } else if (category === "contentSharing") {
    g.add(box(0.14, 0.04, 0.1, dark));
    h = HEIGHTS.table + 0.02;
  } else {
    return null;
  }
  // Nothing up at the ceiling should shade the room below it.
  if (h > room.height - 0.1) g.traverse((o) => { o.castShadow = false; });
  g.position.copy(toWorld(room, item.x, item.y, h));
  faceAngle(g, item.angle || 0);
  return g;
}

function buildWalls(room, materialFor) {
  const { length: L, width: W, height: H } = room;
  const t = WALL_T;
  const walls = [
    // name, position, size, outward normal
    { name: "top", pos: [0, H / 2, -W / 2 - t / 2], size: [L + 2 * t, H, t], normal: new THREE.Vector3(0, 0, -1) },
    { name: "bottom", pos: [0, H / 2, W / 2 + t / 2], size: [L + 2 * t, H, t], normal: new THREE.Vector3(0, 0, 1) },
    { name: "left", pos: [-L / 2 - t / 2, H / 2, 0], size: [t, H, W], normal: new THREE.Vector3(-1, 0, 0) },
    { name: "right", pos: [L / 2 + t / 2, H / 2, 0], size: [t, H, W], normal: new THREE.Vector3(1, 0, 0) },
  ];
  return walls.map((w) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...w.size), materialFor(w.name));
    m.position.set(...w.pos);
    m.receiveShadow = true;
    m.userData = { wall: w.name, normal: w.normal };
    return m;
  });
}

// Where someone in a seat looks: at the screen most in front of them (head turned by
// the difference, within what a neck comfortably turns), or straight ahead if every
// screen is behind them. Degrees, yaw clockwise and pitch up.
function seatLook(seat, screens) {
  let best = null;
  screens.forEach((sc) => {
    const bearing = (Math.atan2(sc.x - seat.x, -(sc.y - seat.y)) * 180) / Math.PI;
    const delta = ((((bearing - seat.angle) % 360) + 540) % 360) - 180;
    if (Math.abs(delta) <= 100 && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { sc, delta };
  });
  if (!best) return { yaw: 0, pitch: -6 };
  const dist = Math.max(Math.hypot(best.sc.x - seat.x, best.sc.y - seat.y), 0.5);
  const pitch = (Math.atan2(best.sc.center - HEIGHTS.seatedEye, dist) * 180) / Math.PI;
  return { yaw: Math.max(-70, Math.min(70, best.delta)), pitch: Math.max(-15, Math.min(20, pitch)) };
}

// Returns the scene plus handles the viewer needs: the walls (to cut away the ones
// between the camera and the room), each seat's chair and person, the ceiling, the
// floor-level overlays and the things you can pick.
export function buildRoomScene({ room, layoutResult, tableOffset, seats, seatSources, screens, cameras, devices, finishes, audioPreference, roomName }) {
  const scene = new THREE.Scene();
  const disposables = [];
  const textures = {};

  // Finishes: a minimal, silky white room (see interiorStyle) — white walls with a
  // light grey one behind the screen, a white floor (textured grey carpet if chosen),
  // a glossy white table. With glass in the plan, a side wall clear of the screen and
  // door is glazed.
  const kit = createStyleKit();
  const span2 = Math.max(room.length, room.width);
  const chosenWalls = finishes.wallMaterials || [];
  const floorSpec = floorFinish(finishes.floorType);
  const ceilingColor = ceilingColorFor(finishes.ceilingType);
  const materials = {
    // A little self-glow keeps satin white reading as white on walls the overhead
    // light only grazes.
    wall: kit.finish(WALL_WHITE, span2 / 1.5, room.height / 1.5, { emissive: WALL_WHITE.color, emissiveIntensity: 0.22 }),
    featureWall: kit.finish(WALL_BEHIND_SCREEN, span2 / 1.5, room.height / 1.5, { emissive: WALL_BEHIND_SCREEN.color, emissiveIntensity: 0.16 }),
    glassWall: new THREE.MeshPhysicalMaterial({ color: 0xd6dde1, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, depthWrite: false }),
    floor: kit.finish(floorSpec, room.length / floorSpec.tile, room.width / floorSpec.tile, { emissive: floorSpec.color, emissiveIntensity: floorSpec.texture === "carpet" ? 0.05 : 0.12 }),
    // Lit mostly by its own light fittings, which the sky light can't reach.
    ceiling: mat(ceilingColor, { roughness: 1, emissive: ceilingColor, emissiveIntensity: 0.4 }),
    top: finishes.tableTopMaterial === "Glass"
      ? new THREE.MeshPhysicalMaterial({ color: 0xcfd8dc, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55, thickness: 0.02 })
      : kit.finish(topFinish(finishes.tableTopMaterial), 2, 1, { emissive: PALETTE.tableWhite, emissiveIntensity: 0.1 }),
    base: mat(PALETTE.baseGrey, { roughness: 0.35 }),
    chair: mat(PALETTE.chairGrey, { roughness: 0.55 }),
    chairBase: mat(PALETTE.chrome, { metalness: 0.9, roughness: 0.22 }),
    castor: mat(0x9ea1a5, { roughness: 0.5 }),
    chairActive: mat(0x2563eb, { roughness: 0.6, emissive: 0x0b2a6b, side: THREE.DoubleSide }),
    // A head in the way of the selected seat's view.
    // See-through, so how much of the screen it hides still shows.
    blocker: mat(0xef4444, { roughness: 0.6, emissive: 0x5a1010, transparent: true, opacity: 0.5, depthWrite: false }),
    metal: mat(PALETTE.chrome, { metalness: 0.85, roughness: 0.25 }),
    device: mat(0x1a1c20, { roughness: 0.4 }),
    door: mat(PALETTE.doorWhite, { roughness: 0.3, emissive: PALETTE.doorWhite, emissiveIntensity: 0.15 }),
    doorFrame: mat(PALETTE.frameGrey, { roughness: 0.35 }),
    // Ceiling mics and speakers: faded in the overview, where they'd float over the
    // table with the ceiling lifted off.
    ceilingDevice: mat(0xf4f4f2, { transparent: true, emissive: 0xf4f4f2, emissiveIntensity: 0.35 }),
  };
  disposables.push(kit);

  // Light: bright and neutral, so the whites stay white and the greys stay grey.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe1e4, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  // Nearly overhead, like ceiling lights: furniture casts soft shadows beneath it,
  // but the walls don't throw a band of shadow across the floor.
  sun.position.set(room.length * 0.08, room.height * 8, room.width * 0.12);
  sun.castShadow = true;
  const span = Math.max(room.length, room.width) / 2 + 1;
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.5, far: room.height * 12 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Floor.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.length, room.width), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls: which is the screen's, and which (if any) is glazed.
  const mainScreen = screens.find((sc) => sc.mount === "wall");
  const screenWall = mainScreen ? wallFacing(mainScreen.angle) : null;
  const doorWalls = new Set(devices.door.map((d) => d.edge || wallFacing(d.angle || 0)));
  const PERPENDICULAR = { top: ["left", "right"], bottom: ["left", "right"], left: ["top", "bottom"], right: ["top", "bottom"] };
  const windowWall = chosenWalls.includes("Glass")
    ? [...(screenWall ? PERPENDICULAR[screenWall] : []), "top", "bottom", "left", "right"].find((w) => w !== screenWall && !doorWalls.has(w)) || null
    : null;
  const walls = buildWalls(room, (name) => (name === windowWall ? materials.glassWall : name === screenWall ? materials.featureWall : materials.wall));
  walls.forEach((w) => scene.add(w));
  const wallItems = [];
  const views = [];
  const HALF = { top: [0, -room.width / 2], bottom: [0, room.width / 2], left: [-room.length / 2, 0], right: [room.length / 2, 0] };
  const wallFrame = (name) => {
    const [x, z] = HALF[name];
    const horizontal = name === "top" || name === "bottom";
    return {
      centre: new THREE.Vector3(x, 0, z),
      along: horizontal ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1),
      inward: new THREE.Vector3(horizontal ? 0 : -Math.sign(x), 0, horizontal ? -Math.sign(z) : 0),
      length: horizontal ? room.length : room.width,
    };
  };
  if (windowWall) {
    const glass = glazing(wallFrame(windowWall), room, kit);
    // The view beyond the glass is only for looking out from inside the room.
    const view = glass.children[glass.children.length - 1];
    views.push(view);
    scene.add(glass);
    wallItems.push({ object: glass, wall: windowWall });
  }

  // Ceiling, cove light and downlights (lifted off, all together, in the overview).
  const ceiling = new THREE.Group();
  const ceilingPlane = new THREE.Mesh(new THREE.PlaneGeometry(room.length, room.width), materials.ceiling);
  ceilingPlane.rotation.x = Math.PI / 2; // facing down into the room
  ceilingPlane.position.y = room.height;
  ceiling.add(ceilingPlane);
  if (finishes.ceilingType !== "Exposed / Open Ceiling") ceilingLights(room, ceiling);
  scene.add(ceiling);

  // Tables, around the group's centre.
  const groupCenter = toWorld(room, room.length / 2 + tableOffset.x, room.width / 2 + tableOffset.y);
  const tables = buildTables(layoutResult.tableShape, materials);
  tables.position.copy(groupCenter);
  scene.add(tables);

  // Chairs and people, one per seat actually in the room. Theatre seating has no table
  // to rest on, so hands go in laps there.
  const people = createPeopleKit();
  const pose = layoutResult.tableShape.type === "none" ? "lap" : "table";
  const seatObjects = seats.map((s, i) => {
    const holder = new THREE.Group();
    holder.position.copy(toWorld(room, s.x, s.y));
    faceAngle(holder, s.angle);
    const chair = officeChair(materials);
    chair.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.seatIndex = i; } });
    holder.add(chair);
    const { person, headMeshes } = people.makePerson(i, { pose, look: seatLook(s, screens) });
    person.traverse((o) => { if (o.isMesh) o.userData.seatIndex = i; });
    holder.add(person);
    holder.userData = { seatIndex: i, source: seatSources?.[i] };
    scene.add(holder);
    return { holder, chair, person, headMeshes };
  });

  // Devices.
  screens.forEach((s) => scene.add(buildScreen(s, room, textures)));
  cameras.forEach((c) => {
    const obj = buildCamera(c, room);
    if (obj) scene.add(obj);
  });
  const overlays = new THREE.Group();
  cameras.forEach((c) => overlays.add(fovWedge(c, room)));
  scene.add(overlays);
  const ctx = { audioPreference };
  ["microphone", "speaker", "touchPanel", "contentSharing"].forEach((category) =>
    devices[category].forEach((item) => {
      const obj = buildSmallDevice(category, item, room, ctx, materials);
      if (obj) scene.add(obj);
    })
  );
  const name = roomName?.trim();
  const plateTexture = name ? nameplateTexture(name) : null;
  if (plateTexture) disposables.push(plateTexture);
  const plate = plateTexture && new THREE.MeshStandardMaterial({ map: plateTexture, roughness: 0.4, metalness: 0.1 });
  devices.door.forEach((d) => {
    const door = buildDoor(d, room, materials, plate);
    scene.add(door);
    // Always shown, even when the overview lifts its wall away.
    wallItems.push({ object: door, wall: wallOf(d, room), always: true });
  });

  // Room schedulers: wherever the plan puts its booking panels, on the corridor side
  // where people check the room. Only ones actually on the plan are shown — a room is
  // never given equipment nobody chose.
  const mainDoor = devices.door[0] || null;
  const schedulerSpots = devices.bookingPanel.map((b) => ({ x: b.x, y: b.y, angle: facingIntoRoom(b, room), edge: wallOf(b, room), wired: !!b.wired }));
  // A panel's face is drawn once per kind in the room.
  const panelTextures = {};
  if (schedulerSpots.some((spot) => !spot.wired)) panelTextures.roomz = roomzTexture(name);
  if (schedulerSpots.some((spot) => spot.wired)) panelTextures.wired = wiredPanelTexture(name);
  Object.values(panelTextures).forEach((t) => disposables.push(t));
  const schedulers = schedulerSpots.map((spot) => {
    const g = placeScheduler(spot, room, panelTextures);
    scene.add(g);
    wallItems.push({ object: g, wall: spot.edge, always: true });
    return { object: g, spot };
  });

  // What an outside view of the entrance needs: the door, its scheduler, and which
  // way is out of the room and along its wall (world directions).
  let entrance = null;
  if (mainDoor) {
    const angle = facingIntoRoom(mainDoor, room);
    const out = outOfRoom(angle), along = alongWall(angle);
    const nearest = schedulers.reduce(
      (best, sc) => (!best || Math.hypot(sc.spot.x - mainDoor.x, sc.spot.y - mainDoor.y) < Math.hypot(best.spot.x - mainDoor.x, best.spot.y - mainDoor.y) ? sc : best),
      null
    );
    entrance = {
      wall: wallOf(mainDoor, room),
      door: toWorld(room, mainDoor.x, mainDoor.y, 0),
      scheduler: nearest ? nearest.object.position.clone() : null,
      schedulerWired: !!nearest?.spot.wired,
      out: new THREE.Vector3(out.x, 0, out.y),
      along: new THREE.Vector3(along.x, 0, along.y),
    };
  }

  Object.values(textures).forEach((t) => disposables.push(t));

  return {
    scene,
    walls,
    wallItems,
    // Things only seen from inside the room (the view out of the windows).
    views,
    entrance,
    ceiling,
    overlays,
    seatObjects,
    materials,
    dispose() {
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose());
      });
      disposables.forEach((d) => d.dispose());
      people.dispose();
    },
  };
}
