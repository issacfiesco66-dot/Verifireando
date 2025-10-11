import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Check,
  X,
  AlertCircle,
  Camera,
  Upload
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Personal Info Form
  const {
    register: registerPersonal,
    handleSubmit: handleSubmitPersonal,
    setValue: setValuePersonal,
    formState: { errors: errorsPersonal }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    }
  })

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: errorsPassword }
  } = useForm()

  // Notifications Form
  const {
    register: registerNotifications,
    handleSubmit: handleSubmitNotifications,
    setValue: setValueNotifications,
    watch: watchNotifications
  } = useForm({
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      promotionalEmails: false
    }
  })

  const newPassword = watchPassword('newPassword')

  useEffect(() => {
    if (user) {
      // Set personal info values
      setValuePersonal('name', user.name || '')
      setValuePersonal('email', user.email || '')
      setValuePersonal('phone', user.phone || '')
      setValuePersonal('address', user.address || '')

      // Set notification preferences
      if (user.preferences) {
        Object.keys(user.preferences).forEach(key => {
          setValueNotifications(key, user.preferences[key])
        })
      }
    }
  }, [user, setValuePersonal, setValueNotifications])

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG o PNG')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede ser mayor a 2MB')
      return
    }

    setAvatar(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async () => {
    if (!avatar) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('avatar', avatar)

      const response = await userService.uploadAvatar(formData)
      updateUser(response.data)
      setAvatar(null)
      setAvatarPreview(null)
      toast.success('Foto de perfil actualizada')
    } catch (error) {
      toast.error('Error al subir la foto de perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPersonal = async (data) => {
    try {
      setLoading(true)
      const response = await userService.updateProfile(data)
      updateUser(response.data)
      toast.success('Perfil actualizado exitosamente')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPassword = async (data) => {
    try {
      setLoading(true)
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      resetPassword()
      toast.success('Contraseña actualizada exitosamente')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitNotifications = async (data) => {
    try {
      setLoading(true)
      const response = await userService.updateNotificationPreferences(data)
      updateUser(response.data)
      toast.success('Preferencias de notificaciones actualizadas')
    } catch (error) {
      toast.error('Error al actualizar las preferencias')
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      setLoading(true)
      await userService.resendVerificationEmail()
      toast.success('Email de verificación enviado')
    } catch (error) {
      toast.error('Error al enviar el email de verificación')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Información personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
            <p className="text-gray-600">
              Gestiona tu información personal y configuraciones de cuenta
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                {/* Profile Picture */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Foto de perfil
                  </h3>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {avatar && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={uploadAvatar}
                          disabled={loading}
                          className="btn btn-primary btn-sm flex items-center space-x-2"
                        >
                          {loading ? (
                            <LoadingSpinner size="sm" color="white" />
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir foto</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setAvatar(null)
                            setAvatarPreview(null)
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG o PNG. Máximo 2MB.
                  </p>
                </div>

                {/* Email Verification Status */}
                {!user?.emailVerified && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-warning-900">
                          Email no verificado
                        </h4>
                        <p className="text-sm text-warning-700 mt-1">
                          Tu email no ha sido verificado. Verifica tu email para acceder a todas las funciones.
                        </p>
                        <button
                          onClick={resendVerificationEmail}
                          disabled={loading}
                          className="mt-2 text-sm font-medium text-warning-800 hover:text-warning-900 underline"
                        >
                          Reenviar email de verificación
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Info Form */}
                <form onSubmit={handleSubmitPersonal(onSubmitPersonal)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        className={`input input-md w-full ${errorsPersonal.name ? 'border-error-500' : ''}`}
                        {...registerPersonal('name', {
                          required: 'El nombre es requerido',
                          minLength: {
                            value: 2,
                            message: 'El nombre debe tener al menos 2 caracteres'
                          }
                        })}
                      />
                      {errorsPersonal.name && (
                        <p className="mt-1 text-sm text-error-600">{errorsPersonal.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        className={`input input-md w-full ${errorsPersonal.email ? 'border-error-500' : ''}`}
                        {...registerPersonal('email', {
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                      />
                      {errorsPersonal.email && (
                        <p className="mt-1 text-sm text-error-600">{errorsPersonal.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        className="input input-md w-full"
                        {...registerPersonal('phone')}
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        className="input input-md w-full"
                        {...registerPersonal('address')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-md flex items-center space-x-2"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Guardar cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Cambiar contraseña
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Asegúrate de usar una contraseña segura para proteger tu cuenta.
                  </p>

                  <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          className={`input input-md w-full pr-10 ${errorsPassword.currentPassword ? 'border-error-500' : ''}`}
                          {...registerPassword('currentPassword', {
                            required: 'La contraseña actual es requerida'
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errorsPassword.currentPassword && (
                        <p className="mt-1 text-sm text-error-600">{errorsPassword.currentPassword.message}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          className={`input input-md w-full pr-10 ${errorsPassword.newPassword ? 'border-error-500' : ''}`}
                          {...registerPassword('newPassword', {
                            required: 'La nueva contraseña es requerida',
                            minLength: {
                              value: 8,
                              message: 'La contraseña debe tener al menos 8 caracteres'
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
                            }
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errorsPassword.newPassword && (
                        <p className="mt-1 text-sm text-error-600">{errorsPassword.newPassword.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`input input-md w-full pr-10 ${errorsPassword.confirmPassword ? 'border-error-500' : ''}`}
                          {...registerPassword('confirmPassword', {
                            required: 'Confirma tu nueva contraseña',
                            validate: value => value === newPassword || 'Las contraseñas no coinciden'
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errorsPassword.confirmPassword && (
                        <p className="mt-1 text-sm text-error-600">{errorsPassword.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-md flex items-center space-x-2"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Cambiar contraseña</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Preferencias de notificaciones
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Configura cómo y cuándo quieres recibir notificaciones.
                  </p>

                  <form onSubmit={handleSubmitNotifications(onSubmitNotifications)} className="space-y-6">
                    <div className="space-y-4">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Notificaciones por email</h4>
                          <p className="text-sm text-gray-500">
                            Recibe actualizaciones importantes por email
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...registerNotifications('emailNotifications')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* Push Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Notificaciones push</h4>
                          <p className="text-sm text-gray-500">
                            Recibe notificaciones en tiempo real en tu navegador
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...registerNotifications('pushNotifications')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* SMS Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Notificaciones por SMS</h4>
                          <p className="text-sm text-gray-500">
                            Recibe mensajes de texto para actualizaciones críticas
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...registerNotifications('smsNotifications')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* Appointment Reminders */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Recordatorios de citas</h4>
                          <p className="text-sm text-gray-500">
                            Recibe recordatorios antes de tus citas programadas
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...registerNotifications('appointmentReminders')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* Promotional Emails */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Emails promocionales</h4>
                          <p className="text-sm text-gray-500">
                            Recibe ofertas especiales y promociones
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...registerNotifications('promotionalEmails')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-md flex items-center space-x-2"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Guardar preferencias</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile