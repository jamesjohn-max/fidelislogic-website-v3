import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowLeft, Calendar, Tag, Clock, ExternalLink, Loader2, AlertCircle, Globe2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { api, resolveApiAsset } from "../lib/api";
import { analytics } from "../lib/analytics";
import { hasPrerenderedSchema } from "../lib/prerenderedSchema";
export const DealPost = () => {
  const { slug } = useParams();
  const [deal, setDeal] = useState(null);
  const [relatedDeals, setRelatedDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await api.get(`/deals`);
        const allDeals = response.data;
        const foundDeal = allDeals.find((d) => d.slug === slug);
        
        if (foundDeal) {
          setDeal(foundDeal);
          const related = allDeals
            .filter((d) => d.brand === foundDeal.brand && d.id !== foundDeal.id)
            .slice(0, 3);
          setRelatedDeals(related);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeal();
  }, [slug]);

  // Check if a deal is expired
  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  // Check if a deal is active
  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  // Check if deal hasn't started yet
  const isUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen pt-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Deal not found</h1>
          <Link to="/deals">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Back to Deals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const expired = isExpired(deal.end_date);
  const active = isActive(deal.start_date, deal.end_date);
  const upcoming = isUpcoming(deal.start_date);
  const daysLeft = getDaysRemaining(deal.end_date);
  const img = resolveApiAsset(deal.featured_image) || "/img/social/og-home.jpg";
  const pageUrl = `${window.location.origin}/deals/${slug}`;

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": deal.seo_title || deal.title,
    "description": deal.seo_description || deal.excerpt,
    "image": img,
    "validFrom": deal.start_date,
    "validThrough": deal.end_date,
    "seller": { "@type": "Organization", "name": "Fidelis Logic LLC" }
  };

  return (
    <div className={`min-h-screen ${expired ? "bg-gray-50" : ""}`}>
      <Helmet>
        <title>{deal.seo_title || deal.title} | Smart Deals - Fidelis Logic</title>
        <meta name="description" content={deal.seo_description || deal.excerpt} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={deal.seo_title || deal.title} />
        <meta property="og:description" content={deal.seo_description || deal.excerpt} />
        <meta property="og:image" content={img} />
        <meta property="og:type" content="product" />
        {!hasPrerenderedSchema("Offer") && (
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        )}
      </Helmet>

      <Breadcrumbs
        items={[
          { name: "Smart Deals", href: "/deals" },
          { name: deal.title }
        ]}
        className="pt-24"
      />

      <section className="pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/deals">
            <Button variant="outline" className="mb-8">
              <ArrowLeft className="mr-2" size={18} />
              Back to Deals
            </Button>
          </Link>

          {/* Status Banner */}
          {expired && (
            <div className="bg-gray-800 text-white rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle size={24} />
              <div>
                <p className="font-semibold">This deal has expired</p>
                <p className="text-sm text-gray-300">This offer ended on {formatDate(deal.end_date)}</p>
              </div>
            </div>
          )}

          {upcoming && (
            <div className="bg-blue-600 text-white rounded-xl p-4 mb-6 flex items-center gap-3">
              <Clock size={24} />
              <div>
                <p className="font-semibold">Coming Soon!</p>
                <p className="text-sm text-blue-100">This deal starts on {formatDate(deal.start_date)}</p>
              </div>
            </div>
          )}

          {active && daysLeft <= 7 && (
            <div className="bg-red-600 text-white rounded-xl p-4 mb-6 flex items-center gap-3">
              <Clock size={24} />
              <div>
                <p className="font-semibold">Hurry! Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left!</p>
                <p className="text-sm text-red-100">This offer ends on {formatDate(deal.end_date)}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge className={`text-sm font-medium px-4 py-2 ${
              expired 
                ? "bg-gray-200 text-gray-600"
                : "bg-blue-100 text-blue-700"
            }`}>
              <Tag className="mr-2" size={16} />
              {deal.brand}
            </Badge>
            <span className={`text-sm flex items-center ${expired ? "text-gray-400" : "text-gray-500"}`}>
              <Calendar className="mr-2" size={16} />
              Valid {formatDate(deal.start_date)} – {formatDate(deal.end_date)}
            </span>
            {/* Applicable geography, stated on every deal (blueprint section 9).
                A deal that applies somewhere else says so in its own content. */}
            <span className={`text-sm flex items-center ${expired ? "text-gray-400" : "text-gray-500"}`}>
              <Globe2 className="mr-2" size={16} aria-hidden="true" />
              Available in the UAE and GCC
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${expired ? "text-gray-500" : "text-gray-900"}`}>
            {deal.title}
          </h1>
          <p className={`text-xl ${expired ? "text-gray-400" : "text-gray-600"}`}>{deal.excerpt}</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-5xl mx-auto">
          <img 
            src={img} 
            alt={deal.title} 
            className={`w-full h-full object-cover rounded-2xl shadow-2xl ${expired ? "grayscale opacity-70" : ""}`} 
          />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <article 
            className={`prose prose-lg max-w-none ${expired ? "opacity-70" : ""}`}
            dangerouslySetInnerHTML={{ __html: deal.content }}
          />

          {/* Deal CTA Box */}
          {!expired && deal.deal_url && (
            <div className="bg-blue-50 rounded-2xl p-8 mt-12 border-2 border-blue-200">
              <h3 className="text-2xl font-bold mb-4 text-blue-800">Ready to save?</h3>
              <p className="text-gray-700 mb-6">Click below to access this exclusive deal.</p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <a
                  href={deal.deal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analytics.dealEnquiryClick({ deal: deal.slug, kind: "external" })}
                >
                  Get This Deal
                  <ExternalLink className="ml-2" size={18} />
                </a>
              </Button>
            </div>
          )}

          {expired && (
            <div className="bg-gray-100 rounded-2xl p-8 mt-12">
              <h3 className="text-2xl font-bold mb-4 text-gray-600">This deal has expired</h3>
              <p className="text-gray-500 mb-6">Check out our other active deals for great savings.</p>
              <Link to="/deals">
                <Button className="bg-gray-600 hover:bg-gray-700 text-white">Browse Active Deals</Button>
              </Link>
            </div>
          )}

          {!expired && !deal.deal_url && (
            <div className="bg-blue-50 rounded-2xl p-8 mt-12">
              <h3 className="text-2xl font-bold mb-4">Interested in this deal?</h3>
              <p className="text-gray-700 mb-6">Contact us for more information on how to access this offer.</p>
              <Link
                to="/contact"
                onClick={() => analytics.dealEnquiryClick({ deal: deal.slug, kind: "enquiry" })}
              >
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Ask About This Deal</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {relatedDeals.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 tracking-tight">More deals from {deal.brand}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedDeals.map((rd) => {
                const rdExpired = isExpired(rd.end_date);
                return (
                  <Link key={rd.id} to={`/deals/${rd.slug}`}>
                    <div className={`card-interactive bg-white rounded-2xl shadow-lg overflow-hidden ${
                      rdExpired ? "opacity-60 grayscale" : ""
                    }`}>
                      <div className="relative">
                        <img 
                          src={resolveApiAsset(rd.featured_image) || "/img/social/og-home.jpg"} 
                          alt={rd.title} 
                          className="w-full h-48 object-cover" 
                        />
                        {rdExpired && (
                          <Badge className="absolute top-3 left-3 bg-gray-800 text-white">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="p-6">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          rdExpired ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                        }`}>
                          {rd.brand}
                        </span>
                        <h3 className={`text-lg font-semibold mt-3 mb-2 ${rdExpired ? "text-gray-500" : ""}`}>
                          {rd.title}
                        </h3>
                        <p className={`text-sm ${rdExpired ? "text-gray-400" : "text-gray-600"}`}>
                          {rd.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
