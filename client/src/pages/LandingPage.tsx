import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Code, Users, LogIn, UserPlus } from "lucide-react"
import HeroSection from "../components/HeroSection"
import Button from "../components/ui/Button"

const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate("/register")
  }

  const handleLearnMore = () => {
    // Scroll to features section or navigate to about page
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">DevStudio</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" icon={LogIn}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button icon={UserPlus}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Built for Modern Development Teams</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              DevStudio provides everything you need for seamless collaborative coding, from real-time editing to
              integrated communication tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Collaboration</h3>
              <p className="text-muted-foreground">
                Edit code simultaneously with your team members and see changes instantly.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Monaco Editor</h3>
              <p className="text-muted-foreground">
                Powered by VS Code's editor with syntax highlighting and IntelliSense.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Organize your projects and manage team access with granular permissions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
