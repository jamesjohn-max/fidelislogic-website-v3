// lucide-style (24px grid, currentColor stroke) glyph for a video bar — a long bar
// with the camera lens in the middle and speaker grilles either side — so it sits
// alongside the lucide icons used for every other device.
export function VideoBarGlyph({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="8.5" width="21" height="7" rx="3.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M5 12h1.5M17.5 12H19" />
    </svg>
  );
}
