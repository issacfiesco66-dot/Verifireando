import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { authService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  useEffect(() => {
    if (!token) {
      navigate('/auth/login')
      return
    }
    
    // Validate token
    validateToken()
  }, [token, navigate])

  const validateToken = async () => {
    try {
      await authService.validateResetToken(token)
      setIsValidToken(true)
    } catch (error) {
      setIsValidToken(false)
      toast.error('El enlace de recuperación es inválido o ha expirado')
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      toast.success('Contraseña restablecida exitosamente')
      navigate('/auth/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Enlace Inválido
            </h2>
            <p className="text-gray-600 mb-8">
              El enlace de recuperación es inválido o ha expirado. 
              Por favor, solicita un nuevo enlace de recuperación.
            </p>
            <button
              onClick={() => navigate('/auth/forgot-password')}
              className="btn btn-primary w-full"
            >
              Solicitar Nuevo Enlace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Nueva Contraseña
          </h2>
          <p className="mt-2 text-gray-600">
            Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input input-md w-full pl-10 pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="••••••••"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input input-md w-full pl-10 pr-10 ${errors.confirmPassword ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Restablecer Contraseña</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword