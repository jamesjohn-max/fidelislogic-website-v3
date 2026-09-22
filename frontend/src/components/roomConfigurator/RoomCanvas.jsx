import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import {
  GRID_STEP,
  ROOM_MARGIN,
  DEVICE_LABELS,
  DEVICE_ORDER,
  POD_CHAIR_RING_INSET,
  rotatePoint,
  clamp,
  generateFovPolygon,
  fovEdgeRays,
  displayWidthMeters,
  angleFromVector,
  refLabel,
  nearestGridPoint,
  rotateBy,
  clampTableOffset,
  TABLE_CAM_MIC_RANGE_M,
} from "../../lib/roomConfiguratorEngine";
import "./roomConfigurator.css";

// Two colour sets for the plan: dark to sit in the page, and light for the PDF, which is
// rendered from a copy of this SVG drawn with the print colours.
const PALETTES = {
  screen: {
    margin: "#0A101C", floor: "#111A2A", grid: "#1E293B", wall: "#94A3B8",
    tableFill: "#1C2840", tableStroke: "#64748B", tableFillSel: "#1E3A8A", tableStrokeSel: "#60A5FA", podTick: "#64748B",
    chairSeat: "#27344A", chairAccent: "#3E4D66", chairStroke: "#8391A7", chairSeatSel: "#1E3A8A", chairAccentSel: "#3B82F6", chairStrokeSel: "#93C5FD",
    device: "#2563EB", deviceStroke: "#60A5FA", deviceAccent: "#DBEAFE", deviceSel: "#3B82F6", deviceStrokeSel: "#BFDBFE", deviceAccentSel: "#EFF6FF",
    select: "#60A5FA", fov: "#3B82F6", fovLabel: "#93C5FD",
    label: "#CBD5E1", halo: "#111A2A", rulerMinor: "#334155", rulerMajor: "#64748B", rulerLabel: "#7C8BA1",
    handleFill: "#0B1220", badgeFill: "#E2E8F0", badgeText: "#0F172A", badgeStroke: "#0B1220", coord: "#F1F5F9",
  },
  print: {
    margin: "#E7ECF2", floor: "#F8FAFC", grid: "#E2E8F0", wall: "#334155",
    tableFill: "#E3E9F1", tableStroke: "#5B6B82", tableFillSel: "#DBEAFE", tableStrokeSel: "#2563EB", podTick: "#94A3B8",
    chairSeat: "#EEF1F6", chairAccent: "#B9C3D1", chairStroke: "#7C8BA1", chairSeatSel: "#DBEAFE", chairAccentSel: "#93C5FD", chairStrokeSel: "#2563EB",
    device: "#2563EB", deviceStroke: "#1D4ED8", deviceAccent: "#E2E8F0", deviceSel: "#2563EB", deviceStrokeSel: "#1D4ED8", deviceAccentSel: "#DBEAFE",
    select: "#2563EB", fov: "#2563EB", fovLabel: "#1D4ED8",
    label: "#334155", halo: "#FFFFFF", rulerMinor: "#CBD5E1", rulerMajor: "#64748B", rulerLabel: "#94A3B8",
    handleFill: "#FFFFFF", badgeFill: "#0F172A", badgeText: "#FFFFFF", badgeStroke: "#FFFFFF", coord: "#0F172A",
  },
};
const PaletteContext = createContext(PALETTES.screen);
const usePalette = () => useContext(PaletteContext);

// A device's fill, outline and detail colours, selected or not.
function useDeviceColors(selected) {
  const c = usePalette();
  return selected
    ? { fill: c.deviceSel, stroke: c.deviceStrokeSel, accent: c.deviceAccentSel }
    : { fill: c.device, stroke: c.deviceStroke, accent: c.deviceAccent };
}

// Everything is drawn in meters, but outlines use non-scaling strokes, whose widths are
// screen pixels, so they stay crisp and the same weight at any room size.

// Realistic top-down office chair: curved backrest peeking out behind a rounded
// seat, with small armrest nubs — reads as an actual chair, not a plain block.
const ChairIcon = ({ selected }) => {
  const c = usePalette();
  const seatFill = selected ? c.chairSeatSel : c.chairSeat;
  const accentFill = selected ? c.chairAccentSel : c.chairAccent;
  const stroke = selected ? c.chairStrokeSel : c.chairStroke;
  const sw = selected ? 1.5 : 1;
  return (
    <g>
      <path
        d="M -0.16 0.06 A 0.185 0.185 0 0 0 0.16 0.06"
        fill="none"
        stroke={accentFill}
        strokeWidth={0.12}
        strokeLinecap="round"
      />
      <rect x={-0.17} y={-0.18} width={0.34} height={0.3} rx={0.08} fill={seatFill} stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      <rect x={-0.245} y={-0.07} width={0.065} height={0.16} rx={0.028} fill={accentFill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <rect x={0.18} y={-0.07} width={0.065} height={0.16} rx={0.028} fill={accentFill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

// Wall-mounted screen: proportional-width bar (per the chosen diagonal) with small
// corner brackets, reading as a TV/display symbol rather than a plain line.
const DisplayIcon = ({ widthM, selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  const tick = Math.min(0.09, widthM * 0.18);
  return (
    <g>
      <rect x={-widthM / 2} y={-0.045} width={widthM} height={0.09} rx={0.025} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <line x1={-widthM / 2} y1={-0.045} x2={-widthM / 2} y2={-0.045 - tick} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={widthM / 2} y1={-0.045} x2={widthM / 2} y2={-0.045 - tick} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={0} r={0.032} fill={accent} />
    </g>
  );
};

// All-in-one display: the screen bar, with the camera in a raised housing at its middle
// (on the room side, like a video bar's) and speaker grilles toward each end.
const AllInOneIcon = ({ widthM, selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  const grilleX = [0.22, 0.3].map((f) => f * widthM);
  return (
    <g>
      <DisplayIcon widthM={widthM} selected={selected} />
      {grilleX.flatMap((gx) => [
        <circle key={`l${gx}`} cx={-gx} cy={0} r={0.014} fill={accent} />,
        <circle key={`r${gx}`} cx={gx} cy={0} r={0.014} fill={accent} />,
      ])}
      <rect x={-0.07} y={-0.1} width={0.14} height={0.1} rx={0.03} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-0.05} r={0.032} fill={accent} stroke={stroke} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-0.05} r={0.012} fill={stroke} />
    </g>
  );
};

// Camera body + lens + viewfinder hump, like a compact camcorder silhouette.
const CameraIcon = ({ selected, isTableCam }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  if (isTableCam) {
    return (
      <g>
        <circle r={0.075} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
        <circle r={0.03} fill={accent} />
        <circle r={0.115} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  return (
    <g>
      <rect x={-0.075} y={-0.045} width={0.15} height={0.09} rx={0.0225} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <rect x={-0.0275} y={-0.0775} width={0.055} height={0.0375} rx={0.009} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={0} r={0.0325} fill={accent} stroke={stroke} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

// Video bar: a long, slim soundbar-style body with speaker grilles at both ends and
// the camera lens in a raised housing at the middle, facing the room like a camera.
const VideoBarIcon = ({ selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  const w = 0.7;
  const h = 0.09;
  const grilleX = [0.13, 0.18, 0.23, 0.28];
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      {grilleX.flatMap((gx) => [
        <circle key={`l${gx}`} cx={-gx} cy={0} r={0.012} fill={accent} />,
        <circle key={`r${gx}`} cx={gx} cy={0} r={0.012} fill={accent} />,
      ])}
      <rect x={-0.07} y={-0.08} width={0.14} height={0.12} rx={0.03} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-0.02} r={0.036} fill={accent} stroke={stroke} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-0.02} r={0.014} fill={stroke} />
    </g>
  );
};

// Speaker cone + sound-wave arcs — the classic "audio out" glyph, unmistakable at a glance.
const SpeakerIcon = ({ selected }) => {
  const { fill, stroke } = useDeviceColors(selected);
  return (
    <g>
      <path
        d="M -0.0225 -0.045 L -0.08 -0.045 L -0.08 0.045 L -0.0225 0.045 L 0.055 0.095 L 0.055 -0.095 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M 0.085 -0.04 A 0.055 0.055 0 0 1 0.085 0.04" fill="none" stroke={fill} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M 0.115 -0.075 A 0.095 0.095 0 0 1 0.115 0.075" fill="none" stroke={fill} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
};

// Mic capsule on a shock-mount cradle, with grille lines and a stand — a real
// microphone silhouette, distinct from the speaker's cone-and-waves glyph.
const MicrophoneIcon = ({ selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  return (
    <g>
      <rect x={-0.05} y={-0.11} width={0.1} height={0.14} rx={0.05} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <line x1={-0.03} y1={-0.083} x2={0.03} y2={-0.083} stroke={accent} strokeWidth={0.008} strokeLinecap="round" />
      <line x1={-0.03} y1={-0.055} x2={0.03} y2={-0.055} stroke={accent} strokeWidth={0.008} strokeLinecap="round" />
      <line x1={-0.03} y1={-0.027} x2={0.03} y2={-0.027} stroke={accent} strokeWidth={0.008} strokeLinecap="round" />
      <path d="M -0.075 -0.01 A 0.075 0.075 0 0 0 0.075 -0.01" fill="none" stroke={fill} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0.065} x2={0} y2={0.105} stroke={fill} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={-0.04} y1={0.105} x2={0.04} y2={0.105} stroke={fill} strokeWidth={1.75} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
};

// Tablet body with a screen inset and home button — a real touch-panel silhouette.
const TouchPanelIcon = ({ selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  return (
    <g>
      <rect x={-0.065} y={-0.085} width={0.13} height={0.17} rx={0.0175} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <rect x={-0.05} y={-0.065} width={0.1} height={0.11} rx={0.006} fill={accent} />
      <circle cx={0} cy={0.0625} r={0.009} fill={accent} />
    </g>
  );
};

// Wireless-sharing dongle: a plug-in body with a connector prong and a status LED —
// the real object you'd hand someone to cast their laptop to the room display.
const ContentSharingIcon = ({ selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  return (
    <g>
      <rect x={-0.095} y={-0.05} width={0.15} height={0.1} rx={0.024} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <rect x={0.045} y={-0.02} width={0.05} height={0.04} rx={0.006} fill={fill} stroke={stroke} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <circle cx={-0.02} cy={0} r={0.02} fill={accent} />
    </g>
  );
};

// Architectural door symbol: a slab drawn parallel to whichever wall it's snapped to
// (our rotation maps local-x to the wall direction on every edge), plus a handle.
const DoorIcon = ({ selected }) => {
  const w = 0.9;
  const thickness = 0.1;
  const { fill, stroke, accent } = useDeviceColors(selected);
  return (
    <g>
      <rect x={-w / 2} y={-thickness / 2} width={w} height={thickness} rx={0.02} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <circle cx={w / 2 - 0.16} cy={0} r={0.03} fill={accent} />
    </g>
  );
};

// Flush wall-mounted scheduling panel: wide and shallow, sitting right at the wall
// line and extending only slightly into the room — like a real mounted panel, not
// a device floating in the middle of the floor.
const BookingPanelIcon = ({ selected }) => {
  const { fill, stroke, accent } = useDeviceColors(selected);
  const w = 0.36;
  const depth = 0.12;
  const y0 = 0.015;
  return (
    <g>
      <rect x={-w / 2} y={y0} width={w} height={depth} rx={0.022} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <line x1={-w / 2 + 0.05} y1={y0 + depth * 0.35} x2={w / 2 - 0.15} y2={y0 + depth * 0.35} stroke={accent} strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={-w / 2 + 0.05} y1={y0 + depth * 0.65} x2={w / 2 - 0.15} y2={y0 + depth * 0.65} stroke={accent} strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={w / 2 - 0.07} cy={y0 + depth / 2} r={0.026} fill={accent} />
    </g>
  );
};

// How far a device's built-in microphones reach: a ring clipped to the room, labelled
// on whichever side stays inside it. A 360° camera sees the whole room, so it shows
// this (tinted) instead of a view cone; an all-in-one display shows it as a dashed
// outline over its view cone.
function MicRange({ cam, reach, room, labelScale, outline = false, text = `Mic pickup ~${reach}m` }) {
  const c = usePalette();
  const clipId = `rc-range-${cam.id}`;
  const fontSize = 0.11 * labelScale;
  // Just inside the ring's top edge, else its bottom, left or right — the first spot
  // that's inside the room (a ring can be wider than the room in both directions). A
  // wall-mounted device's ring is labelled where it meets the top or bottom wall
  // first, clear of the furniture it reaches over.
  const label = (r, text) => {
    const inset = fontSize * 0.5;
    const alongWall = (wallY, y) => {
      const dy = Math.abs(wallY - cam.y);
      if (!outline || dy >= r) return [];
      const dx = Math.sqrt(r * r - dy * dy);
      return [cam.x + dx, cam.x - dx].map((x) => ({ x, y, anchor: "middle" }));
    };
    const spots = [
      ...alongWall(0, fontSize * 1.3),
      ...alongWall(room.width, room.width - inset),
      { x: cam.x, y: cam.y - r + fontSize * 1.3, anchor: "middle" },
      { x: cam.x, y: cam.y + r - inset, anchor: "middle" },
      { x: cam.x - r + inset, y: cam.y + fontSize * 0.35, anchor: "start" },
      { x: cam.x + r - inset, y: cam.y + fontSize * 0.35, anchor: "end" },
    ];
    // A centered label needs half its width clear of the side walls.
    const clearance = (p) => (p.anchor === "middle" ? fontSize * 4 : inset);
    const spot = spots.find((p) => p.y > fontSize && p.y < room.width - inset && p.x > clearance(p) && p.x < room.length - clearance(p));
    if (!spot) return null;
    return (
      <text x={spot.x} y={spot.y} textAnchor={spot.anchor} fontSize={fontSize} fontWeight={600} fill={c.fovLabel} fillOpacity={0.85} stroke={c.halo} strokeWidth={0.03 * labelScale} paintOrder="stroke">
        {text}
      </text>
    );
  };
  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={room.length} height={room.width} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle
          cx={cam.x}
          cy={cam.y}
          r={reach}
          fill={outline ? "none" : c.fov}
          fillOpacity={0.08}
          stroke={c.fov}
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeDasharray={outline ? "6 5" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      {label(reach, text)}
    </g>
  );
}

// Shared by cameras, video bars and all-in-one displays — anything with a field of view.
function FovRay({ cam, room, labelScale }) {
  if (cam.isTableCam) return <MicRange cam={cam} reach={TABLE_CAM_MIC_RANGE_M} room={room} labelScale={labelScale} />;
  return (
    <>
      <ViewCone cam={cam} room={room} />
      {cam.micReach && <MicRange cam={cam} reach={cam.micReach} room={room} labelScale={labelScale} outline />}
    </>
  );
}

// Front-of-room cameras and video bars: the fan of what the lens sees, out to the walls.
function ViewCone({ cam, room }) {
  const c = usePalette();
  const { fov } = cam;
  const poly = useMemo(() => generateFovPolygon(cam.x, cam.y, cam.angle, fov, room), [cam.x, cam.y, cam.angle, fov, room]);
  const edges = useMemo(() => fovEdgeRays(cam.x, cam.y, cam.angle, fov, room), [cam.x, cam.y, cam.angle, fov, room]);
  const pointsAttr = poly.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
  return (
    <g pointerEvents="none">
      <polygon points={pointsAttr} fill={c.fov} fillOpacity={0.12} />
      <line x1={cam.x} y1={cam.y} x2={edges[0].x} y2={edges[0].y} stroke={c.fov} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <line x1={cam.x} y1={cam.y} x2={edges[1].x} y2={edges[1].y} stroke={c.fov} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function TableShape({ tableShape, selected }) {
  const c = usePalette();
  const stroke = selected ? c.tableStrokeSel : c.tableStroke;
  const strokeWidth = selected ? 2 : 1.25;
  const fill = selected ? c.tableFillSel : c.tableFill;
  switch (tableShape.type) {
    case "rect":
      return <rect x={-tableShape.w / 2} y={-tableShape.h / 2} width={tableShape.w} height={tableShape.h} rx={0.08} fill={fill} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />;
    case "ellipse":
      return <ellipse cx={0} cy={0} rx={tableShape.w / 2} ry={tableShape.h / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />;
    case "segments":
      return tableShape.segments.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={0.05} fill={fill} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      ));
    case "desks":
      return tableShape.desks.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} rx={0.05} fill={fill} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      ));
    // D-shape and curved front-row tables.
    case "polygon":
      return (
        <polygon
          points={tableShape.points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ")}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      );
    default:
      return null;
  }
}

// Open Collaboration pod: rendered individually (not through the generic
// TableShape) so each one carries its own selection state and drag handle.
// A pod is round, so a short tick on its rim shows which way it's turned.
function PodTable({ x, y, radius, angle, selected, onPointerDown, focusProps }) {
  const c = usePalette();
  const stroke = selected ? c.tableStrokeSel : c.tableStroke;
  const strokeWidth = selected ? 2 : 1.25;
  const fill = selected ? c.tableFillSel : c.tableFill;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} onPointerDown={onPointerDown} style={{ cursor: "grab" }} {...focusProps}>
      <circle r={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={-radius * 0.92} x2={0} y2={-radius * 0.68} stroke={selected ? c.tableStrokeSel : c.podTick} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />
      {selected && (
        <circle
          r={radius + 0.1}
          fill="none"
          stroke={c.select}
          strokeWidth={2}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
          opacity={0.8}
          pointerEvents="none"
        />
      )}
    </g>
  );
}

const CATEGORY_ICON = {
  display: DisplayIcon,
  allInOne: AllInOneIcon,
  camera: CameraIcon,
  videoBar: VideoBarIcon,
  microphone: MicrophoneIcon,
  speaker: SpeakerIcon,
  touchPanel: TouchPanelIcon,
  contentSharing: ContentSharingIcon,
  door: DoorIcon,
  bookingPanel: BookingPanelIcon,
};

const ROTATABLE_CATEGORIES = ["display", "allInOne", "camera", "videoBar", "microphone", "speaker", "touchPanel", "contentSharing", "door", "bookingPanel"];
// Anything with a field of view drawn on the plan.
const FOV_CATEGORIES = ["camera", "videoBar", "allInOne"];
// Selection ring radius per category, sized to each icon's actual footprint so it
// hugs smaller icons instead of floating loosely around them.
const SELECTION_RING_RADIUS = {
  display: 0.24,
  allInOne: 0.24,
  camera: 0.14,
  videoBar: 0.4,
  microphone: 0.14,
  speaker: 0.14,
  touchPanel: 0.12,
  contentSharing: 0.12,
  door: 0.24,
  bookingPanel: 0.24,
};
const TURN_HANDLE_DIST = 0.38;
// Touch double-tap window/radius (see registerTapAndCheckDouble).
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 24;

// Small on-canvas handle to rotate a selected item by dragging; stays attached to its front.
function TurnHandle({ onPointerDown, dist = TURN_HANDLE_DIST }) {
  const c = usePalette();
  return (
    <g onPointerDown={onPointerDown} className="rc-handle" style={{ cursor: "grab" }}>
      <line x1={0} y1={0} x2={0} y2={-dist} stroke={c.select} strokeWidth={1.25} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-dist} r={0.17} fill="transparent" />
      <circle cx={0} cy={-dist} r={0.09} fill={c.handleFill} stroke={c.select} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-dist} r={0.032} fill={c.select} />
    </g>
  );
}

function StackBadge({ count }) {
  const c = usePalette();
  return (
    <g transform="translate(0.3 -0.3)" pointerEvents="none">
      <circle r={0.14} fill={c.badgeFill} stroke={c.badgeStroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={0.15} fontWeight={700} fill={c.badgeText}>
        {count}
      </text>
    </g>
  );
}

// Thin identification label (e.g. "D1", "C2") shown under every placed component,
// matching the reference codes used in the text brief. A white halo keeps it legible
// over the table, chairs, or grid without needing a solid background chip.
// `scale` grows the text for large rooms (see labelScale). Labels are kept inside the
// room: `wall` ("left"/"right"/"bottom") is set for an item hugging that wall, and
// shifts the label off it — to the side for a side wall, above for the bottom wall.
const REF_LABEL_FONT = 0.075;
const REF_LABEL_GAP = 0.22;
// `line` moves the label a line further from the wall, clear of another item's label at
// the same spot (a camera mounted on a display).
function RefLabel({ label, scale = 1, wall = null, line = 0 }) {
  const c = usePalette();
  const fontSize = REF_LABEL_FONT * scale;
  const x = wall === "left" ? 0.12 : wall === "right" ? -0.12 : 0;
  const anchor = wall === "left" ? "start" : wall === "right" ? "end" : "middle";
  return (
    <text
      x={x}
      y={wall === "bottom" ? -REF_LABEL_GAP - line * fontSize * 1.3 : REF_LABEL_GAP + fontSize * 0.9 + line * fontSize * 1.3}
      textAnchor={anchor}
      fontSize={fontSize}
      fontWeight={scale > 1 ? 400 : 300}
      fill={c.label}
      stroke={c.halo}
      strokeWidth={0.018 * scale}
      paintOrder="stroke"
      pointerEvents="none"
    >
      {label}
    </text>
  );
}

// Tick positions run in lockstep with the visible grid dots (same step, same bounds)
// so a measurement read off the ruler lines up exactly with a dot in the room.
function buildRulerMarks(dimension, step, labelStep) {
  const n = Math.floor(dimension / step + 1e-6);
  const marks = [];
  for (let i = 0; i <= n; i++) {
    const pos = i * step;
    const nearestLabelIdx = Math.round(pos / labelStep);
    const isMajor = Math.abs(pos - nearestLabelIdx * labelStep) < step * 0.05;
    marks.push({ pos, isMajor });
  }
  return marks;
}

const formatMeters = (v) => {
  const r = Math.round(v * 100) / 100;
  return `${Number.isInteger(r) ? r : r.toFixed(2)}m`;
};

const RULER_MINOR_TICK = 0.05;
const RULER_MAJOR_TICK = 0.12;
const RULER_LABEL_GAP = 0.05;

// One wall's worth of outward-facing ruler ticks. `orientation` picks the axis the
// ticks run along; `wallAt` is that wall's fixed coordinate (0 or the room's far
// edge); `sign` is the outward direction (-1 for top/left, +1 for bottom/right).
function RulerTicks({ marks, orientation, wallAt, sign }) {
  const c = usePalette();
  const isHorizontal = orientation === "horizontal";
  return (
    <g pointerEvents="none">
      {marks.map(({ pos, isMajor }) => {
        const len = isMajor ? RULER_MAJOR_TICK : RULER_MINOR_TICK;
        const tickEnd = wallAt + sign * len;
        const color = isMajor ? c.rulerMajor : c.rulerMinor;
        const strokeWidth = isMajor ? 1 : 0.75;
        if (isHorizontal) {
          return (
            <g key={pos}>
              <line x1={pos} y1={wallAt} x2={pos} y2={tickEnd} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {isMajor && (
                <text
                  x={pos}
                  y={tickEnd + sign * RULER_LABEL_GAP}
                  textAnchor="middle"
                  dominantBaseline={sign === -1 ? "auto" : "hanging"}
                  fontSize={0.13}
                  fontWeight={400}
                  fill={c.rulerLabel}
                >
                  {formatMeters(pos)}
                </text>
              )}
            </g>
          );
        }
        return (
          <g key={pos}>
            <line x1={wallAt} y1={pos} x2={tickEnd} y2={pos} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {isMajor && (
              <text
                x={tickEnd + sign * RULER_LABEL_GAP}
                y={pos}
                textAnchor={sign === -1 ? "end" : "start"}
                dominantBaseline="central"
                fontSize={0.13}
                fontWeight={400}
                fill={c.rulerLabel}
              >
                {formatMeters(pos)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// Moving with the keyboard: one grid step per arrow press, three with Shift held.
const KEY_MOVE = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const KEY_TURN_DEG = 15;

export function RoomCanvas({
  room,
  table,
  chairCount,
  layout,
  layoutResult,
  tableOffset,
  devices,
  selection,
  onSelect,
  onTableDragCommit,
  onDeviceDragCommit,
  onRotateSelected,
  onSetItemAngle,
  onRemoveSelected,
  removedChairIndices,
  onRemoveChair,
  chairOffsets,
  onChairDragCommit,
  onSetChairAngle,
  onPodDragCommit,
  onSetPodAngle,
  diagramRef,
  // A dedicated microphone's pickup across the plan ({ reach, label }), drawn round
  // the selected microphone.
  micPickup = null,
  // Guidance under the plan for the current step; falls back to how to move the seating.
  hint,
  // Shown above the plan, at the plan's width.
  header,
  // "screen" in the page; "print" for the copy the PDF's diagram is taken from.
  theme = "screen",
  // False draws the plan for looking at only (the PDF copy, previews elsewhere on the
  // site): nothing can be focused or moved, and the hint slot below it is left out.
  interactive = theme === "screen",
}) {
  const palette = PALETTES[theme] || PALETTES.screen;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const rotateDragRef = useRef(null);
  const lastTapRef = useRef({ key: null, time: 0, x: 0, y: 0 });
  const [liveTableOffset, setLiveTableOffset] = useState(null);
  const [liveDevicePos, setLiveDevicePos] = useState(null);
  const [liveAngle, setLiveAngle] = useState(null);

  const effectiveOffset = liveTableOffset || tableOffset;
  // Memoized because the pointer-up callback depends on it; as a fresh object
  // literal it would rebuild that callback on every render, including on every
  // pointer-move frame during a drag.
  const tableCenter = useMemo(
    () => ({
      x: room.length / 2 + effectiveOffset.x,
      y: room.width / 2 + effectiveOffset.y,
    }),
    [room.length, room.width, effectiveOffset.x, effectiveOffset.y]
  );

  const viewBox = { x: -ROOM_MARGIN, y: -ROOM_MARGIN, w: room.length + ROOM_MARGIN * 2, h: room.width + ROOM_MARGIN * 2 };

  // Component labels are sized in meters like everything else on the plan, so once a
  // large room is scaled down to fit they'd shrink to an unreadable few pixels. Grow
  // them with the room's longer side so they keep roughly the same on-screen size.
  const labelScale = clamp(Math.max(room.length, room.width) / 7, 1, 15);

  // Snapping always uses the fine GRID_STEP; the visible marks thin out for very
  // large rooms so the grid (and the ruler, which stays locked to the same spacing)
  // stays cheap to render and legible at any room size.
  const displayStep = useMemo(() => {
    let step = GRID_STEP;
    while ((room.length / step) * (room.width / step) > 4000) step *= 2;
    return step;
  }, [room.length, room.width]);

  const gridPath = useMemo(() => {
    const r = displayStep * 0.2;
    const nx = Math.floor(room.length / displayStep + 1e-6);
    const ny = Math.floor(room.width / displayStep + 1e-6);
    let d = "";
    for (let i = 0; i <= nx; i++) {
      const x = i * displayStep;
      for (let j = 0; j <= ny; j++) {
        const y = j * displayStep;
        d += `M${(x - r).toFixed(3)},${y.toFixed(3)} L${(x + r).toFixed(3)},${y.toFixed(3)} M${x.toFixed(3)},${(y - r).toFixed(3)} L${x.toFixed(3)},${(y + r).toFixed(3)} `;
      }
    }
    return d;
  }, [room.length, room.width, displayStep]);

  // Major (labeled) ticks land on a "nice" meter value that's still an exact multiple
  // of displayStep, so a labeled tick always sits exactly on top of a grid dot.
  const labelStep = useMemo(() => {
    const niceSteps = [1, 2, 5, 10, 20, 50, 100];
    const nice = niceSteps.find((n) => n >= displayStep) ?? 100;
    return Math.max(1, Math.round(nice / displayStep)) * displayStep;
  }, [displayStep]);

  const marksX = useMemo(() => buildRulerMarks(room.length, displayStep, labelStep), [room.length, displayStep, labelStep]);
  const marksY = useMemo(() => buildRulerMarks(room.width, displayStep, labelStep), [room.width, displayStep, labelStep]);

  // Group items that share a grid cell so they can be flagged with a stack badge —
  // items render at their exact position, one squarely atop another, no offset drift.
  const stackGroups = useMemo(() => {
    const groups = {};
    DEVICE_ORDER.forEach((cat) => {
      devices[cat].forEach((item) => {
        // A camera on top of its display is meant to share its spot.
        if (item.mountedOn) return;
        const key = `${Math.round(item.x / GRID_STEP)}_${Math.round(item.y / GRID_STEP)}`;
        groups[key] = groups[key] || [];
        groups[key].push(`${cat}:${item.id}`);
      });
    });
    const counts = {};
    Object.values(groups).forEach((group) => {
      if (group.length < 2) return;
      const topKey = group[group.length - 1];
      counts[topKey] = group.length;
    });
    return counts;
  }, [devices]);

  const clientToPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }, []);

  const startDrag = useCallback((e, category, id, curX, curY) => {
    e.stopPropagation();
    // No preventDefault() here: touch-action:none on draggable items and select-none on
    // the SVG already suppress scrolling/selection, and calling it on pointerdown would
    // stop the browser from synthesizing the compatibility mouse events a real
    // double-click on a chair depends on (dblclick never fires once pointerdown is
    // prevented). Pointer capture is deferred to the first real movement (see
    // handleSvgPointerMove) rather than taken here: capturing immediately retargets
    // the click/dblclick that follow a plain click to the <svg>, which silently
    // breaks double-click on any descendant (chairs) for that gesture.
    onSelect({ category, id });
    dragRef.current = {
      category, id,
      pointerId: e.pointerId,
      startPointM: clientToPoint(e.clientX, e.clientY),
      startX: curX, startY: curY,
      moved: false,
    };
  }, [clientToPoint, onSelect]);

  // dblclick never synthesizes from a touch double-tap on a draggable item, because
  // touch-action:none (needed so a drag in progress doesn't also pan/pinch-zoom the
  // page) also disables the browser's double-tap gesture recognition that dblclick
  // compatibility events are built on — the mouse-only dblclick handler on chairs
  // silently never fires on a phone or tablet. This reimplements just the double-tap
  // part manually for touch pointers: a second tap on the same target within the
  // window/radius counts as a "double-click"; the caller stops propagation and
  // selects. A lone tap is recorded and left to propagate normally (e.g. so it can
  // still drag the table group or pod), exactly like the first half of a real
  // double-click does.
  const registerTapAndCheckDouble = useCallback((e, key) => {
    if (e.pointerType !== "touch") return false;
    const now = Date.now();
    const last = lastTapRef.current;
    const isDouble =
      last.key === key &&
      now - last.time < DOUBLE_TAP_MS &&
      Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_PX;
    if (isDouble) {
      lastTapRef.current = { key: null, time: 0, x: 0, y: 0 };
      return true;
    }
    lastTapRef.current = { key, time: now, x: e.clientX, y: e.clientY };
    return false;
  }, []);

  // Dragging a chair moves only that chair (as an offset from its generated seat
  // position), never the table — distinct from startDrag, which always drags the
  // whole table+chairs group. Only called for the chair that's already selected;
  // any other chair's pointerdown is left to bubble up to the table group.
  const startChairDrag = useCallback((e, index, curDx, curDy) => {
    e.stopPropagation();
    onSelect({ category: "chair", index });
    dragRef.current = {
      category: "chair", id: index,
      pointerId: e.pointerId,
      startPointM: clientToPoint(e.clientX, e.clientY),
      startX: curDx, startY: curDy,
      moved: false,
    };
  }, [clientToPoint, onSelect]);

  // Open Collaboration: pressing a pod (or any of its chairs) selects that one table
  // and drags it with its chairs. The drag is tracked as a delta from the pod's
  // committed position, so its chairs can follow along live.
  const startPodDrag = useCallback((e, index) => {
    e.stopPropagation();
    onSelect({ category: "tablePod", index });
    dragRef.current = {
      category: "tablePod", id: index,
      pointerId: e.pointerId,
      startPointM: clientToPoint(e.clientX, e.clientY),
      startX: 0, startY: 0,
      moved: false,
    };
  }, [clientToPoint, onSelect]);

  const startRotateDrag = useCallback((e, category, id, centerX, centerY) => {
    e.stopPropagation();
    e.preventDefault();
    const svg = svgRef.current;
    try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    rotateDragRef.current = { category, id, centerX, centerY };
  }, []);

  // A chair's new offset from its generated seat, with its spot on the floor snapped to
  // the placement grid (and kept inside the room). Stored relative to the seat so it
  // still rides along when the table itself is moved.
  const commitChairMove = useCallback((index, dx, dy) => {
    const chair = layoutResult.chairs[index];
    if (!chair) return;
    const snapped = nearestGridPoint(tableCenter.x + chair.x + dx, tableCenter.y + chair.y + dy, room);
    onChairDragCommit(index, snapped.x - tableCenter.x - chair.x, snapped.y - tableCenter.y - chair.y);
  }, [layoutResult.chairs, tableCenter, room, onChairDragCommit]);

  // A pod moved by (dx, dy): its center snapped to the grid, keeping the pod and its
  // chair ring inside the walls, handed back as the move from where it was.
  const commitPodMove = useCallback((index, dx, dy) => {
    const pod = layoutResult.tableShape.tables?.[index];
    if (!pod) return;
    const reach = pod.radius + POD_CHAIR_RING_INSET + 0.25;
    const fromX = tableCenter.x + pod.x;
    const fromY = tableCenter.y + pod.y;
    const snapped = nearestGridPoint(clamp(fromX + dx, reach, room.length - reach), clamp(fromY + dy, reach, room.width - reach), room);
    onPodDragCommit(index, snapped.x - fromX, snapped.y - fromY);
  }, [layoutResult.tableShape.tables, tableCenter, room, onPodDragCommit]);

  const handleSvgPointerMove = useCallback((e) => {
    if (rotateDragRef.current) {
      const r = rotateDragRef.current;
      const p = clientToPoint(e.clientX, e.clientY);
      const angle = angleFromVector(p.x - r.centerX, p.y - r.centerY);
      setLiveAngle({ key: `${r.category}:${r.id}`, angle });
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    const p = clientToPoint(e.clientX, e.clientY);
    const ddx = p.x - d.startPointM.x;
    const ddy = p.y - d.startPointM.y;
    if (!d.moved && Math.hypot(ddx, ddy) > 0.035) {
      d.moved = true;
      // Only now, once this is confirmably a drag and not a click, capture the
      // pointer so the drag keeps tracking outside the element's bounds.
      try { svgRef.current.setPointerCapture(d.pointerId); } catch (_) {}
    }
    if (!d.moved) return;
    if (d.category === "table") {
      // Kept inside the room (and a D-shape against its wall) while it moves, not just
      // once it's let go.
      setLiveTableOffset(clampTableOffset({ x: d.startX + ddx, y: d.startY + ddy }, room, layoutResult.groupBounds));
    } else {
      setLiveDevicePos({ key: `${d.category}:${d.id}`, x: d.startX + ddx, y: d.startY + ddy });
    }
  }, [clientToPoint, room, layoutResult.groupBounds]);

  const handleSvgPointerUp = useCallback((e) => {
    if (rotateDragRef.current) {
      const r = rotateDragRef.current;
      rotateDragRef.current = null;
      const p = clientToPoint(e.clientX, e.clientY);
      const angle = angleFromVector(p.x - r.centerX, p.y - r.centerY);
      if (r.category === "chair") {
        onSetChairAngle(r.id, angle);
      } else if (r.category === "tablePod") {
        onSetPodAngle(r.id, angle);
      } else {
        onSetItemAngle(r.category, r.id, angle);
      }
      setLiveAngle(null);
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (!d.moved) {
      setLiveTableOffset(null);
      setLiveDevicePos(null);
      return;
    }
    const p = clientToPoint(e.clientX, e.clientY);
    const ddx = p.x - d.startPointM.x;
    const ddy = p.y - d.startPointM.y;
    if (d.category === "table") {
      onTableDragCommit({ x: d.startX + ddx, y: d.startY + ddy });
    } else if (d.category === "chair") {
      commitChairMove(d.id, d.startX + ddx, d.startY + ddy);
    } else if (d.category === "tablePod") {
      commitPodMove(d.id, ddx, ddy);
    } else {
      onDeviceDragCommit(d.category, d.id, d.startX + ddx, d.startY + ddy);
    }
    setLiveTableOffset(null);
    setLiveDevicePos(null);
  }, [clientToPoint, onTableDragCommit, onDeviceDragCommit, onSetItemAngle, onSetChairAngle, onSetPodAngle, commitChairMove, commitPodMove]);

  const handleDeleteSelected = useCallback(() => {
    if (!selection || selection.category === "table" || selection.category === "tablePod") return;
    if (selection.category === "chair") {
      onRemoveChair(selection.index);
      onSelect(null);
    } else {
      onRemoveSelected();
    }
  }, [selection, onRemoveChair, onRemoveSelected, onSelect]);

  const handleBackgroundPointerDown = useCallback(() => {
    if (selection) onSelect(null);
  }, [onSelect, selection]);

  // Keyboard: Escape deselects and Delete removes the selected item from anywhere on
  // the page (outside a text field). While focus is on the plan, the arrow keys move the
  // selected item a grid step (Shift: three) and R turns it (Shift+R the other way).
  useEffect(() => {
    if (!interactive) return undefined;
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "Escape") {
        if (selection) onSelect(null);
        return;
      }
      if (!selection || typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.category === "table" || selection.category === "tablePod") return;
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
      if (!svgRef.current?.contains(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
      const move = KEY_MOVE[e.key];
      if (move) {
        e.preventDefault();
        const step = GRID_STEP * (e.shiftKey ? 3 : 1);
        const [dx, dy] = [move[0] * step, move[1] * step];
        if (selection.category === "table") {
          onTableDragCommit({ x: tableOffset.x + dx, y: tableOffset.y + dy });
        } else if (selection.category === "chair") {
          const off = chairOffsets[selection.index] || {};
          commitChairMove(selection.index, (off.dx || 0) + dx, (off.dy || 0) + dy);
        } else if (selection.category === "tablePod") {
          commitPodMove(selection.index, dx, dy);
        } else {
          const item = devices[selection.category]?.find((d) => d.id === selection.id);
          if (item) onDeviceDragCommit(selection.category, item.id, item.x + dx, item.y + dy);
        }
        return;
      }
      if (e.key.toLowerCase() === "r") {
        const delta = e.shiftKey ? -KEY_TURN_DEG : KEY_TURN_DEG;
        if (selection.category === "chair") {
          e.preventDefault();
          const chair = layoutResult.chairs[selection.index];
          if (chair) onSetChairAngle(selection.index, rotateBy(chairOffsets[selection.index]?.angle ?? chair.angle, delta));
        } else if (selection.category === "tablePod") {
          e.preventDefault();
          const pod = layoutResult.tableShape.tables?.[selection.index];
          if (pod) onSetPodAngle(selection.index, rotateBy(pod.angle || 0, delta));
        } else if (ROTATABLE_CATEGORIES.includes(selection.category)) {
          e.preventDefault();
          onRotateSelected(delta);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [interactive, selection, onSelect, handleDeleteSelected, onRotateSelected, layoutResult.chairs, layoutResult.tableShape.tables, chairOffsets, onSetChairAngle, onSetPodAngle, onTableDragCommit, tableOffset, commitChairMove, commitPodMove, devices, onDeviceDragCommit]);

  // What makes an item on the plan reachable with Tab. Tabbing to it selects it; a click
  // focuses it too, but selection there is left to the pointer handlers (a click on a
  // chair must not select the table group around it).
  const focusable = (label, target) =>
    interactive
      ? {
          tabIndex: 0,
          role: "button",
          "aria-label": label,
          className: "rc-focusable",
          onFocus: (e) => {
            if (e.currentTarget.matches(":focus-visible")) onSelect(target);
          },
        }
      : {};

  const renderDevicePos = (category, item) => {
    const key = `${category}:${item.id}`;
    if (liveDevicePos && liveDevicePos.key === key) return { x: liveDevicePos.x, y: liveDevicePos.y };
    return { x: item.x, y: item.y };
  };

  const renderDeviceAngle = (category, item) => {
    const key = `${category}:${item.id}`;
    if (liveAngle && liveAngle.key === key) return liveAngle.angle;
    return item.angle || 0;
  };

  // Open Collaboration pods at their live position/angle: the committed transform
  // from the layout, plus any drag or turn in progress (dAngle is the turn so far,
  // baseX/baseY the committed center — its chairs are generated around that).
  const isPods = layoutResult.tableShape.type === "pods";
  const pods = isPods
    ? layoutResult.tableShape.tables.map((t, i) => {
        const key = `tablePod:${i}`;
        const move = liveDevicePos && liveDevicePos.key === key ? liveDevicePos : null;
        const turned = liveAngle && liveAngle.key === key ? liveAngle.angle : null;
        const angle = turned ?? (t.angle || 0);
        return {
          x: t.x + (move ? move.x : 0),
          y: t.y + (move ? move.y : 0),
          angle,
          dAngle: angle - (t.angle || 0),
          baseX: t.x,
          baseY: t.y,
          radius: t.radius,
        };
      })
    : [];
  const selectedPodIndex = isPods && selection?.category === "tablePod" ? selection.index : null;
  const selectedPod = selectedPodIndex != null ? pods[selectedPodIndex] : null;

  const selectionLabel = !selection
    ? null
    : selection.category === "table"
    ? "Table & chairs"
    : selection.category === "tablePod"
    ? `Table ${selection.index + 1}`
    : selection.category === "chair"
    ? `Chair ${selection.index + 1}`
    : DEVICE_LABELS[selection.category];
  const selectionDeletable = selection && selection.category !== "table" && selection.category !== "tablePod";

  // x, y in meters from the room's top-left corner — the same origin the ruler is
  // drawn from, so this always reads consistently with the marks on the diagram.
  const selectedPosition = (() => {
    if (!selection) return null;
    if (selection.category === "table") return { x: tableCenter.x, y: tableCenter.y };
    if (selection.category === "tablePod") {
      const pod = pods[selection.index];
      return pod ? { x: tableCenter.x + pod.x, y: tableCenter.y + pod.y } : null;
    }
    if (selection.category === "chair") {
      const chair = layoutResult.chairs[selection.index];
      if (!chair) return null;
      const off = chairOffsets[selection.index] || { dx: 0, dy: 0 };
      const liveKey = `chair:${selection.index}`;
      const live = liveDevicePos && liveDevicePos.key === liveKey ? liveDevicePos : null;
      return { x: tableCenter.x + chair.x + (live ? live.x : off.dx || 0), y: tableCenter.y + chair.y + (live ? live.y : off.dy || 0) };
    }
    const item = devices[selection.category]?.find((d) => d.id === selection.id);
    return item ? renderDevicePos(selection.category, item) : null;
  })();

  // Live coordinate readout shown while an item is being dragged. Chair and pod drags
  // are tracked relative to the table group, so convert those back to room coordinates.
  const liveBadgePos = (() => {
    if (!liveDevicePos) return null;
    const [kind, id] = liveDevicePos.key.split(":");
    if (kind === "tablePod") {
      const p = pods[Number(id)];
      return p ? { x: tableCenter.x + p.x, y: tableCenter.y + p.y } : null;
    }
    if (kind === "chair") {
      const c = layoutResult.chairs[Number(id)];
      return c ? { x: tableCenter.x + c.x + liveDevicePos.x, y: tableCenter.y + c.y + liveDevicePos.y } : null;
    }
    return { x: liveDevicePos.x, y: liveDevicePos.y };
  })();
  const coordBadgePos = liveTableOffset
    ? { x: tableCenter.x, y: tableCenter.y }
    : liveBadgePos;

  const turnHint = "turn with its handle (or R)";

  return (
    // Stage → column → frame: on desktop the column is as wide as it can be while the
    // diagram plus its header and slot still fit beside the step panel (see
    // .rc-plan-stage in roomConfigurator.css).
    <PaletteContext.Provider value={palette}>
      {/* With no status bar above and no hint slot below, the plan takes the stage's whole height. */}
      <div className="rc-plan-stage" style={{ "--rc-plan-aspect": viewBox.w / viewBox.h, ...(!interactive && !header && { "--rc-plan-chrome": "0rem" }) }}>
        <div className="rc-plan-column">
          {header}
          <div className="rc-plan-frame relative">
            <div
              ref={diagramRef}
              className="h-full w-full overflow-hidden rounded-3xl border border-white/[0.08] shadow-sm"
              style={{ backgroundColor: palette.margin }}
            >
              <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                className="rc-plan-svg block h-full w-full select-none"
                role="group"
                aria-label={interactive ? "Room plan. Tab to an item to select it, move it with the arrow keys, turn it with R, and remove it with Delete." : "Room plan"}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerCancel={handleSvgPointerUp}
              >
                <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill={palette.margin} />
                <rect x={0} y={0} width={room.length} height={room.width} fill={palette.floor} />
                <path d={gridPath} stroke={palette.grid} strokeWidth={1.1} vectorEffect="non-scaling-stroke" fill="none" pointerEvents="none" />
                <rect x={0} y={0} width={room.length} height={room.width} fill="none" stroke={palette.wall} strokeWidth={2.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="transparent" onPointerDown={handleBackgroundPointerDown} />

                <RulerTicks marks={marksX} orientation="horizontal" wallAt={0} sign={-1} />
                <RulerTicks marks={marksX} orientation="horizontal" wallAt={room.width} sign={1} />
                <RulerTicks marks={marksY} orientation="vertical" wallAt={0} sign={-1} />
                <RulerTicks marks={marksY} orientation="vertical" wallAt={room.length} sign={1} />

                {micPickup &&
                  selection?.category === "microphone" &&
                  devices.microphone
                    .filter((m) => m.id === selection.id)
                    .map((m) => {
                      const pos = renderDevicePos("microphone", m);
                      return (
                        <MicRange
                          key={`pickup-${m.id}`}
                          cam={{ ...m, x: pos.x, y: pos.y }}
                          reach={micPickup.reach}
                          room={room}
                          labelScale={labelScale}
                          text={`Mic pickup ${micPickup.label}`}
                        />
                      );
                    })}
                {FOV_CATEGORIES.map((category) =>
                  devices[category].map((cam) => {
                    const pos = renderDevicePos(category, cam);
                    const angle = renderDeviceAngle(category, cam);
                    return <FovRay key={cam.id} cam={{ ...cam, x: pos.x, y: pos.y, angle }} room={room} labelScale={labelScale} />;
                  })
                )}

                <g
                  {...(layout && !isPods ? focusable("Table and chairs", { category: "table", id: "table" }) : {})}
                  className={`rc-table-group${layout && !isPods && interactive ? " rc-focusable" : ""}`}
                  transform={`translate(${tableCenter.x} ${tableCenter.y})`}
                  onPointerDown={(e) => startDrag(e, "table", "table", effectiveOffset.x, effectiveOffset.y)}
                >
                  {isPods
                    ? pods.map((p, i) => (
                        <PodTable
                          key={i}
                          x={p.x}
                          y={p.y}
                          radius={p.radius}
                          angle={p.angle}
                          selected={selectedPodIndex === i}
                          onPointerDown={(e) => startPodDrag(e, i)}
                          focusProps={focusable(`Table ${i + 1}`, { category: "tablePod", index: i })}
                        />
                      ))
                    : <TableShape tableShape={layoutResult.tableShape} selected={selection?.category === "table"} />}
                  {layoutResult.chairs.map((c, i) => {
                    if (removedChairIndices.has(i)) return null;
                    const isThisChairSelected = selection?.category === "chair" && selection.index === i;
                    const liveKey = `chair:${i}`;
                    const live = liveDevicePos && liveDevicePos.key === liveKey ? liveDevicePos : null;
                    const off = chairOffsets[i] || { dx: 0, dy: 0 };
                    const offX = live ? live.x : off.dx || 0;
                    const offY = live ? live.y : off.dy || 0;
                    const ownAngle = liveAngle && liveAngle.key === liveKey ? liveAngle.angle : off.angle ?? c.angle;
                    let chairX = c.x + offX;
                    let chairY = c.y + offY;
                    let chairAngle = ownAngle;
                    // A pod's chairs ride along while their table is being dragged or turned.
                    const pod = c.podIndex != null ? pods[c.podIndex] : null;
                    if (pod && (pod.x !== pod.baseX || pod.y !== pod.baseY || pod.dAngle)) {
                      const rel = rotatePoint(c.x - pod.baseX + offX, c.y - pod.baseY + offY, pod.dAngle);
                      chairX = pod.x + rel.x;
                      chairY = pod.y + rel.y;
                      chairAngle = ownAngle + pod.dAngle;
                    }
                    const highlighted =
                      selection?.category === "table" || isThisChairSelected || (c.podIndex != null && selectedPodIndex === c.podIndex);
                    return (
                      <g
                        key={i}
                        transform={`translate(${chairX} ${chairY})`}
                        onDoubleClick={(e) => { e.stopPropagation(); onSelect({ category: "chair", index: i }); }}
                        onPointerDown={(e) => {
                          if (registerTapAndCheckDouble(e, `chair:${i}`)) {
                            e.stopPropagation();
                            onSelect({ category: "chair", index: i });
                            return;
                          }
                          // Only the already-selected chair drags on its own. A pod's chair
                          // drags its whole pod; any other chair's pointerdown is left to
                          // bubble up and drag the whole table group.
                          if (isThisChairSelected) startChairDrag(e, i, off.dx || 0, off.dy || 0);
                          else if (c.podIndex != null) startPodDrag(e, c.podIndex);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <g transform={`rotate(${chairAngle})`}>
                          <circle r={0.26} fill="transparent" />
                          <ChairIcon selected={highlighted} />
                          {isThisChairSelected && (
                            <TurnHandle
                              onPointerDown={(e) => startRotateDrag(e, "chair", i, tableCenter.x + chairX, tableCenter.y + chairY)}
                            />
                          )}
                        </g>
                      </g>
                    );
                  })}
                  {selectedPod && (
                    <g transform={`translate(${selectedPod.x} ${selectedPod.y}) rotate(${selectedPod.angle})`}>
                      <TurnHandle
                        dist={selectedPod.radius + POD_CHAIR_RING_INSET + 0.55}
                        onPointerDown={(e) => startRotateDrag(e, "tablePod", selectedPodIndex, tableCenter.x + selectedPod.x, tableCenter.y + selectedPod.y)}
                      />
                    </g>
                  )}
                </g>

                {["display", "allInOne", "microphone", "speaker", "touchPanel", "contentSharing", "door", "bookingPanel", "videoBar", "camera"].map((category) =>
                  devices[category].map((item, idx) => {
                    const pos = renderDevicePos(category, item);
                    const angle = renderDeviceAngle(category, item);
                    const Icon = CATEGORY_ICON[category];
                    const isSelected = selection?.category === category && selection?.id === item.id;
                    const stackCount = stackGroups[`${category}:${item.id}`];
                    const isRotatable = ROTATABLE_CATEGORIES.includes(category);
                    const focus = focusable(refLabel(category, idx), { category, id: item.id });
                    return (
                      <g
                        key={item.id}
                        {...focus}
                        className={`rc-device rc-fade-in ${focus.className || ""}`}
                        transform={`translate(${pos.x} ${pos.y})`}
                        onPointerDown={(e) => startDrag(e, category, item.id, item.x, item.y)}
                      >
                        <g transform={`rotate(${angle})`}>
                          {isSelected && (
                            <circle r={SELECTION_RING_RADIUS[category] ?? 0.24} fill="none" stroke={palette.select} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" opacity={0.9} />
                          )}
                          {category === "display" || category === "allInOne" ? (
                            <Icon widthM={displayWidthMeters(item.sizeInches, item.aspect)} selected={isSelected} />
                          ) : (
                            <Icon selected={isSelected} isTableCam={item.isTableCam} mount={item.mount} />
                          )}
                          {isSelected && isRotatable && (
                            <TurnHandle onPointerDown={(e) => startRotateDrag(e, category, item.id, pos.x, pos.y)} />
                          )}
                        </g>
                        <RefLabel
                          label={refLabel(category, idx)}
                          scale={labelScale}
                          wall={pos.x < 0.3 ? "left" : pos.x > room.length - 0.3 ? "right" : pos.y > room.width - 0.3 ? "bottom" : null}
                          line={item.mountedOn ? 1 : 0}
                        />
                        {!isSelected && stackCount > 1 && <StackBadge count={stackCount} />}
                      </g>
                    );
                  })
                )}

                {coordBadgePos && (
                  <g transform={`translate(${coordBadgePos.x} ${coordBadgePos.y})`} pointerEvents="none">
                    <text
                      x={0}
                      y={-0.34 * labelScale}
                      textAnchor="middle"
                      fontSize={0.14 * labelScale}
                      fontWeight={600}
                      fill={palette.coord}
                      stroke={palette.halo}
                      strokeWidth={0.03 * labelScale}
                      paintOrder="stroke"
                    >
                      {coordBadgePos.x.toFixed(2)}m, {coordBadgePos.y.toFixed(2)}m
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* One slot under the plan: guidance while nothing is selected, the selected
            item's actions once something is. On desktop it keeps a fixed minimum height
            (part of --rc-plan-chrome) so selecting something never resizes the plan. */}
          {interactive && (
            <div className="shrink-0 lg:min-h-[60px]">
              {!selection && (
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  {hint ||
                    (isPods
                      ? "Drag a table to move it with its chairs, or use its handle to turn it. Double-click (or double-tap on a phone or tablet) a chair to move just that one."
                      : "Drag the table to move the whole layout. Double-click (or double-tap on a phone or tablet) a chair to move just that one.")}
                </p>
              )}

              {selection && (
                <div className="rc-banner-in mt-2 flex items-center justify-between gap-3 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm">
                  <span className="font-medium text-cyan-100">
                    {selectionLabel} selected
                    {selection.category === "table" ? ": drag or use the arrow keys to move it" : ""}
                    {selection.category === "tablePod" ? `: drag to move, ${turnHint}, resize under Seating` : ""}
                    {selectedPosition && (
                      <span className="font-normal text-cyan-300"> at {selectedPosition.x.toFixed(2)}m, {selectedPosition.y.toFixed(2)}m</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectionDeletable && (
                      <button
                        onClick={handleDeleteSelected}
                        className="flex min-h-[36px] items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-transform duration-100 hover:bg-red-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 active:scale-[0.96]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                    <button
                      aria-label="Deselect"
                      onClick={() => onSelect(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-cyan-300 hover:bg-blue-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PaletteContext.Provider>
  );
}
