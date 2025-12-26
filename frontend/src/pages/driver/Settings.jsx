import React from 'react'
import { Settings as SettingsIcon, Bell, Lock, User, Globe } from 'lucide-react'

const Settings = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">Administra tus preferencias y configuración de cuenta</p>
      </div>

      <div className="space-y-6">
        {/* Notificaciones */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificaciones push</p>
                <p className="text-sm text-gray-500">Recibe notificaciones de nuevas citas</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificaciones por email</p>
                <p className="text-sm text-gray-500">Recibe resúmenes diarios por correo</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
          </div>
          <div className="space-y-4">
            <button className="btn btn-outline w-full sm:w-auto">
              Cambiar contraseña
            </button>
            <button className="btn btn-outline w-full sm:w-auto">
              Autenticación de dos factores
            </button>
          </div>
        </div>

        {/* Preferencias */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Preferencias</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select className="input w-full sm:w-64">
                <option>Español</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona horaria
              </label>
              <select className="input w-full sm:w-64">
                <option>America/Mexico_City</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
