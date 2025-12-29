// PWA Service for managing service worker, installation, and push notifications
import { notificationAPI } from './api'

class PWAService {
  constructor() {
    this.deferredPrompt = null
    this.isInstalled = false
    this.isStandalone = false
    this.swRegistration = null
    this.pushSubscription = null
    this.isInitialized = false
    this.listenersSetup = false
    
    // Initialize only in production mode
    if (!import.meta.env.DEV) {
      this.init()
    }
  }

  // Initialize PWA service
  async init() {
    if (this.isInitialized) {
      console.log('PWA: Service already initialized, skipping...')
      return
    }
    
    // Skip PWA initialization in development mode
    if (import.meta.env.DEV) {
      console.log('PWA: Skipping PWA initialization in development mode')
      this.isInitialized = true
      return
    }
    
    this.checkInstallationStatus()
    this.setupEventListeners()
    await this.registerServiceWorker()
    await this.setupPushNotifications()
    
    this.isInitialized = true
  }

  // Check if app is installed or running in standalone mode
  checkInstallationStatus() {
    // Check if running in standalone mode
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://')

    // Check if app is installed
    this.isInstalled = this.isStandalone || 
                       localStorage.getItem('pwa-installed') === 'true'
  }

  // Setup event listeners for PWA events
  setupEventListeners() {
    // Avoid duplicate listeners
    if (this.listenersSetup) {
      return
    }
    
    // Listen for install prompt - NO PREVENTDEFAULT PARA QUE APAREZCA EL BANNER
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available')
      // NO hacer e.preventDefault() para permitir el banner nativo
      this.deferredPrompt = e
      this.dispatchEvent('installPromptAvailable', { prompt: e })
    })
    
    this.listenersSetup = true

    // Listen for app installed
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA: App installed')
      this.isInstalled = true
      localStorage.setItem('pwa-installed', 'true')
      this.deferredPrompt = null
      this.dispatchEvent('appInstalled', { event: e })
    })

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.isStandalone = e.matches
      this.dispatchEvent('displayModeChanged', { isStandalone: e.matches })
    })

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.dispatchEvent('connectionChanged', { isOnline: true })
    })

    window.addEventListener('offline', () => {
      this.dispatchEvent('connectionChanged', { isOnline: false })
    })
  }

  // Register service worker
  async registerServiceWorker() {
    // Skip service worker registration in development
    if (import.meta.env.DEV) {
      console.log('PWA: Service Worker registration skipped in development mode')
      return null
    }

    if ('serviceWorker' in navigator) {
      try {
        // Ensure secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(window.location.hostname)
        if (!isSecureContext) {
          console.warn('PWA: Insecure context detected, skipping Service Worker registration')
          return null
        }

        // Preflight check for sw.js availability and correct MIME type
        let contentType = ''
        try {
          const res = await fetch('/sw.js', { method: 'GET', cache: 'no-store' })
          if (!res.ok) {
            console.warn('PWA: /sw.js not found (status', res.status, '), skipping registration')
            return null
          }
          contentType = res.headers.get('content-type') || ''
        } catch (e) {
          console.warn('PWA: Failed to fetch /sw.js preflight, skipping registration:', e?.message || e)
          return null
        }

        if (!/javascript/.test(contentType)) {
          console.warn('PWA: /sw.js has unsupported MIME type:', contentType, '- skipping registration')
          return null
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        this.swRegistration = registration

        console.log('PWA: Service Worker registered successfully')

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New service worker available')
              this.dispatchEvent('updateAvailable', { registration })
            }
          })
        })

        // Check for existing service worker updates
        if (registration.waiting) {
          this.dispatchEvent('updateAvailable', { registration })
        }

        return registration
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error)
        // Don't throw to avoid breaking runtime if SW cannot be registered in production
        return null
      }
    } else {
      console.warn('PWA: Service Workers not supported')
      return null
    }
  }

  // Setup push notifications
  async setupPushNotifications() {
    if (!this.swRegistration || !('PushManager' in window)) {
      console.warn('PWA: Push notifications not supported')
      return false
    }

    try {
      // Check if notifications are already granted
      if (Notification.permission === 'granted') {
        await this.subscribeToPush()
      }

      return true
    } catch (error) {
      console.error('PWA: Push notification setup failed:', error)
      return false
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('PWA: Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        console.log('PWA: Notification permission granted')
        await this.subscribeToPush()
        this.dispatchEvent('notificationPermissionGranted')
        return true
      } else {
        console.log('PWA: Notification permission denied')
        this.dispatchEvent('notificationPermissionDenied')
        return false
      }
    } catch (error) {
      console.error('PWA: Error requesting notification permission:', error)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.swRegistration) {
      console.warn('PWA: No service worker registration available')
      return null
    }

    try {
      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
        
        if (!vapidPublicKey) {
          console.warn('PWA: VAPID public key not configured')
          return null
        }

        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        })

        console.log('PWA: Push subscription created')
      }

      this.pushSubscription = subscription

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('PWA: Push subscription failed:', error)
      return null
    }
  }

  // Send push subscription to server
  async sendSubscriptionToServer(subscription) {
    // Skip sending subscription in development mode
    if (import.meta.env.DEV) {
      console.log('PWA: Skipping push subscription in development mode')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('PWA: User not authenticated, skipping push subscription')
      return
    }

    try {
      const response = await notificationAPI.post('/subscribe', {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })

      if (response.status === 200) {
        console.log('PWA: Push subscription sent to server')
      } else {
        console.error('PWA: Failed to send subscription to server')
      }
    } catch (error) {
      console.error('PWA: Error sending subscription to server:', error)
    }
  }

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('PWA: No install prompt available')
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      console.log(`PWA: Install prompt outcome: ${outcome}`)
      
      if (outcome === 'accepted') {
        this.dispatchEvent('installPromptAccepted')
      } else {
        this.dispatchEvent('installPromptDismissed')
      }

      this.deferredPrompt = null
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error)
      return false
    }
  }

  // Update service worker
  async updateServiceWorker() {
    if (!this.swRegistration || !this.swRegistration.waiting) {
      console.warn('PWA: No service worker update available')
      return false
    }

    try {
      // Send message to waiting service worker to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload page after service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      return true
    } catch (error) {
      console.error('PWA: Error updating service worker:', error)
      return false
    }
  }

  // Cache specific URLs
  async cacheUrls(urls) {
    if (!this.swRegistration) {
      console.warn('PWA: No service worker available for caching')
      return false
    }

    try {
      // Send message to service worker to cache URLs
      this.swRegistration.active.postMessage({
        type: 'CACHE_URLS',
        urls: urls
      })

      console.log('PWA: URLs sent for caching')
      return true
    } catch (error) {
      console.error('PWA: Error caching URLs:', error)
      return false
    }
  }

  // Show local notification
  async showNotification(title, options = {}) {
    if (!this.swRegistration) {
      console.warn('PWA: No service worker available for notifications')
      return false
    }

    if (Notification.permission !== 'granted') {
      console.warn('PWA: Notification permission not granted')
      return false
    }

    try {
      const defaultOptions = {
        body: '',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'default',
        requireInteraction: false,
        actions: []
      }

      const notificationOptions = { ...defaultOptions, ...options }

      await this.swRegistration.showNotification(title, notificationOptions)
      console.log('PWA: Notification shown')
      return true
    } catch (error) {
      console.error('PWA: Error showing notification:', error)
      return false
    }
  }

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      canInstall: !!this.deferredPrompt,
      hasServiceWorker: !!this.swRegistration,
      hasPushSubscription: !!this.pushSubscription,
      notificationPermission: Notification.permission,
      isOnline: navigator.onLine
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    // Limpiar la VAPID key - remover espacios y saltos de línea
    const cleanBase64 = base64String.replace(/\s/g, '')
    
    const padding = '='.repeat((4 - cleanBase64.length % 4) % 4)
    const base64 = (cleanBase64 + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Event dispatcher
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(`pwa:${eventName}`, { detail })
    window.dispatchEvent(event)
  }

  // Event listeners
  on(eventName, callback) {
    window.addEventListener(`pwa:${eventName}`, callback)
  }

  off(eventName, callback) {
    window.removeEventListener(`pwa:${eventName}`, callback)
  }
}

// Create singleton instance
const pwaService = new PWAService()

export default pwaService
