import { usePalette } from "./PaletteContext";

// How far a device's built-in microphones reach: a ring clipped to the room, labelled
// on whichever side stays inside it. A 360° camera sees the whole room, so it shows
// this (tinted) instead of a view cone; an all-in-one display shows it as a dashed
// outline over its view cone.
export function MicRange({ cam, reach, room, labelScale, outline = false, text = `Mic pickup ~${reach}m` }) {
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
