import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile as fbUpdateProfile, sendEmailVerification, sendPasswordResetEmail, confirmPasswordReset, applyActionCode, signInWithPopup, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
const useFirebaseAuth = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true'

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
      if (useFirebaseAuth) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true })
          onAuthStateChanged(auth, async (user) => {
            if (user) {
              const idToken = await user.getIdToken()
              setToken(idToken)
              const normalizedUser = {
                id: user.uid,
                name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
                email: user.email,
                phone: user.phoneNumber || '',
                role: 'client',
                isVerified: user.emailVerified ?? false,
                isActive: true,
              }
              dispatch({ type: 'SET_USER', payload: normalizedUser })
            } else {
              setToken(null)
              dispatch({ type: 'SET_USER', payload: null })
            }
          })
        } catch (error) {
          console.error('Auth initialization failed (Firebase):', error)
          dispatch({ type: 'SET_LOADING', payload: false })
        }
        return
      }
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          setToken(token)
          const response = await authAPI.get('/me')
          const serverUser = response.data.user || null
          const normalizedUser = serverUser
            ? {
                ...serverUser,
                isActive: serverUser.isActive ?? true,
                isVerified: serverUser.isVerified ?? false,
              }
            : null
          dispatch({ type: 'SET_USER', payload: normalizedUser })
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
      if (useFirebaseAuth) {
        const { email, password, role } = credentials
        const result = await signInWithEmailAndPassword(auth, email, password)
        const user = result.user
        const idToken = await user.getIdToken()
    
        setToken(idToken)
        const normalizedUser = {
          id: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
          email: user.email,
          phone: user.phoneNumber || '',
          role: role || 'client',
          isVerified: user.emailVerified ?? false,
          isActive: true,
        }
        dispatch({ type: 'SET_USER', payload: normalizedUser })
    
        toast.success(`¡Bienvenido, ${normalizedUser.name}!`)
        return { success: true, user: normalizedUser }
      }
      // Determinar qué endpoint usar según el rol
      const endpoint = credentials.role === 'driver' ? '/login/driver' : '/login'
      // No enviar role al backend (el backend lo determina)
      const { role, ...credentialsWithoutRole } = credentials
      
      const response = await authAPI.post(endpoint, credentialsWithoutRole)
      const { user, token } = response.data

      setToken(token)
      const normalizedUser = {
        ...user,
        isActive: user?.isActive ?? true,
        isVerified: user?.isVerified ?? false,
      }
      dispatch({ type: 'SET_USER', payload: normalizedUser })
      
      toast.success(`¡Bienvenido, ${user.firstName || user.name}!`)
      return { success: true, user: normalizedUser }
    } catch (error) {
      // Manejar el caso de usuario no verificado que devuelve 403 pero con devCode
      if (error.response?.status === 403 && error.response?.data?.needsVerification) {
         // Si hay un devCode, mostrarlo en un toast para facilitar el desarrollo
         if (error.response.data.devCode) {
             toast('Tu código de verificación es: ' + error.response.data.devCode, {
                 duration: 10000,
                 icon: '🔑'
             });
         }
         
         // Retornar información especial para que el componente Login redirija
         return { 
             success: false, 
             needsVerification: true, 
             userId: error.response.data.userId,
             email: credentials.email
         }
      }

      const message = error.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: message }
    }
  }

  // Google login function
  const loginWithGoogle = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      if (!useFirebaseAuth) {
        throw new Error('Google login solo está disponible con Firebase Auth')
      }

      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      if (import.meta.env.DEV) {
        const result = await signInWithPopup(auth, provider)
        const user = result.user
        const idToken = await user.getIdToken()

        setToken(idToken)
        const normalizedUser = {
          id: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
          email: user.email,
          phone: user.phoneNumber || '',
          role: 'client',
          isVerified: user.emailVerified ?? true,
          isActive: true,
        }
        dispatch({ type: 'SET_USER', payload: normalizedUser })

        toast.success(`¡Bienvenido, ${normalizedUser.name}!`)
        return { success: true, user: normalizedUser }
      } else {
        await signInWithRedirect(auth, provider)
        // After redirect back, onAuthStateChanged will set user and token
        return { success: true, redirect: true }
      }
    } catch (error) {
      let message = 'Error al iniciar sesión con Google'
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Inicio de sesión cancelado'
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup bloqueado. Por favor, permite popups para este sitio'
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Solicitud de popup cancelada'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: message }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      if (useFirebaseAuth) {
        const { email, password, name, phone, role } = userData
        const result = await createUserWithEmailAndPassword(auth, email, password)
        const user = result.user
        if (name) {
          await fbUpdateProfile(user, { displayName: name })
        }
        const idToken = await user.getIdToken()
    
        setToken(idToken)
        const normalizedUser = {
          id: user.uid,
          name: name || user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
          email: user.email,
          phone: phone || user.phoneNumber || '',
          role: role || 'client',
          isVerified: user.emailVerified ?? false,
          isActive: true,
        }
        dispatch({ type: 'SET_USER', payload: normalizedUser })
    
        try {
          const actionCodeSettings = {
            url: `${window.location.origin}/auth/verify-email`,
            handleCodeInApp: true,
          }
          await sendEmailVerification(user, actionCodeSettings)
        } catch {}
        toast.success('¡Cuenta creada exitosamente! Verifica tu email.')
        return { success: true, user: normalizedUser }
      }
      
      // API backend (no Firebase)
      const response = await authAPI.post('/register', userData)
      
      // El backend devuelve needsVerification: true, no un token
      if (response.data.needsVerification) {
        // Mostrar código de desarrollo si existe
        if (response.data.devCode) {
          toast('Tu código de verificación es: ' + response.data.devCode, {
            duration: 15000,
            icon: '🔑'
          })
        }
        
        dispatch({ type: 'SET_LOADING', payload: false })
        toast.success('¡Cuenta creada! Verifica tu cuenta con el código enviado.')
        return { 
          success: true, 
          needsVerification: true, 
          userId: response.data.userId,
          email: userData.email,
          role: userData.role
        }
      }
      
      // Si por alguna razón devuelve token (no debería en registro normal)
      const { user, token } = response.data
      if (token) {
        setToken(token)
        const normalizedUser = {
          ...user,
          isActive: user?.isActive ?? true,
          isVerified: user?.isVerified ?? false,
        }
        dispatch({ type: 'SET_USER', payload: normalizedUser })
        toast.success('¡Cuenta creada exitosamente!')
        return { success: true, user: normalizedUser }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: true }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al crear la cuenta'
      toast.error(message)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      if (useFirebaseAuth) {
        await signOut(auth)
      } else {
        await authAPI.post('/logout')
      }
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
      if (useFirebaseAuth) {
        const user = auth.currentUser
        if (!user) throw new Error('No autenticado')
        const { name } = userData
        if (name) {
          await fbUpdateProfile(user, { displayName: name })
        }
        const normalizedUser = {
          ...state.user,
          name: name || state.user?.name,
        }
        dispatch({ type: 'UPDATE_USER', payload: normalizedUser })
        toast.success('Perfil actualizado exitosamente')
        return { success: true, user: normalizedUser }
      }
      const response = await authAPI.put('/profile', userData)
      dispatch({ type: 'UPDATE_USER', payload: response.data.user })
      toast.success('Perfil actualizado exitosamente')
      return { success: true, user: response.data.user }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al actualizar el perfil'
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
      if (useFirebaseAuth) {
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/reset-password`,
          handleCodeInApp: true,
        }
        await sendPasswordResetEmail(auth, email, actionCodeSettings)
        toast.success('Instrucciones enviadas a tu correo electrónico')
        return { success: true }
      }
      await authAPI.post('/forgot-password', { email })
      toast.success('Instrucciones enviadas a tu correo electrónico')
      return { success: true }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al enviar las instrucciones'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      if (useFirebaseAuth) {
        await confirmPasswordReset(auth, token, password)
        toast.success('Contraseña restablecida exitosamente')
        return { success: true }
      }
      await authAPI.post('/reset-password', { token, password })
      toast.success('Contraseña restablecida exitosamente')
      return { success: true }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al restablecer la contraseña'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Verify email
  const verifyEmail = async (token) => {
    try {
      if (useFirebaseAuth) {
        await applyActionCode(auth, token)
        const user = auth.currentUser
        const normalizedUser = {
          ...state.user,
          isVerified: true,
        }
        dispatch({ type: 'UPDATE_USER', payload: normalizedUser })
        toast.success('Email verificado exitosamente')
        return { success: true }
      }
      const response = await authAPI.post('/verify-email', { token })
      dispatch({ type: 'UPDATE_USER', payload: response.data.user })
      toast.success('Email verificado exitosamente')
      return { success: true }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al verificar el email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (useFirebaseAuth) {
        const user = auth.currentUser
        if (!user) throw new Error('No autenticado')
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/verify-email`,
          handleCodeInApp: true,
        }
        await sendEmailVerification(user, actionCodeSettings)
        toast.success('Email de verificación enviado')
        return { success: true }
      }
      await authAPI.post('/resend-verification')
      toast.success('Email de verificación enviado')
      return { success: true }
    } catch (error) {
      const message = error?.message || error.response?.data?.message || 'Error al enviar el email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    login,
    loginWithGoogle,
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