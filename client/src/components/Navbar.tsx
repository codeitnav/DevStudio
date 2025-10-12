"use client";

import { useState, useEffect, useMemo } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Modal from "./ui/Modal";
import LoginForm from "./ui/LoginForm";
import SignupForm from "./ui/SignupForm";

interface NavItem {
  name: string;
  href: string;
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const navItems: NavItem[] = useMemo(() => [
        { name: "Home", href: "#home" },
        { name: "Services", href: "#services" },
        { name: "Expertise", href: "#expertise" },
        { name: "Resources", href: "#resources" },
    ], []);

    useEffect(() => {
      if (user) {
        setLoginModalOpen(false);
        setSignupModalOpen(false);
      }
    }, [user]);

    const handleOpenLogin = () => {
        setSignupModalOpen(false);
        setLoginModalOpen(true);
    };

    const handleOpenSignup = () => {
        setLoginModalOpen(false);
        setSignupModalOpen(true);
    };

    const handleCloseModals = () => {
        setLoginModalOpen(false);
        setSignupModalOpen(false);
    };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActiveSection(entry.target.id);
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" });

    navItems.forEach(item => {
        const element = document.getElementById(item.href.substring(1));
        if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#166EC1]/20 backdrop-blur-xl border-b border-white/30 shadow-lg"
            : "bg-transparent border-b border-transparent"
        } ${isScrolled ? "py-2" : "py-4"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Image src="/logo.png" alt="DevStudio Logo" width={150} height={40} className="object-contain" />
            </div>

            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === item.href.substring(1)
                        ? "bg-white/10 text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                 <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-sm hidden sm:block">Welcome, {user.username}</span>
                    <button
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-full hover:bg-red-600 transition-all"
                    >
                        Logout
                    </button>
                 </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-2">
                    <button
                        onClick={handleOpenLogin}
                        className="text-white/80 hover:text-white px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/10 transition-all"
                    >
                        Login
                    </button>
                    <button
                        onClick={handleOpenSignup}
                        className="bg-white/90 text-[#166EC1] px-4 py-2 text-sm font-semibold rounded-full hover:bg-white transition-all shadow-md"
                    >
                        Sign Up
                    </button>
                </div>
              )}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/20 backdrop-blur-lg rounded-lg">
             {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeSection === item.href.substring(1)
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.name}
              </button>
            ))}
             <div className="border-t border-white/20 pt-4 mt-4 flex items-center justify-center space-x-2">
                {user ? (
                    <button
                        onClick={logout}
                        className="bg-red-500 text-white w-full px-4 py-2 text-sm font-semibold rounded-full hover:bg-red-600 transition-all"
                    >
                        Logout
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleOpenLogin}
                            className="text-white/80 w-full hover:text-white px-4 py-2 text-sm font-semibold rounded-full bg-white/10 transition-all"
                        >
                            Login
                        </button>
                        <button
                            onClick={handleOpenSignup}
                            className="bg-white/90 w-full text-[#166EC1] px-4 py-2 text-sm font-semibold rounded-full hover:bg-white transition-all"
                        >
                            Sign Up
                        </button>
                    </>
                )}
            </div>
          </div>
        )}
      </nav>

        <Modal isOpen={isLoginModalOpen} onClose={handleCloseModals}>
            <LoginForm onSwitchToSignup={handleOpenSignup} />
        </Modal>

        <Modal isOpen={isSignupModalOpen} onClose={handleCloseModals}>
            <SignupForm onSwitchToLogin={handleOpenLogin} />
        </Modal>
    </>
  );
};

export default Navbar;