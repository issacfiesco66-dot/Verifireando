import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  Phone,
  Filter,
  Search,
  Plus,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { appointmentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Appointments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getMyAppointments()
      setAppointments(response.data.appointments || [])
    } catch (error) {
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = [...appointments]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.car?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.car?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate)
        
        switch (dateFilter) {
          case 'today':
            return appointmentDate >= today && appointmentDate < tomorrow
          case 'tomorrow':
            return appointmentDate >= tomorrow && appointmentDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          case 'week':
            return appointmentDate >= today && appointmentDate < nextWeek
          case 'past':
            return appointmentDate < today
          default:
            return true
        }
      })
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))

    setFilteredAppointments(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-500" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-info-500" />
      case 'in_progress':
        return <AlertCircle className="w-5 h-5 text-primary-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-error-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
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
        return 'bg-warning-100 text-warning-800'
      case 'confirmed':
        return 'bg-info-100 text-info-800'
      case 'in_progress':
        return 'bg-primary-100 text-primary-800'
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'cancelled':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando citas..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis citas</h1>
              <p className="text-gray-600">
                Gestiona todas tus citas de verificación vehicular
              </p>
            </div>
            <button
              onClick={() => navigate('/client/appointments/new')}
              className="btn btn-primary btn-md flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva cita</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </h2>
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por placas, vehículo, chofer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-md w-full pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input input-md w-full"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input input-md w-full"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="tomorrow">Mañana</option>
              <option value="week">Esta semana</option>
              <option value="past">Pasadas</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredAppointments.length} de {appointments.length} citas
          </p>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {appointments.length === 0 ? 'No tienes citas programadas' : 'No se encontraron citas'}
            </h3>
            <p className="text-gray-600 mb-6">
              {appointments.length === 0 
                ? 'Programa tu primera cita de verificación vehicular'
                : 'Intenta ajustar los filtros para encontrar lo que buscas'
              }
            </p>
            {appointments.length === 0 && (
              <button
                onClick={() => navigate('/client/appointments/new')}
                className="btn btn-primary btn-md"
              >
                Programar primera cita
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Cita #{appointment._id.slice(-8)}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/client/appointments/${appointment._id}`)}
                    className="btn btn-secondary btn-sm flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver detalles</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date and Time */}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(appointment.scheduledDate).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center space-x-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.car?.make} {appointment.car?.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.car?.licensePlate}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600 truncate">
                        {appointment.location?.address || 'Dirección no disponible'}
                      </p>
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="flex items-center space-x-3">
                    {appointment.driver ? (
                      <>
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.driver.name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {appointment.driver.phone}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-warning-500" />
                        <div>
                          <p className="text-sm font-medium text-warning-700">
                            Sin asignar
                          </p>
                          <p className="text-sm text-warning-600">
                            Esperando chofer
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Service Type and Notes */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">Servicio: </span>
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.serviceType === 'verification' ? 'Verificación vehicular' :
                         appointment.serviceType === 'inspection' ? 'Inspección completa' :
                         'Prueba de emisiones'}
                      </span>
                    </div>
                    {appointment.totalAmount && (
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="text-lg font-bold text-gray-900">
                          ${appointment.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Notas: </span>
                      <span className="text-sm text-gray-900">{appointment.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Appointments