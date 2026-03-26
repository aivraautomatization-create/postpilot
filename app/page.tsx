import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";

export const metadata: Metadata = {
  title: "Puls — AI Social Media Content Generator",
  description:
    "Generate weeks of engaging social media posts in minutes. AI-powered content creation, scheduling, and auto-publishing for Instagram, LinkedIn, TikTok, and X.",
  alternates: { canonical: "https://puls.work" },
  openGraph: {
    url: "https://puls.work",
    title: "Puls — AI Social Media Content Generator",
    description:
      "Generate weeks of engaging social media posts in minutes. 14-day free trial, no credit card required.",
  },
};
import HowItWorks from "@/components/landing/HowItWorks";
import ProductPreview from "@/components/landing/ProductPreview";
import TryItNow from "@/components/landing/TryItNow";
import ROICalculator from "@/components/landing/ROICalculator";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import Results from "@/components/landing/Results";
import ComparisonTable from "@/components/landing/ComparisonTable";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Footer from "@/components/landing/Footer";
import BackgroundSystem from "@/components/landing/BackgroundSystem";
import ExitIntentModal from "@/components/landing/ExitIntentModal";
import SocialProofBar from "@/components/landing/SocialProofBar";
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirect('/dashboard');
    }
  }

  // JSON-LD structured data for Google rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Puls",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://puls.work",
        description:
          "AI-powered social media content generator. Create, schedule, and publish posts to Instagram, LinkedIn, TikTok, Facebook, and X in minutes.",
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "15",
          highPrice: "78",
          priceCurrency: "USD",
          offerCount: "3",
        },
        featureList: [
          "AI post generation",
          "Multi-platform publishing",
          "Content calendar",
          "Brand voice learning",
          "Video creation",
          "Analytics & insights",
        ],
      },
      {
        "@type": "Organization",
        name: "Puls",
        url: "https://puls.work",
        logo: "https://puls.work/icon.svg",
        sameAs: ["https://twitter.com/pulswork"],
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-[#0F1115] overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundSystem />

      {/* Content overlay */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <SocialProofBar />
        <HowItWorks />
        <DashboardPreview />
        <ProductPreview />
        <TryItNow />
        <Testimonials />
        <Results />
        <ROICalculator />
        <ComparisonTable />
        <Pricing />
        <Footer />
      </div>

      <ExitIntentModal />
    </div>
  );
}
