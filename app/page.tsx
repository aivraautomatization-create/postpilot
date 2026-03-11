import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductPreview from "@/components/landing/ProductPreview";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Full-page background video */}
      <video
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-60"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="https://s3.amazonaws.com/webflow-prod-assets/69a9f01be85c61dc8d88d4ae/69a9f01ce85c61dc8d88d684_Video%20home%2022.mp4" type="video/mp4" />
      </video>

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
