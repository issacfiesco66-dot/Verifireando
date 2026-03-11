import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../contexts/AuthContext'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState('client') // 'client' | 'driver'
  
  const { login, loginWithGoogle, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Determinar rol inicial según ruta o query (?role=driver)
  useEffect(() => {
    const roleFromQuery = searchParams.get('role')
    const isDriverPath = location.pathname.includes('/login/driver')

    if (roleFromQuery === 'driver' || isDriverPath) {
      setRole('driver')
    } else if (roleFromQuery === 'client') {
      setRole('client')
    } else {
      setRole('client')
    }
  }, [location.pathname, searchParams])

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      const userRole = user.role || 'client'
      const redirectPath = userRole === 'admin' 
        ? '/admin/dashboard' 
        : userRole === 'driver' 
        ? '/driver/dashboard' 
        : '/client/dashboard'
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        role // Cliente o chofer según selección
      })
      
      if (result.success) {
        // Esperar un momento para que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirigir según el rol del usuario (usar result.user o esperar a que el contexto se actualice)
        const userRole = result.user?.role || user?.role || 'client'
        let redirectPath = '/client/dashboard'
        
        if (userRole === 'admin') {
          redirectPath = '/admin/dashboard'
        } else if (userRole === 'driver') {
          redirectPath = '/driver/dashboard'
        }
        
        // Usar replace para evitar que el usuario pueda volver atrás
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

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      // Pasar rol seleccionado para que el backend cree/identifique correctamente
      const result = await loginWithGoogle({ role })
      
      if (result?.redirect) {
        // En producción, redirect ya está manejado por Firebase
        return
      }
      
      if (result.success && result.user) {
        // Esperar un momento para que el estado se actualice completamente
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirigir según el rol del usuario
        const userRole = result.user?.role || role || 'client'
        const redirectPath = userRole === 'admin' 
          ? '/admin/dashboard' 
          : userRole === 'driver' 
          ? '/driver/dashboard' 
          : '/client/dashboard'
        
        navigate(redirectPath, { replace: true })
      } else {
        setError(result.error || 'Error al iniciar sesión con Google')
      }
    } catch (err) {
      console.error('Error signing in with Google:', err)
      setError('Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar sesión
          </h2>

          {/* Selector de tipo de cuenta */}
          <div className="mt-4 flex justify-center space-x-2" aria-label="Tipo de cuenta">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`px-4 py-1 rounded-full text-sm border ${
                role === 'client'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`px-4 py-1 rounded-full text-sm border ${
                role === 'driver'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Chofer
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-gray-500">
            Estás iniciando sesión como{' '}
            <span className="font-semibold">
              {role === 'driver' ? 'chofer' : 'cliente'}
            </span>
            .
          </p>

          <p className="mt-2 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              to={role === 'driver' ? '/auth/register?role=driver' : '/auth/register'}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Regístrate como {role === 'driver' ? 'chofer' : 'cliente'}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link to="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">O continuar con</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                {loading ? 'Conectando...' : 'Continuar con Google'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
