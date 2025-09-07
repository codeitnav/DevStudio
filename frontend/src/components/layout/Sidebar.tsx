import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Settings, FileText, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useResponsive } from '../../hooks/useResponsive'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresAuth: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, requiresAuth: true },
  { name: 'Rooms', href: '/rooms', icon: Users, requiresAuth: true },
  { name: 'Files', href: '/files', icon: FileText, requiresAuth: true },
  { name: 'Settings', href: '/settings', icon: Settings, requiresAuth: true },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { isMobile, isTablet } = useResponsive()

  const filteredNavigation = navigation.filter(item => 
    !item.requiresAuth || user
  )

  // Determine sidebar width based on screen size
  const sidebarWidth = isMobile ? 'w-64' : isTablet ? 'w-56' : 'w-64'

  return (
    <>
      {/* Mobile/Tablet overlay */}
      {isOpen && !isMobile && isTablet && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarWidth,
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile/Tablet header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 lg:hidden">
            <span className="text-lg font-semibold">Navigation</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-2"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
                    "touch-manipulation", // Better touch interaction
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info (mobile/tablet) */}
          {user && (isMobile || isTablet) && (
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}