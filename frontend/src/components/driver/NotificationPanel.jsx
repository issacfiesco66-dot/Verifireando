import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  MapPin, 
  Clock, 
  DollarSign, 
  Car, 
  User,
  Navigation,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'
import { useLocation } from '../../contexts/LocationContext'
import { useAuth } from '../../contexts/AuthContext'
import { appointmentService } from '../../services/api'
import toast from 'react-hot-toast'

const NotificationPanel = ({ className = "" }) => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [availableAppointments, setAvailableAppointments] = useState([])
  const [processingAppointment, setProcessingAppointment] = useState(null)
  
  const { user } = useAuth()
  const { subscribe, connected } = useSocket()
  const { currentLocation, calculateDistance } = useLocation()

  useEffect(() => {
    if (!connected || user?.role !== 'driver') return

    // Subscribe to appointment events
    const unsubscribeAppointmentCreated = subscribe('appointment-created', handleNewAppointment)
    const unsubscribeAppointmentUpdated = subscribe('appointment-updated', handleAppointmentUpdate)
    const unsubscribeAppointmentAssigned = subscribe('appointment-assigned', handleAppointmentAssigned)

    // Fetch initial available appointments
    fetchAvailableAppointments()

    return () => {
      unsubscribeAppointmentCreated()
      unsubscribeAppointmentUpdated()
      unsubscribeAppointmentAssigned()
    }
  }, [connected, user])

  const fetchAvailableAppointments = async () => {
    try {
      const response = await appointmentService.getAvailableAppointments()
      const appointments = response.data.appointments || []
      
      // Filter appointments within reasonable distance (e.g., 20km)
      const nearbyAppointments = appointments.filter(appointment => {
        if (!currentLocation || !appointment.location) return true
        
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          appointment.location.latitude,
          appointment.location.longitude
        )
        
        return distance <= 20 // 20km radius
      })
      
      setAvailableAppointments(nearbyAppointments)
    } catch (error) {
      console.error('Error fetching available appointments:', error)
    }
  }

  const handleNewAppointment = (event) => {
    const appointment = event.detail
    
    // Check if appointment is within reasonable distance
    if (currentLocation && appointment.location) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        appointment.location.latitude,
        appointment.location.longitude
      )
      
      if (distance > 20) return // Skip if too far
    }

    // Add to available appointments
    setAvailableAppointments(prev => [appointment, ...prev])
    
    // Create notification
    const notification = {
      id: `appointment-${appointment._id}`,
      type: 'new-appointment',
      title: 'Nueva cita disponible',
      message: `Cita de ${appointment.serviceType} en ${appointment.location?.address || 'ubicación no especificada'}`,
      appointment,
      timestamp: new Date(),
      read: false
    }
    
    addNotification(notification)
    
    // Show toast notification
    toast.success('Nueva cita disponible en tu área', {
      duration: 5000,
      icon: '🚗'
    })
  }

  const handleAppointmentUpdate = (event) => {
    const appointment = event.detail
    
    // Remove from available appointments if no longer available
    if (appointment.status !== 'pending') {
      setAvailableAppointments(prev => 
        prev.filter(app => app._id !== appointment._id)
      )
    }
  }

  const handleAppointmentAssigned = (event) => {
    const appointment = event.detail
    
    if (appointment.driver === user._id) {
      // This appointment was assigned to current driver
      const notification = {
        id: `assigned-${appointment._id}`,
        type: 'appointment-assigned',
        title: 'Cita asignada',
        message: `Te han asignado una cita de ${appointment.serviceType}`,
        appointment,
        timestamp: new Date(),
        read: false
      }
      
      addNotification(notification)
      toast.success('Te han asignado una nueva cita')
    }
    
    // Remove from available appointments
    setAvailableAppointments(prev => 
      prev.filter(app => app._id !== appointment._id)
    )
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep only 10 notifications
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  const acceptAppointment = async (appointmentId) => {
    try {
      setProcessingAppointment(appointmentId)
      await appointmentService.acceptAppointment(appointmentId)
      
      // Remove from available appointments
      setAvailableAppointments(prev => 
        prev.filter(app => app._id !== appointmentId)
      )
      
      toast.success('Cita aceptada exitosamente')
    } catch (error) {
      console.error('Error accepting appointment:', error)
      toast.error('Error al aceptar la cita')
    } finally {
      setProcessingAppointment(null)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDistance = (appointment) => {
    if (!currentLocation || !appointment.location) return ''
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      appointment.location.latitude,
      appointment.location.longitude
    )
    
    return `${distance.toFixed(1)} km`
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Available Appointments Section */}
            {availableAppointments.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Citas Disponibles ({availableAppointments.length})
                </h4>
                <div className="space-y-3">
                  {availableAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment._id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Car className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              {appointment.serviceType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-blue-700">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {appointment.location?.address || 'Ubicación no especificada'}
                            </span>
                            {currentLocation && appointment.location && (
                              <span className="text-blue-600 font-medium">
                                • {formatDistance(appointment)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-blue-700">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(appointment.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>${appointment.estimatedCost}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptAppointment(appointment._id)}
                        disabled={processingAppointment === appointment._id}
                        className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {processingAppointment === appointment._id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Aceptando...</span>
                          </div>
                        ) : (
                          'Aceptar Cita'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications History */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Historial de Notificaciones
              </h4>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {notification.type === 'new-appointment' && (
                              <Bell className="w-4 h-4 text-blue-600" />
                            )}
                            {notification.type === 'appointment-assigned' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay notificaciones</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationPanel