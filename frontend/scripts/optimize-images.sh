#!/usr/bin/env bash
#
# Generates responsive WebP + JPEG variants for the site's photographic assets.
#
# Source images live in frontend/image-sources/ — full-resolution originals, kept
# outside public/ so CRA never copies them into the build.
# Output lands in public/img/ and IS served — those are the files the app links to.
#
# This is a LOCAL AUTHORING TOOL, not part of the deployed build. Its output is
# committed under public/img/, so neither CI nor the Emergent container ever
# needs to run it. Re-run it only when source imagery changes.
#
# Prerequisites (macOS):  brew install webp     (provides cwebp)
#                         sips ships with macOS
#
# On Linux, install `webp` and `imagemagick`; the script uses `magick`/`convert`
# in place of sips.
#
# Run from frontend/:  ./scripts/optimize-images.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="image-sources"
OUT="public/img"

if ! command -v cwebp >/dev/null; then
  echo "cwebp not found. macOS: brew install webp — Debian/Ubuntu: apt-get install webp" >&2
  exit 1
fi

# Resize + re-encode to JPEG. sips on macOS, ImageMagick elsewhere.
if command -v sips >/dev/null; then
  to_jpeg() { # <src> <out> <max-dimension> <quality>
    sips -s format jpeg -s formatOptions "$4" -Z "$3" "$1" --out "$2" >/dev/null
  }
  crop_jpeg() { # <src> <out> <width> <height> <quality>
    sips -s format jpeg -s formatOptions "$5" -Z "$(( $3 + 200 ))" "$1" --out "$2" >/dev/null
    sips -c "$4" "$3" "$2" --out "$2" >/dev/null
  }
elif command -v magick >/dev/null || command -v convert >/dev/null; then
  IM=$(command -v magick || command -v convert)
  to_jpeg() {
    "$IM" "$1" -resize "$3x$3>" -quality "$4" "$2"
  }
  crop_jpeg() {
    "$IM" "$1" -resize "$3x$4^" -gravity center -extent "$3x$4" -quality "$5" "$2"
  }
else
  echo "Need sips (macOS) or ImageMagick. Debian/Ubuntu: apt-get install imagemagick" >&2
  exit 1
fi

# Widest JPEG fallback we bother to build. WebP covers ~97% of traffic; the
# fallback exists for the rest, and letting those browsers top out at 1280
# (upscaled by the browser) keeps ~8 MB of near-duplicate JPEGs out of the repo.
JPEG_MAX_WIDTH=1280

# emit <src> <out-basename> <width> <webp-quality> <jpeg-quality>
variant() {
  local src="$1" name="$2" w="$3" wq="$4" jq="$5"
  cwebp -quiet -q "$wq" -resize "$w" 0 "$src" -o "$OUT/${name}-${w}.webp"
  if [ "$w" -le "$JPEG_MAX_WIDTH" ]; then
    to_jpeg "$src" "$OUT/${name}-${w}.jpg" "$w" "$jq"
  fi
}

# Card images: rendered in a 4-up grid, ~230-350 CSS px wide.
CARD_WIDTHS="400 800"
CARD_WEBP_Q=80
CARD_JPEG_Q=78

# Hero images: full-bleed background, up to 2560 CSS px on wide desktops.
HERO_WIDTHS="768 1280 1920"
HERO_WEBP_Q=78
HERO_JPEG_Q=76

# Interface screenshots (Room Planner preview on the homepage). Text has to stay
# legible, so these use higher quality than the photographic assets and stop at
# 1280 — the preview never renders wider than half the page.
UI_WIDTHS="768 1280"
UI_WEBP_Q=88
UI_JPEG_Q=86

mkdir -p "$OUT/cards" "$OUT/hero" "$OUT/page-hero" "$OUT/brand-hero" "$OUT/social" "$OUT/room-planner"

# workspace-experience uses a tighter crop of ROOMZ2 (ROOMZ2-card.jpg): at card
# size the booking panel was a speck in an empty corridor. The social preview
# below still uses the full frame, where there is room for the context.
echo "→ card images"
for pair in \
  "meeting-rooms:Neat2.jpg" \
  "headsets:EnterpriseHeadsets.png" \
  "workspace-experience:ROOMZ2-card.jpg" \
  "business-apps:business-apps-ai-hero.png"
do
  name="${pair%%:*}"; file="${pair#*:}"
  for w in $CARD_WIDTHS; do
    variant "$SRC/cards/$file" "cards/$name" "$w" "$CARD_WEBP_Q" "$CARD_JPEG_Q"
  done
  echo "   $name"
done

# Room Planner interface preview. The source is a real capture of the planner's
# 3D review screen, not a mock-up — recapture it when the planner's UI changes.
echo "→ interface screenshots"
for pair in \
  "preview:planner-3d.png"
do
  name="${pair%%:*}"; file="${pair#*:}"
  [ -e "$SRC/room-planner/$file" ] || { echo "   skipped $name (no source)"; continue; }
  for w in $UI_WIDTHS; do
    variant "$SRC/room-planner/$file" "room-planner/$name" "$w" "$UI_WEBP_Q" "$UI_JPEG_Q"
  done
  echo "   $name"
done

echo "→ hero images"
for pair in \
  "workplace:HeroImage.png" \
  "roomz:ROOMZ1.png" \
  "neat:Neat4.png" \
  "logitech:Logitech1.png" \
  "jabra:Jabra5.jpg"
do
  name="${pair%%:*}"; file="${pair#*:}"
  for w in $HERO_WIDTHS; do
    variant "$SRC/hero/$file" "hero/$name" "$w" "$HERO_WEBP_Q" "$HERO_JPEG_Q"
  done
  echo "   $name"
done

# Page heroes: full-bleed hero backgrounds on the solution detail pages.
echo "→ page heroes"
for pair in \
  "headsets:EnterpriseHeadsets2.png" \
  "business-apps:business-apps-ai-hero.png" \
  "meeting-rooms:meeting-rooms.jpg" \
  "workspace-experience:workspace-experience.jpg"
do
  name="${pair%%:*}"; file="${pair#*:}"
  for w in $HERO_WIDTHS; do
    variant "$SRC/page-hero/$file" "page-hero/$name" "$w" "$HERO_WEBP_Q" "$HERO_JPEG_Q"
  done
  echo "   $name"
done

# Brand heroes: the carousels on /brands/<slug>. Sources are named
# <slug>-<n>.<ext> in the order they appear in the carousel.
echo "→ brand heroes"
for src in "$SRC"/brand-hero/*; do
  [ -e "$src" ] || continue
  name=$(basename "$src"); name="${name%.*}"
  for w in $HERO_WIDTHS; do
    variant "$src" "brand-hero/$name" "$w" "$HERO_WEBP_Q" "$HERO_JPEG_Q"
  done
  echo "   $name"
done

# Service photography: /services/<slug> heroes and in-page images, plus the
# homepage services section. Sources are <slug>-1 (hero) and <slug>-2
# (supporting); see image-sources/services/SOURCES.md for provenance.
# The extra 400px width serves the small thumbnails in the homepage list.
echo "→ service images"
mkdir -p "$OUT/services"
SERVICE_WIDTHS="400 $HERO_WIDTHS"
for src in "$SRC"/services/*.jpg; do
  [ -e "$src" ] || continue
  name=$(basename "$src"); name="${name%.*}"
  for w in $SERVICE_WIDTHS; do
    variant "$src" "services/$name" "$w" "$HERO_WEBP_Q" "$HERO_JPEG_Q"
  done
  echo "   $name"
done

# About page: the mission-section photo, rendered ~600px wide in a 2-up grid.
echo "→ about page"
mkdir -p "$OUT/about"
for w in 768 1280; do
  variant "$SRC/about/aboutus.png" "about/mission" "$w" "$HERO_WEBP_Q" "$HERO_JPEG_Q"
done
echo "   mission"

# Site logo: a 2071x377 master rendered at 220x40 in the header and 154x28 in
# the footer. 660px wide covers 3x on the larger of the two.
echo "→ site logo"
for name in Logo_Color_Large Logo_White_Large; do
  cwebp -quiet -lossless -resize 660 0 "public/$name.png" -o "public/$name.webp"
  echo "   $name — $(( $(stat -f%z "public/$name.png") / 1024 ))KB → $(( $(stat -f%z "public/$name.webp") / 1024 ))KB"
done

# Brand logos: transparent wordmarks. Lossless WebP keeps the edges crisp and
# is dramatically smaller than PNG for flat-colour artwork. Never upscale a
# small source, and keep the PNG if WebP does not actually win.
echo "→ brand logos"
LOGO_MAX_WIDTH=600
for png in public/brand-logos/*.png; do
  [ -e "$png" ] || continue
  base="${png%.png}"
  if command -v sips >/dev/null; then
    src_w=$(sips -g pixelWidth "$png" | awk '/pixelWidth/{print $2}')
  else
    src_w=$("$IM" identify -format '%w' "$png")
  fi
  if [ "$src_w" -gt "$LOGO_MAX_WIDTH" ]; then
    cwebp -quiet -lossless -resize "$LOGO_MAX_WIDTH" 0 "$png" -o "$base.webp"
  else
    cwebp -quiet -lossless "$png" -o "$base.webp"
  fi
  if [ "$(stat -f%z "$base.webp")" -ge "$(stat -f%z "$png")" ]; then
    rm -f "$base.webp"
    echo "   $(basename "$base") — kept PNG (WebP was no smaller)"
  else
    echo "   $(basename "$base") — $(( $(stat -f%z "$png") / 1024 ))KB → $(( $(stat -f%z "$base.webp") / 1024 ))KB"
  fi
done

# Social previews: fixed 1200x630, JPEG only — crawlers are unreliable with
# WebP, and the meta tags declare these exact dimensions.
echo "→ social previews"
for pair in \
  "og-home:hero/HeroImage.png" \
  "og-meeting-rooms:cards/Neat2.jpg" \
  "og-headsets:cards/EnterpriseHeadsets.png" \
  "og-workspace-experience:cards/ROOMZ2.jpg" \
  "og-business-apps:cards/business-apps-ai-hero.png" \
  "og-brand-roomz:brand-hero/roomz-1.jpg" \
  "og-brand-jabra:brand-hero/jabra-1.jpg" \
  "og-brand-neat:brand-hero/neat-2.jpg" \
  "og-brand-logitech:brand-hero/logitech-1.png"
do
  name="${pair%%:*}"; file="${pair#*:}"
  # Scale to cover 1200x630, then centre-crop to exactly that.
  crop_jpeg "$SRC/$file" "$OUT/social/$name.jpg" 1200 630 82
  echo "   $name.jpg"
done
for src in "$SRC"/services/*-1.jpg; do
  [ -e "$src" ] || continue
  slug=$(basename "$src"); slug="${slug%-1.jpg}"
  crop_jpeg "$src" "$OUT/social/og-service-$slug.jpg" 1200 630 82
  echo "   og-service-$slug.jpg"
done

echo
echo "Done. Output:"
du -sh "$OUT"
