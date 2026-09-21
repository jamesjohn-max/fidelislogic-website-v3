import { Helmet } from "react-helmet-async";

export const SEO = ({
  title,
  description,
  keywords,
  ogType = "website",
  ogImage = "/img/social/og-home.jpg",
  article = false,
  author,
  publishedDate,
  modifiedDate,
  canonicalUrl
}) => {
  const siteName = "Fidelis Logic";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  // Use origin + pathname (strip query/hash) so canonical URL is stable.
  const currentUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const canonical = canonicalUrl || currentUrl;
  // og:image must be absolute — crawlers do not resolve site-relative paths.
  const absoluteOgImage = /^https?:\/\//.test(ogImage)
    ? ogImage
    : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_AE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* Article specific meta tags */}
      {article && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedDate && (
            <meta property="article:published_time" content={publishedDate} />
          )}
          {modifiedDate && (
            <meta property="article:modified_time" content={modifiedDate} />
          )}
        </>
      )}

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="AE" />
      <meta name="geo.placename" content="Sharjah" />
    </Helmet>
  );
};
