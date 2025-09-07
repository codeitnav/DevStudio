import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { Dashboard, NotFound } from '../../pages'
import { MainLayout } from '../../components/layout'
import { AuthGuard } from '../../components/auth'

// Mock the AuthContext with a logged-in user
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('Router Configuration', () => {
  it('renders dashboard for authenticated user at root path', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />
          }
        ]
      }
    ], {
      initialEntries: ['/']
    })

    render(
      <MockAuthProvider>
        <RouterProvider router={router} />
      </MockAuthProvider>
    )

    // Should render dashboard content
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('renders 404 page for unknown routes', () => {
    const router = createMemoryRouter([
      {
        path: '*',
        element: <NotFound />
      }
    ], {
      initialEntries: ['/unknown-route']
    })

    render(
      <MockAuthProvider>
        <RouterProvider router={router} />
      </MockAuthProvider>
    )

    // Should render 404 page
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
  })
})