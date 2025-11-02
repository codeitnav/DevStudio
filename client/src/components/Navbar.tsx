"use client"

import { useState, useEffect, useMemo } from "react"
import { Menu, X, Sparkles } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

interface NavItem {
  name: string
  href: string
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const navItems: NavItem[] = useMemo(
    () => [
      { name: "Home", href: "#home" },
      { name: "About", href: "#about" },
      { name: "Dashboard", href: "/dashboard" },
    ],
    []
  )

  const handleLogin = () => {
    setIsMobileMenuOpen(false)
    router.push("/login")
  }

  const handleSignup = () => {
    setIsMobileMenuOpen(false)
    router.push("/signup")
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-50% 0px -50% 0px" }
    )

    navItems.forEach((item) => {
      if (item.href.startsWith("#")) {
        const element = document.getElementById(item.href.substring(1))
        if (element) observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [navItems])

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false)
    if (href.startsWith("/")) {
      router.push(href)
    } else {
      const element = document.querySelector(href)
      if (element) element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-gradient-to-b from-[#166EC1]/30 to-[#166EC1]/10 backdrop-blur-2xl border-b border-white/20 shadow-2xl"
          : "bg-transparent border-b border-transparent"
      } ${isScrolled ? "py-2" : "py-4"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 group cursor-pointer">
            <Image
              src="/logo.png"
              alt="DevStudio Logo"
              width={50}
              height={40}
              className="object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-baseline space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                    activeSection === item.href.substring(1)
                      ? "bg-white/15 text-white"
                      : "text-gray-200 hover:text-white"
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#166EC1] to-blue-400 transition-all duration-300 ${
                      activeSection === item.href.substring(1)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            {user ? (
              <>
                <span className="text-white font-medium text-xs sm:text-sm hidden xs:block lg:block">
                  Welcome, {user.username}
                </span>
                <button
                  onClick={logout}
                  className="hidden sm:block bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-red-600 transition-all duration-300 hover:shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={handleLogin}
                  className="text-white/80 hover:text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="bg-gradient-to-r from-[#166EC1] to-blue-600 text-white px-6 py-2 text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Sign Up
                </button>
              </div>
            )}
            <div className="lg:hidden w-fit">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 px-2 pt-2 pb-3 space-y-3 sm:px-3 bg-black/40 backdrop-blur-lg rounded-lg border border-white/10 mx-2">
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
          <div className="border-t border-white/20 pt-4 mt-4">
            {user ? (
              <div className="space-y-2">
                <div className="text-white font-medium text-sm px-3 py-2">
                  Welcome, {user.username}
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white w-full px-4 py-2 text-sm font-semibold rounded-lg hover:bg-red-600 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleLogin}
                  className="text-white/80 w-full hover:text-white px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="bg-gradient-to-r from-[#166EC1] to-blue-600 w-full text-white px-4 py-2 text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar