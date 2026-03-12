import React, { useState, useEffect } from 'react'
import { Bell, Lock, Globe, Eye, EyeOff, Save, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { userService, authService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      enabled ? 'bg-primary-600' : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
)

const Settings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    newAppointments: true,
    statusUpdates: true,
    paymentNotifications: true
  })
  const [preferences, setPreferences] = useState({
    language: 'es',
    timezone: 'America/Mexico_City'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await userService.getSettings()
      if (res.data?.notifications) setNotifications(prev => ({ ...prev, ...res.data.notifications }))
      if (res.data?.preferences) setPreferences(prev => ({ ...prev, ...res.data.preferences }))
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    try {
      setSaving(true)
      await userService.updateSettings({ notifications: updated })
      toast.success('Configuración guardada')
    } catch (_) {
      toast.error('Error al guardar la configuración')
      setNotifications(notifications)
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = async (key, value) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    try {
      setSaving(true)
      await userService.updateSettings({ preferences: updated })
      toast.success('Preferencia guardada')
    } catch (_) {
      toast.error('Error al guardar la preferencia')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (pwdForm.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    try {
      setPwdSaving(true)
      await authService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      })
      toast.success('Contraseña actualizada correctamente')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    } finally {
      setPwdSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando configuración..." />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">Administra tus preferencias y configuración de cuenta</p>
      </div>

      <div className="space-y-6">
        {/* Notificaciones */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
            {saving && <RefreshCw className="w-4 h-4 text-primary-600 animate-spin ml-auto" />}
          </div>
          <div className="space-y-5">
            {[
              { key: 'push', label: 'Notificaciones push', desc: 'Recibe notificaciones en tiempo real de nuevas citas' },
              { key: 'email', label: 'Notificaciones por email', desc: 'Recibe resúmenes diarios y actualizaciones por correo' },
              { key: 'sms', label: 'Notificaciones SMS', desc: 'Recibe alertas críticas por mensaje de texto' },
              { key: 'newAppointments', label: 'Nuevas citas disponibles', desc: 'Notificar cuando haya citas disponibles cerca' },
              { key: 'statusUpdates', label: 'Actualizaciones de estado', desc: 'Cambios de estado en tus citas asignadas' },
              { key: 'paymentNotifications', label: 'Notificaciones de pago', desc: 'Confirmaciones y actualizaciones de tus ganancias' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
                <ToggleSwitch enabled={notifications[key]} onChange={() => handleToggle(key)} disabled={saving} />
              </div>
            ))}
          </div>
        </div>

        {/* Seguridad - Cambiar Contraseña */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
          </div>
          <h3 className="font-medium text-gray-900 mb-4">Cambiar contraseña</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual *</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  required
                  value={pwdForm.currentPassword}
                  onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="input input-md w-full pr-10"
                  placeholder="Tu contraseña actual"
                />
                <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showCurrentPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="input input-md w-full pr-10"
                  placeholder="Mínimo 8 caracteres"
                />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showNewPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña *</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  required
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  className={`input input-md w-full pr-10 ${pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="Repite la nueva contraseña"
                />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showConfirmPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
            <button
              type="submit"
              disabled={pwdSaving || !pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword}
              className="btn btn-primary btn-md flex items-center space-x-2 disabled:opacity-50"
            >
              {pwdSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : <><Save className="w-4 h-4" /><span>Cambiar contraseña</span></>}
            </button>
          </form>
        </div>

        {/* Preferencias */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Preferencias</h2>
          </div>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
              <select
                value={preferences.language}
                onChange={e => handlePreferenceChange('language', e.target.value)}
                className="input input-md w-full"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zona horaria</label>
              <select
                value={preferences.timezone}
                onChange={e => handlePreferenceChange('timezone', e.target.value)}
                className="input input-md w-full"
              >
                <option value="America/Mexico_City">Ciudad de México</option>
                <option value="America/Cancun">Cancún</option>
                <option value="America/Tijuana">Tijuana</option>
                <option value="America/New_York">Nueva York (ET)</option>
                <option value="America/Los_Angeles">Los Ángeles (PT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
