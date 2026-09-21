import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { CtaBand } from "../components/CtaBand";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowRight, Loader2, Clock, Tag, ExternalLink } from "lucide-react";
import { api, resolveApiAsset } from "../lib/api";
import { analytics } from "../lib/analytics";
export const SmartDeals = () => {
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await api.get(`/deals`);
        setDeals(response.data);
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // Get unique brands from deals
  const brands = ["All", ...new Set(deals.map(deal => deal.brand).filter(Boolean))];

  const filteredDeals = selectedBrand === "All"
    ? deals
    : deals.filter((deal) => deal.brand === selectedBrand);

  // Check if a deal is expired
  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  // Check if a deal is active (started and not expired)
  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  // Check if deal hasn't started yet
  const isUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  // Format date for display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Smart Deals | Best IT Technology Deals"
        description="Discover the best deals on IT solutions, meeting room technology, enterprise headsets, and business applications from top brands."
        keywords="IT deals, technology discounts, meeting room deals, enterprise headset offers, business software deals"
      />

      <Breadcrumbs items={[{ name: "Smart Deals" }]} className="pt-24" />

      <PageHeader label="Resources" title="Smart Deals">
        <p>
          Current promotions on meeting room systems, headsets and software from the
          brands we work with. Each deal shows the period it runs for, and every deal
          here applies to the UAE and GCC unless its own page says otherwise.
        </p>
        {/* Blueprint section 9: deals must not read as the reason behind an
            advisory recommendation. */}
        <p className="text-base text-gray-500">
          Deals are a separate commercial offer. Our recommendations are made on fit,
          and a promotion is never the reason we put something forward.
        </p>
      </PageHeader>

      {/* Brand Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedBrand === brand
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Deals Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No deals found in this category.</p>
              <p className="text-gray-500 mt-2">Check back soon for new offers!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDeals.map((deal) => {
                const expired = isExpired(deal.end_date);
                const active = isActive(deal.start_date, deal.end_date);
                const upcoming = isUpcoming(deal.start_date);
                const daysLeft = getDaysRemaining(deal.end_date);

                return (
                  <Link 
                    key={deal.id} 
                    to={`/deals/${deal.slug}`}
                    className={expired ? "pointer-events-auto" : ""}
                  >
                    <Card className={`h-full border-0 ${
                      expired 
                        ? "opacity-60 grayscale hover:opacity-70" 
                        : "card-interactive"
                    }`}>
                      <CardContent className="p-0 relative">
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          {expired && (
                            <Badge className="bg-gray-800 text-white">
                              Expired
                            </Badge>
                          )}
                          {upcoming && (
                            <Badge className="bg-blue-600 text-white">
                              Coming Soon
                            </Badge>
                          )}
                          {active && daysLeft <= 7 && (
                            <Badge className="bg-red-600 text-white">
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left!
                            </Badge>
                          )}
                        </div>

                        {/* Image */}
                        <div className={`relative ${expired ? "grayscale" : ""}`}>
                          <img
                            src={resolveApiAsset(deal.featured_image) || "/img/social/og-home.jpg"}
                            alt={deal.title}
                            className="w-full h-48 object-cover rounded-t-2xl"
                          />
                          {deal.deal_url && !expired && (
                            <div className="absolute top-3 right-3">
                              <span className="bg-white/90 p-1.5 rounded-full inline-block">
                                <ExternalLink size={14} className="text-blue-600" />
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          {/* Brand & Dates */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                              expired 
                                ? "bg-gray-100 text-gray-500"
                                : "bg-blue-50 text-blue-600"
                            }`}>
                              {deal.brand}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${
                              expired ? "text-gray-400" : "text-gray-500"
                            }`}>
                              <Clock size={12} />
                              {expired 
                                ? `Ended ${formatDate(deal.end_date)}`
                                : `Ends ${formatDate(deal.end_date)}`
                              }
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className={`text-xl font-semibold mb-3 leading-snug ${
                            expired ? "text-gray-500" : "text-gray-900"
                          }`}>
                            {deal.title}
                          </h3>

                          {/* Excerpt */}
                          <p className={`leading-relaxed mb-4 line-clamp-2 ${
                            expired ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {deal.excerpt}
                          </p>

                          {/* CTA */}
                          <div className={`flex items-center font-medium text-sm ${
                            expired ? "text-gray-400" : "text-blue-600"
                          }`}>
                            {expired ? "View Details" : "View Deal"} 
                            <ArrowRight className="ml-2" size={16} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Deal enquiries are tracked separately from advisory enquiries so a
          promotion never inflates the advisory numbers (blueprint section 13). */}
      <CtaBand
        title="Ask about a deal"
        location="deals_footer"
        ctaLabel="Enquire about a deal"
        onClick={() => analytics.dealEnquiryClick({ location: "deals_footer" })}
        secondary={{ label: "Get independent advice instead", href: "/solutions", testId: "deals-cta-solutions" }}
        testId="deals-cta"
      >
        Tell us which deal you are looking at and how many you need, and we will confirm
        availability and what it actually includes.
      </CtaBand>
    </div>
  );
};
