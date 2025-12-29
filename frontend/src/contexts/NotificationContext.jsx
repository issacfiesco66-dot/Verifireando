import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'
import { useAuth } from './AuthContext'
import { notificationAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import logger from '../utils/logger'
import app from '../firebase' // Import existing app instance

export const NotificationContext = createContext()

// Initialize Firebase services using the existing app instance
// Importar messaging desde firebase.js (ya tiene verificación de contexto seguro)
// No inicializar aquí para evitar errores - firebase.js ya lo maneja
let messaging = null
let analytics = null

// Solo intentar inicializar si es contexto seguro
if (typeof window !== 'undefined') {
  const isSecureContext = window.isSecureContext || 
                          window.location.protocol === 'https:' || 
                          ['localhost', '127.0.0.1'].includes(window.location.hostname)
  
  if (isSecureContext && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app)
    } catch (error) {
      // Silenciar error - esto es esperado si no hay service worker o no es contexto seguro
      // No loguear para evitar ruido en la consola
    }
    
    const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    if (enableAnalytics) {
      try {
        analytics = getAnalytics(app)
      } catch (error) {
        // Silenciar error de analytics
      }
    }
  }
  // Si no es contexto seguro, messaging y analytics permanecen null (comportamiento esperado)
}

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload._id ? action.payload : n
        ),
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }
    case 'DELETE_NOTIFICATION':
      const notification = state.notifications.find(n => n._id === action.payload)
      return {
        ...state,
        notifications: state.notifications.filter(n => n._id !== action.payload),
        unreadCount: notification && !notification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      }
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload }
    case 'SET_PERMISSION':
      return { ...state, permission: action.payload }
    case 'SET_FCM_TOKEN':
      return { ...state, fcmToken: action.payload }
    default:
      return state
  }
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  permission: Notification.permission,
  fcmToken: null,
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  
  // Safely get auth context
  let user = null
  let token = null
  
  try {
    const authContext = useAuth()
    if (authContext) {
      user = authContext.user
      token = authContext.token
    }
  } catch (error) {
    logger.notification('Auth context not available in NotificationProvider:', error)
    // Continue with null values
  }

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (user && token) {
      try {
        initializeNotifications()
        setupFCM()
      } catch (error) {
        logger.notification('Error initializing notifications:', error)
      }
    }
  }, [user, token])

  // Setup FCM messaging
  const setupFCM = useCallback(async () => {
    // Verificar contexto seguro primero
    const isSecure = typeof window !== 'undefined' && (
      window.isSecureContext || 
      window.location.protocol === 'https:' || 
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    )
    
    if (!messaging) {
      // Solo loguear si es contexto seguro - en HTTP esto es esperado
      if (isSecure) {
        logger.notification('Firebase messaging not available - skipping FCM setup')
      }
      return
    }
    
    // Solo configurar FCM en contexto seguro
    if (!isSecure) {
      return
    }
    
    // Skip FCM listener setup in development to reduce noise
    if (import.meta.env.DEV) {
      logger.notification('Skipping FCM onMessage setup in development mode')
      return
    }

    try {
      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        logger.notification('Foreground message received:', payload)
        
        // Show notification toast
        if (payload.notification) {
          toast(payload.notification.body, {
            icon: '🔔',
            duration: 5000,
          })
        }
        
        // Add to notifications list
        if (payload.data) {
          const notification = {
            _id: payload.data.id || Date.now().toString(),
            title: payload.notification?.title || 'Nueva notificación',
            message: payload.notification?.body || '',
            type: payload.data.type || 'info',
            read: false,
            createdAt: new Date().toISOString(),
          }
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        }
      })
    } catch (error) {
      logger.notification('Error setting up FCM:', error)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        logger.notification('This browser does not support notifications')
        return false
      }

      let permission = Notification.permission

      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      dispatch({ type: 'SET_PERMISSION', payload: permission })

      if (permission === 'granted') {
        // Verificar contexto seguro (HTTPS o localhost)
        const isSecure = typeof window !== 'undefined' && (
          window.isSecureContext || 
          window.location.protocol === 'https:' || 
          ['localhost', '127.0.0.1'].includes(window.location.hostname)
        )
        
        // Solo intentar obtener token FCM si messaging está disponible y es contexto seguro
        if (messaging && isSecure) {
          try {
            // Intentar obtener token real solo si hay VAPID key configurada
            let token = null;
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            
            // Solo intentar obtener token real si hay VAPID key
            if (vapidKey) {
              try {
                token = await getToken(messaging, {
                  vapidKey: vapidKey,
                })
              } catch (err) {
                // Silenciar errores de Firebase en HTTP - usar token mock
                // Solo loguear en HTTPS si es producción
                if (isSecure && window.location.protocol === 'https:' && import.meta.env.PROD) {
                  logger.notification('Could not get real FCM token:', err.message || err);
                }
                // En HTTP, esto es esperado, no loguear
              }
            }

            // Si no hay token real, usar uno mock
            if (!token) {
              token = `mock_fcm_token_${Date.now()}`;
              // Solo loguear en desarrollo o si es HTTPS
              if (import.meta.env.DEV || (isSecure && window.location.protocol === 'https:')) {
                logger.notification('Using mock FCM token');
              }
            }
            
            if (token) {
              dispatch({ type: 'SET_FCM_TOKEN', payload: token })
              // Send token to backend
              await notificationAPI.post('/register-token', { token })
            } else {
              logger.notification('FCM token not available')
            }
          } catch (error) {
            logger.notification('Error getting FCM token:', error)
          }
        } else {
          logger.notification('Skipping FCM token registration (insecure context without dev override)')
        }
        
        return true
      }

      return false
    } catch (error) {
      logger.notification('Error requesting notification permission:', error)
      return false
    }
  }, [])

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Fetch notifications
      const response = await notificationAPI.get('/my-notifications')
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.notifications })
      
      // Get unread count
      const unreadResponse = await notificationAPI.get('/unread-count')
      dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadResponse.data.count })
    } catch (error) {
      logger.notification('Error initializing notifications:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      const response = await notificationAPI.get('/my-notifications', {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      logger.notification('Error fetching notifications:', error)
      return { notifications: [], pagination: {} }
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.put(`/mark-as-read`, { notificationId })
      dispatch({ type: 'MARK_AS_READ', payload: notificationId })
    } catch (error) {
      logger.notification('Error marking notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.put('/mark-all-as-read')
      dispatch({ type: 'MARK_ALL_AS_READ' })
    } catch (error) {
      logger.notification('Error marking all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(`/${notificationId}`)
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
    } catch (error) {
      logger.notification('Error deleting notification:', error)
    }
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (!('Notification' in window)) return false
    if (Notification.permission !== 'granted') return false

    try {
      const notification = new Notification(title, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      return true
    } catch (error) {
      logger.notification('Error showing browser notification:', error)
      return false
    }
  }, [])

  const value = {
    state,
    requestPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showBrowserNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  return useContext(NotificationContext)
}

export const useNotifications = () => {
  return useContext(NotificationContext)
}