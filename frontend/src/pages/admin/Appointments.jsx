import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  User,
  Car,
  DollarSign,
  Download,
  UserCheck,
  Navigation,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Appointments = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [appointmentToAssign, setAppointmentToAssign] = useState(null)
  const [availableDrivers, setAvailableDrivers] = useState([])

  useEffect(() => {
    fetchAppointments()
    fetchAvailableDrivers()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter, serviceFilter])

  useEffect(() => {
    if (socket) {
      socket.on('appointmentCreated', handleAppointmentUpdate)
      socket.on('appointmentUpdated', handleAppointmentUpdate)
      socket.on('appointmentCancelled', handleAppointmentUpdate)
      
      return () => {
        socket.off('appointmentCreated', handleAppointmentUpdate)
        socket.off('appointmentUpdated', handleAppointmentUpdate)
        socket.off('appointmentCancelled', handleAppointmentUpdate)
      }
    }
  }, [socket])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAppointments()
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableDrivers = async () => {
    try {
      const data = await adminService.getAvailableDrivers()
      setAvailableDrivers(data)
    } catch (error) {
      console.error('Error fetching available drivers:', error)
    }
  }

  const handleAppointmentUpdate = (appointmentData) => {
    setAppointments(prev => {
      const index = prev.findIndex(a => a._id === appointmentData._id)
      if (index !== -1) {
        const updated = [...prev]
        updated[index] = appointmentData
        return updated
      } else {
        return [appointmentData, ...prev]
      }
    })
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.car?.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)

      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate)
        
        switch (dateFilter) {
          case 'today':
            return appointmentDate >= today && appointmentDate < tomorrow
          case 'tomorrow':
            return appointmentDate >= tomorrow && appointmentDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          case 'week':
            return appointmentDate >= today && appointmentDate <= weekFromNow
          case 'past':
            return appointmentDate < today
          default:
            return true
        }
      })
    }

    // Filter by service type
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.serviceType === serviceFilter)
    }

    // Sort by date (nearest first)
    filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

    setFilteredAppointments(filtered)
  }

  const handleViewAppointment = (appointmentData) => {
    setSelectedAppointment(appointmentData)
    setShowAppointmentModal(true)
  }

  const handleAssignDriver = (appointmentData) => {
    setAppointmentToAssign(appointmentData)
    setShowAssignModal(true)
  }

  const confirmAssignDriver = async (driverId) => {
    try {
      await adminService.assignDriver(appointmentToAssign._id, driverId)
      setAppointments(appointments.map(a => 
        a._id === appointmentToAssign._id 
          ? { ...a, driver: availableDrivers.find(d => d._id === driverId), status: 'confirmed' }
          : a
      ))
      toast.success('Chofer asignado exitosamente')
      setShowAssignModal(false)
      setAppointmentToAssign(null)
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast.error('Error al asignar el chofer')
    }
  }

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await adminService.updateAppointmentStatus(appointmentId, newStatus)
      setAppointments(appointments.map(a => 
        a._id === appointmentId ? { ...a, status: newStatus } : a
      ))
      toast.success('Estado actualizado exitosamente')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const exportAppointments = async () => {
    try {
      const blob = await adminService.exportAppointments()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citas_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Citas exportadas exitosamente')
    } catch (error) {
      console.error('Error exporting appointments:', error)
      toast.error('Error al exportar citas')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock
      case 'confirmed':
        return CheckCircle
      case 'in_progress':
        return Navigation
      case 'completed':
        return CheckCircle
      case 'cancelled':
        return XCircle
      default:
        return AlertTriangle
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      in_progress: 'En progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Citas
          </h1>
          <p className="text-gray-600">
            Administra y supervisa todas las citas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportAppointments}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="btn btn-primary btn-md flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar citas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="tomorrow">Mañana</option>
            <option value="week">Esta semana</option>
            <option value="past">Pasadas</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los servicios</option>
            <option value="verification">Verificación</option>
            <option value="inspection">Inspección</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="repair">Reparación</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setDateFilter('all')
              setServiceFilter('all')
            }}
            className="btn btn-secondary btn-md"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Navigation className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En progreso</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Citas ({filteredAppointments.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chofer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status)
                
                return (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{appointment._id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(appointment.scheduledDate)} • {formatTime(appointment.scheduledDate)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {appointment.serviceType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.client?.avatar ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={appointment.client.avatar}
                              alt={appointment.client.name}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {appointment.client?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.client?.name || 'Cliente no asignado'}
                          </div>
                          {appointment.client?.phone && (
                            <div className="text-sm text-gray-500">
                              {appointment.client.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.driver ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {appointment.driver.avatar ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover"
                                src={appointment.driver.avatar}
                                alt={appointment.driver.name}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {appointment.driver.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.driver.name}
                            </div>
                            {appointment.driver.phone && (
                              <div className="text-sm text-gray-500">
                                {appointment.driver.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">Sin asignar</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Car className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {appointment.car?.make} {appointment.car?.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.car?.licensePlate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          ${appointment.amount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewAppointment(appointment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!appointment.driver && appointment.status === 'pending' && (
                          <button
                            onClick={() => handleAssignDriver(appointment)}
                            className="text-green-600 hover:text-green-900"
                            title="Asignar chofer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <div className="relative group">
                            <button className="text-purple-600 hover:text-purple-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-6 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                              {appointment.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Confirmar
                                </button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(appointment._id, 'in_progress')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Iniciar
                                </button>
                              )}
                              {appointment.status === 'in_progress' && (
                                <button
                                  onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Completar
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron citas</p>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalles de la Cita
                </h2>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Appointment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Cita</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID</label>
                      <p className="text-sm text-gray-900">#{selectedAppointment._id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedAppointment.scheduledDate)} a las {formatTime(selectedAppointment.scheduledDate)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
                      <p className="text-sm text-gray-900">{selectedAppointment.serviceType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                        {React.createElement(getStatusIcon(selectedAppointment.status), { className: "w-3 h-3 mr-1" })}
                        {getStatusText(selectedAppointment.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monto</label>
                      <p className="text-sm text-gray-900">${selectedAppointment.amount?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dirección</label>
                      <p className="text-sm text-gray-900">{selectedAppointment.location?.address}</p>
                    </div>
                    {selectedAppointment.location?.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notas de ubicación</label>
                        <p className="text-sm text-gray-900">{selectedAppointment.location.notes}</p>
                      </div>
                    )}
                    <button className="btn btn-secondary btn-sm flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Ver en mapa</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Client and Driver Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente</h3>
                  {selectedAppointment.client ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        {selectedAppointment.client.avatar ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={selectedAppointment.client.avatar}
                            alt={selectedAppointment.client.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {selectedAppointment.client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedAppointment.client.name}</p>
                          <p className="text-sm text-gray-500">{selectedAppointment.client.email}</p>
                        </div>
                      </div>
                      {selectedAppointment.client.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{selectedAppointment.client.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Cliente no asignado</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Chofer</h3>
                  {selectedAppointment.driver ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        {selectedAppointment.driver.avatar ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={selectedAppointment.driver.avatar}
                            alt={selectedAppointment.driver.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {selectedAppointment.driver.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedAppointment.driver.name}</p>
                          <p className="text-sm text-gray-500">{selectedAppointment.driver.email}</p>
                        </div>
                      </div>
                      {selectedAppointment.driver.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{selectedAppointment.driver.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Chofer no asignado</p>
                      <button
                        onClick={() => {
                          setShowAppointmentModal(false)
                          handleAssignDriver(selectedAppointment)
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Asignar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca y Modelo</label>
                    <p className="text-sm text-gray-900">
                      {selectedAppointment.car?.make} {selectedAppointment.car?.model} ({selectedAppointment.car?.year})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Placas</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.car?.licensePlate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.car?.color}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.car?.type}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cerrar
              </button>
              {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                <button className="btn btn-primary btn-md">
                  Editar Cita
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && appointmentToAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Asignar Chofer
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Selecciona un chofer disponible para la cita #{appointmentToAssign._id.slice(-8)}
              </p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => confirmAssignDriver(driver._id)}
                  >
                    <div className="flex items-center space-x-3">
                      {driver.avatar ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={driver.avatar}
                          alt={driver.name}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {driver.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500">
                          {driver.rating?.toFixed(1) || '0.0'} ⭐ • {driver.totalAppointments || 0} citas
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Disponible
                    </div>
                  </div>
                ))}
              </div>

              {availableDrivers.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay choferes disponibles</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments