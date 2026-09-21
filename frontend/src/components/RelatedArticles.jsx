import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, resolveApiAsset } from "../lib/api";
import { analytics } from "../lib/analytics";

/**
 * Articles related to the page's topic (blueprint section 7: every solution
 * page links "related articles", and section 9 asks for contextual next steps
 * instead of generic promotional interruptions).
 *
 * The blog API has no category filter, so this asks for card-sized summaries and
 * matches `category` client-side against `categories`. When nothing matches it
 * falls back to the most recent posts, and when the request fails or there are
 * no posts at all it renders nothing rather than an empty band.
 *
 * Props:
 *  - categories: category substrings to prefer, case-insensitive
 *  - topic: value sent with the blog_solution_click analytics event
 */
export const RelatedArticles = ({
  categories = [],
  topic,
  heading = "Related reading",
  subheading,
  limit = 3,
  background = "white",
  testIdPrefix = "related-articles"
}) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get("/blog/posts", {
          params: { summary: true, limit: 24 }
        });
        if (cancelled) return;
        const all = response.data.map((post) => ({
          ...post,
          image: resolveApiAsset(post.featured_image || post.image)
        }));
        const wanted = categories.map((c) => c.toLowerCase());
        const matched = wanted.length
          ? all.filter((post) =>
              wanted.some((c) => (post.category || "").toLowerCase().includes(c))
            )
          : all;
        setPosts((matched.length ? matched : all).slice(0, limit));
      } catch {
        // A page should not break because the blog is unreachable.
        if (!cancelled) setPosts([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // `categories` is a literal array at every call site, so comparing its
    // contents keeps this from refetching on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join("|"), limit]);

  if (posts.length === 0) return null;

  const bgClass = background === "gray" ? "bg-gray-50" : "bg-white";

  return (
    <section
      className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <p className="section-label mb-3">Insights</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{subheading}</p>
            )}
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold shrink-0"
          >
            All articles
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              onClick={() => analytics.blogSolutionClick({ topic, post: post.slug })}
              className="card-interactive group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
              data-testid={`${testIdPrefix}-card-${post.slug}`}
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div
                  className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                {post.category && (
                  <span className="self-start text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                    {post.category}
                  </span>
                )}
                <h3 className="text-base font-semibold text-brand-dark group-hover:text-blue-700 leading-snug">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  Read the article
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
