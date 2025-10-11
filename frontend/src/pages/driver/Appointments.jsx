import React, { useState, useEffect } from 'react'
import { 
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
  Eye,
  Filter,
  Search,
  Route
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { appointmentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Appointments = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter])

  useEffect(() => {
    if (socket) {
      socket.on('appointmentAssigned', handleAppointmentAssigned)
      socket.on('appointmentUpdated', handleAppointmentUpdated)
      socket.on('appointmentCancelled', handleAppointmentCancelled)

      return () => {
        socket.off('appointmentAssigned')
        socket.off('appointmentUpdated')
        socket.off('appointmentCancelled')
      }
    }
  }, [socket])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getDriverAppointments()
      setAppointments(response.data)
    } catch (error) {
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentAssigned = (appointment) => {
    setAppointments(prev => [appointment, ...prev])
    toast.success('Nueva cita asignada')
  }

  const handleAppointmentUpdated = (updatedAppointment) => {
    setAppointments(prev =>
      prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
    )
  }

  const handleAppointmentCancelled = (appointmentId) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
    toast.info('Cita cancelada')
  }

  const filterAppointments = () => {
    let filtered = [...appointments]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.vehicle?.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.location?.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(appointment => {
            const appointmentDate = new Date(appointment.scheduledDate)
            appointmentDate.setHours(0, 0, 0, 0)
            return appointmentDate.getTime() === filterDate.getTime()
          })
          break
        case 'tomorrow':
          filterDate.setDate(now.getDate() + 1)
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(appointment => {
            const appointmentDate = new Date(appointment.scheduledDate)
            appointmentDate.setHours(0, 0, 0, 0)
            return appointmentDate.getTime() === filterDate.getTime()
          })
          break
        case 'week':
          filterDate.setDate(now.getDate() + 7)
          filtered = filtered.filter(appointment => 
            new Date(appointment.scheduledDate) <= filterDate
          )
          break
        case 'past':
          filtered = filtered.filter(appointment => 
            new Date(appointment.scheduledDate) < now
          )
          break
      }
    }

    // Sort by date (nearest first)
    filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

    setFilteredAppointments(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-warning-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
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
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openNavigation = (appointment) => {
    const { latitude, longitude } = appointment.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
            <p className="text-gray-600">
              Gestiona tus citas asignadas y programadas
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente, placa o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-md w-full pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input input-md w-full sm:w-auto"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmed">Confirmada</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input input-md w-full sm:w-auto"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="tomorrow">Mañana</option>
              <option value="week">Esta semana</option>
              <option value="past">Pasadas</option>
            </select>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary btn-md whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredAppointments.length === 0 ? (
              'No se encontraron citas'
            ) : (
              `Mostrando ${filteredAppointments.length} de ${appointments.length} citas`
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <LoadingSpinner text="Cargando citas..." />
        ) : (
          <>
            {/* Appointments List */}
            {filteredAppointments.length > 0 ? (
              <div className="space-y-6">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(appointment.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Cita #{appointment.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(appointment.scheduledDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatTime(appointment.scheduledDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Client Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Cliente</span>
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">
                            {appointment.client?.name}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{appointment.client?.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <Car className="w-4 h-4" />
                          <span>Vehículo</span>
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">
                            {appointment.vehicle?.make} {appointment.vehicle?.model} {appointment.vehicle?.year}
                          </p>
                          <p className="text-sm text-gray-600">
                            Placa: {appointment.vehicle?.licensePlate}
                          </p>
                          <p className="text-sm text-gray-600">
                            Color: {appointment.vehicle?.color}
                          </p>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Ubicación</span>
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {appointment.location?.address}
                          </p>
                          {appointment.location?.notes && (
                            <p className="text-sm text-gray-500 italic">
                              Notas: {appointment.location.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    {appointment.serviceType && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Detalles del servicio
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Tipo de servicio</p>
                            <p className="font-medium text-gray-900">
                              {appointment.serviceType}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Monto</p>
                            <p className="font-medium text-gray-900">
                              ${appointment.amount?.toLocaleString('es-MX')} MXN
                            </p>
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-4">
                            <p className="text-gray-500">Notas adicionales</p>
                            <p className="text-gray-900">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                        onClick={() => openNavigation(appointment)}
                        className="btn btn-secondary btn-sm flex items-center space-x-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Navegar</span>
                      </button>
                      <button className="btn btn-primary btn-sm flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Ver detalles</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'No se encontraron citas'
                    : 'No tienes citas asignadas'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Las citas asignadas aparecerán aquí'
                  }
                </p>
                {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-primary btn-md"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Appointments