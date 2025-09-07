import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { MainLayout } from '../MainLayout'
import { AuthProvider } from '../../../contexts/AuthContext'

// Mock the AuthContext
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  )
}

describe('MainLayout', () => {
  it('renders header and main content area', () => {
    renderWithRouter(<MainLayout />)
    
    // Check if DevStudio logo/title is present
    expect(screen.getByText('DevStudio')).toBeInTheDocument()
    
    // Check if navigation elements are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Rooms')).toBeInTheDocument()
  })

  it('renders sidebar navigation', () => {
    renderWithRouter(<MainLayout />)
    
    // Check if sidebar navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Rooms')).toBeInTheDocument()
    expect(screen.getByText('Files')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})