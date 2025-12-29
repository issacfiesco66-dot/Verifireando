import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

const VerifyEmail = () => {
  const { verifyEmail, resendVerificationEmail, user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [status, setStatus] = useState('idle') // idle | verifying | success | error | no_token | manual_code
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('client')

  useEffect(() => {
    // Si venimos de la página de registro/login
    if (location.state?.email) {
      setEmail(location.state.email)
      setStatus('manual_code')
      if (location.state.role) {
        setRole(location.state.role)
      }
    }
    
    // Si hay token en URL (link de email)
    const token = searchParams.get('oobCode') || searchParams.get('token')
    if (token) {
      setStatus('verifying')
      verify(token)
    }
  }, [location.state, searchParams])

  const verify = async (token) => {
    const result = await verifyEmail(token)
    if (result?.success) {
      setStatus('success')
      setTimeout(() => {
        // Redirigir según rol
        const dest = '/client/dashboard' // Default, ajustar según contexto si es posible
        navigate(dest, { replace: true })
      }, 1500)
    } else {
      setMessage(result?.error || 'No se pudo verificar el email')
      setStatus('error')
    }
  }

  const handleManualVerify = async (e) => {
    e.preventDefault()
    if (!manualCode || manualCode.length !== 6) {
      toast.error('Ingresa un código válido de 6 dígitos')
      return
    }

    try {
      setStatus('verifying')
      // Llamar directamente al endpoint de verificar OTP
      const response = await authAPI.post('/verify-otp', {
        email: email,
        code: manualCode,
        role: role
      })
      
      if (response.data.token) {
        // Guardar token y usuario
        localStorage.setItem('token', response.data.token)
        toast.success('Verificación exitosa')
        const dashboardPath = role === 'driver' ? '/driver/dashboard' : '/client/dashboard'
        window.location.href = dashboardPath
      }
    } catch (error) {
      setStatus('manual_code')
      const errorMessage = error.response?.data?.message || 'Código inválido'
      toast.error(errorMessage)
      
      // Si el error es código inválido, sugerir reenviar
      if (errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
          setMessage('El código ingresado es incorrecto o ha expirado. Por favor solicita uno nuevo.')
      }
    }
  }
  
  const handleResend = async () => {
    setStatus('verifying')
    try {
      if (email) {
          // Reenviar OTP
          await authAPI.post('/resend-otp', { email, role: role })
      } else {
          await resendVerificationEmail()
      }
      
      setMessage('Hemos reenviado el código. Revisa tu WhatsApp o Email.')
      
      if (email) {
        setStatus('manual_code')
        toast.success('Código reenviado')
      } else {
        setStatus('idle')
      }
    } catch {
      setMessage('Error al reenviar la verificación')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
        {status === 'verifying' && (
          <>
            <LoadingSpinner fullScreen={false} text="Verificando..." />
            <p className="text-gray-600 mt-4">Por favor espera un momento.</p>
          </>
        )}

        {status === 'manual_code' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación Requerida</h1>
            <p className="text-gray-600 mb-4">
              Hemos enviado un código de verificación a tu WhatsApp.
              <br/>
              <span className="text-sm text-gray-500">(En desarrollo: el código aparece en un mensaje emergente)</span>
            </p>
            
            <form onSubmit={handleManualVerify} className="space-y-4">
                <input 
                    type="text" 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    maxLength={6}
                    className="input input-md w-full text-center tracking-widest text-2xl"
                />
                <button type="submit" className="btn btn-primary btn-md w-full">Verificar Código</button>
            </form>
            
            <button onClick={handleResend} className="mt-4 text-primary-600 text-sm hover:underline">
                ¿No recibiste el código? Reenviar
            </button>
            
            <div className="mt-4">
                <Link to="/auth/login" className="text-gray-500 text-sm">Volver al login</Link>
            </div>
          </>
        )}

        {(status === 'no_token' || status === 'idle') && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación de email</h1>
            <p className="text-gray-600 mb-4">No encontramos un token de verificación en el enlace.</p>
            <button onClick={handleResend} className="btn btn-primary btn-md w-full mb-3">Reenviar verificación</button>
            <Link to="/auth/login" className="btn btn-secondary btn-md w-full">Volver al login</Link>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Verificado!</h1>
            <p className="text-gray-600">Redirigiendo a tu panel...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de verificación</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button onClick={handleResend} className="btn btn-primary btn-md w-full mb-3">Reenviar verificación</button>
            <Link to="/auth/login" className="btn btn-secondary btn-md w-full">Volver al login</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail