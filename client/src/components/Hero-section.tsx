"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Loader2, Zap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import Modal from "./ui/Modal"
import JoinOrCreateForm from "./ui/JoinOrCreateForm"
import { useRouter } from "next/navigation"

const HeroSection = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const { user, loginAsGuest } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleStartCollaborating = () => {
    if (!user) {
      router.push("/signup")
    } else {
      setFormModalOpen(true)
    }
  }

  const handleGetDemo = async () => {
    setIsDemoLoading(true)
    try {
      if (loginAsGuest) {
        await loginAsGuest()
        setFormModalOpen(true)
      } else {
        console.error("Guest login functionality is not available.")
      }
    } catch (error) {
      console.error("Guest login failed:", error)
    } finally {
      setIsDemoLoading(false)
    }
  }

  return (
    <>
      <section
        id="home"
        className="min-h-screen relative overflow-hidden flex items-center justify-center w-full 
                   px-4 sm:px-6 lg:px-20 
                   bg-gradient-to-b from-gray-50 via-gray-50 to-white text-gray-900 
                   dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-black dark:text-gray-100 transition-colors duration-500"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 left-10 w-96 h-96 bg-[#166EC1]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center max-w-4xl w-full">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Team Coding,{" "}
              <span className="bg-gradient-to-r from-[#166EC1] via-blue-500 to-blue-600 bg-clip-text text-transparent animate-pulse">
                Simplified
              </span>
              <br />
              <span className="text-gray-600 dark:text-gray-300 text-3xl sm:text-4xl md:text-5xl">
                Scalable & Interactive
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto px-2 leading-relaxed">
              Build smarter with DevStudio — the real-time collaborative code editor for modern development teams.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
              <button
                onClick={handleStartCollaborating}
                className="group w-full sm:w-auto bg-gradient-to-r from-[#166EC1] to-blue-600 hover:from-[#145ba3] hover:to-blue-700
                           text-white px-6 sm:px-10 py-3 sm:py-4 rounded-lg 
                           font-semibold text-base sm:text-lg 
                           transition-all duration-300 hover:scale-105 
                           hover:shadow-2xl flex items-center justify-center space-x-2
                           border border-blue-400/30"
              >
                <span>Start Collaborating</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleGetDemo}
                disabled={isDemoLoading}
                className="group w-full sm:w-auto 
                           bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white 
                           dark:bg-white/10 dark:hover:bg-white/20
                           border border-gray-300/30 dark:border-white/20
                           px-6 sm:px-10 py-3 sm:py-4 rounded-lg 
                           font-semibold text-base sm:text-lg 
                           transition-all duration-300 hover:scale-105 hover:shadow-xl 
                           flex items-center justify-center 
                           disabled:opacity-60 disabled:cursor-wait"
              >
                {isDemoLoading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                <span>Get a Demo</span>
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200/30 dark:border-white/10">
            </div>
          </div>
        </div>
      </section>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)}>
        <JoinOrCreateForm />
      </Modal>
    </>
  )
}

export default HeroSection