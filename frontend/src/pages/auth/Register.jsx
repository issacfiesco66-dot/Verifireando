import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, Car, CreditCard, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// Version: 2025-12-28-02:35 - Registro simplificado de conductores (solo licencia)
const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const { register: registerUser, loading, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm()

  const password = watch('password')
  const selectedRole = watch('role')

  // Leer query param role y pre-seleccionar el rol
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam && (roleParam === 'driver' || roleParam === 'client')) {
      setValue('role', roleParam)
    }
  }, [searchParams, setValue])

  // Redirect if already logged in (except right after form registration)
  useEffect(() => {
    if (user && !justRegistered) {
      const redirectPath = user.role === 'admin' 
        ? '/admin/dashboard' 
        : user.role === 'driver' 
        ? '/driver/dashboard' 
        : '/client/dashboard'
      
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, justRegistered])

  const onSubmit = async (data) => {
    try {
      setJustRegistered(true) // Set BEFORE register to prevent useEffect redirect
      
      const registrationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role
      }

      // Add driver-specific fields if role is driver (solo licencia)
      if (data.role === 'driver') {
        registrationData.licenseNumber = data.licenseNumber
        registrationData.licenseExpiry = data.licenseExpiry
      }
      
      const result = await registerUser(registrationData)
      
      // Solo redirigir si el registro fue exitoso
      if (result?.success) {
        navigate('/auth/verify-email', { replace: true, state: { email: data.email, role: data.role } })
      } else {
        setJustRegistered(false)
      }
    } catch (error) {
      setJustRegistered(false) // Reset on error
      // Error is handled by AuthContext
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Creando cuenta..." />
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
          <p className="text-gray-600">Crea tu cuenta nueva</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`input input-md w-full pl-10 ${errors.name ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Juan Pérez"
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres'
                    },
                    maxLength: {
                      value: 50,
                      message: 'El nombre no puede tener más de 50 caracteres'
                    }
                  })}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>

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

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (México)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={`input input-md w-full pl-10 ${errors.phone ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="+52 55 1234 5678"
                  {...register('phone', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: /^(\+52)?[0-9]{10}$/,
                      message: 'Ingresa un número de teléfono mexicano válido (10 dígitos)'
                    }
                  })}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Role Field */}
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
                defaultValue={searchParams.get('role') || ''}
              >
                <option value="">Selecciona una opción</option>
                <option value="client">Cliente</option>
                <option value="driver">Chofer</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
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
                  autoComplete="new-password"
                  className={`input input-md w-full pl-10 pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
                      message: 'Debe incluir mayúscula, minúscula, número y símbolo'
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

            {/* Driver-specific fields */}
            {selectedRole === 'driver' && (
              <>
                {/* License Number */}
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Licencia
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="licenseNumber"
                      type="text"
                      className={`input input-md w-full pl-10 ${errors.licenseNumber ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                      placeholder="ABC123456"
                      {...register('licenseNumber', {
                        required: selectedRole === 'driver' ? 'El número de licencia es requerido' : false
                      })}
                    />
                  </div>
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-error-600">{errors.licenseNumber.message}</p>
                  )}
                </div>

                {/* License Expiry */}
                <div>
                  <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento de Licencia
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="licenseExpiry"
                      type="date"
                      className={`input input-md w-full pl-10 ${errors.licenseExpiry ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                      {...register('licenseExpiry', {
                        required: selectedRole === 'driver' ? 'La fecha de vencimiento es requerida' : false
                      })}
                    />
                  </div>
                  {errors.licenseExpiry && (
                    <p className="mt-1 text-sm text-error-600">{errors.licenseExpiry.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
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
                  <UserPlus className="w-4 h-4" />
                  <span>Crear cuenta</span>
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
              <span className="px-2 bg-white text-gray-500">¿Ya tienes cuenta?</span>
            </div>
          </div>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <Link to="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register