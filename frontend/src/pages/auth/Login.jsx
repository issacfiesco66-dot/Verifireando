import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'admin' 
        ? '/admin/dashboard' 
        : user.role === 'driver' 
        ? '/driver/dashboard' 
        : '/client/dashboard'
      
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (data) => {
    try {
      await login({
        email: data.email,
        password: data.password,
        role: data.role
      })
      
      // Redirect based on user role or to intended page
      if (from !== '/') {
        navigate(from, { replace: true })
      } else {
        // Will be handled by the useEffect above
      }
    } catch (error) {
      // Error is handled by AuthContext
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Iniciando sesión..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verifireando</h1>
          <p className="text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input input-md w-full pl-10 ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="tu@email.com"
                  {...register('email', {
                    required: 'El correo electrónico es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo electrónico inválido'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input input-md w-full pl-10 pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cuenta
              </label>
              <select
                id="role"
                className={`input input-md w-full ${errors.role ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                {...register('role', {
                  required: 'Selecciona el tipo de cuenta'
                })}
              >
                <option value="">Selecciona tu tipo de cuenta</option>
                <option value="client">Cliente</option>
                <option value="driver">Chofer</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>

              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿No tienes cuenta?</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <Link
              to="/auth/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Crear cuenta nueva
            </Link>
          </div>
        </div>

        {/* Demo Accounts */}
        {import.meta.env.DEV && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Cuentas de prueba:</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Cliente: cliente@test.com / 123456</div>
              <div>Chofer: chofer@test.com / 123456</div>
              <div>Admin: admin@test.com / 123456</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login