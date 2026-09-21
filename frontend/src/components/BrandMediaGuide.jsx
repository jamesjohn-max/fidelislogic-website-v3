import { ExternalLink, PlayCircle } from "lucide-react";

export const BrandMediaGuide = ({ brand }) => {
  const { seoContent } = brand;

  if (!seoContent) return null;

  const { image, overview, buyingGuide, video, officialUrl } = seoContent;

  return (
    <section
      className="border-y border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      data-testid={`brand-media-guide-${brand.slug}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 border-b border-gray-200 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="section-label mb-3">
              {brand.name} guide for UAE buyers
            </p>
            <h2 className="mb-6 text-3xl font-bold leading-tight text-brand-dark sm:text-4xl tracking-tight">
              See the technology. Understand where it fits.
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-gray-700">
              {overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
              >
                Visit the official {brand.name} website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <img
              src={image.src}
              alt={image.alt}
              width="1200"
              height="675"
              loading="lazy"
              className="aspect-video w-full object-cover"
            />
            <figcaption className="border-t border-gray-200 px-5 py-4 text-sm leading-relaxed text-gray-600">
              {image.caption}
            </figcaption>
          </figure>
        </div>

        <div className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-blue-600" aria-hidden="true" />
              <div>
                <p className="section-label">
                  Official product video
                </p>
                <h3 className="text-xl font-bold text-brand-dark">{video.title}</h3>
              </div>
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-sm">
              {video.type === "youtube" ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={image.src}
                  className="h-full w-full object-contain"
                >
                  <source src={video.src} type="video/mp4" />
                  Your browser does not support embedded video.
                </video>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{video.description}</p>
          </div>

          <div>
            <p className="section-label mb-3">
              Before you standardise
            </p>
            <h3 className="mb-7 text-2xl font-bold text-brand-dark">
              Three questions for a better-fit deployment.
            </h3>
            <ol className="border-t border-gray-200">
              {buyingGuide.map((item, index) => (
                <li
                  key={item.title}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-gray-200 py-5"
                >
                  <span className="text-2xl font-bold tabular-nums text-blue-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="mb-1 font-semibold text-brand-dark">{item.title}</h4>
                    <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};
