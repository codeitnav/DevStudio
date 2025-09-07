/**
 * Demo component to verify routing implementation
 * This can be used to test the routing structure manually
 */

import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function RoutingDemo() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Routing Demo</h1>
      <p>Test the navigation between different routes:</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link to="/">
          <Button className="w-full">Dashboard</Button>
        </Link>
        <Link to="/rooms">
          <Button className="w-full">Rooms</Button>
        </Link>
        <Link to="/room/demo-room">
          <Button className="w-full">Demo Room</Button>
        </Link>
        <Link to="/auth/login">
          <Button variant="outline" className="w-full">Login</Button>
        </Link>
        <Link to="/auth/register">
          <Button variant="outline" className="w-full">Register</Button>
        </Link>
        <Link to="/nonexistent">
          <Button variant="outline" className="w-full">404 Test</Button>
        </Link>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Routing Features Implemented:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ React Router v6 with nested routes</li>
          <li>✅ Protected routes with AuthGuard</li>
          <li>✅ Public authentication routes</li>
          <li>✅ Responsive navigation (Header + Sidebar)</li>
          <li>✅ Mobile-friendly navigation with collapsible sidebar</li>
          <li>✅ Route-based layouts (MainLayout, AuthLayout)</li>
          <li>✅ 404 error handling</li>
          <li>✅ Legacy route redirects</li>
        </ul>
      </div>
    </div>
  )
}