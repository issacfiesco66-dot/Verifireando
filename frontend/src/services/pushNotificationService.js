import pwaService from './pwaService'
import { notificationAPI } from './api'

class PushNotificationService {
  constructor() {
    this.isInitialized = false
    this.subscription = null
    
    // Only initialize in production mode
    if (!import.meta.env.DEV) {
      this.init()
    }
  }

  // Initialize push notification service
  async init() {
    // Skip initialization in development mode
    if (import.meta.env.DEV) {
      console.log('Push Notification Service: Skipping initialization in development mode')
      this.isInitialized = true
      return
    }

    try {
      // Wait for PWA service to be ready
      await this.waitForPWAService()
      
      // Setup push notification handlers
      this.setupPushHandlers()
      
      this.isInitialized = true
      console.log('Push Notification Service initialized')
    } catch (error) {
      console.error('Failed to initialize Push Notification Service:', error)
    }
  }

  // Wait for PWA service to be ready
  async waitForPWAService() {
    return new Promise((resolve) => {
      const checkPWAService = () => {
        if (pwaService.swRegistration) {
          resolve()
        } else {
          setTimeout(checkPWAService, 100)
        }
      }
      checkPWAService()
    })
  }

  // Setup push notification event handlers
  setupPushHandlers() {
    // Listen for push subscription changes
    pwaService.on('notificationPermissionGranted', () => {
      this.handlePermissionGranted()
    })

    // Listen for push messages (handled by service worker)
    // The actual push handling is done in the service worker
    // This is just for managing subscriptions and preferences
  }

  // Handle notification permission granted
  async handlePermissionGranted() {
    try {
      this.subscription = await pwaService.subscribeToPush()
      if (this.subscription) {
        console.log('Push subscription created successfully')
      }
    } catch (error) {
      console.error('Failed to create push subscription:', error)
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      const granted = await pwaService.requestNotificationPermission()
      return granted
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Send a local notification
  async sendLocalNotification(title, options = {}) {
    try {
      return await pwaService.showNotification(title, options)
    } catch (error) {
      console.error('Failed to send local notification:', error)
      return false
    }
  }

  // Subscribe to specific notification types
  async subscribeToNotifications(types = []) {
    if (!this.subscription) {
      console.warn('No push subscription available')
      return false
    }

    try {
      const response = await notificationAPI.post('/preferences', {
        subscription: this.subscription.toJSON(),
        types: types,
        enabled: true
      })

      if (response.data.success) {
        console.log('Subscribed to notification types:', types)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error)
      return false
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
      }

      // Notify server
      await notificationAPI.post('/unsubscribe')
      
      console.log('Unsubscribed from push notifications')
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await notificationAPI.get('/preferences')
      return response.data
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await notificationAPI.put('/preferences', preferences)
      return response.data
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return null
    }
  }

  // Send appointment notification
  async sendAppointmentNotification(type, appointmentData) {
    const notifications = {
      'appointment_created': {
        title: '¡Cita creada exitosamente!',
        body: `Tu cita para el ${appointmentData.date} a las ${appointmentData.time} ha sido confirmada.`,
        icon: '/icon-192.svg',
        tag: 'appointment-created',
        data: {
          type: 'appointment',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        actions: [
          {
            action: 'view',
            title: 'Ver detalles'
          }
        ]
      },
      'driver_assigned': {
        title: 'Conductor asignado',
        body: `${appointmentData.driver.name} ha sido asignado a tu cita.`,
        icon: '/icon-192.svg',
        tag: 'driver-assigned',
        data: {
          type: 'driver-assigned',
          appointmentId: appointmentData.id,
          driverId: appointmentData.driver.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        actions: [
          {
            action: 'view',
            title: 'Ver conductor'
          }
        ]
      },
      'driver_on_way': {
        title: 'Conductor en camino',
        body: `${appointmentData.driver.name} está en camino a tu ubicación.`,
        icon: '/icon-192.svg',
        tag: 'driver-on-way',
        data: {
          type: 'driver-on-way',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'Ver ubicación'
          }
        ]
      },
      'driver_arrived': {
        title: 'Conductor ha llegado',
        body: `${appointmentData.driver.name} ha llegado a tu ubicación.`,
        icon: '/icon-192.svg',
        tag: 'driver-arrived',
        data: {
          type: 'driver-arrived',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'Ver detalles'
          }
        ]
      },
      'appointment_completed': {
        title: 'Verificación completada',
        body: 'Tu verificación vehicular ha sido completada exitosamente.',
        icon: '/icon-192.svg',
        tag: 'appointment-completed',
        data: {
          type: 'appointment-completed',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        actions: [
          {
            action: 'view',
            title: 'Ver certificado'
          }
        ]
      },
      'appointment_cancelled': {
        title: 'Cita cancelada',
        body: 'Tu cita de verificación ha sido cancelada.',
        icon: '/icon-192.svg',
        tag: 'appointment-cancelled',
        data: {
          type: 'appointment-cancelled',
          appointmentId: appointmentData.id,
          url: '/client/appointments'
        },
        actions: [
          {
            action: 'view',
            title: 'Agendar nueva cita'
          }
        ]
      },
      'payment_processed': {
        title: 'Pago procesado',
        body: `Tu pago de $${appointmentData.amount} ha sido procesado exitosamente.`,
        icon: '/icon-192.svg',
        tag: 'payment-processed',
        data: {
          type: 'payment',
          appointmentId: appointmentData.id,
          url: `/client/payments`
        },
        actions: [
          {
            action: 'view',
            title: 'Ver recibo'
          }
        ]
      },
      'reminder_24h': {
        title: 'Recordatorio de cita',
        body: `Tu cita de verificación es mañana a las ${appointmentData.time}.`,
        icon: '/icon-192.svg',
        tag: 'reminder-24h',
        data: {
          type: 'reminder',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        actions: [
          {
            action: 'view',
            title: 'Ver detalles'
          },
          {
            action: 'cancel',
            title: 'Cancelar cita'
          }
        ]
      },
      'reminder_1h': {
        title: 'Tu cita es en 1 hora',
        body: `No olvides tu cita de verificación a las ${appointmentData.time}.`,
        icon: '/icon-192.svg',
        tag: 'reminder-1h',
        data: {
          type: 'reminder',
          appointmentId: appointmentData.id,
          url: `/client/appointments/${appointmentData.id}`
        },
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'Ver detalles'
          }
        ]
      }
    }

    const notificationConfig = notifications[type]
    if (!notificationConfig) {
      console.warn(`Unknown notification type: ${type}`)
      return false
    }

    return await this.sendLocalNotification(notificationConfig.title, notificationConfig)
  }

  // Check if notifications are supported
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Get current notification permission status
  getPermissionStatus() {
    if (!this.isSupported()) {
      return 'not-supported'
    }
    return Notification.permission
  }

  // Get subscription status
  getSubscriptionStatus() {
    return {
      isSubscribed: !!this.subscription,
      subscription: this.subscription?.toJSON() || null
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService()

export default pushNotificationService