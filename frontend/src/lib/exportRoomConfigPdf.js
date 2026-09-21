import { jsPDF } from "jspdf";
import {
  LAYOUTS,
  DEVICE_LABELS,
  DEVICE_ORDER,
  CAMERA_FEATURES,
  ROOM_MARGIN,
  refCode,
  recommendationNotes,
  TABLE_SIZED_LAYOUTS,
  TABLE_KIND_LABELS,
  seatingDensityLabel,
  seatingSpacingSummary,
  TABLE_CAM_MIC_RANGE_M,
  allInOneSpec,
  CLASSROOM_DESK_DEPTH,
  displaySpec,
} from "./roomConfiguratorEngine";

// This report is built from the configurator's data model with jsPDF's own drawing
// primitives (text/rect/ellipse/lines); only the room diagram comes from the live
// canvas (see renderDiagramToCanvas). Sections flow top to bottom and any section
// that won't fit above the footer moves to a new page (see the entry point), so a
// big configuration — lots of devices, long notes — never runs into the footer.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 15;
// Lowest point any content may reach — keeps a clear gap above the footer rule.
const CONTENT_BOTTOM = PAGE_H - FOOTER_H - 5;
// drawSectionTitle's own height (its text sits on the baseline it's given).
const SECTION_TITLE_H = 4.5;
// One consistent corner radius across every card-like block (stat cards, the
// dimensions strip, the notes callout) so the page reads as a single designed
// system rather than a mix of ad-hoc shapes.
const CARD_RADIUS = 2;

// Report accents use the two blues of the Fidelis Logic logo: the light blue of the
// "FIDELIS" wordmark (#4BADD4) for accent fills and rules, and the dark blue of
// "LOGIC" (#2D598C) for accent-coloured text, where the light blue would be too
// faint to read on white.
const BRAND_BLUE = [75, 173, 212];
const BRAND_NAVY = [45, 89, 140];
const BRAND_BLUE_TINT = [237, 247, 251];
// Device markers match the device icons on the configurator canvas (and in the
// diagram image), so the legend swatch reads as the same thing.
const DEVICE_BLUE = [37, 99, 235];
const SLATE_900 = [15, 23, 42];
const SLATE_700 = [51, 65, 85];
const SLATE_500 = [100, 116, 139];
const SLATE_400 = [148, 163, 184];
const SLATE_300 = [203, 213, 225];
const SLATE_200 = [226, 232, 240];
const SLATE_100 = [241, 245, 249];
const CARD_TINT = [248, 250, 252];
const WHITE = [255, 255, 255];
const CREDIT_TEXT = "Designed using Room Planner on https://fidelislogic.com";

const ROOM_BG = [231, 236, 242];
const ROOM_FLOOR = [248, 250, 252];
const ROOM_BORDER = [51, 65, 85];
const TABLE_FILL = [227, 233, 241];
const TABLE_STROKE = [91, 107, 130];
const CHAIR_FILL = [238, 241, 246];
const CHAIR_STROKE = [148, 163, 184];

function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setText(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

// Wraps text to at most maxLines lines within maxWidth (mm) at the doc's current
// font/size, ellipsizing the final line if it still doesn't fit — used for the stat
// cards so a long value (a free-text room name, or the room's full L × W × H
// breakdown) wraps onto a second line instead of being cut off after the first.
function wrapToLines(doc, text, maxWidth, maxLines) {
  const lines = doc.splitTextToSize(text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const clamped = lines.slice(0, maxLines);
  const ellipsis = "…";
  let last = clamped[maxLines - 1];
  while (last.length > 0 && doc.getTextWidth(last + ellipsis) > maxWidth) {
    last = last.slice(0, -1).trimEnd();
  }
  clamped[maxLines - 1] = last + ellipsis;
  return clamped;
}

// A nice round meter interval for ruler ticks, aiming for roughly 5-7 labels across
// the given dimension regardless of room size.
function niceTickStep(dimension) {
  const target = dimension / 6;
  const steps = [0.5, 1, 2, 5, 10, 20, 50];
  return steps.find((s) => s >= target) || 50;
}

function formatMeters(v) {
  const r = Math.round(v * 100) / 100;
  return `${Number.isInteger(r) ? r : r.toFixed(r % 1 === 0.5 ? 1 : 2)}m`;
}

// --- header / footer ---------------------------------------------------------------

function drawTopAccent(doc) {
  setFill(doc, BRAND_BLUE);
  doc.rect(0, 0, PAGE_W, 3, "F");
}

const TITLE_FONT_SIZE = 19;
const TITLE_MAX_LINES = 2;

function drawHeader(doc, meta, title) {
  drawTopAccent(doc);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, SLATE_500);
  doc.text(meta.dateStr, PAGE_W - MARGIN, 11, { align: "right" });
  const dateW = doc.getTextWidth(meta.dateStr);

  // Wrapped (and measured) at the size it's drawn at, and kept clear of the date in
  // the top-right corner, so a long customer name wraps — at most two lines, then
  // ellipsized — instead of running into the date or past the right margin.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TITLE_FONT_SIZE);
  setText(doc, SLATE_900);
  const titleLines = wrapToLines(doc, title, CONTENT_W - dateW - 6, TITLE_MAX_LINES);
  doc.text(titleLines, MARGIN, 15);

  // The credit line used to sit on its own row above the title with its own bold
  // brand-blue styling; it now takes over the subtitle row instead (in that row's
  // own normal/slate format) rather than duplicating the attribution twice in the
  // header, freeing up the space the old top row took.
  const subtitleY = 15 + (titleLines.length - 1) * 7.2 + 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, SLATE_500);
  // Who it's from: a customer sends their own requirements; a reseller prepares them.
  const subtitleText = meta.createdBy
    ? `${meta.fromCustomer ? "Sent by" : "Prepared by"} ${meta.createdBy} · Fidelis Logic Room Planner`
    : CREDIT_TEXT;
  doc.text(wrapToLines(doc, subtitleText, CONTENT_W, 1), MARGIN, subtitleY);

  const dividerY = subtitleY + 4.5;
  setDraw(doc, BRAND_BLUE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, dividerY, MARGIN + 16, dividerY);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.4);
  doc.line(MARGIN + 16, dividerY, PAGE_W - MARGIN, dividerY);

  return dividerY + 6;
}

function drawFooter(doc, meta, pageNum, totalPages) {
  const y = PAGE_H - FOOTER_H;
  setDraw(doc, SLATE_300);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, SLATE_500);
  doc.text(CREDIT_TEXT, MARGIN, y + 6);
  doc.text(meta.dateStr, MARGIN, y + 10.5);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, y + 6, { align: "right" });
}

// --- section header ------------------------------------------------------------------

// A small accent tab beside every section label (the same brand-blue motif used on
// the stat cards' left edge) plus a rule that runs out to the page edge — ties every
// section header to the same visual language and reads as a proper document section
// break rather than just a bolder line of text.
function drawSectionTitle(doc, y, label) {
  setFill(doc, BRAND_BLUE);
  doc.roundedRect(MARGIN, y - 3.3, 1.4, 4.3, 0.7, 0.7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, SLATE_900);
  doc.text(label, MARGIN + 4, y);

  const ruleX = MARGIN + 4 + doc.getTextWidth(label) + 4;
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.line(ruleX, y - 1, PAGE_W - MARGIN, y - 1);

  return y + 4.5;
}

// --- stat cards (Room name / Seating capacity / Room size / Table & seating) -------------

function drawStatCards(doc, y, state, roomName) {
  const { room, table } = state;
  const area = room.length * room.width;
  const people = `${state.chairCount} ${state.chairCount === 1 ? "person" : "people"}`;
  const cards = [
    { label: "Room name", value: roomName },
    { label: "Seating capacity", value: people },
    {
      label: "Room size",
      value: `${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m`,
      format: "(L×W×H)",
      sub: `${area.toFixed(1)} m² floor area`,
    },
  ];
  // Only table-sized layouts get this card; row and pod layouts are sized by the
  // room, so seating capacity alone describes them.
  if (TABLE_SIZED_LAYOUTS.includes(state.layout)) {
    cards.push({
      label: "Table & seating",
      value: `${table.length.toFixed(1)} × ${table.width.toFixed(1)} m`,
      format: state.layout === "ushape" ? "(leg length × width across)" : "(L×W)",
      sub: `${state.chairCount} ${state.chairCount === 1 ? "chair" : "chairs"} ${state.layout === "frontrow" ? "in a row along the table" : "around the table"}`,
    });
  }
  const VALUE_SIZE = 11;
  const FORMAT_SIZE = VALUE_SIZE / 2; // half the value's font size, as its own caption line
  const gap = 5;
  const cardW = (CONTENT_W - gap * (cards.length - 1)) / cards.length;
  const innerW = cardW - 10;
  const valueLineH = 4.3;

  // Every card wraps up to 2 lines rather than truncating to one — a free-text room
  // name can easily run past a single line — so all the cards share one height
  // sized to whichever needs the most room.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(VALUE_SIZE);
  const wrapped = cards.map((card) => wrapToLines(doc, card.value, innerW, 2));
  const maxLines = Math.max(...wrapped.map((lines) => lines.length));
  const hasFormat = cards.some((card) => card.format);
  const hasSub = cards.some((card) => card.sub);
  const cardH = 9 + maxLines * valueLineH + (hasFormat ? 3 : 0) + (hasSub ? 4.3 : hasFormat ? 0 : 1);

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardW + gap);
    setDraw(doc, SLATE_200);
    doc.setLineWidth(0.3);
    setFill(doc, CARD_TINT);
    doc.roundedRect(x, y, cardW, cardH, CARD_RADIUS, CARD_RADIUS, "FD");
    setFill(doc, BRAND_BLUE);
    doc.roundedRect(x, y, 1.2, cardH, 0.6, 0.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, SLATE_500);
    doc.text(card.label.toUpperCase(), x + 5, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(VALUE_SIZE);
    setText(doc, SLATE_900);
    doc.text(wrapped[i], x + 5, y + 11.2);

    let cursorY = y + 11.2 + (wrapped[i].length - 1) * valueLineH;
    if (card.format) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FORMAT_SIZE);
      setText(doc, SLATE_400);
      doc.text(card.format, x + 5, cursorY + 3);
      cursorY += 3;
    }
    if (card.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, SLATE_400);
      doc.text(card.sub, x + 5, cursorY + 4.3);
    }
  });

  return y + cardH + 6;
}

// --- room diagram (native vector, not a screenshot) -------------------------------------

function drawTableShape(doc, tableShape, centerMm, mPerMm) {
  const [cx, cy] = centerMm;
  const toMm = (dm) => dm / mPerMm; // meters -> mm at current scale
  setFill(doc, TABLE_FILL);
  setDraw(doc, TABLE_STROKE);
  doc.setLineWidth(0.35);

  switch (tableShape.type) {
    case "rect": {
      const w = toMm(tableShape.w), h = toMm(tableShape.h);
      doc.roundedRect(cx - w / 2, cy - h / 2, w, h, 1, 1, "FD");
      break;
    }
    case "ellipse": {
      doc.ellipse(cx, cy, toMm(tableShape.w) / 2, toMm(tableShape.h) / 2, "FD");
      break;
    }
    case "segments":
      tableShape.segments.forEach((s) => {
        doc.roundedRect(cx + toMm(s.x), cy + toMm(s.y), toMm(s.w), toMm(s.h), 0.8, 0.8, "FD");
      });
      break;
    case "desks":
      tableShape.desks.forEach((d) => {
        doc.roundedRect(cx + toMm(d.x), cy + toMm(d.y), toMm(d.w), toMm(d.h), 0.8, 0.8, "FD");
      });
      break;
    case "pods":
      tableShape.tables.forEach((t) => {
        doc.circle(cx + toMm(t.x), cy + toMm(t.y), toMm(t.radius), "FD");
      });
      break;
    case "polygon": {
      // D-shape and front-row tables: jsPDF draws a path as segments relative to its start.
      const pts = tableShape.points.map((p) => [cx + toMm(p.x), cy + toMm(p.y)]);
      const segments = pts.slice(1).map(([x, y], i) => [x - pts[i][0], y - pts[i][1]]);
      doc.lines(segments, pts[0][0], pts[0][1], [1, 1], "FD", true);
      break;
    }
    default:
      break;
  }
}

function drawDiagram(doc, y, height, boxW, state, layoutResult, removedChairIndices, chairOffsets) {
  const { room, devices, tableOffset } = state;
  const boxX = MARGIN, boxY = y, boxH = height;

  const viewW = room.length + ROOM_MARGIN * 2;
  const viewH = room.width + ROOM_MARGIN * 2;
  const scale = Math.min(boxW / viewW, boxH / viewH); // mm per meter
  const mPerMm = 1 / scale;
  const diagramW = viewW * scale;
  const diagramH = viewH * scale;
  const originX = boxX + (boxW - diagramW) / 2 + ROOM_MARGIN * scale;
  const originY = boxY + (boxH - diagramH) / 2 + ROOM_MARGIN * scale;
  const toPage = (mx, my) => [originX + mx * scale, originY + my * scale];

  // Outer neutral background + room floor + border, matching the live canvas's look.
  setFill(doc, ROOM_BG);
  doc.rect(boxX + (boxW - diagramW) / 2, boxY + (boxH - diagramH) / 2, diagramW, diagramH, "F");
  setFill(doc, ROOM_FLOOR);
  doc.rect(originX, originY, room.length * scale, room.width * scale, "F");

  // Light reference grid every meter (capped so very large rooms don't flood the page).
  setDraw(doc, [231, 235, 240]);
  doc.setLineWidth(0.15);
  const gridStep = room.length * room.width > 400 ? niceTickStep(Math.max(room.length, room.width)) : 1;
  for (let gx = 0; gx <= room.length + 1e-6; gx += gridStep) {
    const [px] = toPage(gx, 0);
    doc.line(px, originY, px, originY + room.width * scale);
  }
  for (let gy = 0; gy <= room.width + 1e-6; gy += gridStep) {
    const [, py] = toPage(0, gy);
    doc.line(originX, py, originX + room.length * scale, py);
  }

  setDraw(doc, ROOM_BORDER);
  doc.setLineWidth(0.6);
  doc.rect(originX, originY, room.length * scale, room.width * scale, "S");

  // Ruler ticks + labels along the bottom and left edges.
  const stepX = niceTickStep(room.length);
  const stepY = niceTickStep(room.width);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(doc, SLATE_400);
  setDraw(doc, SLATE_400);
  doc.setLineWidth(0.25);
  for (let gx = 0; gx <= room.length + 1e-6; gx += stepX) {
    const [px] = toPage(gx, 0);
    const py = originY + room.width * scale;
    doc.line(px, py, px, py + 1.6);
    doc.text(formatMeters(gx), px, py + 5, { align: "center" });
  }
  for (let gy = 0; gy <= room.width + 1e-6; gy += stepY) {
    const py = toPage(0, gy)[1];
    doc.line(originX - 1.6, py, originX, py);
    doc.text(formatMeters(gy), originX - 2.4, py + 1, { align: "right" });
  }

  // Table + chairs, positioned the same way the live canvas positions them: chairs
  // and the table shape are local offsets from the table group's center.
  const tableCenter = { x: room.length / 2 + tableOffset.x, y: room.width / 2 + tableOffset.y };
  const [tcx, tcy] = toPage(tableCenter.x, tableCenter.y);
  drawTableShape(doc, layoutResult.tableShape, [tcx, tcy], mPerMm);

  setFill(doc, CHAIR_FILL);
  setDraw(doc, CHAIR_STROKE);
  doc.setLineWidth(0.25);
  const chairR = Math.max(0.9, Math.min(2.2, scale * 0.22));
  layoutResult.chairs.forEach((c, i) => {
    if (removedChairIndices.has(i)) return;
    const off = chairOffsets[i] || { dx: 0, dy: 0 };
    const cx = tableCenter.x + c.x + off.dx;
    const cy = tableCenter.y + c.y + off.dy;
    const [px, py] = toPage(cx, cy);
    doc.circle(px, py, chairR, "FD");
  });

  // Devices, at their absolute room coordinates — a small brand-blue marker with its
  // reference code, matching the codes used in the device placement table below.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  DEVICE_ORDER.forEach((category) => {
    devices[category].forEach((item, idx) => {
      const [px, py] = toPage(item.x, item.y);
      setFill(doc, DEVICE_BLUE);
      setDraw(doc, WHITE);
      doc.setLineWidth(0.3);
      doc.circle(px, py, 1.5, "FD");
      setText(doc, SLATE_700);
      // Wall-mounted items (door/booking panel) sit right on the room's border, so the
      // ref-code label is nudged inward off that edge instead of always to the lower
      // right, where it would land on top of the wall line for top/left-edge items.
      const edge = item.edge;
      let lx = px + 2.2, ly = py + 1, align = "left";
      if (edge === "top") { ly = py + 3.8; }
      else if (edge === "bottom") { ly = py - 2.2; }
      else if (edge === "left") { lx = px + 2.5; }
      else if (edge === "right") { lx = px - 2.5; align = "right"; }
      doc.text(refCode(category, idx), lx, ly, { align });
    });
  });

  return boxY + boxH;
}

// --- diagram rendered from the live configurator's SVG (not redrawn) ----------------------

// The canvas is an SVG, so rather than screenshotting the page (the old html2canvas
// capture re-laid the page out in a fixed-size virtual window, and for large or
// full rooms — theater/classroom rows fill the room to its walls — the room's right
// and bottom edges fell outside the captured area) the SVG itself is serialized and
// rasterized: always the whole room, at a fixed resolution whatever the window size.
//
// It's laid out as if DIAGRAM_CSS_WIDTH px wide (roughly its on-screen size, which is
// what its hairline strokes are tuned for) and rasterized DIAGRAM_SCALE times larger.
// Strokes marked non-scaling-stroke are sized in screen pixels, so they're scaled up
// by the same factor to keep the same proportions as on screen.
const DIAGRAM_CSS_WIDTH = 1000;
const DIAGRAM_SCALE = 2.4;
const DIAGRAM_FONT_FALLBACK = "Helvetica, Arial, sans-serif";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't render the room diagram"));
    img.src = src;
  });
}

async function renderDiagramToCanvas(container) {
  const svg = container?.querySelector("svg");
  if (!svg) return null;
  try {
    const vb = svg.viewBox.baseVal;
    const pxW = Math.round(DIAGRAM_CSS_WIDTH * DIAGRAM_SCALE);
    const pxH = Math.round((pxW * vb.height) / vb.width);

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(pxW));
    clone.setAttribute("height", String(pxH));
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    // An SVG drawn as an image can't see the page's stylesheets, so pin its font.
    clone.setAttribute("font-family", `${getComputedStyle(svg).fontFamily || ""}, ${DIAGRAM_FONT_FALLBACK}`.replace(/^, /, ""));
    clone.querySelectorAll('[vector-effect="non-scaling-stroke"]').forEach((node) => {
      const width = parseFloat(node.getAttribute("stroke-width"));
      if (Number.isFinite(width)) node.setAttribute("stroke-width", String(width * DIAGRAM_SCALE));
      const dash = node.getAttribute("stroke-dasharray");
      if (dash) {
        node.setAttribute(
          "stroke-dasharray",
          dash.split(/[\s,]+/).map((v) => String(parseFloat(v) * DIAGRAM_SCALE)).join(" ")
        );
      }
    });

    const markup = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pxW, pxH);
      ctx.drawImage(img, 0, 0, pxW, pxH);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null; // fall back to the native vector diagram below if rendering fails
  }
}

// Places the captured canvas into the same box the native diagram would have used,
// letterboxing on whichever axis the image doesn't fill so its own aspect ratio (the
// room's real proportions) is never distorted.
function drawDiagramImage(doc, y, height, boxW, canvas) {
  const boxX = MARGIN;
  const imgAspect = canvas.width / canvas.height;
  const boxAspect = boxW / height;
  let drawW, drawH;
  if (imgAspect > boxAspect) {
    drawW = boxW;
    drawH = boxW / imgAspect;
  } else {
    drawH = height;
    drawW = height * imgAspect;
  }
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = y + (height - drawH) / 2;
  const dataUrl = canvas.toDataURL("image/png");
  doc.addImage(dataUrl, "PNG", drawX, drawY, drawW, drawH, undefined, "FAST");
}

// A 3D picture of the room (Room Planner v2), in a card like the photos'. It arrives
// already watermarked, and goes in as a JPEG: a render compresses well, and a PNG of
// it would be several megabytes.
// The card hugs the picture, so a picture shrunk to fit a page's last space is
// centred without grey bands either side.
const IMAGE_PAD = 1.5;
function drawRoom3dImage(doc, y, height, canvas) {
  const innerW = CONTENT_W - IMAGE_PAD * 2, innerH = height - IMAGE_PAD * 2;
  const imgAspect = canvas.width / canvas.height;
  let drawW = innerW, drawH = innerW / imgAspect;
  if (drawH > innerH) { drawH = innerH; drawW = innerH * imgAspect; }
  const cardW = drawW + IMAGE_PAD * 2, cardH = drawH + IMAGE_PAD * 2;
  const cardX = MARGIN + (CONTENT_W - cardW) / 2;
  setFill(doc, CARD_TINT);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, y, cardW, cardH, CARD_RADIUS, CARD_RADIUS, "FD");
  doc.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", cardX + IMAGE_PAD, y + IMAGE_PAD, drawW, drawH, undefined, "FAST");
  return y + cardH;
}

// The diagram is drawn to actual scale, so for most rooms (wider than they are deep,
// relative to the page) it ends up narrower than the full content width — centering
// it just leaves that width as dead space. When there's enough of it left over, this
// draws a companion legend/key panel in it instead, so the space is doing something
// rather than sitting empty beside the drawing.
// A single compact row under the diagram, in a smaller font than the rest of the
// report — just enough to explain what each symbol on the diagram means, without
// repeating facts (layout, seating, device count) already covered by the stat cards
// and Configuration Summary elsewhere on the page.
// A customer's plan has no devices (and theater seating no tables).
const customerLegend = (layout) => ["chair", layout !== "theater" && "table", "wall"].filter(Boolean);

function drawDiagramLegendRow(doc, x, y, kinds = ["device", "chair", "table", "wall"]) {
  const items = [
    { kind: "device", label: "AV device" },
    { kind: "chair", label: "Chair" },
    { kind: "table", label: "Table / desk" },
    { kind: "wall", label: "Room wall" },
  ].filter((item) => kinds.includes(item.kind));
  const cy = y + 1.6;
  let cursorX = x;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  items.forEach((item) => {
    if (item.kind === "device") {
      setFill(doc, DEVICE_BLUE); setDraw(doc, WHITE); doc.setLineWidth(0.25);
      doc.circle(cursorX + 1.1, cy, 1.1, "FD");
    } else if (item.kind === "chair") {
      // Matches the actual chair icon in the diagram above (a seat with two armrest
      // nubs) — a plain circle here looked identical to the AV device swatch.
      setFill(doc, CHAIR_FILL); setDraw(doc, CHAIR_STROKE); doc.setLineWidth(0.2);
      doc.roundedRect(cursorX + 0.5, cy - 0.9, 1.4, 1.8, 0.3, 0.3, "FD");
      doc.roundedRect(cursorX, cy - 0.5, 0.4, 1.0, 0.15, 0.15, "FD");
      doc.roundedRect(cursorX + 2.0, cy - 0.5, 0.4, 1.0, 0.15, 0.15, "FD");
    } else if (item.kind === "table") {
      setFill(doc, TABLE_FILL); setDraw(doc, TABLE_STROKE); doc.setLineWidth(0.25);
      doc.roundedRect(cursorX, cy - 1.1, 2.4, 2.2, 0.4, 0.4, "FD");
    } else {
      setDraw(doc, ROOM_BORDER);
      doc.setLineWidth(0.7);
      doc.line(cursorX, cy, cursorX + 2.4, cy);
    }
    setText(doc, SLATE_700);
    doc.text(item.label, cursorX + 4, y + 2.2);
    cursorX += 4 + doc.getTextWidth(item.label) + 7;
  });
  return y + 5;
}

// --- room photo pages (2 per page, appended after the main report page) -------------------

// Phone camera photos can run 4000px+ per side / several MB each; embedding them at
// native resolution would bloat the PDF and slow generation for no visual benefit at
// half-page print size. Downscaled + re-encoded once here via canvas before jsPDF
// ever sees them. This is also the only place these photos exist as pixels — nothing
// is uploaded, so "don't save the pictures on the website" holds by construction.
const MAX_PHOTO_DIMENSION = 1600;
const PHOTO_JPEG_QUALITY = 0.82;

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY), width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read one of the room photos"));
    };
    img.src = objectUrl;
  });
}

// The smaller header used on every page after the first — report continuation pages
// and room photo pages alike.
function drawCompactHeader(doc, meta, title, subtitle) {
  drawTopAccent(doc);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, SLATE_500);
  doc.text(meta.dateStr, PAGE_W - MARGIN, 11, { align: "right" });
  const dateW = doc.getTextWidth(meta.dateStr);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setText(doc, SLATE_900);
  doc.text(wrapToLines(doc, title, CONTENT_W - dateW - 6, 1), MARGIN, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, SLATE_500);
  doc.text(wrapToLines(doc, subtitle, CONTENT_W, 1), MARGIN, 21.5);

  const dividerY = 25;
  setDraw(doc, BRAND_BLUE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, dividerY, MARGIN + 16, dividerY);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.4);
  doc.line(MARGIN + 16, dividerY, PAGE_W - MARGIN, dividerY);

  return dividerY + 6;
}

// Same tinted-card language as the rest of the report, letterboxing the photo inside
// it (contain-fit) so a portrait or landscape phone photo is never stretched.
function drawPhotoBox(doc, y, height, photo, captionText) {
  const boxX = MARGIN, boxW = CONTENT_W;
  setFill(doc, CARD_TINT);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y, boxW, height, CARD_RADIUS, CARD_RADIUS, "FD");

  const pad = 3;
  const captionH = 5;
  const innerX = boxX + pad, innerY = y + pad;
  const innerW = boxW - pad * 2, innerH = height - pad * 2 - captionH;
  const imgAspect = photo.width / photo.height;
  const boxAspect = innerW / innerH;
  let drawW, drawH;
  if (imgAspect > boxAspect) { drawW = innerW; drawH = innerW / imgAspect; }
  else { drawH = innerH; drawW = innerH * imgAspect; }
  const drawX = innerX + (innerW - drawW) / 2;
  const drawY = innerY + (innerH - drawH) / 2;
  doc.addImage(photo.dataUrl, "JPEG", drawX, drawY, drawW, drawH, undefined, "FAST");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, SLATE_500);
  doc.text(captionText, boxX + pad, y + height - 2);
}

// Appends one new PDF page per pair of photos. Footers aren't drawn here — the entry
// point draws every page's footer in one pass afterward, once the final page count
// (report pages + photo pages) is known.
function drawRoomPhotoPages(doc, meta, photos) {
  for (let i = 0; i < photos.length; i += 2) {
    doc.addPage();
    const y = drawCompactHeader(
      doc,
      meta,
      "Room Photos",
      meta.customerName ? `${meta.customerName} — site survey reference photos` : "Site survey reference photos"
    );
    const bottom = PAGE_H - FOOTER_H - 4;
    const gap = 5;
    const pair = photos.slice(i, i + 2);
    const boxH = pair.length === 2 ? (bottom - y - gap) / 2 : bottom - y;
    pair.forEach((photo, j) => {
      const boxY = y + j * (boxH + gap);
      drawPhotoBox(doc, boxY, boxH, photo, `Photo ${i + j + 1} of ${photos.length}`);
    });
  }
}

// --- 4-column configuration summary (mirrors the on-screen summary panel) -----------------

// Predicts a column's rendered height without drawing anything — used to size the
// column-divider rules in drawSummaryGrid before any of the four columns are drawn.
function measureKeyValueColumn(doc, width, rows) {
  let cursorY = 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  rows.forEach(([, value]) => {
    const lines = doc.splitTextToSize(String(value), width);
    cursorY += 3.3 + lines.length * 3.1 + 1.3;
  });
  return cursorY;
}

function drawKeyValueColumn(doc, x, y, width, title, rows) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, SLATE_500);
  doc.text(title.toUpperCase(), x, y);
  let cursorY = y + 4.5;

  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setText(doc, SLATE_500);
    doc.text(label, x, cursorY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    setText(doc, SLATE_900);
    const lines = doc.splitTextToSize(String(value), width);
    doc.text(lines, x, cursorY + 3.3);
    cursorY += 3.3 + lines.length * 3.1 + 1.3;
  });

  return cursorY;
}

const SUMMARY_GAP = 6;
const SUMMARY_COL_W = (CONTENT_W - SUMMARY_GAP * 3) / 4;
const PLATFORM_LINE_H = 3.8;

// Works out the whole grid (columns, and the UC Platform block's wrapped lines) up
// front so its height is known before anything is drawn — the entry point needs it
// to decide whether the section still fits on the current page.
// `unconfirmed` holds the sections ("step:section") nobody opened, so their values are
// still the starting defaults; those are marked "(default)" for whoever reads it next.
function layoutSummaryGrid(doc, state, audience, unconfirmed = new Set()) {
  const { room, table, chairCount, layout, platform, audioPreference, devices, wallMaterials, floorType, ceilingType, tableTopMaterial, cameraFeatures } = state;
  const layoutLabel = LAYOUTS.find((l) => l.id === layout)?.label || "Not chosen";
  const colW = SUMMARY_COL_W;
  const mark = (section, rows) => (unconfirmed.has(section) ? rows.map(([k, v]) => [k, `${v} ${DEFAULT_MARK}`]) : rows);

  // A customer's report holds just the room and its furniture.
  if (audience === "customer") {
    const furnitureRows = !layout
      ? [["Layout", "Not chosen"]]
      : [
          ["Layout", layoutLabel],
          ...mark("table:seats", [
            ["Seats", `${chairCount}`],
            ["Seating spacing", `${seatingDensityLabel(state.seatingDensity)} (${seatingSpacingSummary(layout, state.seatingDensity)})`],
          ]),
          ...mark("table:size", [
            ...(TABLE_SIZED_LAYOUTS.includes(layout)
              ? [
                  ["Table size", `${table.length.toFixed(1)} × ${table.width.toFixed(1)} m`],
                  ["Orientation", table.orientation === 0 ? "Landscape" : "Portrait"],
                ]
              : []),
            ...(layout === "classroom" ? [["Desk depth", `${(table.deskDepth ?? CLASSROOM_DESK_DEPTH.default).toFixed(2)} m`]] : []),
          ]),
          ...(TABLE_SIZED_LAYOUTS.includes(layout) ? [] : [["Tables", TABLE_KIND_LABELS[layout]]]),
          ...(layout === "theater" ? [] : [["Top", tableTopMaterial || NOT_SPECIFIED]]),
        ];
    const columns = [
      ["Room", [
        ...mark("room:dimensions", [["Size", `${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m`]]),
        ...mark("room:finishes", [
          ["Floor", floorType || NOT_SPECIFIED],
          ["Ceiling", ceilingType || NOT_SPECIFIED],
        ]),
      ]],
      ["Furniture", furnitureRows],
    ];
    const columnHeights = columns.map(([, rows]) => measureKeyValueColumn(doc, colW, rows));
    return { columns, columnHeights, platformLines: null, height: 3.5 + Math.max(...columnHeights) + 4 };
  }

  const roomRows = [
    ...mark("room:dimensions", [["Size", `${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m`]]),
    ["Layout", layoutLabel],
    ...mark("seating:seating", [
      ["Seating", `${chairCount} chairs`],
      ["Seating spacing", `${seatingDensityLabel(state.seatingDensity)} (${seatingSpacingSummary(layout, state.seatingDensity)})`],
    ]),
    ...mark("room:finishes", [
      ["Walls", wallMaterials?.length ? wallMaterials.join(", ") : NOT_SPECIFIED],
      ["Floor", floorType || NOT_SPECIFIED],
      ["Ceiling", ceilingType || NOT_SPECIFIED],
    ]),
  ];
  // The size a layout starts with is a default until checked; the top is only ever
  // what someone picked.
  const tableRows = TABLE_SIZED_LAYOUTS.includes(layout)
    ? [...mark("seating:table", [["Size", `${table.length.toFixed(1)} × ${table.width.toFixed(1)} m`]]), ["Top", tableTopMaterial || NOT_SPECIFIED]]
    : [
        ["Tables", TABLE_KIND_LABELS[layout] || "None"],
        ...(layout === "classroom" ? mark("seating:table", [["Desk depth", `${(table.deskDepth ?? CLASSROOM_DESK_DEPTH.default).toFixed(2)} m`]]) : []),
        ...(!layout || layout === "theater" ? [] : [["Top", tableTopMaterial || NOT_SPECIFIED]]),
      ];
  const deviceRows = [
    ["Display", devices.display.length ? devices.display.map((d, i) => `${refCode("display", i)}: ${displaySpec(d)}`).join(", ") : "0"],
    ...(devices.allInOne.length ? [["All-in-one display", devices.allInOne.map((d, i) => `${refCode("allInOne", i)}: ${allInOneSpec(d)}`).join(", ")]] : []),
    ["Camera", devices.camera.length ? devices.camera.map((c, i) => `${refCode("camera", i)}: ${c.isTableCam ? "360°" : `${c.fov}°`}`).join(", ") : "0"],
    ["Video bar", devices.videoBar.length ? devices.videoBar.map((v, i) => `${refCode("videoBar", i)}: ${v.fov}°`).join(", ") : "0"],
    ["Camera features", cameraFeatures?.length ? cameraFeatures.map((id) => CAMERA_FEATURES.find((f) => f.id === id)?.label || id).join(", ") : "None selected"],
    ["Audio setup", audioPreference || NOT_SPECIFIED],
    ["Microphones", devices.microphone.length ? devices.microphone.map((_, i) => refCode("microphone", i)).join(", ") : "0"],
    ["Speakers", devices.speaker.length ? devices.speaker.map((_, i) => refCode("speaker", i)).join(", ") : "0"],
  ];
  const markedDeviceRows = [
    ...mark("video:devices", deviceRows.slice(0, deviceRows.length - 4)),
    ...deviceRows.slice(-4, -3),
    ...mark("audio:audio", deviceRows.slice(-3)),
  ];
  // Door is intentionally left out here — its position is only ever meaningful on
  // the diagram itself (which wall it's on), so it lives there and nowhere else.
  const controlRows = mark("audio:control", [
    ["Touch panel", devices.touchPanel.length ? devices.touchPanel.map((_, i) => refCode("touchPanel", i)).join(", ") : "Not included"],
    ["Content sharing", devices.contentSharing.length ? devices.contentSharing.map((_, i) => refCode("contentSharing", i)).join(", ") : "Not included"],
    ["Booking panel", devices.bookingPanel.length ? devices.bookingPanel.map((d, i) => `${refCode("bookingPanel", i)}: ${d.edge}`).join(", ") : "Not included"],
  ]);

  const columns = [
    ["Room", roomRows],
    ["Table", tableRows],
    ["Devices", markedDeviceRows],
    ["Room controls", controlRows],
  ];

  const columnHeights = columns.map(([, rows]) => measureKeyValueColumn(doc, colW, rows));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const platformLines = doc.splitTextToSize(platform || NOT_SPECIFIED, colW);
  // Offsets from the grid's top edge, matching what drawSummaryGrid draws.
  const tableColumnBottom = 3.5 + columnHeights[1];
  const platformBottom = tableColumnBottom + 10 + (platformLines.length - 1) * PLATFORM_LINE_H;
  const height = Math.max(3.5 + Math.max(...columnHeights), platformBottom) + 4;
  return { columns, columnHeights, platformLines, height };
}

function drawSummaryGrid(doc, y, grid) {
  const { columns, columnHeights, platformLines } = grid;
  const colW = SUMMARY_COL_W;
  const gap = SUMMARY_GAP;

  // Divider rules between the four columns, tying this grid to the same "structured
  // grid" language as the dimensions strip above it — sized from the measure pass
  // so they run the full height of whichever column ends up tallest.
  const blockHeight = Math.max(...columnHeights);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  for (let i = 1; i < columns.length; i++) {
    const x = MARGIN + i * (colW + gap) - gap / 2;
    doc.line(x, y, x, y + 3.5 + blockHeight);
  }

  let tableColumnBottom = y;
  columns.forEach(([title, rows], i) => {
    const x = MARGIN + i * (colW + gap);
    const bottom = drawKeyValueColumn(doc, x, y + 3.5, colW, title, rows);
    if (title === "Table") tableColumnBottom = bottom;
  });

  if (!platformLines) return y + grid.height;

  // UC Platform gets its own section header (matching ROOM/TABLE/etc.) rather than
  // being just another row inside Table — drawn in the Table column's own left-over
  // vertical space, since that column (2 rows) is far shorter than the others.
  const tableX = MARGIN + colW + gap;
  const platformY = tableColumnBottom + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, SLATE_500);
  doc.text("UC PLATFORM", tableX, platformY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(doc, SLATE_900);
  doc.text(platformLines, tableX, platformY + 5);

  return y + grid.height;
}

// Values from sections nobody opened are the starting defaults, not answers; anything
// nobody filled in at all says so.
const DEFAULT_MARK = "(default)";
const NOT_SPECIFIED = "Not specified";
const DEFAULT_NOTE = "(default) — a starting value nobody changed or confirmed while filling this in. Please verify it on site.";

// --- device placement table ---------------------------------------------------------------

function deviceSpecText(category, item) {
  switch (category) {
    case "display": return `${displaySpec(item)} display`;
    case "allInOne": return `${item.sizeInches}" all-in-one — built-in ${item.fov}° camera, mics (~${item.micReach}m) and speakers`;
    case "camera":
      return item.isTableCam
        ? `360° camera — built-in mics (~${TABLE_CAM_MIC_RANGE_M}m), no speaker; paired with a video bar or all-in-one display`
        : `${item.fov}° FOV camera`;
    case "videoBar": return `${item.fov}° FOV video bar`;
    case "microphone": return "Microphone";
    case "speaker": return "Speaker";
    case "touchPanel": return "Touch panel";
    case "contentSharing": return "Content sharing dongle";
    case "door": return `Door (${item.edge} wall)`;
    case "bookingPanel":
      return item.wired
        ? `Booking panel — wired room display, cable drop (${item.edge} wall)`
        : `Booking panel — ROOMZ wireless room display (${item.edge} wall)`;
    default: return DEVICE_LABELS[category] || category;
  }
}

const DEVICE_TABLE_COLS = [
  { label: "Ref", w: 16 },
  { label: "Type", w: 38 },
  { label: "Spec", w: 88 },
  { label: "Position", w: CONTENT_W - 16 - 38 - 88 },
];
const DEVICE_TABLE_HEADER_H = 6.2;
const DEVICE_TABLE_ROW_H = 4.6;

function deviceTableRows(devices) {
  const rows = [];
  DEVICE_ORDER.forEach((category) => {
    devices[category].forEach((item, idx) => {
      rows.push([refCode(category, idx), DEVICE_LABELS[category], deviceSpecText(category, item), `${item.x.toFixed(2)}, ${item.y.toFixed(2)} m`]);
    });
  });
  return rows;
}

function drawDeviceTableHeader(doc, y) {
  setFill(doc, SLATE_100);
  doc.rect(MARGIN, y, CONTENT_W, DEVICE_TABLE_HEADER_H, "F");
  let colX = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, SLATE_500);
  DEVICE_TABLE_COLS.forEach((c) => {
    doc.text(c.label.toUpperCase(), colX + 2, y + 4.1);
    colX += c.w;
  });
  return y + DEVICE_TABLE_HEADER_H;
}

// Outline, header rule, and column rules for one page's worth of the table.
function strokeDeviceTableFrame(doc, top, bottom) {
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, top, CONTENT_W, bottom - top, "S");
  doc.line(MARGIN, top + DEVICE_TABLE_HEADER_H, MARGIN + CONTENT_W, top + DEVICE_TABLE_HEADER_H);
  let colX = MARGIN;
  for (let i = 0; i < DEVICE_TABLE_COLS.length - 1; i++) {
    colX += DEVICE_TABLE_COLS[i].w;
    doc.line(colX, top, colX, bottom);
  }
}

// Rows that would run past the bottom of the page continue on the next one
// (`newPage` adds it and returns where content starts), under a repeated header row.
function drawDeviceTable(doc, y, rows, newPage) {
  if (!rows.length) return y;
  let segmentTop = y;
  let cursorY = drawDeviceTableHeader(doc, y);

  // Alternating row tint reads as a real data table rather than a loose text list.
  rows.forEach((row, r) => {
    if (cursorY + DEVICE_TABLE_ROW_H > CONTENT_BOTTOM) {
      strokeDeviceTableFrame(doc, segmentTop, cursorY);
      segmentTop = newPage();
      cursorY = drawDeviceTableHeader(doc, segmentTop);
    }
    if (r % 2 === 1) {
      setFill(doc, CARD_TINT);
      doc.rect(MARGIN, cursorY, CONTENT_W, DEVICE_TABLE_ROW_H, "F");
    }
    let colX = MARGIN;
    doc.setFontSize(7.6);
    row.forEach((cell, i) => {
      setText(doc, i === 0 ? BRAND_NAVY : SLATE_700);
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.text(String(cell), colX + 2, cursorY + DEVICE_TABLE_ROW_H / 2 + 1.3);
      colX += DEVICE_TABLE_COLS[i].w;
    });
    cursorY += DEVICE_TABLE_ROW_H;
  });

  strokeDeviceTableFrame(doc, segmentTop, cursorY);
  return cursorY + 3;
}

// --- recommended notes ---------------------------------------------------------------------

function measureNotesHeight(doc, notes, wrapWidth) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  let h = 0;
  notes.forEach((note) => {
    const lines = doc.splitTextToSize(note, wrapWidth);
    h += lines.length * 3.6 + 1.3;
  });
  return h;
}

const NOTES_PAD = { top: 3, bottom: 2.5, left: 7, right: 5 };
const NOTES_WRAP_W = CONTENT_W - NOTES_PAD.left - NOTES_PAD.right;

function notesBoxHeight(doc, notes) {
  return NOTES_PAD.top + measureNotesHeight(doc, notes, NOTES_WRAP_W) + NOTES_PAD.bottom;
}

// A tinted callout card instead of bare bullets on white — gives the advisory notes
// visual weight as a distinct "read this" block, the same way a pull-quote or
// callout box reads in a printed report.
function drawNotes(doc, y, notes) {
  const padTop = NOTES_PAD.top, padLeft = NOTES_PAD.left;
  const wrapWidth = NOTES_WRAP_W;
  const boxH = notesBoxHeight(doc, notes);

  setFill(doc, BRAND_BLUE_TINT);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, CARD_RADIUS, CARD_RADIUS, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  let cursorY = y + padTop + 2.6;
  notes.forEach((note) => {
    setFill(doc, BRAND_BLUE);
    doc.circle(MARGIN + padLeft - 3, cursorY - 1.1, 0.6, "F");
    setText(doc, SLATE_700);
    const lines = doc.splitTextToSize(note, wrapWidth);
    doc.text(lines, MARGIN + padLeft, cursorY);
    cursorY += lines.length * 3.6 + 1.3;
  });

  return y + boxH;
}

// --- additional notes (free text from the user, distinct from the system-generated
// recommendations) -----------------------------------------------------------------

// Shown in full: a note too long for the rest of the page continues in a second box
// on the next page rather than being cut off.
const USER_NOTES_PAD = { top: 4, bottom: 3, left: 6, right: 6 };
const USER_NOTES_LINE_H = 3.8;

// Wrapping is measurement — done once here so the entry point's fit check and the
// actual draw always agree on exactly how many lines resulted.
function wrapUserNotes(doc, notesText) {
  const wrapWidth = CONTENT_W - USER_NOTES_PAD.left - USER_NOTES_PAD.right;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  return doc.splitTextToSize(notesText, wrapWidth);
}

function measureUserNotesBoxHeight(lines) {
  return USER_NOTES_PAD.top + lines.length * USER_NOTES_LINE_H + USER_NOTES_PAD.bottom;
}

function drawUserNotesBox(doc, y, lines) {
  const boxH = measureUserNotesBoxHeight(lines);

  setFill(doc, CARD_TINT);
  setDraw(doc, SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, CARD_RADIUS, CARD_RADIUS, "FD");
  setFill(doc, BRAND_BLUE);
  doc.roundedRect(MARGIN, y, 1.2, boxH, 0.6, 0.6, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, SLATE_700);
  // Line by line at USER_NOTES_LINE_H, the same step the box is sized with, so a
  // long note fills its box exactly.
  lines.forEach((line, i) => doc.text(line, MARGIN + USER_NOTES_PAD.left, y + USER_NOTES_PAD.top + 2.8 + i * USER_NOTES_LINE_H));

  return y + boxH;
}

// Draws as many lines as fit above the footer, then continues on a new page
// (`newPage` adds it and returns where content starts) until every line is shown.
function drawUserNotes(doc, y, lines, newPage) {
  let cursorY = y;
  let start = 0;
  while (start < lines.length) {
    const fits = Math.floor((CONTENT_BOTTOM - cursorY - USER_NOTES_PAD.top - USER_NOTES_PAD.bottom) / USER_NOTES_LINE_H);
    if (fits < 1) {
      cursorY = newPage();
      continue;
    }
    const chunk = lines.slice(start, start + fits);
    cursorY = drawUserNotesBox(doc, cursorY, chunk);
    start += chunk.length;
    if (start < lines.length) cursorY = newPage();
  }
  return cursorY;
}

// --- entry point -----------------------------------------------------------------------------

// "Company Name_Room Name.pdf". Names keep their spaces and capitals; only
// characters that aren't allowed in file names on Windows/macOS are dropped.
function fileNamePart(text, fallback) {
  const cleaned = Array.from(String(text || ""), (ch) => (ch.charCodeAt(0) < 32 ? " " : ch))
    .join("")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80)
    .trim();
  return cleaned || fallback;
}

export function reportFileName(companyName, roomName) {
  return `${fileNamePart(companyName, "Company")}_${fileNamePart(roomName, "Room")}.pdf`;
}

// `audience` "customer" makes the shorter report a customer hands to their technology
// partner: the room, its table, photos and notes — no seating plan, devices or advice.
export async function exportRoomConfigPdf({ state, layoutResult, removedChairIndices, chairOffsets, roomName, customerName, createdBy, diagramElement, images = [], audience = "reseller", unconfirmed = new Set(), views3d = [], includeRecommendations = true }) {
  const customer = audience === "customer";
  const reportTitle = customer ? "Meeting Room Details" : "Meeting Room Configuration";
  if (!state || !layoutResult) throw new Error("Nothing to export — the room configuration wasn't found.");

  // Captured/decoded before anything else is drawn — these are the only async steps
  // in this whole export, and doing them first means everything below can stay
  // synchronous. Photos are decoded to data URLs entirely in memory (canvas), never
  // sent anywhere — nothing about this export touches a server.
  const diagramCanvas = await renderDiagramToCanvas(diagramElement);
  const photos = images.length ? await Promise.all(images.map(loadImageFile)) : [];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const meta = { customerName, createdBy, dateStr, fromCustomer: audience === "customer" };

  let y = drawHeader(doc, meta, `${reportTitle} for: ${customerName}`);
  y = drawStatCards(doc, y, state, roomName);

  // Page flow: each section checks it fits above the footer before drawing, and
  // otherwise starts a new page under a compact continuation header — a section is
  // never split mid-way or drawn over the footer. (The device table is the one
  // exception: its rows continue across pages under a repeated header row.)
  const newPage = () => {
    doc.addPage();
    y = drawCompactHeader(doc, meta, `${reportTitle} (continued)`, `${customerName} · ${roomName}`);
    return y;
  };
  const ensureSpace = (height) => {
    if (y + height > CONTENT_BOTTOM) newPage();
  };

  // The diagram gets the full content width (table size and seating are on the stat
  // cards above), and is drawn as large as fits this box at the room's own proportions.
  const diagramH = 105;
  const LEGEND_H = 5;
  const diagramBoxW = CONTENT_W;
  ensureSpace(SECTION_TITLE_H + diagramH + 4 + LEGEND_H);
  y = drawSectionTitle(doc, y, "Room Layout Diagram");
  if (diagramCanvas) {
    drawDiagramImage(doc, y, diagramH, diagramBoxW, diagramCanvas);
  } else {
    drawDiagram(doc, y, diagramH, diagramBoxW, state, layoutResult, removedChairIndices, chairOffsets);
  }
  y += diagramH + 4;
  y = drawDiagramLegendRow(doc, MARGIN, y, customer ? customerLegend(state.layout) : undefined) + 5;

  const summary = layoutSummaryGrid(doc, state, audience, unconfirmed);
  const marked = summary.columns.some(([, rows]) => rows.some(([, v]) => String(v).endsWith(DEFAULT_MARK)));
  ensureSpace(SECTION_TITLE_H + summary.height + (marked ? 6 : 0));
  y = drawSectionTitle(doc, y, customer ? "Room Details" : "Configuration Summary");
  y = drawSummaryGrid(doc, y, summary) + 2;
  if (marked) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    setText(doc, SLATE_500);
    doc.text(DEFAULT_NOTE, MARGIN, y + 1.5);
    y += 6;
  }

  const deviceRows = customer ? [] : deviceTableRows(state.devices);
  if (deviceRows.length) {
    // Keep the section title with at least its header and first couple of rows.
    ensureSpace(SECTION_TITLE_H + DEVICE_TABLE_HEADER_H + DEVICE_TABLE_ROW_H * Math.min(deviceRows.length, 2));
    y = drawSectionTitle(doc, y, "Device Placement");
    y = drawDeviceTable(doc, y, deviceRows, newPage) + 2;
  }

  if (state.additionalNotes?.trim()) {
    const lines = wrapUserNotes(doc, state.additionalNotes.trim());
    // Keep the section title with at least the first few lines of the note.
    ensureSpace(SECTION_TITLE_H + measureUserNotesBoxHeight(lines.slice(0, 3)));
    y = drawSectionTitle(doc, y, "Additional Notes");
    y = drawUserNotes(doc, y, lines, newPage) + 6;
  }

  if (!customer && includeRecommendations) {
    const notes = recommendationNotes(state);
    ensureSpace(SECTION_TITLE_H + notesBoxHeight(doc, notes));
    y = drawSectionTitle(doc, y, "Recommendations");
    y = drawNotes(doc, y, notes) + 6;
  }

  // Room Planner v2: the finished room in 3D, after the written sections so those fill
  // the first pages. Each picture takes the full width where it fits; when a page has
  // most of the room it needs, the picture shrinks a little to finish that page rather
  // than leave it half empty.
  views3d.forEach(({ title, canvas }) => {
    const full = CONTENT_W / (canvas.width / canvas.height) + IMAGE_PAD * 2;
    const space = () => CONTENT_BOTTOM - y - SECTION_TITLE_H - 1;
    if (space() < full * 0.7) newPage();
    const h = Math.min(full, space());
    y = drawSectionTitle(doc, y, title);
    y = drawRoom3dImage(doc, y, h, canvas) + 6;
  });

  if (photos.length) drawRoomPhotoPages(doc, meta, photos);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, meta, p, totalPages);
  }

  doc.save(reportFileName(customerName, roomName));
}
