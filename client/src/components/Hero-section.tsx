"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Modal from "./ui/Modal";
import JoinOrCreateForm from "./ui/JoinOrCreateForm";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const handleStartCollaborating = () => {
    if (user) {
        setFormModalOpen(true);
    } else {
        // If you want to force login before creating/joining a room.
        // You could open the login modal from the Navbar here.
        // For simplicity, this example will let anyone open the form.
        setFormModalOpen(true); 
    }
  };

  return (
    <>
      <section
        id="home"
        className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center w-full px-4 sm:px-6 lg:px-20"
      >
        <div className="relative z-10 text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Team Coding, Simplified
              <br />
              <span className="bg-gradient-to-r from-[#166EC1] to-[#145ca5] bg-clip-text text-transparent">
                Scalable & Interactive
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Build smarter with DevStudio. The real-time collaborative code editor for modern development teams.
            </p>

            <div className="flex justify-center">
              <button
                onClick={handleStartCollaborating}
                className="group bg-[#166EC1] hover:bg-[#145ca5] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Start Collaborating</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)}>
        <JoinOrCreateForm />
      </Modal>
    </>
  );
};

export default HeroSection;