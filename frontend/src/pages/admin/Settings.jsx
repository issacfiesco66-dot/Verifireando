import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Globe,
  Database,
  Mail,
  Smartphone,
  Key,
  Users,
  Car,
  DollarSign,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  Edit,
  Copy
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState({})
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Verifireando',
      siteDescription: 'Plataforma de verificación vehicular',
      contactEmail: 'contacto@verifireando.com',
      contactPhone: '+52 55 1234 5678',
      timezone: 'America/Mexico_City',
      language: 'es',
      currency: 'MXN',
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerDay: 100
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      paymentNotifications: true,
      systemAlerts: true,
      marketingEmails: false,
      reminderHours: 24,
      maxNotificationsPerUser: 10
    },
    security: {
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorRequired: false,
      ipWhitelist: [],
      allowedDomains: []
    },
    integrations: {
      mapbox: {
        enabled: false,
        apiKey: '',
        defaultZoom: 12,
        defaultCenter: { lat: 19.4326, lng: -99.1332 }
      },
      stripe: {
        enabled: false,
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        currency: 'mxn'
      },
      twilio: {
        enabled: false,
        accountSid: '',
        authToken: '',
        phoneNumber: ''
      },
      sendgrid: {
        enabled: false,
        apiKey: '',
        fromEmail: '',
        fromName: ''
      }
    },
    business: {
      operatingHours: {
        monday: { open: '08:00', close: '18:00', enabled: true },
        tuesday: { open: '08:00', close: '18:00', enabled: true },
        wednesday: { open: '08:00', close: '18:00', enabled: true },
        thursday: { open: '08:00', close: '18:00', enabled: true },
        friday: { open: '08:00', close: '18:00', enabled: true },
        saturday: { open: '09:00', close: '15:00', enabled: true },
        sunday: { open: '09:00', close: '15:00', enabled: false }
      },
      appointmentDuration: 60,
      maxAppointmentsPerDay: 50,
      advanceBookingDays: 30,
      cancellationHours: 24,
      servicePrices: {
        verification: 500,
        inspection: 300,
        maintenance: 800,
        repair: 1200
      },
      taxRate: 16
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSettings()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await adminService.updateSettings(settings)
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const testIntegration = async (service) => {
    try {
      const result = await adminService.testIntegration(service)
      if (result.success) {
        toast.success(`Integración con ${service} exitosa`)
      } else {
        toast.error(`Error en integración con ${service}: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error testing ${service}:`, error)
      toast.error(`Error al probar integración con ${service}`)
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const updateNestedSetting = (section, subsection, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }))
  }

  const addToList = (section, key, value) => {
    if (value.trim()) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: [...prev[section][key], value.trim()]
        }
      }))
    }
  }

  const removeFromList = (section, key, index) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: prev[section][key].filter((_, i) => i !== index)
      }
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const exportSettings = async () => {
    try {
      const blob = await adminService.exportSettings()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `configuracion_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Configuración exportada exitosamente')
    } catch (error) {
      console.error('Error exporting settings:', error)
      toast.error('Error al exportar la configuración')
    }
  }

  const importSettings = async (file) => {
    try {
      const formData = new FormData()
      formData.append('settings', file)
      const data = await adminService.importSettings(formData)
      setSettings(data)
      toast.success('Configuración importada exitosamente')
    } catch (error) {
      console.error('Error importing settings:', error)
      toast.error('Error al importar la configuración')
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'integrations', name: 'Integraciones', icon: Globe },
    { id: 'business', name: 'Negocio', icon: DollarSign }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600">
            Administra la configuración general de la plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportSettings}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <label className="btn btn-secondary btn-md flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files[0] && importSettings(e.target.files[0])}
            />
          </label>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-primary btn-md flex items-center space-x-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-soft p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-soft p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuración General</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Sitio
                    </label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={settings.general.contactPhone}
                      onChange={(e) => updateSetting('general', 'contactPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/Mexico_City">Ciudad de México</option>
                      <option value="America/Cancun">Cancún</option>
                      <option value="America/Mazatlan">Mazatlán</option>
                      <option value="America/Tijuana">Tijuana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Sitio
                  </label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Modo de Mantenimiento</h3>
                      <p className="text-sm text-gray-500">Desactiva temporalmente el sitio para mantenimiento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Registro Habilitado</h3>
                      <p className="text-sm text-gray-500">Permite que nuevos usuarios se registren</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.registrationEnabled}
                        onChange={(e) => updateSetting('general', 'registrationEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuración de Notificaciones</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones por Email</h3>
                      <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) => updateSetting('notifications', 'emailEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones por SMS</h3>
                      <p className="text-sm text-gray-500">Enviar notificaciones por mensaje de texto</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.smsEnabled}
                        onChange={(e) => updateSetting('notifications', 'smsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones Push</h3>
                      <p className="text-sm text-gray-500">Enviar notificaciones push a dispositivos móviles</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushEnabled}
                        onChange={(e) => updateSetting('notifications', 'pushEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Recordatorios de Citas</h3>
                      <p className="text-sm text-gray-500">Enviar recordatorios automáticos de citas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.appointmentReminders}
                        onChange={(e) => updateSetting('notifications', 'appointmentReminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas de Recordatorio
                    </label>
                    <input
                      type="number"
                      value={settings.notifications.reminderHours}
                      onChange={(e) => updateSetting('notifications', 'reminderHours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo Notificaciones por Usuario
                    </label>
                    <input
                      type="number"
                      value={settings.notifications.maxNotificationsPerUser}
                      onChange={(e) => updateSetting('notifications', 'maxNotificationsPerUser', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuración de Seguridad</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud Mínima de Contraseña
                    </label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Sesión (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo Intentos de Login
                    </label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración de Bloqueo (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Requerir Caracteres Especiales</h3>
                      <p className="text-sm text-gray-500">Las contraseñas deben incluir caracteres especiales</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordRequireSpecial}
                        onChange={(e) => updateSetting('security', 'passwordRequireSpecial', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Requerir Números</h3>
                      <p className="text-sm text-gray-500">Las contraseñas deben incluir números</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.passwordRequireNumbers}
                        onChange={(e) => updateSetting('security', 'passwordRequireNumbers', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Autenticación de Dos Factores</h3>
                      <p className="text-sm text-gray-500">Requerir 2FA para todos los usuarios</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorRequired}
                        onChange={(e) => updateSetting('security', 'twoFactorRequired', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Integraciones</h2>
                
                {/* Mapbox */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Mapbox</h3>
                        <p className="text-sm text-gray-500">Servicios de mapas y geolocalización</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testIntegration('mapbox')}
                        className="btn btn-secondary btn-sm"
                      >
                        Probar
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.mapbox.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'mapbox', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {settings.integrations.mapbox.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.mapbox ? 'text' : 'password'}
                            value={settings.integrations.mapbox.apiKey}
                            onChange={(e) => updateNestedSetting('integrations', 'mapbox', 'apiKey', e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ..."
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('mapbox')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.mapbox ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stripe */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Stripe</h3>
                        <p className="text-sm text-gray-500">Procesamiento de pagos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testIntegration('stripe')}
                        className="btn btn-secondary btn-sm"
                      >
                        Probar
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.stripe.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'stripe', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {settings.integrations.stripe.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Public Key
                        </label>
                        <input
                          type="text"
                          value={settings.integrations.stripe.publicKey}
                          onChange={(e) => updateNestedSetting('integrations', 'stripe', 'publicKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="pk_test_..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secret Key
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.stripe ? 'text' : 'password'}
                            value={settings.integrations.stripe.secretKey}
                            onChange={(e) => updateNestedSetting('integrations', 'stripe', 'secretKey', e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="sk_test_..."
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('stripe')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.stripe ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Twilio */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-6 h-6 text-red-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Twilio</h3>
                        <p className="text-sm text-gray-500">Servicios de SMS y llamadas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testIntegration('twilio')}
                        className="btn btn-secondary btn-sm"
                      >
                        Probar
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.twilio.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'twilio', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {settings.integrations.twilio.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account SID
                        </label>
                        <input
                          type="text"
                          value={settings.integrations.twilio.accountSid}
                          onChange={(e) => updateNestedSetting('integrations', 'twilio', 'accountSid', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="AC..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auth Token
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.twilio ? 'text' : 'password'}
                            value={settings.integrations.twilio.authToken}
                            onChange={(e) => updateNestedSetting('integrations', 'twilio', 'authToken', e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('twilio')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.twilio ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuración del Negocio</h2>
                
                {/* Operating Hours */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de Operación</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.business.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {day === 'monday' ? 'Lunes' :
                             day === 'tuesday' ? 'Martes' :
                             day === 'wednesday' ? 'Miércoles' :
                             day === 'thursday' ? 'Jueves' :
                             day === 'friday' ? 'Viernes' :
                             day === 'saturday' ? 'Sábado' : 'Domingo'}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hours.enabled}
                            onChange={(e) => updateNestedSetting('business', 'operatingHours', day, { ...hours, enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        {hours.enabled && (
                          <>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateNestedSetting('business', 'operatingHours', day, { ...hours, open: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateNestedSetting('business', 'operatingHours', day, { ...hours, close: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Prices */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Precios de Servicios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.business.servicePrices).map(([service, price]) => (
                      <div key={service}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {service === 'verification' ? 'Verificación' :
                           service === 'inspection' ? 'Inspección' :
                           service === 'maintenance' ? 'Mantenimiento' : 'Reparación'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => updateNestedSetting('business', 'servicePrices', service, parseFloat(e.target.value))}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Business Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración de Cita (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.business.appointmentDuration}
                      onChange={(e) => updateSetting('business', 'appointmentDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo Citas por Día
                    </label>
                    <input
                      type="number"
                      value={settings.business.maxAppointmentsPerDay}
                      onChange={(e) => updateSetting('business', 'maxAppointmentsPerDay', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Reserva Anticipada
                    </label>
                    <input
                      type="number"
                      value={settings.business.advanceBookingDays}
                      onChange={(e) => updateSetting('business', 'advanceBookingDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas de Cancelación
                    </label>
                    <input
                      type="number"
                      value={settings.business.cancellationHours}
                      onChange={(e) => updateSetting('business', 'cancellationHours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tasa de Impuesto (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.business.taxRate}
                      onChange={(e) => updateSetting('business', 'taxRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings