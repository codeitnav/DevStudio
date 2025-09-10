"use client"

import type React from "react"
import { Code, Users, Zap, GitBranch, MessageSquare, Shield } from "lucide-react"
import Button from "./ui/Button"

interface HeroSectionProps {
  onGetStarted: () => void
  onLearnMore?: () => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onLearnMore }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Real-time Collaboration
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Code Together, <span className="text-primary">Innovate Faster</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl">
              Experience seamless real-time collaboration with DevStudio's cutting-edge tools. Write, edit, and debug
              code together with your team in a powerful, synchronized environment.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2 text-primary" />
                Multi-user Editing
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                Integrated Chat
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <GitBranch className="w-4 h-4 mr-2 text-primary" />
                Version Control
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Secure Workspaces
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start Coding Now
              </Button>
              {onLearnMore && (
                <Button variant="outline" size="lg" onClick={onLearnMore}>
                  Learn More
                </Button>
              )}
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            {/* Code Editor Mockup */}
            <div className="bg-card border rounded-lg shadow-2xl overflow-hidden">
              {/* Editor Header */}
              <div className="bg-muted px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-muted-foreground">main.js</div>
              </div>

              {/* Editor Content */}
              <div className="p-4 font-mono text-sm bg-card">
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    <span className="text-blue-500">function</span> <span className="text-yellow-500">collaborate</span>
                    () {"{"}
                  </div>
                  <div className="pl-4 text-muted-foreground">
                    <span className="text-green-500">// Real-time editing</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-blue-500">const</span> <span className="text-white">editor</span> =
                    <span className="text-orange-500"> new</span> <span className="text-yellow-500">DevStudio</span>();
                  </div>
                  <div className="pl-4">
                    editor.<span className="text-yellow-500">sync</span>();
                  </div>
                  <div className="text-muted-foreground">{"}"}</div>
                </div>
              </div>

              {/* Collaboration Indicators */}
              <div className="absolute top-16 right-4 flex space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">A</span>
                </div>
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-white font-medium">B</span>
                </div>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-white font-medium">C</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 bg-primary/10 backdrop-blur-sm rounded-lg p-3">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-green-500/10 backdrop-blur-sm rounded-lg p-3">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
