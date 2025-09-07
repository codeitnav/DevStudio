import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import { LazyWrapper } from '../components/common/LazyWrapper'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

// Lazy load layout components
const MainLayout = lazy(() => import('../components/layout/MainLayout').then(module => ({ default: module.MainLayout })))
const AuthLayout = lazy(() => import('../components/layout/AuthLayout').then(module => ({ default: module.AuthLayout })))

// Lazy load auth components  
const AuthGuard = lazy(() => import('../components/auth/AuthGuard').then(module => ({ default: module.AuthGuard })))
const LoginForm = lazy(() => import('../components/auth/LoginForm').then(module => ({ default: module.LoginForm })))
const RegisterForm = lazy(() => import('../components/auth/RegisterForm').then(module => ({ default: module.RegisterForm })))
const ForgotPasswordForm = lazy(() => import('../components/auth/ForgotPasswordForm').then(module => ({ default: module.ForgotPasswordForm })))
const ResetPasswordForm = lazy(() => import('../components/auth/ResetPasswordForm').then(module => ({ default: module.ResetPasswordForm })))

// Lazy load page components
const Dashboard = lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Rooms = lazy(() => import('../pages/Rooms').then(module => ({ default: module.Rooms })))
const Room = lazy(() => import('../pages/Room').then(module => ({ default: module.Room })))
const Profile = lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })))
const NotFound = lazy(() => import('../pages/NotFound').then(module => ({ default: module.NotFound })))


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LazyWrapper fallback={<PageLoader />}>
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <Dashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'rooms',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <Rooms />
          </LazyWrapper>
        )
      },
      {
        path: 'room/:roomId',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <Room />
          </LazyWrapper>
        )
      },
      {
        path: 'files',
        element: <div className="p-6">Files page - Coming soon</div>
      },
      {
        path: 'settings',
        element: <div className="p-6">Settings page - Coming soon</div>
      },
      {
        path: 'profile',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <Profile />
          </LazyWrapper>
        )
      }
    ]
  },
  {
    path: '/auth',
    element: (
      <LazyWrapper fallback={<PageLoader />}>
        <AuthLayout />
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />
      },
      {
        path: 'login',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <LoginForm />
          </LazyWrapper>
        )
      },
      {
        path: 'register',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <RegisterForm />
          </LazyWrapper>
        )
      },
      {
        path: 'forgot-password',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <ForgotPasswordForm />
          </LazyWrapper>
        )
      },
      {
        path: 'reset-password',
        element: (
          <LazyWrapper fallback={<PageLoader />}>
            <ResetPasswordForm />
          </LazyWrapper>
        )
      }
    ]
  },
  // Legacy routes for backward compatibility
  {
    path: '/login',
    element: <Navigate to="/auth/login" replace />
  },
  {
    path: '/register',
    element: <Navigate to="/auth/register" replace />
  },
  {
    path: '/forgot-password',
    element: <Navigate to="/auth/forgot-password" replace />
  },
  {
    path: '/reset-password',
    element: <Navigate to="/auth/reset-password" replace />
  },
  // Room creation and joining routes (temporary placeholders)
  {
    path: '/rooms/create',
    element: (
      <LazyWrapper fallback={<PageLoader />}>
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: <div className="p-6">Create Room page - Coming soon</div>
      }
    ]
  },
  {
    path: '/rooms/join',
    element: (
      <LazyWrapper fallback={<PageLoader />}>
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: <div className="p-6">Join Room page - Coming soon</div>
      }
    ]
  },
  {
    path: '*',
    element: (
      <LazyWrapper fallback={<PageLoader />}>
        <NotFound />
      </LazyWrapper>
    )
  }
])