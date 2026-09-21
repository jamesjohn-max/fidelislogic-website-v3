import * as THREE from "three";
import { HEIGHTS } from "../../../lib/roomSightlines";

// The 3D room's look: minimal and silky — satin white walls, a light grey wall behind
// the screen, a soft-sheen white floor (or textured grey carpet where the plan has
// carpet), a white ceiling with pin downlights, a glossy white table, and light grey
// office chairs on chrome five-star bases. Whites and greys throughout.

export const PALETTE = {
  white: 0xf5f5f3,
  wallGrey: 0xd5d7da,
  floorWhite: 0xf0f0ee,
  carpetGrey: 0x8f9296,
  ceiling: 0xf8f8f6,
  tableWhite: 0xf7f7f5,
  baseGrey: 0xdcdddf,
  doorWhite: 0xefefed,
  frameGrey: 0xc9cbce,
  chairGrey: 0xc7c9cc,
  chrome: 0xd4d7db,
  blind: 0xf2f1ee,
  cove: 0xffffff,
};

// Every wall is satin white; the screen's wall is a light grey (see buildRoomScene).
export const WALL_WHITE = { color: PALETTE.white, texture: "plaster", roughness: 0.35 };
export const WALL_BEHIND_SCREEN = { color: PALETTE.wallGrey, texture: "plaster", roughness: 0.4 };
// Carpet is a textured grey; every other floor a silky white.
export const floorFinish = (type) =>
  type === "Carpet"
    ? { color: PALETTE.carpetGrey, texture: "carpet", tile: 0.6, roughness: 0.95 }
    : { color: PALETTE.floorWhite, texture: "plaster", tile: 1.5, roughness: 0.28 };
export const ceilingColor = (type) => (type === "Exposed / Open Ceiling" ? 0x8e9094 : PALETTE.ceiling);
// Table tops: glossy white (a touch warmer for marble); glass stays glass.
export const topFinish = (type) => ({ color: type === "Marble" ? 0xf2f1ee : PALETTE.tableWhite, texture: "plaster", roughness: 0.18 });

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });

// --- procedural textures ----------------------------------------------------------------
// Light grey detail that the material's colour tints: carpet speckle and a faint satin
// grain. Made once per scene and repeated to real-world scale.

function canvasTexture(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const rand = (seed) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

const DRAW = {
  carpet: (g, n) => {
    const r = rand(7);
    g.fillStyle = "#e9e9e9";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < n * n * 0.18; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(r() * n, r() * n, 1.5, 1.5);
    }
    // A loose, woven ripple, like a textured loop pile.
    g.strokeStyle = "rgba(0,0,0,0.05)";
    for (let y = 0; y < n; y += 6) {
      g.beginPath();
      for (let x = 0; x <= n; x += 8) g.lineTo(x, y + Math.sin((x + y) * 0.2) * 2);
      g.stroke();
    }
  },
  // A barely-there mottle: a fine grain, not blotches.
  plaster: (g, n) => {
    const r = rand(5);
    g.fillStyle = "#f2f2f2";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < n * n * 0.12; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.01 + r() * 0.02})`;
      g.fillRect(r() * n, r() * n, 1 + r() * 2, 1 + r() * 2);
    }
  },
};

// A kit of materials for one scene; `dispose` frees their textures.
export function createStyleKit() {
  const textures = {};
  const texture = (kind, repeatX = 1, repeatY = 1) => {
    const base = textures[kind] || (textures[kind] = canvasTexture(256, DRAW[kind]));
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(repeatX, repeatY);
    const clones = textures[`${kind}-clones`] || (textures[`${kind}-clones`] = []);
    clones.push(t);
    return t;
  };
  const finish = (spec, repeatX, repeatY, extra = {}) =>
    mat(spec.color, { map: spec.texture ? texture(spec.texture, repeatX, repeatY) : null, roughness: spec.roughness ?? 0.8, ...extra });
  return {
    texture,
    finish,
    dispose() {
      Object.values(textures).flat().forEach((t) => t.dispose());
    },
  };
}

// --- furniture -------------------------------------------------------------------------

// A light grey office chair on a chrome five-star base with castors, facing -z
// (its sitter's way): padded seat, a gently reclined back, and chrome-framed armrests.
export function officeChair(materials) {
  const group = new THREE.Group();
  const seatY = HEIGHTS.chairSeat;
  const add = (mesh, upholstered = false) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (upholstered) mesh.userData.upholstery = true;
    group.add(mesh);
    return mesh;
  };
  const rounded = (w, h, d, r) => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 8 });
    g.translate(0, 0, -d / 2);
    return g;
  };
  // Seat: a padded cushion, laid flat.
  const seat = add(new THREE.Mesh(rounded(0.46, 0.44, 0.06, 0.08), materials.chair), true);
  seat.rotation.x = -Math.PI / 2;
  seat.position.set(0, seatY, 0);
  // Back: taller than the seat, reclined a little, behind the sitter (+z).
  const back = add(new THREE.Mesh(rounded(0.44, 0.52, 0.06, 0.1), materials.chair), true);
  back.position.set(0, seatY + 0.33, 0.24);
  back.rotation.x = -0.14;
  // Armrests: chrome supports rising from the seat to padded rests.
  [-1, 1].forEach((side) => {
    const post = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), materials.chairBase));
    post.position.set(side * 0.26, seatY + 0.1, 0.02);
    const rest = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.26), materials.chair), true);
    rest.position.set(side * 0.26, seatY + 0.21, 0.0);
  });
  // Gas lift and a chrome five-star base on castors.
  const lift = add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, seatY - 0.12, 14), materials.chairBase));
  lift.position.y = (seatY - 0.12) / 2 + 0.08;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const leg = add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.3), materials.chairBase));
    leg.position.set(Math.sin(a) * 0.15, 0.075, Math.cos(a) * 0.15);
    leg.rotation.set(0.1, a, 0, "YXZ");
    const castor = add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), materials.castor));
    castor.position.set(Math.sin(a) * 0.29, 0.025, Math.cos(a) * 0.29);
  }
  return group;
}

// A table's base, in plan coordinates relative to the table group's centre: a pale grey
// slab under long tables, a round pedestal under pods, slim chrome legs under desks.
export function tableBase(kind, dims, materials) {
  const h = HEIGHTS.table - 0.05;
  const g = new THREE.Group();
  const add = (mesh, x, z, rotY = 0) => {
    mesh.position.set(x, h / 2, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  if (kind === "slab") {
    const { x, y, w, d } = dims;
    const long = w >= d;
    const along = Math.max(0.45, (long ? w : d) * 0.5);
    const across = Math.min(0.55, Math.max(0.3, (long ? d : w) * 0.36));
    add(new THREE.Mesh(new THREE.BoxGeometry(long ? along : across, h, long ? across : along), materials.base), x, y);
  } else if (kind === "pedestal") {
    const { x, y, r } = dims;
    add(new THREE.Mesh(new THREE.CylinderGeometry(Math.min(0.1, r * 0.3), Math.min(0.1, r * 0.3), h, 20), materials.base), x, y);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(0.32, r * 0.7), Math.min(0.34, r * 0.72), 0.03, 28), materials.base);
    foot.position.set(x, 0.015, y);
    g.add(foot);
  } else {
    dims.points.forEach((p) => add(new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.04), materials.chairBase), p.x, p.y));
  }
  return g;
}

// --- walls and ceiling -----------------------------------------------------------------

// Floor-to-ceiling glazing: brushed grey mullions and rails, white roller blinds part
// way down, and a hazy skyline beyond. The wall itself is swapped for glass.
export function glazing(wall, room, kit) {
  const g = new THREE.Group();
  const frame = mat(0xb9bcc0, { roughness: 0.35, metalness: 0.5 });
  const bays = Math.max(2, Math.round(wall.length / 1.4));
  const bay = wall.length / bays;
  const at = (a, y, out = 0) => wall.centre.clone().addScaledVector(wall.along, a).addScaledVector(wall.inward, -out).setY(y);
  const facing = Math.atan2(wall.inward.x, wall.inward.z);
  for (let i = 0; i <= bays; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, room.height, 0.1), frame);
    m.position.copy(at(-wall.length / 2 + i * bay, room.height / 2, 0.05));
    m.rotation.y = facing;
    g.add(m);
  }
  [0.05, room.height - 0.05].forEach((y) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(wall.length, 0.1, 0.1), frame);
    rail.position.copy(at(0, y, 0.05));
    rail.rotation.y = facing;
    g.add(rail);
  });
  // Blinds: each bay's shade drawn down to a slightly different height.
  const linen = mat(PALETTE.blind, { roughness: 1, transparent: true, opacity: 0.93, side: THREE.DoubleSide });
  const r = rand(9);
  for (let i = 0; i < bays; i++) {
    const drop = room.height * (0.3 + r() * 0.12);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(bay - 0.08, drop), linen);
    shade.position.copy(at(-wall.length / 2 + (i + 0.5) * bay, room.height - 0.1 - drop / 2, -0.04));
    shade.rotation.y = facing;
    g.add(shade);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bay - 0.08, 0.025, 0.025), frame);
    bar.position.copy(at(-wall.length / 2 + (i + 0.5) * bay, room.height - 0.1 - drop, -0.04));
    bar.rotation.y = facing;
    g.add(bar);
  }
  // The view: a pale sky with a hazy city skyline, well beyond the glass.
  const sky = kit.texture("sky");
  // Tall enough that looking down through the glass still meets it.
  const view = new THREE.Mesh(new THREE.PlaneGeometry(wall.length * 5, room.height * 7), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false }));
  view.position.copy(at(0, room.height * 0.3, 7));
  view.rotation.y = facing;
  g.add(view);
  return g;
}

DRAW.sky = (g, n) => {
  const grad = g.createLinearGradient(0, 0, 0, n);
  grad.addColorStop(0, "#c9d8e4");
  grad.addColorStop(0.45, "#eef0ec");
  grad.addColorStop(1, "#dcd8cc");
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
  const r = rand(17);
  for (let x = 0; x < n; ) {
    const w = 6 + r() * 16;
    const h = n * (0.08 + r() * (r() < 0.12 ? 0.4 : 0.16));
    g.fillStyle = `rgba(150,160,170,${0.35 + r() * 0.25})`;
    g.fillRect(x, n * 0.5 - h * 0.6, w, h * 0.6 + n * 0.08);
    x += w + r() * 4;
  }
  g.fillStyle = "rgba(176,188,158,0.8)";
  g.fillRect(0, n * 0.56, n, n * 0.44);
};

// The ceiling's soft glow: a cove of hidden LED strip round the room's edge and a
// grid of pin downlights. Added to the ceiling group, so it hides with it.
export function ceilingLights(room, ceilingGroup) {
  const cove = new THREE.MeshBasicMaterial({ color: PALETTE.cove });
  const band = 0.05;
  const inset = 0.02;
  const y = room.height - 0.012;
  const strip = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), cove);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    ceilingGroup.add(m);
  };
  const hx = room.length / 2 - inset - band / 2, hz = room.width / 2 - inset - band / 2;
  strip(room.length - inset * 2, band, 0, -hz);
  strip(room.length - inset * 2, band, 0, hz);
  strip(band, room.width - inset * 2, -hx, 0);
  strip(band, room.width - inset * 2, hx, 0);
  const pin = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nx = Math.max(1, Math.round(room.length / 1.8)), nz = Math.max(1, Math.round(room.width / 1.8));
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), pin);
      d.rotation.x = Math.PI / 2;
      d.position.set(-room.length / 2 + ((i + 0.5) * room.length) / nx, room.height - 0.004, -room.width / 2 + ((j + 0.5) * room.width) / nz);
      ceilingGroup.add(d);
    }
  }
}
