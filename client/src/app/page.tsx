import  HeroSection  from "@/components/Hero-section";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
