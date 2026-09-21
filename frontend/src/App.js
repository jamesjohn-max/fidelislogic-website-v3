import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "motion/react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home";
import { Solutions } from "./pages/Solutions";
import { Services } from "./pages/Services";
import { ServiceDetail } from "./pages/ServiceDetail";
import { MeetingRooms } from "./pages/MeetingRooms";
import { RoomConfigurator } from "./pages/RoomConfigurator";
import { Headsets } from "./pages/Headsets";
import { WorkspaceExperience } from "./pages/WorkspaceExperience";
import { BusinessApps } from "./pages/BusinessApps";
import { ForOrganisations } from "./pages/ForOrganisations";
import { ForPartners } from "./pages/ForPartners";
import { CaseStudies } from "./pages/CaseStudies";
import { CaseStudyDetail } from "./pages/CaseStudyDetail";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { SmartDeals } from "./pages/SmartDeals";
import { DealPost } from "./pages/DealPost";
import { Brands } from "./pages/Brands";
import { BrandDetail } from "./pages/BrandDetail";
import { Contact } from "./pages/Contact";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminSelection } from "./pages/AdminSelection";
import { AdminDashboard } from "./pages/AdminDashboard";
import { BlogEditor } from "./pages/BlogEditor";
import { AdminDealsDashboard } from "./pages/AdminDealsDashboard";
import { DealEditor } from "./pages/DealEditor";
import { AdminFAQDashboard } from "./pages/AdminFAQDashboard";
import { AdminSiteDashboard } from "./pages/AdminSiteDashboard";
import { FAQEditor } from "./pages/FAQEditor";
import { FloatingDealsButton } from "./components/FloatingDealsButton";
import { FloatingConfiguratorButton } from "./components/FloatingConfiguratorButton";
import { CookieConsent } from "./components/CookieConsent";
import { Toaster } from "./components/ui/sonner";

// Suppress ResizeObserver errors (common React/Radix UI issue, doesn't affect functionality)
const suppressResizeObserverError = () => {
  const errorHandler = (event) => {
    if (
      event.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      event.message === 'ResizeObserver loop limit exceeded'
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };
  window.addEventListener('error', errorHandler);
};

suppressResizeObserverError();

// Layout wrapper for public pages
const PublicLayout = ({ children }) => (
  <>
    <Header />
    {children}
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <FloatingConfiguratorButton />
      <FloatingDealsButton />
    </div>
    <Footer />
  </>
);

function App() {
  return (
    <HelmetProvider>
      {/* reducedMotion="user": under the OS setting Motion drops transform and
          layout animation site-wide (fades still run). The looping Magic UI
          components handle the setting themselves — see components/magicui. */}
      <MotionConfig reducedMotion="user">
      <div className="App">
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/solutions" element={<PublicLayout><Solutions /></PublicLayout>} />
            <Route path="/solutions/meeting-rooms" element={<PublicLayout><MeetingRooms /></PublicLayout>} />
            {/* The Room Planner is the 3D one: every link on the site points
                here, and the 3D view is offered on the review step. The planner
                still opens on the 2D plan while the visitor works through the
                steps. */}
            <Route path="/tools/room-configurator" element={<PublicLayout><RoomConfigurator with3d /></PublicLayout>} />
            {/* The old v2 address, kept working for anyone who bookmarked or
                shared it while 3D was being built. */}
            <Route path="/tools/room-configurator-v2" element={<Navigate to="/tools/room-configurator" replace />} />
            <Route path="/solutions/headsets" element={<PublicLayout><Headsets /></PublicLayout>} />
            <Route path="/solutions/workspace-experience" element={<PublicLayout><WorkspaceExperience /></PublicLayout>} />
            <Route path="/solutions/business-apps" element={<PublicLayout><BusinessApps /></PublicLayout>} />
            <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
            <Route path="/services/:slug" element={<PublicLayout><ServiceDetail /></PublicLayout>} />
            {/* Audience journeys (blueprint section 6) */}
            <Route path="/for-organisations" element={<PublicLayout><ForOrganisations /></PublicLayout>} />
            <Route path="/for-partners" element={<PublicLayout><ForPartners /></PublicLayout>} />
            {/* Case-study library. Built and reachable, but noindex and absent
                from the nav and sitemap until the first approved case lands —
                see CASE_STUDIES_PUBLISHED in src/data/caseStudies.js. */}
            <Route path="/case-studies" element={<PublicLayout><CaseStudies /></PublicLayout>} />
            <Route path="/case-studies/:slug" element={<PublicLayout><CaseStudyDetail /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
            <Route path="/blog/:slug" element={<PublicLayout><BlogPost /></PublicLayout>} />
            <Route path="/deals" element={<PublicLayout><SmartDeals /></PublicLayout>} />
            <Route path="/deals/:slug" element={<PublicLayout><DealPost /></PublicLayout>} />
            <Route path="/brands" element={<PublicLayout><Brands /></PublicLayout>} />
            <Route path="/brands/:slug" element={<PublicLayout><BrandDetail /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            
            {/* Admin Routes (no header/footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminSelection />} />
            <Route path="/admin/blog" element={<AdminDashboard />} />
            <Route path="/admin/blog/new" element={<BlogEditor />} />
            <Route path="/admin/blog/edit/:id" element={<BlogEditor />} />
            <Route path="/admin/deals" element={<AdminDealsDashboard />} />
            <Route path="/admin/deals/new" element={<DealEditor />} />
            <Route path="/admin/deals/edit/:id" element={<DealEditor />} />
            <Route path="/admin/dashboard" element={<AdminSiteDashboard />} />
            <Route path="/admin/faqs" element={<AdminFAQDashboard />} />
            <Route path="/admin/faqs/new" element={<FAQEditor />} />
            <Route path="/admin/faqs/edit/:id" element={<FAQEditor />} />
          </Routes>
          <CookieConsent />
          <Toaster />
        </BrowserRouter>
      </div>
      </MotionConfig>
    </HelmetProvider>
  );
}

export default App;
