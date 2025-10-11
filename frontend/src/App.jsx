import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useNotification } from './contexts/NotificationContext'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import ClientLayout from './layouts/ClientLayout'
import DriverLayout from './layouts/DriverLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'
import ForgotPasswordPage from './pages/auth/ForgotPassword'
import ResetPasswordPage from './pages/auth/ResetPassword'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PricingPage from './pages/PricingPage'
import HowItWorksPage from './pages/HowItWorksPage'
import ServicesPage from './pages/ServicesPage'

// Client Pages
import ClientDashboard from './pages/client/Dashboard'
import ClientCars from './pages/client/Cars'
import ClientAppointments from './pages/client/Appointments'
import ClientProfile from './pages/client/Profile'
import ClientPayments from './pages/client/Payments'
import BookAppointment from './pages/client/NewAppointment'

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard'
import DriverAppointments from './pages/driver/Appointments'
import DriverProfile from './pages/driver/Profile'
import DriverEarnings from './pages/driver/Earnings'
import DriverMap from './pages/driver/Map'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDrivers from './pages/admin/Drivers'
import AdminCars from './pages/admin/Cars'
import AdminAppointments from './pages/admin/Appointments'
import AdminPayments from './pages/admin/Payments'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

// Components
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import NotificationHandler from './components/common/NotificationHandler'
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt'

// PWA Services
import pwaService from './services/pwaService'
import pushNotificationService from './services/pushNotificationService'

function App() {
  const { user, loading } = useAuth()
  const { requestPermission } = useNotification()

  // Initialize PWA services
  React.useEffect(() => {
    // Initialize PWA service
    pwaService.init().catch(console.error)
    
    // Initialize push notification service
    pushNotificationService.init().catch(console.error)
  }, [])

  // Request notification permission on app load
  React.useEffect(() => {
    if (user) {
      requestPermission()
      
      // Request push notification permission for PWA
      pushNotificationService.requestPermission().catch(console.error)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<PublicLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="cars" element={<ClientCars />} />
          <Route path="appointments" element={<ClientAppointments />} />
          <Route path="book-appointment" element={<BookAppointment />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        {/* Driver Routes */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/driver/dashboard" replace />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="appointments" element={<DriverAppointments />} />
          <Route path="map" element={<DriverMap />} />
          <Route path="earnings" element={<DriverEarnings />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="cars" element={<AdminCars />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Redirect based on user role */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate
                to={
                  user.role === 'admin'
                    ? '/admin/dashboard'
                    : user.role === 'driver'
                    ? '/driver/dashboard'
                    : '/client/dashboard'
                }
                replace
              />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                <a
                  href="/"
                  className="btn btn-primary btn-lg"
                >
                  Volver al inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>

      {/* Global Components */}
      <NotificationHandler />
      <PWAInstallPrompt />
    </>
  )
}

export default App