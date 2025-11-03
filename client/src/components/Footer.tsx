"use client"
import type React from "react"
import { motion } from "framer-motion"
import { Github, Linkedin, Mail, Heart, ArrowUp } from "lucide-react"

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 relative">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">DevStudio</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Real-time collaborative editor</p>
            </div>

            <div className="hidden md:block h-8 w-px bg-gray-300 dark:bg-gray-700" />

            <div className="flex gap-4">
              {[
                { Icon: Github, href: "https://github.com/codeitnav", label: "GitHub" },
                { Icon: Linkedin, href: "https://www.linkedin.com/in/navya-srivastava2810/", label: "LinkedIn" },
                { Icon: Mail, href: "mailto:navya.srivas03@gmail.com", label: "Email" },
              ].map(({ Icon, href, label }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-300 group"
                  title={label}
                >
                  <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 transition-all"
          >
            <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
          </motion.button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-xs text-gray-600 dark:text-gray-500 text-center flex items-center justify-center gap-1"
        >
          Made with <Heart className="h-3 w-3 text-red-500" /> (and coffee) by Navya
          <span className="mx-2 hidden sm:inline">•</span>
          <span className="block sm:inline">&copy; 2025 All rights reserved</span>
        </motion.p>
      </div>
    </footer>
  )
}

export default Footer
