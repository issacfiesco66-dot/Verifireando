import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react'
import pwaService from '../../services/pwaService'
import logger from '../../utils/logger'

const PWAInstallPrompt = () => {
  if (import.meta.env.DEV) {
    return null
  }
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [appInfo, setAppInfo] = useState(pwaService.getAppInfo())
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Update app info
    const updateAppInfo = () => {
      setAppInfo(pwaService.getAppInfo())
    }

    // Handle install prompt availability
    const handleInstallPromptAvailable = () => {
      const info = pwaService.getAppInfo()
      setAppInfo(info)
      // Show prompt after a short delay if not already installed
      if (!info.isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 1000)
      }
    }

    // Handle app installation
    const handleAppInstalled = () => {
      updateAppInfo()
      setShowPrompt(false)
      setIsInstalling(false)
    }

    // Handle connection changes
    const handleConnectionChange = (event) => {
      setIsOnline(event.detail.isOnline)
    }

    // Setup event listeners
    pwaService.on('installPromptAvailable', handleInstallPromptAvailable)
    pwaService.on('appInstalled', handleAppInstalled)
    pwaService.on('connectionChanged', handleConnectionChange)

    // Initial check
    updateAppInfo()
    // If the prompt is already available (event fired before listeners), show banner
    const info = pwaService.getAppInfo()
    if (pwaService.deferredPrompt && !info.isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
      setShowPrompt(true)
    }

    return () => {
      pwaService.off('installPromptAvailable', handleInstallPromptAvailable)
      pwaService.off('appInstalled', handleAppInstalled)
      pwaService.off('connectionChanged', handleConnectionChange)
    }
  }, [])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const installed = await pwaService.showInstallPrompt()
      if (!installed) {
        setIsInstalling(false)
      }
    } catch (error) {
      logger.pwa('Error installing app:', error)
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed or no install prompt available
  if (!showPrompt || appInfo.isInstalled || !appInfo.canInstall) {
    return null
  }

  return (
    <>
      {/* Install Prompt Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  ¡Instala Verifireando en tu dispositivo!
                </p>
                <p className="text-xs text-primary-100">
                  Acceso rápido, notificaciones y funcionalidad offline
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-700 mr-1"></div>
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    Instalar
                  </>
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center p-1.5 border border-transparent rounded-md text-primary-100 hover:text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        {!isOnline && (
          <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Sin conexión</span>
          </div>
        )}
      </div>
    </>
  )
}

// PWA Status Component for settings/info
export const PWAStatus = () => {
  const [appInfo, setAppInfo] = useState(pwaService.getAppInfo())
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const updateAppInfo = () => {
      setAppInfo(pwaService.getAppInfo())
    }

    const handleUpdateAvailable = () => {
      updateAppInfo()
    }

    pwaService.on('updateAvailable', handleUpdateAvailable)
    pwaService.on('appInstalled', updateAppInfo)
    pwaService.on('displayModeChanged', updateAppInfo)

    return () => {
      pwaService.off('updateAvailable', handleUpdateAvailable)
      pwaService.off('appInstalled', updateAppInfo)
      pwaService.off('displayModeChanged', updateAppInfo)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await pwaService.updateServiceWorker()
    } catch (error) {
      logger.pwa('Error updating app:', error)
      setIsUpdating(false)
    }
  }

  const handleInstall = async () => {
    try {
      await pwaService.showInstallPrompt()
    } catch (error) {
      logger.pwa('Error installing app:', error)
    }
  }

  const handleRequestNotifications = async () => {
    try {
      await pwaService.requestNotificationPermission()
      setAppInfo(pwaService.getAppInfo())
    } catch (error) {
      console.error('Error requesting notifications:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Estado de la Aplicación</h3>
        <div className="flex items-center space-x-2">
          {appInfo.isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          {appInfo.isStandalone ? (
            <Smartphone className="h-5 w-5 text-blue-500" />
          ) : (
            <Monitor className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Instalación</p>
            <p className="text-xs text-gray-500">
              {appInfo.isInstalled ? 'Aplicación instalada' : 'No instalada'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${appInfo.isInstalled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            {!appInfo.isInstalled && appInfo.canInstall && (
              <button
                onClick={handleInstall}
                className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
              >
                Instalar
              </button>
            )}
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Service Worker</p>
            <p className="text-xs text-gray-500">
              {appInfo.hasServiceWorker ? 'Activo' : 'No disponible'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${appInfo.hasServiceWorker ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            {appInfo.hasServiceWorker && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar'}
              </button>
            )}
          </div>
        </div>

        {/* Notifications Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Notificaciones</p>
            <p className="text-xs text-gray-500">
              {appInfo.notificationPermission === 'granted' ? 'Habilitadas' : 
               appInfo.notificationPermission === 'denied' ? 'Bloqueadas' : 'No configuradas'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              appInfo.notificationPermission === 'granted' ? 'bg-green-500' : 
              appInfo.notificationPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            {appInfo.notificationPermission === 'default' && (
              <button
                onClick={handleRequestNotifications}
                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
              >
                Habilitar
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Conexión</p>
            <p className="text-xs text-gray-500">
              {appInfo.isOnline ? 'En línea' : 'Sin conexión'}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${appInfo.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt