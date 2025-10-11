import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'
import { useAuth } from './AuthContext'
import { notificationAPI } from '../services/api'
import { toast } from 'react-hot-toast'

const NotificationContext = createContext()

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)
const analytics = getAnalytics(app)

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
  const { user, token } = useAuth()

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (user && token) {
      initializeNotifications()
      setupFCM()
    }
  }, [user, token])

  // Setup FCM messaging
  const setupFCM = useCallback(async () => {
    try {
      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)
        
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
      console.error('Error setting up FCM:', error)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
      }

      let permission = Notification.permission

      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      dispatch({ type: 'SET_PERMISSION', payload: permission })

      if (permission === 'granted') {
        // Get FCM token
        try {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          })
          
          if (token) {
            dispatch({ type: 'SET_FCM_TOKEN', payload: token })
            // Send token to backend
            await notificationAPI.post('/register-token', { token })
          }
        } catch (error) {
          console.error('Error getting FCM token:', error)
        }
        
        return true
      }

      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
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
      console.error('Error initializing notifications:', error)
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
      console.error('Error fetching notifications:', error)
      return { notifications: [], pagination: {} }
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.put(`/mark-as-read`, { notificationId })
      dispatch({ type: 'MARK_AS_READ', payload: notificationId })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.put('/mark-all-as-read')
      dispatch({ type: 'MARK_ALL_AS_READ' })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(`/${notificationId}`)
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (state.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        if (options.onClick) {
          options.onClick()
        }
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  }, [state.permission])

  // Send test notification (admin only)
  const sendTestNotification = useCallback(async (data) => {
    try {
      await notificationAPI.post('/admin/test', data)
      toast.success('Notificación de prueba enviada')
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Error al enviar notificación de prueba')
    }
  }, [])

  const value = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    permission: state.permission,
    fcmToken: state.fcmToken,
    requestPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showBrowserNotification,
    sendTestNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}