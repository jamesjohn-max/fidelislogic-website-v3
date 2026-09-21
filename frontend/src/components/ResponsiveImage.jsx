/**
 * Renders a photographic asset as a <picture> with WebP + JPEG sources.
 *
 * Assets are produced by `frontend/scripts/optimize-images.sh`, which writes
 * `<basePath>-<width>.webp` and `<basePath>-<width>.jpg` for each width in
 * `widths`. Pass `basePath` without the width suffix or extension, e.g.
 * "/img/cards/meeting-rooms".
 *
 * Props:
 *  - basePath: path prefix shared by every variant (no width, no extension)
 *  - widths:   intrinsic widths available on disk, ascending
 *  - sizes:    CSS `sizes` attribute — tells the browser how wide the image
 *              will render before layout, so it can pick the right variant
 *  - alt:      "" marks the image decorative (the surrounding text carries
 *              the meaning); anything else is announced by screen readers
 *  - width/height: intrinsic dimensions of the largest variant, used to
 *              reserve layout space and avoid cumulative layout shift
 */
import { jpegWidths, jpegFallback } from "../lib/images";

export const ResponsiveImage = ({
  basePath,
  widths = [400, 800],
  sizes = "100vw",
  alt = "",
  className = "",
  width,
  height,
  loading = "lazy",
  fetchPriority,
  style,
  testId,
  onLoad,
}) => {
  const build = (list, ext) =>
    list.map((w) => `${basePath}-${w}.${ext} ${w}w`).join(", ");
  const srcSet = (ext) =>
    ext === "webp" ? build(widths, ext) : build(jpegWidths(widths), ext);

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={jpegFallback(basePath, widths)}
        srcSet={srcSet("jpg")}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
        style={style}
        onLoad={onLoad}
        data-testid={testId}
      />
    </picture>
  );
};
