import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn, Car, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState('client')

  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const roleFromQuery = searchParams.get('role')
    const isDriverPath = location.pathname.includes('/login/driver')
    if (roleFromQuery === 'driver' || isDriverPath) setRole('driver')
    else setRole('client')
  }, [location.pathname, searchParams])

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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login({ email: formData.email, password: formData.password, role })
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 100))
        const userRole = result.user?.role || user?.role || 'client'
        const redirectPath = userRole === 'admin' ? '/admin/dashboard' : userRole === 'driver' ? '/driver/dashboard' : '/client/dashboard'
        navigate(redirectPath, { replace: true })
      } else if (result.needsVerification) {
        navigate('/auth/verify-email', { state: { email: formData.email, userId: result.userId, role } })
      } else {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Verifireando</h1>
          <p className="text-gray-500 text-sm">Verificación vehicular profesional</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft p-8">

          {/* Role Selector */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === 'client'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === 'driver'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Chofer</span>
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Bienvenido de nuevo
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-md w-full pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-md w-full pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
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
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">¿No tienes cuenta?</span>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link
              to={role === 'driver' ? '/auth/register?role=driver' : '/auth/register'}
              className="text-primary-600 hover:text-primary-500 font-medium text-sm"
            >
              Regístrate como {role === 'driver' ? 'chofer' : 'cliente'}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Verifireando. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default Login
