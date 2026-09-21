import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import axios from "axios";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { StructuredData } from "../components/StructuredData";
import { Button } from "../components/ui/button";
import { getBrandBySlug, getBrandsSorted } from "../data/brands";
import { ArrowRight, CheckCircle2, ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import { PartnershipBadge } from "../components/PartnershipBadge";
import { BrandLogo } from "../components/BrandLogo";
import { BrandLeadForm } from "../components/BrandLeadForm";
import { HeroCarousel } from "../components/HeroCarousel";
import { heroImageWidths, consultationCta } from "../data/siteContent";
import { jpegFallback } from "../lib/images";
import { FAQSection } from "../components/FAQSection";
import { FAQSchema } from "../components/FAQSchema";
import { analytics } from "../lib/analytics";
import { BrandMediaGuide } from "../components/BrandMediaGuide";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { certifiedBrands } from "../data/trust";

import { BACKEND_URL } from "../lib/api";
export const BrandDetail = () => {
  const { slug } = useParams();
  const brand = getBrandBySlug(slug);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/api/faqs`, { params: { brand_slug: slug } })
      .then((res) => {
        if (!cancelled) setFaqs(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!brand) {
    return <Navigate to="/brands" replace />;
  }

  const otherBrands = getBrandsSorted()
    .filter((b) => b.slug !== brand.slug)
    .slice(0, 3);

  const primaryUseCase = brand.useCases[0];
  const primarySolution = brand.relatedSolutions[0];
  const headlineProofs = brand.proofPoints.slice(0, 3);
  const strengths = brand.keyStrengths;
  const products = brand.products;
  // heroImages entries may be responsive-variant descriptors rather than plain
  // URLs, so pick their largest built variant when falling back to them here.
  const heroImageUrls = (brand.heroImages || []).map((img) =>
    typeof img === "string" ? img : jpegFallback(img.basePath, heroImageWidths)
  );
  const productVisuals = brand.productVisuals || Array.from(new Set([
    brand.seoContent?.image?.src,
    ...heroImageUrls,
    brand.heroImage,
  ].filter(Boolean)));
  const useCases = brand.useCases;
  const relatedSolutions = brand.relatedSolutions;

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    "name": brand.name,
    "url": `https://fidelislogic.com/brands/${brand.slug}`,
    "logo": `https://fidelislogic.com${brand.logoImages[0]}`,
    "description": brand.shortDescription,
    "slogan": brand.tagline
  };

  // Either field may already be absolute; concatenating one onto the origin
  // produced "https://fidelislogic.comhttps://images.unsplash.com/...".
  const mediaImageSrc = brand.seoContent?.image?.src || brand.heroImage;
  const mediaImageUrl = mediaImageSrc?.startsWith("http")
    ? mediaImageSrc
    : `https://fidelislogic.com${mediaImageSrc}`;
  const video = brand.seoContent?.video;
  const mediaSchema = brand.seoContent
    ? {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        "name": brand.seoContent.image.alt,
        "caption": brand.seoContent.image.caption,
        "contentUrl": mediaImageUrl,
        "representativeOfPage": true
      }
    : null;
  const videoSchema = video
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.title,
        "description": video.description,
        "thumbnailUrl": [mediaImageUrl],
        ...(video.uploadDate ? { "uploadDate": video.uploadDate } : {}),
        ...(video.type === "youtube"
          ? {
              "contentUrl": `https://www.youtube.com/watch?v=${video.id}`,
              "embedUrl": `https://www.youtube-nocookie.com/embed/${video.id}`
            }
          : { "contentUrl": video.src })
      }
    : null;
  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${brand.name} product categories`,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => {
      const visual = productVisuals[index % productVisuals.length];
      const visualUrl = visual?.startsWith("http")
        ? visual
        : `https://fidelislogic.com${visual}`;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Thing",
          "name": product.name,
          "description": product.description,
          "url": `https://fidelislogic.com/brands/${brand.slug}#product-${brand.slug}-${index + 1}`,
          ...(visual ? { "image": visualUrl } : {}),
          ...(product.officialUrl ? { "sameAs": product.officialUrl } : {})
        }
      };
    })
  };

  const accentTint = `${brand.accentColor}0D`;
  const deliveryBg = { background: `linear-gradient(135deg, ${accentTint} 0%, #ffffff 100%)` };
  const accentBgStyle = { backgroundColor: brand.accentColor };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={brand.seoContent?.title || `${brand.name} UAE Partner | ${brand.tagline}`}
        description={brand.seoContent?.description || `${brand.shortDescription} Delivered in the UAE by Fidelis Logic with design, deployment, and lifecycle support.`}
        keywords={(brand.seoContent?.keywords || [
          `${brand.name} UAE`,
          `${brand.name} partner UAE`,
          `${brand.category.toLowerCase()} UAE`,
          `Fidelis Logic ${brand.name}`
        ]).join(", ")}
        ogImage={mediaImageUrl}
        canonicalUrl={`https://fidelislogic.com/brands/${brand.slug}`}
      />
      <StructuredData data={brandSchema} />
      {mediaSchema && <StructuredData data={mediaSchema} />}
      {videoSchema && <StructuredData data={videoSchema} />}
      <StructuredData data={productListSchema} />
      <Breadcrumbs
        items={[
          { name: "Brands", href: "/brands" },
          { name: brand.name }
        ]}
        className="pt-24"
      />

      {/* Hero — split-stage layout keeps copy and photography independent */}
      <section className="px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <div
          className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_28px_80px_-52px_rgba(15,23,42,0.42)]"
          data-testid="brand-hero-card"
        >
          <div className="grid lg:min-h-[560px] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="order-2 flex flex-col justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:order-1 lg:px-12 xl:px-14">
              <div className="mb-7 flex items-center justify-between gap-5 border-b border-gray-200 pb-6">
                <div className="inline-flex items-center" data-testid="brand-logo-wordmark">
                  <BrandLogo brand={brand} size="lg" className="justify-start" />
                </div>
                <span className="max-w-[10rem] text-right text-[11px] font-semibold uppercase leading-4 tracking-[0.12em] text-gray-500">
                  {brand.partnershipType}
                </span>
              </div>

              <p className="mb-4 flex items-center gap-3 text-sm font-semibold text-blue-600">
                <span className="h-px w-7 bg-blue-600" aria-hidden="true" />
                {brand.category}
              </p>
              <h1
                className="mb-5 text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-gray-950 sm:text-5xl lg:text-[3.35rem]"
                data-testid="brand-hero-title"
              >
                <span className="sr-only">{brand.name}: </span>
                {brand.tagline}
              </h1>
              <p
                className="mb-8 max-w-xl text-base leading-7 text-gray-600 sm:text-lg"
                data-testid="brand-hero-description"
              >
                {brand.shortDescription}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/contact"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    analytics.consultationCtaClick({
                      location: "brand_hero",
                      brand: brand.slug,
                      brand_name: brand.name,
                    })
                  }
                >
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:w-auto"
                    data-testid="brand-hero-cta-primary"
                  >
                    {consultationCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {primarySolution && (
                  <Link to={primarySolution.href} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-gray-300 bg-white text-brand-dark hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
                      data-testid="brand-hero-cta-secondary"
                    >
                      Explore {primarySolution.name}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="relative order-1 min-h-[310px] overflow-hidden border-b border-gray-200 bg-[#F7F7F8] sm:min-h-[420px] lg:order-2 lg:min-h-full lg:border-b-0 lg:border-l">
              <HeroCarousel
                images={brand.heroImages || [brand.heroImage]}
                widths={heroImageWidths}
                interval={7000}
                transitionMs={900}
                showDots
                testId={`brand-hero-carousel-${brand.slug}`}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-gray-950/35 to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      <BrandMediaGuide brand={brand} />

      {/* Why this brand + At a glance */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="brand-strengths-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            {/* Left: Why brand */}
            <div className="lg:col-span-2">
              <div className="max-w-2xl mb-12">
                <p className="section-label mb-3">
                  Why {brand.name}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight">
                  What makes {brand.name} a deliberate choice in our ecosystem.
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {strengths.map((strength, idx) => (
                  <div key={idx} className="flex gap-4" data-testid={`brand-strength-${idx}`}>
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                      style={accentBgStyle}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-dark mb-2">
                        {strength.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{strength.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: At a glance */}
            <aside className="lg:col-span-1" data-testid="brand-glance-aside">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7 lg:sticky lg:top-24">
                <p className="text-sm font-medium text-gray-500 mb-5">
                  At a glance
                </p>
                <dl className="space-y-5">
                  <div>
                    <dt className="text-sm text-gray-500 mb-1.5">Partnership</dt>
                    <dd>
                      <PartnershipBadge
                        type={brand.partnershipType}
                        size="sm"
                        testId="brand-partnership-badge-glance"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-1.5">Category</dt>
                    <dd className="text-base font-semibold text-brand-dark">{brand.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-1.5">Ideal for</dt>
                    <dd className="text-base text-brand-dark">{brand.useCases[0]}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-2.5">Proof points</dt>
                    <dd className="space-y-2.5">
                      {brand.proofPoints.slice(0, 3).map((p) => (
                        <div key={p} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="border-y border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20" data-testid="brand-products-section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-16">
            <div>
            <p className="section-label mb-3">
                Product families
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight">
                Explore the {brand.name} portfolio.
            </h2>
            </div>
            <p className="text-base leading-relaxed text-gray-700">
              {brand.productCategoryIntro || `Understand where each ${brand.name} product family fits before selecting individual models.`}
            </p>
          </div>
          <div className="grid border-l border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, idx) => {
              const visual = productVisuals[idx % productVisuals.length];
              return (
                <article
                  key={product.name}
                  id={`product-${brand.slug}-${idx + 1}`}
                  className="group flex min-h-full flex-col border-b border-r border-gray-200 bg-white"
                  data-testid={`brand-product-${idx}`}
                >
                  {visual && (
                    <figure className="relative aspect-[16/10] overflow-hidden border-b border-gray-200 bg-gray-100">
                      <img
                        src={visual}
                        alt={product.imageAlt || `${brand.name} workplace technology in the context of ${product.name}`}
                        width="720"
                        height="450"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover image-zoom"
                      />
                      <span className="absolute left-0 top-0 bg-blue-600 px-4 py-3 text-2xl font-bold tabular-nums text-white">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </figure>
                  )}
                  <div className="flex grow flex-col p-6 lg:p-7">
                    {!visual && (
                      <span className="mb-8 text-3xl font-bold tabular-nums text-blue-600">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    )}
                    <h3 className="mb-3 text-xl font-semibold leading-snug text-brand-dark">{product.name}</h3>
                    <p className="mb-6 text-sm leading-relaxed text-gray-600">{product.description}</p>
                    {product.bestFor && (
                      <dl className="border-t border-gray-200 pt-5 text-sm">
                        <div>
                          <dt className="mb-1 font-semibold text-brand-dark">Best fit</dt>
                          <dd className="leading-relaxed text-gray-600">{product.bestFor}</dd>
                        </div>
                      </dl>
                    )}
                    {product.deploymentFocus && (
                      <details className="group/details mt-5 border-t border-gray-200 pt-4 text-sm">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-dark">
                          Deployment focus
                          <ChevronDown className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-open/details:rotate-180" aria-hidden="true" />
                        </summary>
                        <p className="pt-3 leading-relaxed text-gray-600">{product.deploymentFocus}</p>
                      </details>
                    )}
                    <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-gray-200 pt-5 text-sm font-semibold">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                        onClick={() => analytics.consultationCtaClick({
                          location: "brand_product_category",
                          brand: brand.slug,
                          brand_name: brand.name,
                          product_category: product.name,
                        })}
                      >
                        Discuss this category
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      {product.officialUrl && (
                        <a
                          href={product.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-brand-dark"
                        >
                          Official product information
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="brand-usecases-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="section-label mb-3">
                Where we deploy {brand.name}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6 leading-tight tracking-tight">
                Use cases and environments.
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {brand.name} earns its place in the estates where it clearly outperforms
                alternatives on the factors that matter most. Here&apos;s where we typically
                position it.
              </p>
            </div>
            <div>
              <ul className="space-y-4">
                {useCases.map((useCase, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg"
                    data-testid={`brand-usecase-${idx}`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-gray-800 font-medium">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fidelis delivery wrap */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={deliveryBg}
        data-testid="brand-delivery-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
            <p className="section-label mb-3">
              How Fidelis Logic delivers {brand.name}
            </p>
            <h2 className="text-3xl font-bold text-brand-dark mb-6 leading-tight tracking-tight">
              Advisory and delivery, wrapped around the technology.
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg mb-8">{brand.fidelisRole}</p>
            <div className="flex flex-wrap gap-2">
              {relatedSolutions.map((sol) => (
                <Link
                  key={sol.href}
                  to={sol.href}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                  data-testid={`brand-related-solution-${sol.href}`}
                >
                  {sol.name}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Other brands */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="brand-related-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
              Other brands in the ecosystem
            </h2>
            <Link
              to="/brands"
              className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1.5 text-sm"
              data-testid="brand-see-all-link"
            >
              See all brands
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherBrands.map((b) => (
              <Link
                key={b.slug}
                to={`/brands/${b.slug}`}
                className="card-interactive group bg-white border border-gray-200 rounded-2xl p-6 flex flex-col"
                data-testid={`brand-related-${b.slug}`}
              >
                <div className="mb-3">
                  <BrandLogo brand={b} size="sm" testId={`brand-related-logo-${b.slug}`} />
                </div>
                <div className="mb-2">
                  <PartnershipBadge
                    type={b.partnershipType}
                    size="xs"
                    testId={`brand-related-partnership-${b.slug}`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  {b.category}
                </p>
                <h3 className="text-base font-semibold text-brand-dark mb-2">
                  {b.tagline}
                </h3>
                <div className="mt-auto pt-3 flex items-center text-sm text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform duration-200 ease-out-strong">
                  Learn more
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — dynamic per brand, indexed for SEO */}
      {faqs.length > 0 && (
        <>
          <FAQSchema faqs={faqs} />
          <FAQSection
            faqs={faqs}
            title={`${brand.name} — Frequently Asked Questions`}
            subtitle={`Answers to the questions we get most often about deploying ${brand.name} in the UAE.`}
            testIdPrefix={`brand-faq-${brand.slug}`}
          />
        </>
      )}

      {/* Our role with this brand — blueprint section 10 asks each brand page to
          separate manufacturer facts from Fidelis Logic's own relationship,
          capability and advisory role, so a visitor can tell which is which. */}
      <section
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white"
        data-testid="brand-our-role"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p className="section-label mb-3">Our role</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              What {brand.name} provides, and what we do
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
              <h3 className="text-lg font-semibold text-brand-dark">
                {brand.name} — the manufacturer
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                {brand.name} builds the products, owns the roadmap, publishes the
                specifications and provides the manufacturer warranty and firmware.
                Everything on this page describing the products themselves comes from
                {" "}{brand.name}.
              </p>
              {brand.seoContent?.officialUrl && (
                <a
                  href={brand.seoContent.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Manufacturer's own product pages
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-7">
              <h3 className="text-lg font-semibold text-brand-dark">
                Fidelis Logic — the advisory and delivery role
              </h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                We assess the rooms, decide whether {brand.name} is the right fit, design
                and document the solution, and support delivery — working with your own
                reseller or system integrator where you have one.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  `Independent assessment of whether ${brand.name} suits your estate`,
                  "Room-by-room design, documentation and bills of quantity",
                  "Deployment support, commissioning and handover",
                  "Training, adoption and ongoing support",
                  certifiedBrands.includes(brand.slug)
                    ? `Technical certification in ${brand.name} solutions`
                    : null
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
              </ul>
              <p className="mt-5 text-sm text-gray-500 leading-relaxed">
                Our recommendation is made on fit. If {brand.name} is not the right
                answer for your rooms, we will say so.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ brand: brand.slug }}
        heading={`${brand.name} in practice`}
        background="gray"
        testIdPrefix={`brand-cases-${brand.slug}`}
      />

      {/* Brand-specific enquiry */}
      <BrandLeadForm brand={brand} variant="full" />

      {/* All brands link */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/40">
        <div className="max-w-5xl mx-auto text-center">
          <Link
            to="/brands"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            data-testid="brand-footer-cta-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all brands
          </Link>
        </div>
      </section>
    </div>
  );
};
