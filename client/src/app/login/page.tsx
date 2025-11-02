"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import LoginForm from "@/components/ui/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#166EC1] hover:text-[#145ca5] transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your DevStudio account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <LoginForm onSwitchToSignup={() => {}} />
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#166EC1] hover:text-[#145ca5] font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}