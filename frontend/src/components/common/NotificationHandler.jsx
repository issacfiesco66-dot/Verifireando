import React, { useEffect, useContext } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { NotificationContext } from '../../contexts/NotificationContext'
import toast from 'react-hot-toast'

const NotificationHandler = () => {
  const { user } = useAuth()
  const { socket, subscribe } = useSocket()
  const notificationContext = useContext(NotificationContext)
  
  // Safely get showBrowserNotification function
  const showBrowserNotification = notificationContext?.showBrowserNotification || (() => {})

  useEffect(() => {
    if (!socket || !user) return

    // Handle appointment notifications
    const handleAppointmentCreated = (data) => {
      if (data.driverId === user._id) {
        toast.success('Nueva cita asignada')
        showBrowserNotification(
          'Nueva cita asignada',
          `Tienes una nueva cita programada para ${new Date(data.scheduledDate).toLocaleString()}`
        )
      }
    }

    const handleAppointmentUpdated = (data) => {
      if (data.clientId === user._id || data.driverId === user._id) {
        toast.info('Cita actualizada')
        showBrowserNotification(
          'Cita actualizada',
          `Tu cita ha sido ${data.status === 'cancelled' ? 'cancelada' : 'actualizada'}`
        )
      }
    }

    const handleAppointmentAssigned = (data) => {
      if (data.driverId === user._id) {
        toast.success('Cita asignada')
        showBrowserNotification(
          'Nueva cita asignada',
          `Se te ha asignado una nueva cita`
        )
      }
    }

    const handleAppointmentCancelled = (data) => {
      if (data.clientId === user._id || data.driverId === user._id) {
        toast.error('Cita cancelada')
        showBrowserNotification(
          'Cita cancelada',
          `Tu cita ha sido cancelada`
        )
      }
    }

    // Handle payment notifications
    const handlePaymentCompleted = (data) => {
      if (data.clientId === user._id) {
        toast.success('Pago completado')
        showBrowserNotification(
          'Pago completado',
          `Tu pago de $${data.amount} ha sido procesado exitosamente`
        )
      }
    }

    const handlePaymentFailed = (data) => {
      if (data.clientId === user._id) {
        toast.error('Error en el pago')
        showBrowserNotification(
          'Error en el pago',
          'Hubo un problema procesando tu pago. Intenta nuevamente.'
        )
      }
    }

    // Handle driver location updates
    const handleDriverLocationUpdated = (data) => {
      // This will be handled by the LocationContext
      // Just show notification if it's the user's assigned driver
      if (user.role === 'client' && data.appointmentId) {
        // Check if this is for user's active appointment
        // This would need to be checked against current appointment state
      }
    }

    // Handle general notifications
    const handleNotification = (data) => {
      // Check if notification is for this user
      if (data.userId === user._id || data.userRole === user.role || !data.userId) {
        toast(data.message, {
          icon: data.type === 'success' ? '✅' : 
                data.type === 'error' ? '❌' : 
                data.type === 'warning' ? '⚠️' : 'ℹ️'
        })
        
        showBrowserNotification(
          data.title || 'Notificación',
          data.message
        )
      }
    }

    // Subscribe to socket events
    const unsubscribeAppointmentCreated = subscribe('appointment-created', handleAppointmentCreated)
    const unsubscribeAppointmentUpdated = subscribe('appointment-updated', handleAppointmentUpdated)
    const unsubscribeAppointmentAssigned = subscribe('appointment-assigned', handleAppointmentAssigned)
    const unsubscribeAppointmentCancelled = subscribe('appointment-cancelled', handleAppointmentCancelled)
    const unsubscribePaymentCompleted = subscribe('payment-completed', handlePaymentCompleted)
    const unsubscribePaymentFailed = subscribe('payment-failed', handlePaymentFailed)
    const unsubscribeDriverLocationUpdated = subscribe('driver-location-updated', handleDriverLocationUpdated)
    const unsubscribeNotification = subscribe('notification', handleNotification)

    // Cleanup subscriptions
    return () => {
      unsubscribeAppointmentCreated()
      unsubscribeAppointmentUpdated()
      unsubscribeAppointmentAssigned()
      unsubscribeAppointmentCancelled()
      unsubscribePaymentCompleted()
      unsubscribePaymentFailed()
      unsubscribeDriverLocationUpdated()
      unsubscribeNotification()
    }
  }, [socket, user, subscribe, showBrowserNotification])

  // Handle browser notification permission request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Show a toast asking for notification permission
      toast((t) => (
        <div className="flex flex-col space-y-2">
          <span>¿Permitir notificaciones para mantenerte informado?</span>
          <div className="flex space-x-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                Notification.requestPermission()
                toast.dismiss(t.id)
              }}
            >
              Permitir
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Ahora no
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
        position: 'top-center'
      })
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

export default NotificationHandler