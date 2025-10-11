import React, { useState, useEffect } from 'react'
import { 
  User, 
  Car, 
  Shield, 
  Bell, 
  Camera, 
  Edit, 
  Save, 
  Eye, 
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Star,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { userService, driverService } from '../../services/api'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')
  const [driverStats, setDriverStats] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Forms
  const personalForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: ''
    }
  })

  const securityForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const vehicleForm = useForm({
    defaultValues: {
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      color: '',
      type: ''
    }
  })

  const [notifications, setNotifications] = useState({
    newAppointments: true,
    appointmentUpdates: true,
    paymentNotifications: true,
    systemUpdates: false,
    promotions: false
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      
      // Fetch driver stats
      const statsResponse = await driverService.getStats()
      setDriverStats(statsResponse.data)
      
      // Fetch vehicle info
      const vehicleResponse = await driverService.getVehicle()
      setVehicle(vehicleResponse.data)
      
      // Set form values
      personalForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || ''
      })

      if (vehicleResponse.data) {
        vehicleForm.reset({
          make: vehicleResponse.data.make || '',
          model: vehicleResponse.data.model || '',
          year: vehicleResponse.data.year || '',
          licensePlate: vehicleResponse.data.licensePlate || '',
          color: vehicleResponse.data.color || '',
          type: vehicleResponse.data.type || ''
        })
      }
      
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }

      setAvatar(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatar) return

    try {
      const formData = new FormData()
      formData.append('avatar', avatar)
      
      const response = await userService.uploadAvatar(formData)
      updateUser({ ...user, avatar: response.data.avatarUrl })
      setAvatar(null)
      setAvatarPreview(null)
      toast.success('Foto de perfil actualizada')
    } catch (error) {
      toast.error('Error al subir la foto')
    }
  }

  const updatePersonalInfo = async (data) => {
    try {
      const response = await userService.updateProfile(data)
      updateUser(response.data)
      toast.success('Información personal actualizada')
    } catch (error) {
      toast.error('Error al actualizar la información')
    }
  }

  const updatePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      securityForm.reset()
      toast.success('Contraseña actualizada')
    } catch (error) {
      toast.error('Error al cambiar la contraseña')
    }
  }

  const updateVehicleInfo = async (data) => {
    try {
      const response = await driverService.updateVehicle(data)
      setVehicle(response.data)
      toast.success('Información del vehículo actualizada')
    } catch (error) {
      toast.error('Error al actualizar el vehículo')
    }
  }

  const updateNotificationSettings = async (newSettings) => {
    try {
      await userService.updateNotificationSettings(newSettings)
      setNotifications(newSettings)
      toast.success('Configuración de notificaciones actualizada')
    } catch (error) {
      toast.error('Error al actualizar las notificaciones')
    }
  }

  const handleNotificationToggle = (setting) => {
    const newSettings = {
      ...notifications,
      [setting]: !notifications[setting]
    }
    updateNotificationSettings(newSettings)
  }

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'vehicle', label: 'Vehículo', icon: Car },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
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
    return <LoadingSpinner text="Cargando perfil..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user.avatar ? (
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
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">Verificador vehicular</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">
                      {driverStats?.rating || '5.0'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-gray-600">
                      {driverStats?.totalAppointments || 0} verificaciones
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Avatar Button */}
              {avatar && (
                <button
                  onClick={uploadAvatar}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar foto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {driverStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total verificaciones</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {driverStats.totalAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Calificación</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {driverStats.rating}/5.0
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Este mes</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {driverStats.monthlyAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experiencia</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {driverStats.experienceYears || 1} años
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
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
              <form onSubmit={personalForm.handleSubmit(updatePersonalInfo)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información Personal
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      {...personalForm.register('name', { required: 'El nombre es requerido' })}
                      className="input input-md w-full"
                    />
                    {personalForm.formState.errors.name && (
                      <p className="text-error-600 text-sm mt-1">
                        {personalForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...personalForm.register('email', { 
                        required: 'El email es requerido',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className="input input-md w-full"
                    />
                    {personalForm.formState.errors.email && (
                      <p className="text-error-600 text-sm mt-1">
                        {personalForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      {...personalForm.register('phone', { required: 'El teléfono es requerido' })}
                      className="input input-md w-full"
                    />
                    {personalForm.formState.errors.phone && (
                      <p className="text-error-600 text-sm mt-1">
                        {personalForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      {...personalForm.register('address')}
                      className="input input-md w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contacto de emergencia
                    </label>
                    <input
                      {...personalForm.register('emergencyContact')}
                      className="input input-md w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de emergencia
                    </label>
                    <input
                      type="tel"
                      {...personalForm.register('emergencyPhone')}
                      className="input input-md w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={personalForm.formState.isSubmitting}
                    className="btn btn-primary btn-md flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </form>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && (
              <form onSubmit={vehicleForm.handleSubmit(updateVehicleInfo)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Vehículo de Trabajo
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      {...vehicleForm.register('make', { required: 'La marca es requerida' })}
                      className="input input-md w-full"
                    />
                    {vehicleForm.formState.errors.make && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.make.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <input
                      {...vehicleForm.register('model', { required: 'El modelo es requerido' })}
                      className="input input-md w-full"
                    />
                    {vehicleForm.formState.errors.model && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.model.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear()}
                      {...vehicleForm.register('year', { required: 'El año es requerido' })}
                      className="input input-md w-full"
                    />
                    {vehicleForm.formState.errors.year && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.year.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa
                    </label>
                    <input
                      {...vehicleForm.register('licensePlate', { required: 'La placa es requerida' })}
                      className="input input-md w-full"
                    />
                    {vehicleForm.formState.errors.licensePlate && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.licensePlate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      {...vehicleForm.register('color', { required: 'El color es requerido' })}
                      className="input input-md w-full"
                    />
                    {vehicleForm.formState.errors.color && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.color.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de vehículo
                    </label>
                    <select
                      {...vehicleForm.register('type', { required: 'El tipo es requerido' })}
                      className="input input-md w-full"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="sedan">Sedán</option>
                      <option value="suv">SUV</option>
                      <option value="pickup">Pickup</option>
                      <option value="van">Van</option>
                      <option value="motorcycle">Motocicleta</option>
                    </select>
                    {vehicleForm.formState.errors.type && (
                      <p className="text-error-600 text-sm mt-1">
                        {vehicleForm.formState.errors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={vehicleForm.formState.isSubmitting}
                    className="btn btn-primary btn-md flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={securityForm.handleSubmit(updatePassword)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Seguridad
                </h2>
                
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        {...securityForm.register('currentPassword', { required: 'La contraseña actual es requerida' })}
                        className="input input-md w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {securityForm.formState.errors.currentPassword && (
                      <p className="text-error-600 text-sm mt-1">
                        {securityForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        {...securityForm.register('newPassword', { 
                          required: 'La nueva contraseña es requerida',
                          minLength: {
                            value: 8,
                            message: 'La contraseña debe tener al menos 8 caracteres'
                          }
                        })}
                        className="input input-md w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {securityForm.formState.errors.newPassword && (
                      <p className="text-error-600 text-sm mt-1">
                        {securityForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        {...securityForm.register('confirmPassword', { required: 'Confirma la nueva contraseña' })}
                        className="input input-md w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {securityForm.formState.errors.confirmPassword && (
                      <p className="text-error-600 text-sm mt-1">
                        {securityForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={securityForm.formState.isSubmitting}
                    className="btn btn-primary btn-md flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Cambiar contraseña</span>
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Configuración de Notificaciones
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Nuevas citas</h3>
                      <p className="text-sm text-gray-500">
                        Recibe notificaciones cuando se te asigne una nueva cita
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.newAppointments}
                      onChange={() => handleNotificationToggle('newAppointments')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Actualizaciones de citas</h3>
                      <p className="text-sm text-gray-500">
                        Notificaciones sobre cambios en tus citas programadas
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.appointmentUpdates}
                      onChange={() => handleNotificationToggle('appointmentUpdates')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Notificaciones de pago</h3>
                      <p className="text-sm text-gray-500">
                        Recibe confirmaciones de pagos y transferencias
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.paymentNotifications}
                      onChange={() => handleNotificationToggle('paymentNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Actualizaciones del sistema</h3>
                      <p className="text-sm text-gray-500">
                        Notificaciones sobre mantenimiento y nuevas funciones
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.systemUpdates}
                      onChange={() => handleNotificationToggle('systemUpdates')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Promociones</h3>
                      <p className="text-sm text-gray-500">
                        Recibe información sobre promociones y ofertas especiales
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.promotions}
                      onChange={() => handleNotificationToggle('promotions')}
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

export default Profile