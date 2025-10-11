import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setIsSubmitted(true)
      toast.success('Correo de recuperación enviado')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Correo Enviado
            </h2>
            <p className="text-gray-600 mb-8">
              Hemos enviado un enlace de recuperación a tu correo electrónico. 
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <Link
              to="/auth/login"
              className="btn btn-primary w-full"
            >
              Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/auth/login"
            className="flex items-center text-primary-600 hover:text-primary-500 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </Link>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Recuperar Contraseña
            </h2>
            <p className="mt-2 text-gray-600">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Enviar Enlace de Recuperación</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <Link
                to="/auth/login"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword