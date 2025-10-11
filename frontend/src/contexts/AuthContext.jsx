import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-hot-toast'

const AuthContext = createContext()

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }
    default:
      return state
  }
}

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Set token in localStorage and API headers
  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token)
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete authAPI.defaults.headers.common['Authorization']
    }
    dispatch({ type: 'SET_TOKEN', payload: token })
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          setToken(token)
          const response = await authAPI.get('/me')
          dispatch({ type: 'SET_USER', payload: response.data.user })
        } catch (error) {
          console.error('Auth initialization failed:', error)
          logout()
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.post('/login', credentials)
      const { user, token } = response.data

      setToken(token)
      dispatch({ type: 'SET_USER', payload: user })
      
      toast.success(`¡Bienvenido, ${user.firstName}!`)
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: message }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authAPI.post('/register', userData)
      const { user, token } = response.data

      setToken(token)
      dispatch({ type: 'SET_USER', payload: user })
      
      toast.success('¡Cuenta creada exitosamente!')
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la cuenta'
      toast.error(message)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authAPI.post('/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      dispatch({ type: 'LOGOUT' })
      toast.success('Sesión cerrada')
    }
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.put('/profile', userData)
      dispatch({ type: 'UPDATE_USER', payload: response.data.user })
      toast.success('Perfil actualizado exitosamente')
      return { success: true, user: response.data.user }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar el perfil'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await authAPI.put('/change-password', passwordData)
      toast.success('Contraseña actualizada exitosamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar la contraseña'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await authAPI.post('/forgot-password', { email })
      toast.success('Instrucciones enviadas a tu correo electrónico')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al enviar las instrucciones'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await authAPI.post('/reset-password', { token, password })
      toast.success('Contraseña restablecida exitosamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al restablecer la contraseña'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.post('/verify-email', { token })
      dispatch({ type: 'UPDATE_USER', payload: response.data.user })
      toast.success('Email verificado exitosamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al verificar el email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      await authAPI.post('/resend-verification')
      toast.success('Email de verificación enviado')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al enviar el email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}