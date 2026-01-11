import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  Phone, 
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  FileText,
  Upload,
  Download,
  Play,
  Pause,
  Square,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { appointmentService } from '../../services/api'
import MapComponent from '../../components/map/MapComponent'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const AppointmentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [appointment, setAppointment] = useState(null)
  const [photos, setPhotos] = useState([])
  const [documents, setDocuments] = useState([])
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    fetchAppointmentDetails()
  }, [id])

  useEffect(() => {
    if (socket) {
      socket.on('appointmentUpdated', handleAppointmentUpdated)
      socket.on('appointmentCancelled', handleAppointmentCancelled)

      return () => {
        socket.off('appointmentUpdated')
        socket.off('appointmentCancelled')
      }
    }
  }, [socket])

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getAppointment(id)
      setAppointment(response.data.appointment || response.data)
      setPhotos(response.data.photos || [])
      setDocuments(response.data.documents || [])
      setNotes(response.data.driverNotes || '')
    } catch (error) {
      toast.error('Error al cargar los detalles de la cita')
      navigate('/driver/appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdated = (updatedAppointment) => {
    if (updatedAppointment.id === appointment?.id) {
      setAppointment(updatedAppointment)
    }
  }

  const handleAppointmentCancelled = (appointmentId) => {
    if (appointmentId === appointment?.id) {
      toast.info('Esta cita ha sido cancelada')
      navigate('/driver/appointments')
    }
  }

  const updateAppointmentStatus = async (newStatus) => {
    try {
      setUpdating(true)
      await appointmentService.updateStatus(id, newStatus, {
        driverNotes: notes
      })
      
      setAppointment(prev => ({ ...prev, status: newStatus }))
      toast.success('Estado actualizado correctamente')
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('appointmentStatusUpdated', {
          appointmentId: id,
          status: newStatus,
          driverId: user.id
        })
      }
    } catch (error) {
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdating(false)
    }
  }

  const uploadPhoto = async (file) => {
    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('appointmentId', id)
      
      const response = await appointmentService.uploadPhoto(formData)
      setPhotos(prev => [...prev, response.data])
      toast.success('Foto subida correctamente')
    } catch (error) {
      toast.error('Error al subir la foto')
    }
  }

  const uploadDocument = async (file) => {
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('appointmentId', id)
      
      const response = await appointmentService.uploadDocument(formData)
      setDocuments(prev => [...prev, response.data])
      toast.success('Documento subido correctamente')
    } catch (error) {
      toast.error('Error al subir el documento')
    }
  }

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0]
    if (!file) return

    if (type === 'photo') {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }
      uploadPhoto(file)
    } else {
      uploadDocument(file)
    }
  }

  const saveNotes = async () => {
    try {
      await appointmentService.updateAppointment(id, { notes })
      toast.success('Notas guardadas correctamente')
    } catch (error) {
      toast.error('Error al guardar notas')
    }
  }

  const handleDownloadPhoto = async (photoUrl, fileName) => {
    try {
      // Crear un enlace temporal para descargar la imagen
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}_${appointment.appointmentNumber}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Foto descargada correctamente')
    } catch (error) {
      toast.error('Error al descargar foto')
    }
  }

  const handleDownloadDocument = async (documentUrl, fileName) => {
    try {
      // Crear un enlace temporal para descargar el documento
      const response = await fetch(documentUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}_${appointment.appointmentNumber}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Documento descargado correctamente')
    } catch (error) {
      toast.error('Error al descargar documento')
    }
  }

  const openNavigation = () => {
    const { latitude, longitude } = appointment.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-success-600" />
      case 'in_progress':
        return <Clock className="w-6 h-6 text-warning-600" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success-600" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-error-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'in_progress':
        return 'En progreso'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Pendiente'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success-100 text-success-800'
      case 'in_progress':
        return 'bg-warning-100 text-warning-800'
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'cancelled':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'details', label: 'Detalles' },
    { id: 'location', label: 'Ubicación' },
    { id: 'photos', label: 'Fotos' },
    { id: 'documents', label: 'Documentos' },
    { id: 'notes', label: 'Notas' }
  ]

  if (loading) {
    return <LoadingSpinner text="Cargando detalles de la cita..." />
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cita no encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            La cita que buscas no existe o no tienes permisos para verla
          </p>
          <button
            onClick={() => navigate('/driver/appointments')}
            className="btn btn-primary btn-md"
          >
            Volver a mis citas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/driver/appointments')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(appointment.status)}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Cita #{appointment.id}
                    </h1>
                    <p className="text-gray-600">
                      {formatDate(appointment.scheduledDate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
                <button
                  onClick={openNavigation}
                  className="btn btn-secondary btn-md flex items-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navegar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Actions */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones de estado
            </h2>
            <div className="flex flex-wrap gap-3">
              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => updateAppointmentStatus('in_progress')}
                  disabled={updating}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar verificación</span>
                </button>
              )}
              {appointment.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => updateAppointmentStatus('completed')}
                    disabled={updating}
                    className="btn btn-success btn-md flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Completar verificación</span>
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus('confirmed')}
                    disabled={updating}
                    className="btn btn-secondary btn-md flex items-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Información del cliente</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium text-gray-900">
                        {appointment.client?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {appointment.client?.phone}
                        </p>
                        <a
                          href={`tel:${appointment.client?.phone}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {appointment.client?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Car className="w-5 h-5" />
                    <span>Información del vehículo</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Marca y modelo</p>
                      <p className="font-medium text-gray-900">
                        {appointment.vehicle?.make} {appointment.vehicle?.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Año</p>
                      <p className="font-medium text-gray-900">
                        {appointment.vehicle?.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Placa</p>
                      <p className="font-medium text-gray-900">
                        {appointment.vehicle?.licensePlate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium text-gray-900">
                        {appointment.vehicle?.color}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium text-gray-900">
                        {appointment.vehicle?.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">VIN</p>
                      <p className="font-medium text-gray-900 font-mono text-sm">
                        {appointment.vehicle?.vin}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Información del servicio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Tipo de servicio</p>
                      <p className="font-medium text-gray-900">
                        {appointment.serviceType || 'Verificación vehicular'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className="font-medium text-gray-900">
                        ${appointment.amount?.toLocaleString('es-MX')} MXN
                      </p>
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Notas del cliente</p>
                      <p className="text-gray-900">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Ubicación de la cita</span>
                  </h3>
                  <div className="mb-4">
                    <p className="text-gray-900">{appointment.location?.address}</p>
                    {appointment.location?.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        Notas: {appointment.location.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapComponent
                    center={[appointment.location?.longitude, appointment.location?.latitude]}
                    markers={[{
                      id: 'appointment',
                      longitude: appointment.location?.longitude,
                      latitude: appointment.location?.latitude,
                      type: 'appointment',
                      popup: {
                        title: 'Ubicación de la cita',
                        content: appointment.location?.address
                      }
                    }]}
                    zoom={15}
                  />
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fotos de la verificación
                  </h3>
                  <label className="btn btn-primary btn-md cursor-pointer flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>Subir foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                    />
                  </label>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                          <button 
                            onClick={() => handleDownloadPhoto(photo.url, `foto_${index + 1}`)}
                            className="opacity-0 group-hover:opacity-100 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No hay fotos
                    </h4>
                    <p className="text-gray-600">
                      Sube fotos del proceso de verificación
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documentos
                  </h3>
                  <label className="btn btn-primary btn-md cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Subir documento</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'document')}
                      className="hidden"
                    />
                  </label>
                </div>

                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((document, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {document.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {document.size} • {document.type}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownloadDocument(doc.url, doc.name)}
                          className="btn btn-secondary btn-sm flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No hay documentos
                    </h4>
                    <p className="text-gray-600">
                      Sube documentos relacionados con la verificación
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Notas del verificador</span>
                </h3>
                
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agrega notas sobre la verificación, observaciones, problemas encontrados, etc."
                    rows={8}
                    className="input input-md w-full resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveNotes}
                    className="btn btn-primary btn-md"
                  >
                    Guardar notas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentDetails