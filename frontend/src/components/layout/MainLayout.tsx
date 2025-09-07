import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useResponsive } from '../../hooks/useResponsive'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isMobile, isDesktop } = useResponsive()

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true)
    }
  }, [isDesktop])

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={handleMenuToggle} showMenuButton />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}