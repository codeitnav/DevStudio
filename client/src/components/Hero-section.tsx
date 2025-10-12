"use client";

import { useState, useEffect } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Call backend logout endpoint to blacklist token
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        
        // Redirect to login or home
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout locally even if API fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      router.push("/");
    }
  };

  return (
    <section
      id="home"
      className="min-h-screen bg-white relative overflow-hidden flex items-center w-full mt-10 sm:mt-0 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 py-6 sm:py-16 lg:py-24"
    >
      {/* Logout Button - Top Right */}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 md:top-10 md:right-10 lg:top-12 lg:right-12 z-20 group bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      )}

      <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center mt-16">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Main Headline */}
          <h1 className="mt-4 md:-mt-4 lg:-mt-6 text-5xl sm:text-5xl md:text-5xl lg:text-5xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2 sm:px-0 mx-auto text-center">
            Team Coding, Simplified
            <br />
            <span className="bg-gradient-to-r from-[#166EC1] via-[#166EC1] to-[#166EC1] bg-clip-text text-transparent">
              Scalable & interactive
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-1xl text-gray-700 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
            Build smarter with DevStudio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-16 px-4 sm:px-0">
            <button
              onClick={() => setShowContactForm(true)}
              className="group bg-[#396DDD] hover:bg-[#2e56b0] text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Get Free Demo</span>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
