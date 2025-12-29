import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  DollarSign,
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Route,
  Star
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLocation } from '../../contexts/LocationContext'
import { appointmentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [processingAction, setProcessingAction] = useState(null)

  const { user } = useAuth()
  const { currentLocation, calculateDistance } = useLocation()

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, selectedStatus, searchTerm])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getAppointments({ 
        driver: user._id,
        populate: 'client car'
      })
      setAppointments(response.data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdate = (event) => {
    const updatedAppointment = event.detail
    setAppointments(prev => 
      prev.map(app => 
        app._id === updatedAppointment._id ? updatedAppointment : app
      )
    )
  }

  const handleAppointmentAssigned = (event) => {
    const appointment = event.detail
    if (appointment.driver === user._id) {
      setAppointments(prev => [appointment, ...prev])
      toast.success('Nueva cita asignada')
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(app => 
        app.client?.name?.toLowerCase().includes(term) ||
        app.client?.email?.toLowerCase().includes(term) ||
        app.serviceType?.toLowerCase().includes(term) ||
        app.location?.address?.toLowerCase().includes(term)
      )
    }

    // Sort by scheduled date
    filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

    setFilteredAppointments(filtered)
  }

  const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
    try {
      setProcessingAction(appointmentId)
      await appointmentService.updateStatus(appointmentId, status, additionalData)
      
      setAppointments(prev => 
        prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status, ...additionalData }
            : app
        )
      )
      
      toast.success(`Cita ${getStatusText(status)} exitosamente`)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Error al actualizar el estado de la cita')
    } finally {
      setProcessingAction(null)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'pendiente',
      'confirmed': 'confirmada',
      'in-progress': 'en progreso',
      'completed': 'completada',
      'cancelled': 'cancelada'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDistanceToAppointment = (appointment) => {
    if (!currentLocation || !appointment.location) return null
    
    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      appointment.location.latitude,
      appointment.location.longitude
    )
  }

  const openNavigation = (appointment) => {
    if (appointment.location?.latitude && appointment.location?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${appointment.location.latitude},${appointment.location.longitude}`
      window.open(url, '_blank')
    }
  }

  const callClient = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  const sendMessage = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`sms:${phoneNumber}`, '_self')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Citas
          </h1>
          <p className="text-gray-600">
            Administra tus citas asignadas y disponibles
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, servicio o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="in-progress">En progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              <button
                onClick={fetchAppointments}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appointments Grid */}
        {filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowDetails(true)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {appointment.location && (
                        <button
                          onClick={() => openNavigation(appointment)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {appointment.serviceType}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Client Info */}
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.client?.name || 'Cliente no especificado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.client?.email}
                      </p>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {formatDate(appointment.scheduledDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(appointment.scheduledDate)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {appointment.location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {appointment.location.address}
                        </p>
                        {currentLocation && (
                          <p className="text-xs text-gray-500">
                            {calculateDistanceToAppointment(appointment)?.toFixed(1)} km de distancia
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Car Info */}
                  {appointment.car && (
                    <div className="flex items-center space-x-3">
                      <Car className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {appointment.car.brand} {appointment.car.model} ({appointment.car.year})
                      </p>
                    </div>
                  )}

                  {/* Cost */}
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">
                      ${appointment.estimatedCost}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* Contact Actions */}
                    <div className="flex items-center space-x-2">
                      {appointment.client?.phone && (
                        <>
                          <button
                            onClick={() => callClient(appointment.client.phone)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Llamar cliente"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => sendMessage(appointment.client.phone)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Enviar mensaje"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center space-x-2">
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'in-progress')}
                          disabled={processingAction === appointment._id}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          Iniciar
                        </button>
                      )}
                      
                      {appointment.status === 'in-progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                          disabled={processingAction === appointment._id}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Completar
                        </button>
                      )}

                      {['pending', 'confirmed'].includes(appointment.status) && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'cancelled', { reason: 'Cancelado por el chofer' })}
                          disabled={processingAction === appointment._id}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay citas disponibles
            </h3>
            <p className="text-gray-500">
              {selectedStatus === 'all' 
                ? 'No tienes citas asignadas en este momento.'
                : `No hay citas con estado "${getStatusText(selectedStatus)}".`
              }
            </p>
          </div>
        )}

        {/* Appointment Details Modal */}
        {showDetails && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalles de la Cita
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status and Service */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusText(selectedAppointment.status)}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${selectedAppointment.estimatedCost}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedAppointment.serviceType}
                    </h3>
                  </div>

                  {/* Client Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Información del Cliente</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Nombre:</span> {selectedAppointment.client?.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedAppointment.client?.email}</p>
                      {selectedAppointment.client?.phone && (
                        <p><span className="font-medium">Teléfono:</span> {selectedAppointment.client.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Schedule Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Fecha y Hora</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Fecha:</span> {formatDate(selectedAppointment.scheduledDate)}</p>
                      <p><span className="font-medium">Hora:</span> {formatTime(selectedAppointment.scheduledDate)}</p>
                    </div>
                  </div>

                  {/* Location Information */}
                  {selectedAppointment.location && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Ubicación</h4>
                      <p className="mb-3">{selectedAppointment.location.address}</p>
                      {currentLocation && (
                        <p className="text-sm text-gray-600 mb-3">
                          Distancia: {calculateDistanceToAppointment(selectedAppointment)?.toFixed(1)} km
                        </p>
                      )}
                      <button
                        onClick={() => openNavigation(selectedAppointment)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Abrir en Maps</span>
                      </button>
                    </div>
                  )}

                  {/* Car Information */}
                  {selectedAppointment.car && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Información del Vehículo</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Marca:</span> {selectedAppointment.car.brand}</p>
                        <p><span className="font-medium">Modelo:</span> {selectedAppointment.car.model}</p>
                        <p><span className="font-medium">Año:</span> {selectedAppointment.car.year}</p>
                        {selectedAppointment.car.licensePlate && (
                          <p><span className="font-medium">Placa:</span> {selectedAppointment.car.licensePlate}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Notas</h4>
                      <p className="text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentManagement