import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}