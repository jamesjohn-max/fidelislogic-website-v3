import { useState } from "react";

/**
 * Renders a brand's logo inside a fixed-dimension container so every brand
 * occupies the same visual footprint, no matter the underlying image's
 * aspect ratio. The image is centred and scaled with `object-contain`.
 *
 * Multi-source fallback chain:
 *   1. Try each candidate src in `brand.logoImages` (in order)
 *   2. If all images fail, render the wordmark text (`brand.logoText`)
 *      styled in the brand accent colour, sized to fit the same box.
 *
 * Optical balance:
 *   `object-contain` inside a shared box sizes each logo by whichever edge it
 *   hits first, so a square mark renders at full box height while a 5:1
 *   wordmark renders at a fifth of it — Poly ended up ~2.4x the visual weight
 *   of Yealink. Each brand carries a `logoScale` (fraction of the box height it
 *   may occupy) to even that out; wide wordmarks get a small scale but stay
 *   wide, square marks get a large one but stay narrow.
 *
 * Sizes (width × height, wide enough for the longest wordmark at its scale):
 *  - sm:  100 × 36 px  (compact strips)
 *  - md:  160 × 48 px  (grid cards)
 *  - lg:  200 × 60 px  (featured cards)
 *  - xl:  280 × 84 px  (brand detail hero)
 */
const sizeByVariant = {
  sm: { box: "w-[100px] h-9", height: 36, text: "text-sm" },
  md: { box: "w-40 h-12", height: 48, text: "text-xl" },
  lg: { box: "w-[200px] h-[60px]", height: 60, text: "text-2xl" },
  xl: { box: "w-[280px] h-[84px]", height: 84, text: "text-4xl sm:text-5xl" },
};

const resolveSources = (brand) => {
  if (Array.isArray(brand.logoImages) && brand.logoImages.length > 0) {
    return brand.logoImages.filter(Boolean);
  }
  if (brand.logoImage) return [brand.logoImage];
  return [];
};

export const BrandLogo = ({ brand, size = "md", className = "", testId }) => {
  const sources = resolveSources(brand);
  const [index, setIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(sources.length === 0);
  const { box, height, text } = sizeByVariant[size];
  const scale = typeof brand.logoScale === "number" ? brand.logoScale : 1;

  const wrapperClass = `inline-flex items-center justify-center shrink-0 ${box} ${className}`;

  if (!allFailed && sources.length > 0) {
    return (
      <div className={wrapperClass} data-testid={testId}>
        <img
          key={sources[index]}
          src={sources[index]}
          alt={brand.name}
          loading="lazy"
          onError={() => {
            if (index + 1 < sources.length) {
              setIndex(index + 1);
            } else {
              setAllFailed(true);
            }
          }}
          className="w-auto h-auto object-contain"
          style={{ maxHeight: `${Math.round(height * scale)}px`, maxWidth: "100%" }}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass} data-testid={testId}>
      <span
        className={`font-bold tracking-tight ${text} truncate`}
        style={{ color: brand.accentColor }}
      >
        {brand.logoText}
      </span>
    </div>
  );
};
