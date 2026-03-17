import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductPreview from "@/components/landing/ProductPreview";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import BackgroundSystem from "@/components/landing/BackgroundSystem";
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="relative min-h-screen bg-canvas-base overflow-hidden">
      <BackgroundSystem />

      {/* Content overlay */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HowItWorks />
        <ProductPreview />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}
