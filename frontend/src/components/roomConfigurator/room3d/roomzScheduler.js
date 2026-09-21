import * as THREE from "three";

// The panels that hang outside a meeting room's door. Wireless is a ROOMZ room
// scheduler; wired is a generic room display fed by a cable from the ceiling.
//
// The ROOMZ room scheduler that hangs outside a meeting room's door: a black-framed
// e-paper display showing the room's name and date, whether it's reserved and until
// when, the next meetings, the day's timeline and its soft-key bar, with six physical
// buttons along the bottom of the frame. Drawn to the proportions of the real device
// (all positions below are in its 1143 × 961 reference layout).

export const ROOMZ_SIZE = { w: 0.21, h: 0.1766, d: 0.018 }; // metres
const REF = { w: 1143, h: 961 };

const PAPER = "#d9d9d5";
const PAPER_LIGHT = "#e2e2de";
const INK = "#2b2c2e";
const INK_SOFT = "#3a3b3e";
const FAINT = "#b9b9b4";
const FONT = `"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;

// Sample bookings, so the display looks like it does in use.
const AGENDA = [
  { from: "13:30", to: "15:30", title: "Product Review", who: "Sales team" },
  { from: "17:00", to: "18:00", title: "Marketing Strategy", who: "Marketing team" },
];
const BLOCKS = [
  [10, 11.5],
  [13, 13.5],
  [13.75, 15.75],
  [17, 18],
];

function todayLabel() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, "0");
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Fits text into a width by shrinking it, down to `min` px, then cutting it short.
function fitText(g, text, maxWidth, size, weight, min = size * 0.55) {
  let s = size;
  g.font = `${weight} ${s}px ${FONT}`;
  while (g.measureText(text).width > maxWidth && s > min) {
    s -= 1;
    g.font = `${weight} ${s}px ${FONT}`;
  }
  let t = text;
  while (g.measureText(t).width > maxWidth && t.length > 1) t = `${t.slice(0, -2)}…`;
  return t;
}

export function roomzTexture(roomName) {
  const scale = 1.4;
  const c = document.createElement("canvas");
  c.width = Math.round(REF.w * scale);
  c.height = Math.round(REF.h * scale);
  const g = c.getContext("2d");
  g.scale(scale, scale);

  // Frame: black glass with a soft sheen toward the top.
  const frame = g.createLinearGradient(0, 0, 0, REF.h);
  frame.addColorStop(0, "#1b1c1f");
  frame.addColorStop(0.5, "#0e0f11");
  frame.addColorStop(1, "#141518");
  g.fillStyle = frame;
  g.beginPath();
  g.roundRect(0, 0, REF.w, REF.h, 26);
  g.fill();
  g.strokeStyle = "#5b5e63";
  g.lineWidth = 4;
  g.stroke();

  // ROOMZ wordmark, top right: R, an O drawn as two facing arcs, M, Z.
  g.fillStyle = "#f2f2f2";
  g.strokeStyle = "#f2f2f2";
  g.font = `300 40px ${FONT}`;
  g.textBaseline = "middle";
  const logoY = 50;
  g.fillText("R", 870, logoY);
  g.lineWidth = 4.2;
  g.beginPath();
  g.arc(937, logoY, 15, Math.PI * 0.62, Math.PI * 1.38);
  g.stroke();
  g.beginPath();
  g.arc(945, logoY, 15, -Math.PI * 0.38, Math.PI * 0.38);
  g.stroke();
  g.fillText("M", 975, logoY);
  g.fillText("Z", 1022, logoY);

  // E-paper screen.
  const sx = 95, sy = 95, sw = 948, sh = 710;
  g.fillStyle = PAPER;
  g.fillRect(sx, sy, sw, sh);

  // Header: date and room name.
  g.fillStyle = PAPER_LIGHT;
  g.fillRect(sx, sy, sw, 87);
  g.fillStyle = INK;
  g.font = `400 36px ${FONT}`;
  g.textAlign = "left";
  g.fillText(todayLabel(), 120, 142);
  g.textAlign = "right";
  g.fillText(fitText(g, roomName || "Meeting Room", 520, 36, 400), 1030, 144);

  // Status: reserved, and until when.
  g.fillStyle = INK_SOFT;
  g.fillRect(sx, 183, 765, 250);
  g.fillStyle = "#dcdcd8";
  g.textAlign = "center";
  g.font = `300 96px ${FONT}`;
  g.fillText("Reserved", 485, 286);
  g.font = `300 42px ${FONT}`;
  g.fillText("until 15:30", 480, 364);

  // Agenda.
  g.textAlign = "left";
  AGENDA.forEach((m, i) => {
    const y = 470 + i * 106;
    g.fillStyle = INK;
    g.font = `400 23px ${FONT}`;
    g.fillText(m.from, 118, y);
    g.fillText(m.to, 118, y + 33);
    g.font = `600 28px ${FONT}`;
    g.fillText(m.title, 226, y - 2);
    g.font = `400 23px ${FONT}`;
    g.fillText(m.who, 226, y + 32);
    g.fillStyle = INK;
    g.fillRect(sx, y + 67, 765, 2);
  });

  // Timeline, 07:00 to 19:00, with the day's bookings as blocks.
  const tx = 862;
  g.fillStyle = PAPER_LIGHT;
  g.fillRect(tx, 183, 181, 565);
  g.fillStyle = INK;
  g.fillRect(tx, 183, 2, 565);
  const hourY = (h) => 217 + (h - 7) * 41.75;
  g.font = `400 17px ${FONT}`;
  for (let h = 7; h <= 19; h++) {
    const y = hourY(h);
    g.fillStyle = INK;
    g.fillText(`${String(h).padStart(2, "0")}:00`, 888, y);
    g.fillStyle = "#6d6e70";
    for (let x = 937; x < 1022; x += 9) g.fillRect(x, y, 5, 1.5);
  }
  g.fillStyle = INK;
  BLOCKS.forEach(([a, b]) => g.fillRect(957, hourY(a), 47, hourY(b) - hourY(a)));

  // Soft keys: Release · (blank) · (blank) · daily · weekly · View.
  const barY = 750, barH = 55;
  const cells = [95, 316, 442, 569, 696, 823, 1043];
  g.fillStyle = "#c9c9c5";
  g.fillRect(sx, barY, sw, barH);
  g.fillStyle = INK;
  g.fillRect(sx, barY - 2, sw, 3);
  cells.slice(1, -1).forEach((x) => g.fillRect(x - 1, barY, 3, barH));
  g.textAlign = "center";
  const label = (i, text, weight, color) => {
    g.fillStyle = color;
    g.font = `${weight} 30px ${FONT}`;
    g.fillText(text, (cells[i] + cells[i + 1]) / 2, barY + barH / 2 + 2);
  };
  label(0, "Release", 600, INK);
  label(3, "daily", 400, FAINT);
  label(4, "weekly", 400, FAINT);
  label(5, "View", 600, INK);

  // Physical buttons under the keys, with dividers between them.
  g.strokeStyle = "#e8e8e8";
  g.fillStyle = "#e8e8e8";
  cells.slice(1, -1).forEach((x) => g.fillRect(x - 1, 812, 2.5, 90));
  [[205, true], [379], [505], [632], [759], [933, true]].forEach(([x, big]) => {
    g.lineWidth = big ? 4.5 : 3;
    g.beginPath();
    g.arc(x, 878, big ? 29 : 13, 0, Math.PI * 2);
    g.stroke();
    if (big) {
      g.beginPath();
      g.arc(x, 878, 16, 0, Math.PI * 2);
      g.fill();
    }
  });

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// The device: a slim black body with the display on its front (-z), centred on its
// own origin. `texture` comes from roomzTexture.
export function buildRoomzScheduler(texture) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(ROOMZ_SIZE.w, ROOMZ_SIZE.h, ROOMZ_SIZE.d),
    new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.35, metalness: 0.2 })
  );
  body.castShadow = true;
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOMZ_SIZE.w, ROOMZ_SIZE.h),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, metalness: 0 })
  );
  face.position.z = -ROOMZ_SIZE.d / 2 - 0.0005;
  face.rotation.y = Math.PI;
  group.add(face);
  return group;
}

// --- generic wired room display ------------------------------------------------------

export const WIRED_SIZE = { w: 0.26, h: 0.165, d: 0.022 };

// Its screen: the room's name, whether it's free, and the next booking — the plain
// panel any wired room-booking system puts outside the door.
export function wiredPanelTexture(roomName) {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = Math.round((720 * WIRED_SIZE.h) / WIRED_SIZE.w);
  const g = c.getContext("2d");
  const font = `"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
  g.fillStyle = "#12161c";
  g.fillRect(0, 0, c.width, c.height);
  // A green "free" band down the left, as these panels show at a glance.
  g.fillStyle = "#2f9e5f";
  g.fillRect(0, 0, 26, c.height);
  g.fillStyle = "#e8ecf2";
  g.textBaseline = "middle";
  let size = 58;
  do {
    g.font = `600 ${size}px ${font}`;
    size -= 2;
  } while (g.measureText(roomName || "Meeting Room").width > c.width - 90 && size > 22);
  g.fillText(roomName || "Meeting Room", 56, 74);
  g.fillStyle = "#8fd6ab";
  g.font = `600 34px ${font}`;
  g.fillText("Available", 56, 136);
  g.fillStyle = "#94a3b8";
  g.font = `400 26px ${font}`;
  g.fillText("Next: 15:30  Product Review", 56, 184);
  g.fillStyle = "#3b4553";
  g.fillRect(56, 214, c.width - 112, 2);
  g.fillStyle = "#64748b";
  g.font = `400 22px ${font}`;
  g.fillText("Tap to book", 56, 244);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// The wired panel: a slim dark display on the wall with its cable dropped from the
// ceiling down the wall into the top of it. `dropTo` is how far above the panel's
// centre the cable starts (the ceiling), in metres.
export function buildWiredRoomPanel(texture, dropTo) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(WIRED_SIZE.w, WIRED_SIZE.h, WIRED_SIZE.d),
    new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.4, metalness: 0.15 })
  );
  body.castShadow = true;
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(WIRED_SIZE.w * 0.94, WIRED_SIZE.h * 0.9),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.25, metalness: 0 })
  );
  face.position.z = -WIRED_SIZE.d / 2 - 0.0005;
  face.rotation.y = Math.PI;
  group.add(face);
  // Cable: down the wall from the ceiling into the top of the panel, with a grommet.
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, Math.max(0.05, dropTo), 10),
    new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.6 })
  );
  cable.position.set(0, WIRED_SIZE.h / 2 + Math.max(0.05, dropTo) / 2, 0.004);
  group.add(cable);
  const grommet = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.5 }));
  grommet.position.set(0, WIRED_SIZE.h / 2, 0.004);
  group.add(grommet);
  return group;
}
