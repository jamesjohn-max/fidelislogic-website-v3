# Service page photography

Editorial photography for `/services/<slug>` and the homepage services section.
All images are from Unsplash under the [Unsplash License](https://unsplash.com/license)
(free for commercial use, no attribution required). Unsplash+ images are not used.

Naming: `<service-slug>-1` is the hero, `<service-slug>-2` is the in-page
supporting image. Each photo is used by exactly one service, so no image repeats
across pages. Replace any of these with real project photography when available;
keep the file names so `scripts/optimize-images.sh` and `src/data/services.js`
keep working.

| File | Unsplash photo |
| --- | --- |
| `consulting-1.jpg` | Supplied by client (AI-generated), 2026-10-17 |
| `consulting-2.jpg` | Supplied by client (AI-generated), 2026-10-18 |
| `deployment-configuration-1.jpg` | https://unsplash.com/photos/photo-1676275774895-7fbba85dce94 |
| `deployment-configuration-2.jpg` | https://unsplash.com/photos/photo-1544197150-b99a580bb7a8 — superseded in `public/`, see note |
| `managed-support-1.jpg` | https://unsplash.com/photos/photo-1551434678-e076c223a692 |
| `managed-support-2.jpg` | https://unsplash.com/photos/photo-1594915440248-1e419eba6611 |
| `video-conferencing-rentals-1.jpg` | https://unsplash.com/photos/photo-1573497161249-42447f9f6706 |
| `video-conferencing-rentals-2.jpg` | https://unsplash.com/photos/photo-1777264935754-aa53096c2d68 |
| `workspace-audits-1.jpg` | https://unsplash.com/photos/photo-1664464683233-2b7f9afc9f08 |
| `workspace-audits-2.jpg` | https://unsplash.com/photos/photo-1551288049-bebda4e38f71 |
| `technology-refresh-1.jpg` | https://unsplash.com/photos/photo-1764810815228-b7f9432eec5c |
| `technology-refresh-2.jpg` | https://unsplash.com/photos/photo-1709000724284-c38463263d59 |
| `relocation-office-moves-1.jpg` | https://unsplash.com/photos/photo-1758691737424-b0cdcfce9f66 |
| `relocation-office-moves-2.jpg` | https://unsplash.com/photos/photo-1679395561581-9d9bc2584047 |
| `training-adoption-1.jpg` | https://unsplash.com/photos/photo-1542744173-8e7e53415bb0 |
| `training-adoption-2.jpg` | https://unsplash.com/photos/photo-1758691736548-073bc97cdff4 |

**Exception — `deployment-configuration-2`:** the variants served from
`public/img/services/` were supplied as finished images on 2026-10-18 and do **not**
come from the source file above, which is still the original Unsplash photo. Nothing
in `image-sources/` reproduces them, so `scripts/optimize-images.sh` will regenerate
that set from the Unsplash original and silently replace the supplied artwork. Put the
original in `image-sources/` and correct the row above before running the script again.

Note the service's hero (`deployment-configuration-1`) is still the Unsplash
photograph, so the two images on that page do not currently share a visual style.
