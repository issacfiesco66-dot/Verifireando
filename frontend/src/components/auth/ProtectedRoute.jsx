import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ProtectedRoute = ({ children, allowedRoles = [], requireEmailVerification = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen text="Verificando autenticación..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'admin' 
      ? '/admin/dashboard' 
      : user.role === 'driver' 
      ? '/driver/dashboard' 
      : '/client/dashboard'
    
    return <Navigate to={redirectPath} replace />
  }

  // Check email verification if required
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verifica tu email
          </h1>
          
          <p className="text-gray-600 mb-8">
            Necesitas verificar tu dirección de correo electrónico para acceder a esta sección.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/auth/verify-email'}
              className="w-full btn btn-primary btn-md"
            >
              Ir a verificación
            </button>
            
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full btn btn-secondary btn-md"
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check if driver profile is complete (for driver routes)
  if (user.role === 'driver' && allowedRoles.includes('driver')) {
    const requiredFields = ['licenseNumber', 'vehicleInfo', 'documents']
    const missingFields = requiredFields.filter(field => !user[field])
    
    if (missingFields.length > 0 && location.pathname !== '/driver/profile') {
      return <Navigate to="/driver/profile" state={{ incomplete: true }} replace />
    }
  }

  // Check if user account is active
  if (!user.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Cuenta desactivada
          </h1>
          
          <p className="text-gray-600 mb-8">
            Tu cuenta ha sido desactivada. Contacta al soporte para más información.
          </p>
          
          <div className="space-y-3">
            <a
              href="/contact"
              className="w-full btn btn-primary btn-md"
            >
              Contactar soporte
            </a>
            
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full btn btn-secondary btn-md"
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render protected content
  return children
}

export default ProtectedRoute