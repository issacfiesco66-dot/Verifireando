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
import { useDriverLocation } from '../../hooks/useDriverLocation'
import DriverVerificationCard from '../../components/driver/DriverVerificationCard'
import TripStatusFlow from '../../components/driver/TripStatusFlow'
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
  
  // Rastrear ubicación del chofer cuando está en ruta
  const shouldTrack = appointment?.status === 'driver_enroute' || appointment?.status === 'picked_up'
  const { location: driverLocation, error: locationError, isWatching } = useDriverLocation(
    appointment?._id,
    shouldTrack
  )

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

  const openNavigation = (type = 'pickup') => {
    let lat, lng, address
    
    if (type === 'pickup') {
      if (appointment.location?.latitude && appointment.location?.longitude) {
        lat = appointment.location.latitude
        lng = appointment.location.longitude
        address = appointment.location.address || appointment.pickupAddress?.street
      } else if (appointment.pickupAddress?.coordinates?.coordinates) {
        const [lngVal, latVal] = appointment.pickupAddress.coordinates.coordinates
        lat = latVal
        lng = lngVal
        address = `${appointment.pickupAddress.street}, ${appointment.pickupAddress.city}, ${appointment.pickupAddress.state}`
      } else {
        toast.error('Ubicación de recogida no disponible para navegación')
        return
      }
    } else {
      if (appointment.deliveryLocation?.latitude && appointment.deliveryLocation?.longitude) {
        lat = appointment.deliveryLocation.latitude
        lng = appointment.deliveryLocation.longitude
        address = appointment.deliveryLocation.address
      } else if (appointment.deliveryAddress?.coordinates?.lat && appointment.deliveryAddress?.coordinates?.lng) {
        lat = appointment.deliveryAddress.coordinates.lat
        lng = appointment.deliveryAddress.coordinates.lng
        address = `${appointment.deliveryAddress.street || ''}, ${appointment.deliveryAddress.city || ''}, ${appointment.deliveryAddress.state || ''}`
      } else if (appointment.deliveryAddress?.coordinates?.coordinates) {
        const [lngVal, latVal] = appointment.deliveryAddress.coordinates.coordinates
        lat = latVal
        lng = lngVal
        address = `${appointment.deliveryAddress.street || ''}, ${appointment.deliveryAddress.city || ''}, ${appointment.deliveryAddress.state || ''}`
      } else {
        toast.error('Ubicación de entrega no disponible para navegación')
        return
      }
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${address ? `&destination_place_id=${encodeURIComponent(address)}` : ''}`
    window.open(url, '_blank')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-warning-600" />
      case 'assigned':
        return <CheckCircle className="w-6 h-6 text-info-600" />
      case 'driver_enroute':
        return <Navigation className="w-6 h-6 text-blue-600" />
      case 'picked_up':
        return <Car className="w-6 h-6 text-purple-600" />
      case 'in_verification':
        return <AlertCircle className="w-6 h-6 text-primary-600" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success-600" />
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-error-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'assigned':
        return 'Asignada'
      case 'driver_enroute':
        return 'En camino'
      case 'picked_up':
        return 'Vehículo recogido'
      case 'in_verification':
        return 'En verificación'
      case 'completed':
        return 'Verificación completada'
      case 'delivered':
        return 'Entregado'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800'
      case 'assigned':
        return 'bg-info-100 text-info-800'
      case 'driver_enroute':
        return 'bg-blue-100 text-blue-800'
      case 'picked_up':
        return 'bg-purple-100 text-purple-800'
      case 'in_verification':
        return 'bg-primary-100 text-primary-800'
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
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
                      Cita #{appointment.appointmentNumber || appointment.id || appointment._id}
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
                {(appointment.location?.latitude && appointment.location?.longitude) || 
                 (appointment.pickupAddress?.coordinates?.coordinates) ? (
                  <button
                    onClick={() => openNavigation('pickup')}
                    className="btn btn-secondary btn-md flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navegar a recogida</span>
                  </button>
                ) : null}
                {(appointment.deliveryLocation || appointment.deliveryAddress) && 
                 ((appointment.deliveryLocation?.latitude && appointment.deliveryLocation?.longitude) ||
                  (appointment.deliveryAddress?.coordinates?.lat && appointment.deliveryAddress?.coordinates?.lng) ||
                  (appointment.deliveryAddress?.coordinates?.coordinates)) ? (
                  <button
                    onClick={() => openNavigation('delivery')}
                    className="btn btn-success btn-md flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navegar a entrega</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Accept Button for Pending Appointments */}
        {appointment.status === 'pending' && !appointment.driver && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Cita disponible para aceptar
                </h2>
                <p className="text-blue-700">
                  Esta cita está disponible. Si quieres aceptarla, haz clic en el botón de abajo.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setUpdating(true)
                    await appointmentService.acceptAppointment(id)
                    toast.success('¡Cita aceptada exitosamente!')
                    await fetchAppointmentDetails() // Refrescar detalles
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Error al aceptar la cita')
                  } finally {
                    setUpdating(false)
                  }
                }}
                disabled={updating}
                className="btn btn-success btn-lg flex items-center space-x-2 px-6"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{updating ? 'Aceptando...' : 'Aceptar esta cita'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Código de verificación - MOSTRAR PRIMERO SI ESTÁ DISPONIBLE */}
        {appointment.pickupCode && ['assigned', 'driver_enroute'].includes(appointment.status) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-blue-900">
                    Tu código de verificación
                  </h2>
                </div>
                <p className="text-blue-700 mb-4">
                  Muestra este código al cliente cuando llegues para que pueda verificar tu identidad
                </p>
                <div className="bg-white rounded-lg p-6 border-2 border-blue-400 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-bold text-blue-900 font-mono tracking-wider">
                      {appointment.pickupCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(appointment.pickupCode)
                        toast.success('Código copiado al portapapeles')
                      }}
                      className="btn btn-secondary btn-md flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nuevo flujo de estado del viaje */}
        {appointment.status !== 'cancelled' && appointment.status !== 'pending' && (
          <TripStatusFlow 
            appointment={appointment}
            onUpdateStatus={updateAppointmentStatus}
            isUpdating={updating}
          />
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
                        {appointment.car?.brand || appointment.car?.make} {appointment.car?.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Año</p>
                      <p className="font-medium text-gray-900">
                        {appointment.car?.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Placa</p>
                      <p className="font-medium text-gray-900">
                        {appointment.car?.plates || appointment.car?.licensePlate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium text-gray-900">
                        {appointment.car?.color}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium text-gray-900">
                        {appointment.car?.vehicleType || appointment.car?.type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">VIN</p>
                      <p className="font-medium text-gray-900 font-mono text-sm">
                        {appointment.car?.vin || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Código de verificación */}
                {appointment.pickupCode && ['assigned', 'driver_enroute'].includes(appointment.status) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Código de verificación</span>
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Muestra este código al cliente cuando llegues para que pueda verificar tu identidad:
                    </p>
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-bold text-blue-900 font-mono">{appointment.pickupCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appointment.pickupCode)
                            toast.success('Código copiado')
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm px-3 py-2 border border-blue-300 rounded-lg hover:bg-blue-50"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Información del servicio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Tipo de servicio</p>
                      <p className="font-medium text-gray-900">
                        {appointment.services?.verification ? 'Verificación vehicular' : 'Servicios adicionales'}
                        {appointment.services?.additionalServices?.length > 0 && ` + ${appointment.services.additionalServices.length} servicio(s) adicional(es)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className="font-medium text-gray-900">
                        ${(appointment.pricing?.total || appointment.amount || 0).toLocaleString('es-MX')} MXN
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
              <div className="space-y-8">
                {/* Ubicación de Recogida */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>Ubicación de recogida</span>
                  </h3>
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">
                      {appointment.location?.address || 
                       (appointment.pickupAddress?.street 
                        ? `${appointment.pickupAddress.street}, ${appointment.pickupAddress.city || ''}, ${appointment.pickupAddress.state || ''}`
                        : 'Dirección no disponible')}
                    </p>
                    {(appointment.location?.instructions || appointment.pickupAddress?.instructions) && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Instrucciones:</span> {appointment.location?.instructions || appointment.pickupAddress?.instructions}
                      </p>
                    )}
                    <button
                      onClick={() => openNavigation('pickup')}
                      className="mt-3 btn btn-primary btn-sm flex items-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Abrir en Google Maps</span>
                    </button>
                  </div>
                  
                  {(appointment.location?.latitude && appointment.location?.longitude) || 
                   (appointment.pickupAddress?.coordinates?.coordinates) ? (
                    <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                      <MapComponent
                        center={
                          appointment.location?.longitude && appointment.location?.latitude
                            ? [appointment.location.longitude, appointment.location.latitude]
                            : appointment.pickupAddress?.coordinates?.coordinates
                              ? [appointment.pickupAddress.coordinates.coordinates[0], appointment.pickupAddress.coordinates.coordinates[1]]
                              : [0, 0]
                        }
                        markers={[{
                          id: 'pickup',
                          longitude: appointment.location?.longitude || appointment.pickupAddress?.coordinates?.coordinates?.[0] || 0,
                          latitude: appointment.location?.latitude || appointment.pickupAddress?.coordinates?.coordinates?.[1] || 0,
                          type: 'appointment',
                          popup: {
                            title: 'Ubicación de recogida',
                            content: appointment.location?.address || 
                                     (appointment.pickupAddress?.street 
                                      ? `${appointment.pickupAddress.street}, ${appointment.pickupAddress.city || ''}, ${appointment.pickupAddress.state || ''}`
                                      : 'Ubicación de recogida')
                          }
                        }]}
                        zoom={15}
                      />
                    </div>
                  ) : (
                    <div className="h-96 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <p className="text-gray-500">Ubicación de recogida no disponible</p>
                    </div>
                  )}
                </div>

                {/* Ubicación de Entrega */}
                {(appointment.deliveryLocation || appointment.deliveryAddress) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Navigation className="w-5 h-5 text-green-600" />
                      <span>Ubicación de entrega</span>
                    </h3>
                    <div className="mb-4">
                      <p className="text-gray-900 font-medium">
                        {appointment.deliveryLocation?.address || 
                         (appointment.deliveryAddress?.street 
                          ? `${appointment.deliveryAddress.street}, ${appointment.deliveryAddress.city || ''}, ${appointment.deliveryAddress.state || ''}`
                          : 'Dirección no disponible')}
                      </p>
                      {(appointment.deliveryLocation?.instructions || appointment.deliveryAddress?.instructions) && (
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Instrucciones:</span> {appointment.deliveryLocation?.instructions || appointment.deliveryAddress?.instructions}
                        </p>
                      )}
                      <button
                        onClick={() => openNavigation('delivery')}
                        className="mt-3 btn btn-success btn-sm flex items-center space-x-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Abrir en Google Maps</span>
                      </button>
                    </div>
                    
                    {(appointment.deliveryLocation?.latitude && appointment.deliveryLocation?.longitude) || 
                     (appointment.deliveryAddress?.coordinates?.lat && appointment.deliveryAddress?.coordinates?.lng) ||
                     (appointment.deliveryAddress?.coordinates?.coordinates) ? (
                      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                        <MapComponent
                          center={
                            appointment.deliveryLocation?.longitude && appointment.deliveryLocation?.latitude
                              ? [appointment.deliveryLocation.longitude, appointment.deliveryLocation.latitude]
                              : appointment.deliveryAddress?.coordinates?.lng && appointment.deliveryAddress?.coordinates?.lat
                                ? [appointment.deliveryAddress.coordinates.lng, appointment.deliveryAddress.coordinates.lat]
                                : appointment.deliveryAddress?.coordinates?.coordinates
                                  ? [appointment.deliveryAddress.coordinates.coordinates[0], appointment.deliveryAddress.coordinates.coordinates[1]]
                                  : [0, 0]
                          }
                          markers={[{
                            id: 'delivery',
                            longitude: appointment.deliveryLocation?.longitude || 
                                      appointment.deliveryAddress?.coordinates?.lng || 
                                      appointment.deliveryAddress?.coordinates?.coordinates?.[0] || 0,
                            latitude: appointment.deliveryLocation?.latitude || 
                                     appointment.deliveryAddress?.coordinates?.lat || 
                                     appointment.deliveryAddress?.coordinates?.coordinates?.[1] || 0,
                            type: 'delivery',
                            popup: {
                              title: 'Ubicación de entrega',
                              content: appointment.deliveryLocation?.address || 
                                       (appointment.deliveryAddress?.street 
                                        ? `${appointment.deliveryAddress.street}, ${appointment.deliveryAddress.city || ''}, ${appointment.deliveryAddress.state || ''}`
                                        : 'Ubicación de entrega')
                            }
                          }]}
                          zoom={15}
                        />
                      </div>
                    ) : (
                      <div className="h-96 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <p className="text-gray-500">Ubicación de entrega no disponible</p>
                      </div>
                    )}
                  </div>
                )}
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