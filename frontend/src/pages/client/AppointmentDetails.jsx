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
  Mail,
  Star,
  MessageCircle,
  CreditCard,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Navigation,
  Edit,
  Send
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { appointmentService } from '../../services/api'
import MapComponent from '../../components/map/MapComponent'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const AppointmentDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [id])

  useEffect(() => {
    if (socket && appointment) {
      // Listen for real-time updates
      socket.on('appointment-updated', handleAppointmentUpdate)
      socket.on('driver-location-updated', handleDriverLocationUpdate)
      
      return () => {
        socket.off('appointment-updated', handleAppointmentUpdate)
        socket.off('driver-location-updated', handleDriverLocationUpdate)
      }
    }
  }, [socket, appointment])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getAppointment(id)
      setAppointment(response.data.appointment)
    } catch (error) {
      toast.error('Error al cargar los detalles de la cita')
      navigate('/client/appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdate = (data) => {
    if (data.appointmentId === id || data.appointmentId === appointment?._id) {
      // Actualizar el estado de la cita
      const newStatus = data.status || data.updates?.status;
      if (newStatus) {
        setAppointment(prev => ({ ...prev, status: newStatus }))
        
        // Mostrar notificación según el estado
        const statusMessages = {
          'assigned': '¡Un chofer ha aceptado tu cita!',
          'driver_enroute': 'El chofer está en camino',
          'picked_up': 'Tu vehículo ha sido recogido',
          'in_verification': 'Tu vehículo está siendo verificado',
          'completed': 'La verificación ha sido completada',
          'delivered': 'Tu vehículo ha sido entregado',
          'cancelled': 'Tu cita ha sido cancelada'
        };
        
        if (statusMessages[newStatus]) {
          toast.success(statusMessages[newStatus]);
        }
      }
      
      // Refrescar los datos completos de la cita
      fetchAppointment();
    }
  }

  const handleDriverLocationUpdate = (data) => {
    if (appointment?.driver?._id === data.driverId) {
      setAppointment(prev => ({
        ...prev,
        driver: {
          ...prev.driver,
          currentLocation: data.location
        }
      }))
    }
  }

  const handleCancelAppointment = async () => {
    try {
      setCancelling(true)
      await appointmentService.cancelAppointment(id, { reason: cancelReason })
      
      setAppointment(prev => ({ ...prev, status: 'cancelled' }))
      setShowCancelModal(false)
      toast.success('Cita cancelada exitosamente')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar la cita')
    } finally {
      setCancelling(false)
    }
  }

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true)
      
      await appointmentService.rateAppointment(id, {
        rating,
        comment: review
      })
      
      toast.success('Calificación enviada correctamente')
      setReview('')
      setRating(0)
      
      // Refresh appointment data
      fetchAppointment()
    } catch (error) {
      toast.error('Error al enviar calificación')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Por favor escribe un mensaje')
      return
    }

    try {
      setSendingMessage(true)
      
      // Enviar mensaje a través del socket o API
      if (socket && appointment.driver) {
        socket.emit('send-message', {
          recipientId: appointment.driver._id,
          appointmentId: appointment._id,
          message: message.trim(),
          senderType: 'client'
        })
      }
      
      toast.success('Mensaje enviado correctamente')
      setMessage('')
      setShowMessageModal(false)
    } catch (error) {
      toast.error('Error al enviar mensaje')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDownloadCertificate = async () => {
    try {
      // Simular descarga del certificado
      const certificateData = {
        appointmentNumber: appointment.appointmentNumber,
        clientName: user.name,
        carInfo: `${appointment.car.brand} ${appointment.car.model} - ${appointment.car.plates}`,
        verificationDate: appointment.completedAt || appointment.updatedAt,
        services: appointment.services.map(s => s.name).join(', '),
        driverName: appointment.driver?.name || 'N/A'
      }
      
      // Crear un PDF simple (simulado)
      const certificateText = `
CERTIFICADO DE VERIFICACIÓN VEHICULAR

Número de Cita: ${certificateData.appointmentNumber}
Cliente: ${certificateData.clientName}
Vehículo: ${certificateData.carInfo}
Fecha de Verificación: ${new Date(certificateData.verificationDate).toLocaleDateString('es-MX')}
Servicios Realizados: ${certificateData.services}
Verificado por: ${certificateData.driverName}

Este certificado confirma que el vehículo ha pasado
la verificación técnica correspondiente.

Emitido el: ${new Date().toLocaleDateString('es-MX')}
      `.trim()
      
      // Crear y descargar el archivo
      const blob = new Blob([certificateText], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado_${appointment.appointmentNumber}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Certificado descargado correctamente')
    } catch (error) {
      toast.error('Error al descargar certificado')
    }
  }

  const handleContactSupport = () => {
    // Crear mensaje predefinido para soporte
    const supportMessage = `
Hola, necesito ayuda con la cita #${appointment?.appointmentNumber}

Detalles de la cita:
- Cliente: ${user?.name}
- Vehículo: ${appointment?.car?.brand} ${appointment?.car?.model} - ${appointment?.car?.plates}
- Estado: ${appointment?.status}
- Fecha: ${appointment?.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString('es-MX') : 'N/A'}

Mensaje: [Describe tu problema aquí]
    `.trim()
    
    // Abrir cliente de correo con mensaje predefinido
    const subject = encodeURIComponent(`Ayuda con cita #${appointment?.appointmentNumber}`)
    const body = encodeURIComponent(supportMessage)
    const mailtoUrl = `mailto:soporte@verifireando.com?subject=${subject}&body=${body}`
    
    window.open(mailtoUrl, '_blank')
    toast.success('Abriendo cliente de correo para contactar soporte')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-warning-500" />
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-info-500" />
      case 'in_progress':
        return <AlertCircle className="w-6 h-6 text-primary-500" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success-500" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-error-500" />
      default:
        return <Clock className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'confirmed':
        return 'Confirmada'
      case 'in_progress':
        return 'En progreso'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800 border-warning-200'
      case 'confirmed':
        return 'bg-info-100 text-info-800 border-info-200'
      case 'in_progress':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'completed':
        return 'bg-success-100 text-success-800 border-success-200'
      case 'cancelled':
        return 'bg-error-100 text-error-800 border-error-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canCancelAppointment = () => {
    return appointment && 
           ['pending', 'confirmed'].includes(appointment.status) &&
           new Date(appointment.scheduledDate) > new Date()
  }

  const canRateAppointment = () => {
    return appointment && 
           appointment.status === 'completed' && 
           !appointment.rating
  }

  const openInMaps = () => {
    if (appointment?.location?.coordinates) {
      const [lng, lat] = appointment.location.coordinates
      const url = `https://www.google.com/maps?q=${lat},${lng}`
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando detalles de la cita..." />
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cita no encontrada</h2>
          <p className="text-gray-600 mb-6">La cita que buscas no existe o no tienes acceso a ella.</p>
          <button
            onClick={() => navigate('/client/appointments')}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/client/appointments')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cita #{appointment._id.slice(-8)}
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  {getStatusIcon(appointment.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {canCancelAppointment() && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-error btn-md"
                >
                  Cancelar cita
                </button>
              )}
              {appointment.status === 'pending' && (
                <button
                  onClick={() => navigate(`/client/appointments/${id}/edit`)}
                  className="btn btn-secondary btn-md flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Appointment Details */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Detalles de la cita</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                <div className="flex items-start space-x-4">
                  <Calendar className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">Fecha y hora</h3>
                    <p className="text-gray-600">
                      {new Date(appointment.scheduledDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600">
                      {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Service Type */}
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">Tipo de servicio</h3>
                    <p className="text-gray-600">
                      {appointment.serviceType === 'verification' ? 'Verificación vehicular' :
                       appointment.serviceType === 'inspection' ? 'Inspección completa' :
                       'Prueba de emisiones'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-2">Notas adicionales</h3>
                  <p className="text-gray-600">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del vehículo</h2>
              
              <div className="flex items-start space-x-4">
                <Car className="w-8 h-8 text-primary-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {appointment.car?.make} {appointment.car?.model} {appointment.car?.year}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-sm text-gray-600">Placas: </span>
                      <span className="font-medium">{appointment.car?.licensePlate}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">VIN: </span>
                      <span className="font-medium">{appointment.car?.vin}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Color: </span>
                      <span className="font-medium">{appointment.car?.color}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tipo: </span>
                      <span className="font-medium">{appointment.car?.vehicleType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location and Map */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
                <button
                  onClick={openInMaps}
                  className="btn btn-secondary btn-sm flex items-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Abrir en Maps</span>
                </button>
              </div>
              
              <div className="flex items-start space-x-4 mb-6">
                <MapPin className="w-6 h-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Dirección</h3>
                  <p className="text-gray-600">{appointment.location?.address}</p>
                </div>
              </div>

              {appointment.location?.coordinates && (
                <MapComponent
                  height="300px"
                  center={{
                    lat: appointment.location.coordinates[1],
                    lng: appointment.location.coordinates[0]
                  }}
                  markers={[
                    {
                      latitude: appointment.location.coordinates[1],
                      longitude: appointment.location.coordinates[0],
                      type: 'appointment',
                      popup: `<div class="p-2"><strong>Ubicación de la cita</strong><br/>${appointment.location.address}</div>`
                    },
                    ...(appointment.driver?.currentLocation ? [{
                      latitude: appointment.driver.currentLocation.coordinates[1],
                      longitude: appointment.driver.currentLocation.coordinates[0],
                      type: 'driver',
                      popup: `<div class="p-2"><strong>${appointment.driver.name}</strong><br/>Ubicación actual del chofer</div>`
                    }] : [])
                  ]}
                  className="rounded-lg border"
                />
              )}
            </div>

            {/* Payment Information */}
            {appointment.payment && (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Información de pago</h2>
                
                <div className="flex items-start space-x-4">
                  <CreditCard className="w-6 h-6 text-primary-600 mt-1" />
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Método de pago: </span>
                        <span className="font-medium">
                          {appointment.payment.method === 'card' ? 'Tarjeta' : 'Efectivo'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Estado: </span>
                        <span className={`font-medium ${
                          appointment.payment.status === 'completed' ? 'text-success-600' :
                          appointment.payment.status === 'pending' ? 'text-warning-600' :
                          'text-error-600'
                        }`}>
                          {appointment.payment.status === 'completed' ? 'Pagado' :
                           appointment.payment.status === 'pending' ? 'Pendiente' :
                           'Fallido'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Subtotal: </span>
                        <span className="font-medium">${appointment.payment.amount?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="text-lg font-bold">${appointment.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {appointment.payment.transactionId && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">ID de transacción: </span>
                        <span className="font-mono text-sm">{appointment.payment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Review Section */}
            {canRateAppointment() && (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Calificar servicio</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calificación
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios (opcional)
                    </label>
                    <textarea
                      rows={4}
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Comparte tu experiencia con el servicio..."
                      className="input input-md w-full"
                    />
                  </div>
                  
                  <button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || submittingReview}
                    className="btn btn-primary btn-md flex items-center space-x-2"
                  >
                    {submittingReview ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        <span>Enviar reseña</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Review */}
            {appointment.rating && (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Tu reseña</h2>
                
                <div className="flex items-center space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= appointment.rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {new Date(appointment.rating.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                {appointment.rating.review && (
                  <p className="text-gray-700">{appointment.rating.review}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Information */}
            {appointment.driver ? (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu chofer</h3>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{appointment.driver.name}</h4>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= (appointment.driver.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        ({appointment.driver.totalRatings || 0})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${appointment.driver.phone}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {appointment.driver.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${appointment.driver.email}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {appointment.driver.email}
                    </a>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setShowMessageModal(true)}
                    className="btn btn-secondary btn-sm w-full flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar mensaje</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chofer</h3>
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Aún no se ha asignado un chofer a tu cita
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
              
              <div className="space-y-3">
                {appointment.certificate && (
                  <button 
                    onClick={handleDownloadCertificate}
                    className="btn btn-secondary btn-sm w-full flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar certificado</span>
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/client/appointments/new')}
                  className="btn btn-primary btn-sm w-full"
                >
                  Programar nueva cita
                </button>
                
                <button
                  onClick={handleContactSupport}
                  className="btn btn-secondary btn-sm w-full"
                >
                  Contactar soporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancelar cita</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de cancelación (opcional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explica por qué cancelas la cita..."
                className="input input-md w-full"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary btn-md flex-1"
              >
                Mantener cita
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="btn btn-error btn-md flex-1 flex items-center justify-center space-x-2"
              >
                {cancelling ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Cancelar cita</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar mensaje al chofer
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="btn btn-secondary btn-md flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !message.trim()}
                  className="btn btn-primary btn-md flex-1 flex items-center justify-center space-x-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentDetails