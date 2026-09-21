/**
 * Shared constants for the responsive image variants produced by
 * `frontend/scripts/optimize-images.sh`.
 */

/**
 * Widest JPEG fallback the build produces.
 *
 * WebP covers the overwhelming majority of traffic, so the pipeline stops
 * emitting JPEG above this width and lets the remaining browsers upscale a
 * 1280px file. Anything that builds a `.jpg` srcset or `src` must clamp to
 * this, or it will point at a file that was never written.
 *
 * Keep in sync with JPEG_MAX_WIDTH in scripts/optimize-images.sh.
 */
export const JPEG_MAX_WIDTH = 1280;

/** Widths available as JPEG, given the full set of built widths. */
export const jpegWidths = (widths) => {
  const usable = widths.filter((w) => w <= JPEG_MAX_WIDTH);
  // Never return an empty list: if every width is above the cap the pipeline
  // still wrote nothing, but pointing at the smallest is the least-bad guess.
  return usable.length > 0 ? usable : widths.slice(0, 1);
};

/** The JPEG variant to use as a plain `src` fallback. */
export const jpegFallback = (basePath, widths) => {
  const usable = jpegWidths(widths);
  return `${basePath}-${usable[usable.length - 1]}.jpg`;
};
