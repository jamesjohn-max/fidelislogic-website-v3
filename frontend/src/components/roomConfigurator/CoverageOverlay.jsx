import { usePalette } from "./PaletteContext";

// How far a source reaches: a ring clipped to the room, labelled on whichever side stays
// inside it. A mic is drawn tinted; a speaker's ring is dotted so the two read apart
// without relying on colour. A wall-mounted source (an all-in-one, a video bar, a wall
// speaker) is drawn as an outline over whatever it already shows, as an all-in-one's
// view cone, and labelled where it meets the top or bottom wall.
export function MicRange({ source, room, labelScale }) {
  const c = usePalette();
  const { x, y, range: reach } = source;
  const isSpeaker = source.kind === "speaker";
  const outline = source.mount === "wall" || source.category === "allInOne" || source.category === "videoBar";
  const clipId = `rc-range-${source.kind}-${source.id}`;
  const fontSize = 0.11 * labelScale;
  // Just inside the ring's top edge, else its bottom, left or right — the first spot
  // that's inside the room (a ring can be wider than the room in both directions). A
  // wall-mounted source's ring is labelled where it meets the top or bottom wall
  // first, clear of the furniture it reaches over.
  const label = (r, text) => {
    const inset = fontSize * 0.5;
    const alongWall = (wallY, labelY) => {
      const dy = Math.abs(wallY - y);
      if (!outline || dy >= r) return [];
      const dx = Math.sqrt(r * r - dy * dy);
      return [x + dx, x - dx].map((px) => ({ x: px, y: labelY, anchor: "middle" }));
    };
    const spots = [
      ...alongWall(0, fontSize * 1.3),
      ...alongWall(room.width, room.width - inset),
      { x, y: y - r + fontSize * 1.3, anchor: "middle" },
      { x, y: y + r - inset, anchor: "middle" },
      { x: x - r + inset, y: y + fontSize * 0.35, anchor: "start" },
      { x: x + r - inset, y: y + fontSize * 0.35, anchor: "end" },
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
          cx={x}
          cy={y}
          r={reach}
          fill={outline ? "none" : c.fov}
          fillOpacity={0.08}
          stroke={c.fov}
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeDasharray={isSpeaker ? "2 4" : outline ? "6 5" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      {label(reach, `${isSpeaker ? "Speaker" : "Mic pickup"} ~${+reach.toFixed(1)}m`)}
    </g>
  );
}

// The rings for `sources` (what micSources / speakerSources return, at their drawn position).
// "selected" draws only the selected device's, "all" every one, "off" none.
export function CoverageOverlay({ sources, room, labelScale, mode = "selected", selection = null }) {
  if (mode === "off") return null;
  const shown = mode === "all" ? sources : sources.filter((s) => selection && s.category === selection.category && s.id === selection.id);
  return shown.map((s) => <MicRange key={`${s.kind}:${s.id}`} source={s} room={room} labelScale={labelScale} />);
}
