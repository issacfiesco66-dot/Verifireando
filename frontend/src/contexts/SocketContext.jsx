import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [onlineDrivers, setOnlineDrivers] = useState([])
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // Evitar crear múltiples sockets
    if (user && token && !socket) {
      initializeSocket()
    } else if (!user || !token) {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  const initializeSocket = () => {
    // Limpiar socket existente antes de crear uno nuevo
    if (socket) {
      socket.disconnect()
    }

    const apiUrl = import.meta.env.VITE_API_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

    // Usar VITE_SOCKET_URL o derivar de VITE_API_URL
    const resolvedSocketUrl = socketUrl || (apiUrl ? new URL(apiUrl).origin : (isLocalhost ? 'http://localhost:5000' : window.location.origin))

    const newSocket = io(resolvedSocketUrl, {
      auth: {
        token,
      },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id, 'URL:', resolvedSocketUrl)
      setConnected(true)
      reconnectAttempts.current = 0
      
      // Join user-specific room
      if (user) {
        // Unirse a sala de usuario según su rol
        if (user.role === 'driver') {
          newSocket.emit('join-driver-room', user._id)
        } else {
          newSocket.emit('join-user-room', user._id)
        }
        // También unirse a sala genérica para compatibilidad
        newSocket.emit('join-room', `user-${user._id}`)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect()
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnected(false)
      
      reconnectAttempts.current += 1
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Error de conexión. Por favor, recarga la página.')
      }
    })

    // User presence events
    newSocket.on('users-online', (users) => {
      setOnlineUsers(users)
    })

    newSocket.on('drivers-online', (drivers) => {
      setOnlineDrivers(drivers)
    })

    newSocket.on('user-joined', (userData) => {
      if (userData.role === 'driver') {
        setOnlineDrivers(prev => [...prev, userData])
      } else {
        setOnlineUsers(prev => [...prev, userData])
      }
    })

    newSocket.on('user-left', (userData) => {
      if (userData.role === 'driver') {
        setOnlineDrivers(prev => prev.filter(d => d.userId !== userData.userId))
      } else {
        setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId))
      }
    })

    // Appointment events
    newSocket.on('appointment-created', (appointment) => {
      if (user.role === 'driver') {
        toast.success('Nueva cita disponible en tu área')
      }
      // Trigger custom event for components to listen
      window.dispatchEvent(new CustomEvent('appointment-created', { detail: appointment }))
    })

    newSocket.on('appointment-updated', (appointment) => {
      toast.info('Estado de cita actualizado')
      window.dispatchEvent(new CustomEvent('appointment-updated', { detail: appointment }))
    })

    newSocket.on('appointment-assigned', (appointment) => {
      if (user.role === 'driver' && appointment.driver === user._id) {
        toast.success('Te han asignado una nueva cita')
      } else if (user.role === 'client' && appointment.client === user._id) {
        toast.success('Conductor asignado a tu cita')
      }
      window.dispatchEvent(new CustomEvent('appointment-assigned', { detail: appointment }))
    })

    newSocket.on('appointment-cancelled', (appointment) => {
      toast.info('Cita cancelada')
      window.dispatchEvent(new CustomEvent('appointment-cancelled', { detail: appointment }))
    })

    // Driver location events
    newSocket.on('driver-location-updated', (data) => {
      window.dispatchEvent(new CustomEvent('driver-location-updated', { detail: data }))
    })

    // Payment events
    newSocket.on('payment-completed', (payment) => {
      toast.success('Pago procesado exitosamente')
      window.dispatchEvent(new CustomEvent('payment-completed', { detail: payment }))
    })

    newSocket.on('payment-failed', (payment) => {
      toast.error('Error en el procesamiento del pago')
      window.dispatchEvent(new CustomEvent('payment-failed', { detail: payment }))
    })

    // Notification events
    newSocket.on('notification', (notification) => {
      // Show toast notification
      switch (notification.type) {
        case 'appointment':
          toast.info(notification.message)
          break
        case 'payment':
          toast.success(notification.message)
          break
        case 'system':
          toast(notification.message)
          break
        default:
          toast.info(notification.message)
      }
      
      // Trigger custom event for notification components
      window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }))
    })

    // Chat events (for future implementation)
    newSocket.on('message', (message) => {
      window.dispatchEvent(new CustomEvent('new-message', { detail: message }))
    })

    setSocket(newSocket)
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setConnected(false)
      setOnlineUsers([])
      setOnlineDrivers([])
    }
  }

  // Emit events
  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }

  // Join specific room
  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join-room', roomId)
    }
  }

  // Leave specific room
  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId)
    }
  }

  // Update driver location
  const updateDriverLocation = (location) => {
    if (socket && connected && user?.role === 'driver') {
      socket.emit('update-location', {
        driverId: user._id,
        location,
        timestamp: new Date(),
      })
    }
  }

  // Send message (for future chat implementation)
  const sendMessage = (roomId, message) => {
    if (socket && connected) {
      socket.emit('send-message', {
        roomId,
        message,
        sender: user._id,
        timestamp: new Date(),
      })
    }
  }

  // Subscribe to custom events
  const subscribe = (event, callback) => {
    window.addEventListener(event, callback)
    return () => window.removeEventListener(event, callback)
  }

  const value = {
    socket,
    connected,
    onlineUsers,
    onlineDrivers,
    emitEvent,
    joinRoom,
    leaveRoom,
    updateDriverLocation,
    sendMessage,
    subscribe,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}