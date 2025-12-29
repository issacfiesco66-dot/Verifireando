import React, { useState, useEffect, useRef } from 'react'
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
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [documents, setDocuments] = useState({
    license: null,
    proofOfAddress: null,
    ine: null,
    termsAccepted: false
  })
  const [documentPreviews, setDocumentPreviews] = useState({})
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

  const documentsForm = useForm({
    defaultValues: {
      licenseNumber: '',
      licenseExpiry: '',
      termsAccepted: false
    }
  })

  const [notifications, setNotifications] = useState({
    newAppointments: true,
    appointmentUpdates: true,
    paymentNotifications: true,
    systemUpdates: false,
    promotions: false
  })

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchProfileData()
    }
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      
      // Simplificar para evitar bucles - solo datos básicos
      const statsResponse = await driverService.getStats()
      setDriverStats(statsResponse.data)
      
      const vehicleResponse = await driverService.getVehicle()
      setVehicle(vehicleResponse.data)
      
      // Resetear formularios solo una vez
      if (user && !personalForm.formState.isDirty) {
        personalForm.reset({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          emergencyContact: user.emergencyContact || '',
          emergencyPhone: user.emergencyPhone || ''
        })
      }
      
      if (vehicleResponse.data && !vehicleForm.formState.isDirty) {
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
      toast.error('Error al cargar datos del perfil')
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

  const handleDocumentChange = (docType, event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 10MB')
        return
      }
      
      setDocuments(prev => ({ ...prev, [docType]: file }))
      
      // Create preview for PDFs and images
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onload = (e) => {
          setDocumentPreviews(prev => ({ ...prev, [docType]: e.target.result }))
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const uploadDocuments = async () => {
    if (!documents.license || !documents.proofOfAddress || !documents.ine) {
      toast.error('Debes subir todos los documentos requeridos')
      return
    }
    
    if (!documentsForm.getValues('termsAccepted')) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }

    try {
      const formData = new FormData()
      formData.append('license', documents.license)
      formData.append('proofOfAddress', documents.proofOfAddress)
      formData.append('ine', documents.ine)
      formData.append('licenseNumber', documentsForm.getValues('licenseNumber'))
      formData.append('licenseExpiry', documentsForm.getValues('licenseExpiry'))
      formData.append('termsAccepted', documentsForm.getValues('termsAccepted'))
      
      const response = await driverService.uploadDocuments(user.id, formData)
      toast.success('Documentos subidos correctamente')
    } catch (error) {
      toast.error('Error al subir los documentos')
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
    { id: 'documents', label: 'Documentos', icon: Shield },
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
                      {driverStats?.rating?.average || driverStats?.rating || '5.0'}
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
                    {typeof driverStats.rating === 'object' ? driverStats.rating.average : driverStats.rating}/5.0
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
                    <label htmlFor="driver-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      id="driver-name"
                      type="text"
                      autoComplete="name"
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
                    <label htmlFor="driver-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="driver-email"
                      type="email"
                      autoComplete="email"
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
                    <label htmlFor="driver-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      id="driver-phone"
                      type="tel"
                      autoComplete="tel"
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
                    <label htmlFor="driver-address" className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      id="driver-address"
                      type="text"
                      autoComplete="street-address"
                      {...personalForm.register('address')}
                      className="input input-md w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="driver-emergency-contact" className="block text-sm font-medium text-gray-700 mb-2">
                      Contacto de emergencia
                    </label>
                    <input
                      id="driver-emergency-contact"
                      type="text"
                      autoComplete="name"
                      {...personalForm.register('emergencyContact')}
                      className="input input-md w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="driver-emergency-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de emergencia
                    </label>
                    <input
                      id="driver-emergency-phone"
                      type="tel"
                      autoComplete="tel"
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

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Documentos de Identificación
                </h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Debes subir los siguientes documentos para verificar tu cuenta:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
                    <li>Licencia de conducir vigente</li>
                    <li>Comprobante de domicilio (reciente)</li>
                    <li>INE/Identificación oficial</li>
                  </ul>
                </div>

                {/* License Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="license-number" className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Licencia
                    </label>
                    <input
                      id="license-number"
                      {...documentsForm.register('licenseNumber', { required: 'El número de licencia es requerido' })}
                      className="input input-md w-full"
                    />
                    {documentsForm.formState.errors.licenseNumber && (
                      <p className="text-error-600 text-sm mt-1">
                        {documentsForm.formState.errors.licenseNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="license-expiry" className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento
                    </label>
                    <input
                      id="license-expiry"
                      type="date"
                      {...documentsForm.register('licenseExpiry', { required: 'La fecha de vencimiento es requerida' })}
                      className="input input-md w-full"
                    />
                    {documentsForm.formState.errors.licenseExpiry && (
                      <p className="text-error-600 text-sm mt-1">
                        {documentsForm.formState.errors.licenseExpiry.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Licencia de Conducir
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentChange('license', e)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                          {documentPreviews.license ? (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600 font-medium">
                                {documents.license?.name}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setDocuments(prev => ({ ...prev, license: null }))
                                  setDocumentPreviews(prev => ({ ...prev, license: null }))
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600">
                                Haz clic para subir o arrastra el archivo
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, PDF (Máx. 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comprobante de Domicilio
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentChange('proofOfAddress', e)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                          {documentPreviews.proofOfAddress ? (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600 font-medium">
                                {documents.proofOfAddress?.name}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setDocuments(prev => ({ ...prev, proofOfAddress: null }))
                                  setDocumentPreviews(prev => ({ ...prev, proofOfAddress: null }))
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600">
                                Haz clic para subir o arrastra el archivo
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, PDF (Máx. 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      INE / Identificación Oficial
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentChange('ine', e)}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                          {documentPreviews.ine ? (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600 font-medium">
                                {documents.ine?.name}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setDocuments(prev => ({ ...prev, ine: null }))
                                  setDocumentPreviews(prev => ({ ...prev, ine: null }))
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600">
                                Haz clic para subir o arrastra el archivo
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, PDF (Máx. 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...documentsForm.register('termsAccepted', { required: 'Debes aceptar los términos y condiciones' })}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="text-sm">
                      <p className="text-gray-700">
                        Acepto los <a href="#" className="text-primary-600 hover:text-primary-700 underline">términos y condiciones</a> y autorizo el tratamiento de mis datos personales según la política de privacidad.
                      </p>
                      {documentsForm.formState.errors.termsAccepted && (
                        <p className="text-error-600 text-sm mt-1">
                          {documentsForm.formState.errors.termsAccepted.message}
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={uploadDocuments}
                    disabled={!documents.license || !documents.proofOfAddress || !documents.ine || !documentsForm.getValues('termsAccepted')}
                    className="btn btn-primary btn-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>Subir Documentos</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={securityForm.handleSubmit(updatePassword)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Seguridad
                </h2>
                
                <div className="max-w-md space-y-6">
                  <div>
                    <label htmlFor="driver-current-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        id="driver-current-password"
                        type={showPassword.current ? 'text' : 'password'}
                        autoComplete="current-password"
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
                    <label htmlFor="driver-new-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="driver-new-password"
                        type={showPassword.new ? 'text' : 'password'}
                        autoComplete="new-password"
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
                    <label htmlFor="driver-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="driver-confirm-password"
                        type={showPassword.confirm ? 'text' : 'password'}
                        autoComplete="new-password"
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