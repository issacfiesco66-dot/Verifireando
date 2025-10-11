import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  CreditCard,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('notifications')
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      appointmentReminders: true,
      statusUpdates: true,
      promotions: false,
      newsletter: false
    },
    privacy: {
      shareLocation: true,
      showOnlineStatus: true,
      allowDataCollection: false,
      marketingEmails: false
    },
    preferences: {
      language: 'es',
      theme: 'light',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    security: {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await userService.getSettings()
      setSettings(prev => ({
        ...prev,
        ...response.data
      }))
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (category, newSettings) => {
    try {
      setSaving(true)
      const updatedSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          ...newSettings
        }
      }
      
      await userService.updateSettings(updatedSettings)
      setSettings(updatedSettings)
      toast.success('Configuración actualizada')
    } catch (error) {
      toast.error('Error al actualizar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (category, setting) => {
    const newValue = !settings[category][setting]
    updateSettings(category, { [setting]: newValue })
  }

  const handleSelectChange = (category, setting, value) => {
    updateSettings(category, { [setting]: value })
  }

  const exportData = async () => {
    try {
      const response = await userService.exportData()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `verifireando-data-${user.id}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Datos exportados correctamente')
    } catch (error) {
      toast.error('Error al exportar datos')
    }
  }

  const deleteAccount = async () => {
    const confirmation = prompt(
      'Para confirmar la eliminación de tu cuenta, escribe "ELIMINAR" (en mayúsculas):'
    )
    
    if (confirmation !== 'ELIMINAR') {
      toast.error('Confirmación incorrecta')
      return
    }

    try {
      await userService.deleteAccount()
      toast.success('Cuenta eliminada correctamente')
      // Redirect to login or home
    } catch (error) {
      toast.error('Error al eliminar la cuenta')
    }
  }

  const tabs = [
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'preferences', label: 'Preferencias', icon: Globe },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'data', label: 'Datos', icon: Download }
  ]

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  if (loading) {
    return <LoadingSpinner text="Cargando configuración..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">
              Personaliza tu experiencia en Verifireando
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notificaciones
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Notificaciones por email
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Notificaciones generales
                              </p>
                              <p className="text-sm text-gray-500">
                                Recibe actualizaciones importantes por email
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.email}
                            onChange={() => handleToggle('notifications', 'email')}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Recordatorios de citas
                              </p>
                              <p className="text-sm text-gray-500">
                                Recibe recordatorios antes de tus citas
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.appointmentReminders}
                            onChange={() => handleToggle('notifications', 'appointmentReminders')}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Actualizaciones de estado
                              </p>
                              <p className="text-sm text-gray-500">
                                Notificaciones cuando cambie el estado de tu cita
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.statusUpdates}
                            onChange={() => handleToggle('notifications', 'statusUpdates')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Notificaciones push
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Notificaciones push
                              </p>
                              <p className="text-sm text-gray-500">
                                Recibe notificaciones en tiempo real
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.push}
                            onChange={() => handleToggle('notifications', 'push')}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Notificaciones SMS
                              </p>
                              <p className="text-sm text-gray-500">
                                Recibe notificaciones importantes por SMS
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.sms}
                            onChange={() => handleToggle('notifications', 'sms')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Marketing y promociones
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Promociones y ofertas
                            </p>
                            <p className="text-sm text-gray-500">
                              Recibe información sobre descuentos y ofertas especiales
                            </p>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.promotions}
                            onChange={() => handleToggle('notifications', 'promotions')}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Newsletter
                            </p>
                            <p className="text-sm text-gray-500">
                              Recibe nuestro boletín mensual con noticias y consejos
                            </p>
                          </div>
                          <ToggleSwitch
                            enabled={settings.notifications.newsletter}
                            onChange={() => handleToggle('notifications', 'newsletter')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Privacidad
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Compartir ubicación
                          </p>
                          <p className="text-sm text-gray-500">
                            Permite que los verificadores vean tu ubicación durante el servicio
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.privacy.shareLocation}
                        onChange={() => handleToggle('privacy', 'shareLocation')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Eye className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Mostrar estado en línea
                          </p>
                          <p className="text-sm text-gray-500">
                            Permite que otros usuarios vean cuando estás en línea
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.privacy.showOnlineStatus}
                        onChange={() => handleToggle('privacy', 'showOnlineStatus')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Recopilación de datos
                        </p>
                        <p className="text-sm text-gray-500">
                          Permite recopilar datos anónimos para mejorar el servicio
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.privacy.allowDataCollection}
                        onChange={() => handleToggle('privacy', 'allowDataCollection')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Emails de marketing
                        </p>
                        <p className="text-sm text-gray-500">
                          Permite recibir emails promocionales de terceros
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.privacy.marketingEmails}
                        onChange={() => handleToggle('privacy', 'marketingEmails')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Preferencias
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Idioma
                        </label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => handleSelectChange('preferences', 'language', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tema
                        </label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => handleSelectChange('preferences', 'theme', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="light">Claro</option>
                          <option value="dark">Oscuro</option>
                          <option value="auto">Automático</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Moneda
                        </label>
                        <select
                          value={settings.preferences.currency}
                          onChange={(e) => handleSelectChange('preferences', 'currency', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="MXN">Peso Mexicano (MXN)</option>
                          <option value="USD">Dólar Americano (USD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zona horaria
                        </label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) => handleSelectChange('preferences', 'timezone', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="America/Mexico_City">Ciudad de México</option>
                          <option value="America/Cancun">Cancún</option>
                          <option value="America/Tijuana">Tijuana</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Formato de fecha
                        </label>
                        <select
                          value={settings.preferences.dateFormat}
                          onChange={(e) => handleSelectChange('preferences', 'dateFormat', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Formato de hora
                        </label>
                        <select
                          value={settings.preferences.timeFormat}
                          onChange={(e) => handleSelectChange('preferences', 'timeFormat', e.target.value)}
                          className="input input-md w-full"
                        >
                          <option value="24h">24 horas</option>
                          <option value="12h">12 horas (AM/PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Seguridad
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Autenticación de dos factores
                        </p>
                        <p className="text-sm text-gray-500">
                          Agrega una capa extra de seguridad a tu cuenta
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.twoFactorEnabled}
                        onChange={() => handleToggle('security', 'twoFactorEnabled')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Notificaciones de inicio de sesión
                        </p>
                        <p className="text-sm text-gray-500">
                          Recibe notificaciones cuando alguien acceda a tu cuenta
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.loginNotifications}
                        onChange={() => handleToggle('security', 'loginNotifications')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo de espera de sesión (minutos)
                      </label>
                      <select
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSelectChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="input input-md w-full max-w-xs"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={60}>1 hora</option>
                        <option value={120}>2 horas</option>
                        <option value={0}>Sin límite</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Gestión de datos
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Export Data */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Download className="w-6 h-6 text-primary-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Exportar datos
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Descarga una copia de todos tus datos personales, citas, vehículos y configuraciones.
                      </p>
                      <button
                        onClick={exportData}
                        className="btn btn-primary btn-md"
                      >
                        Exportar mis datos
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <div className="flex items-center space-x-3 mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-medium text-red-900">
                          Eliminar cuenta
                        </h3>
                      </div>
                      <p className="text-red-700 mb-4">
                        Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
                        Esta acción no se puede deshacer.
                      </p>
                      <button
                        onClick={deleteAccount}
                        className="btn btn-error btn-md"
                      >
                        Eliminar mi cuenta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {saving && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-primary-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings