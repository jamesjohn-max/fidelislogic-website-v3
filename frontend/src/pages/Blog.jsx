import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBand } from "../components/CtaBand";
import { seoConfig } from "../data/seoConfig";
import { priorityPillars } from "../data/pillars";
import { analytics } from "../lib/analytics";
import { ArrowRight, Loader2 } from "lucide-react";
import { api, resolveApiAsset } from "../lib/api";

// Category navigation is organised around the three priority pillars first,
// then practical guidance (blueprint section 9). The order is fixed; the
// categories themselves come from the posts, so a filter is never offered for
// a category with nothing in it, and a new category added in the admin still
// appears.
const CATEGORY_ORDER = [
  "Workspace Technology",
  "Meeting Rooms",
  "Business Applications",
  "Industry Insights",
  "Product Reviews",
  "Case Studies",
];

const orderCategories = (found) => {
  const known = CATEGORY_ORDER.filter((c) => found.has(c));
  const extra = [...found].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
  return ["All", ...known, ...extra];
};
export const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Card-sized records only: the full form inlines every post's base64
        // featured image and runs to tens of megabytes.
        const response = await api.get(`/blog/posts`, {
          params: { summary: true },
        });
        const apiPosts = response.data.map(post => ({
          ...post,
          image: resolveApiAsset(post.featured_image),
        }));
        setPosts(apiPosts);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = orderCategories(
    new Set(posts.map((post) => post.category).filter(Boolean))
  );

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.blog.title}
        description={seoConfig.blog.description}
        keywords={seoConfig.blog.keywords}
      />
      <Breadcrumbs items={[{ name: "Blog" }]} className="pt-24" />
      <PageHeader label="Resources" title="Insights & guidance">
        <p>
          Practical knowledge on modern workplace technology, vendor selection, and implementation best practices.
        </p>
      </PageHeader>

      {/* Categories Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts found in this category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="card-interactive h-full border-0">
                    <CardContent className="p-0">
                      {post.image ? (
                        <img
                          src={post.image}
                          // Decorative: the post title is the <h3> below.
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-48 object-cover rounded-t-2xl"
                        />
                      ) : (
                        <div
                          className="w-full h-48 rounded-t-2xl bg-gradient-to-br from-gray-100 to-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {typeof post.date === 'string' && post.date.includes('-') 
                              ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : post.date
                            }
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-brand-dark mb-3 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">{post.excerpt}</p>
                        <div className="flex items-center text-blue-600 font-medium text-sm">
                          Read More <ArrowRight className="ml-2" size={16} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contextual next steps: the solution pages these articles are about,
          rather than a generic promotional interruption. */}
      <section
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        data-testid="blog-next-steps"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="section-label mb-3">Where to next</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight leading-tight">
              Reading about a decision you are about to make?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {priorityPillars.map((pillar) => (
              <Link
                key={pillar.id}
                to={pillar.href}
                onClick={() =>
                  analytics.blogSolutionClick({ topic: pillar.id, location: "blog_hub" })
                }
                className="card-interactive group flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
                data-testid={`blog-next-${pillar.id}`}
              >
                <h3 className="text-base font-semibold text-brand-dark group-hover:text-blue-700 leading-snug">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                  {pillar.tagline}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  {pillar.ctaLabel}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Turn a question into a plan"
        location="blog_footer"
        ctaLabel="Book a Consultation"
        testId="blog-cta"
      >
        If an article raised a question about your own estate, a short call is usually the
        fastest way to answer it.
      </CtaBand>
    </div>
  );
};
