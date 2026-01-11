import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Navigation, 
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Power,
  Route,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLocation } from '../../contexts/LocationContext'
import { useSocket } from '../../contexts/SocketContext'
import { appointmentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import NotificationPanel from '../../components/driver/NotificationPanel'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const { currentLocation, requestLocationPermission } = useLocation()
  const { socket, isConnected, emit } = useSocket()
  const [appointments, setAppointments] = useState([])
  const [availableAppointments, setAvailableAppointments] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    earnings: 0
  })
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingAvailable, setLoadingAvailable] = useState(false)

  useEffect(() => {
    fetchAppointments()
    checkOnlineStatus()
  }, [])

  useEffect(() => {
    if (isOnline) {
      fetchAvailableAppointments()
      // Refrescar citas disponibles cada 30 segundos si está en línea
      const interval = setInterval(() => {
        fetchAvailableAppointments()
      }, 30000)
      return () => clearInterval(interval)
    } else {
      setAvailableAppointments([])
    }
  }, [isOnline])

  useEffect(() => {
    if (!socket) return;

    const handleAppointmentAssigned = (data) => {
      console.log('Nueva cita asignada:', data);
      toast.success(`¡Nueva cita asignada! #${data.appointmentNumber}`);
      fetchAppointments(); // Refrescar lista de citas
    };

    const handleAppointmentUpdated = (data) => {
      console.log('Cita actualizada:', data);
      fetchAppointments(); // Refrescar lista de citas
    };

    const handleNewAppointmentAvailable = (appointment) => {
      console.log('Nueva cita disponible:', appointment);
      toast.success('¡Hay una nueva cita disponible!', { icon: '🚗' });
      // Refrescar citas disponibles si está en línea
      if (isOnline) {
        fetchAvailableAppointments();
      }
    };

    socket.on('appointment-assigned', handleAppointmentAssigned);
    socket.on('appointment-updated', handleAppointmentUpdated);
    socket.on('new-appointment-available', handleNewAppointmentAvailable);

    return () => {
      socket.off('appointment-assigned', handleAppointmentAssigned);
      socket.off('appointment-updated', handleAppointmentUpdated);
      socket.off('new-appointment-available', handleNewAppointmentAvailable);
    };
  }, [socket])

  useEffect(() => {
    if (currentLocation && isOnline) {
      updateDriverLocation()
    }
  }, [currentLocation, isOnline])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getDriverAppointments()
      const appointmentsData = response.data.appointments || []
      setAppointments(appointmentsData)
      
      // Calculate stats
      const today = new Date()
      const stats = {
        today: appointmentsData.filter(apt => {
          const aptDate = new Date(apt.scheduledDate)
          return aptDate.toDateString() === today.toDateString()
        }).length,
        pending: appointmentsData.filter(apt => ['assigned','driver_enroute','picked_up','in_verification'].includes(apt.status)).length,
        completed: appointmentsData.filter(apt => apt.status === 'completed').length,
        earnings: appointmentsData
          .filter(apt => apt.status === 'completed')
          .reduce((total, apt) => total + (apt.pricing?.total || 0), 0)
      }
      
      setStats(stats)
    } catch (error) {
      console.error('❌ Error fetching appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableAppointments = async () => {
    try {
      setLoadingAvailable(true)
      const response = await appointmentService.getAvailableAppointments()
      const availableData = response.data.appointments || []
      setAvailableAppointments(availableData)
      
      if (availableData.length === 0 && isOnline) {
        // Solo mostrar mensaje si está en línea pero no hay citas (no es un error)
        console.log('No hay citas disponibles en este momento')
      }
    } catch (error) {
      console.error('❌ Error fetching available appointments:', error)
      // Mostrar error al usuario si falla
      if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver citas disponibles')
      } else if (error.response?.status !== 404) {
        toast.error('Error al cargar citas disponibles. Intenta actualizar.')
      }
      setAvailableAppointments([])
    } finally {
      setLoadingAvailable(false)
    }
  }

  const checkOnlineStatus = () => {
    // Check if driver is currently online
    const savedStatus = localStorage.getItem('driverOnlineStatus')
    setIsOnline(savedStatus === 'true')
  }

  const toggleOnlineStatus = async () => {
    try {
      if (!isOnline && !currentLocation) {
        const permission = await requestLocationPermission()
        if (!permission) {
          toast.error('Se requiere acceso a la ubicación para estar en línea')
          return
        }
      }

      const newStatus = !isOnline
      
      // Sincronizar con el backend
      try {
        const { driverService } = await import('../../services/api')
        await driverService.updateOnlineStatus(user._id, newStatus)
        
        setIsOnline(newStatus)
        localStorage.setItem('driverOnlineStatus', newStatus.toString())

        if (newStatus) {
          toast.success('Ahora estás en línea')
          // Cargar citas disponibles cuando se conecta
          fetchAvailableAppointments()
        } else {
          toast.success('Ahora estás fuera de línea')
          setAvailableAppointments([])
        }
      } catch (apiError) {
        console.error('Error actualizando estado en backend:', apiError)
        // Fallback: actualizar solo localmente si falla el backend
        setIsOnline(newStatus)
        localStorage.setItem('driverOnlineStatus', newStatus.toString())
        toast.warning('Estado actualizado localmente. Verifica tu conexión.')
      }
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  const updateDriverLocation = () => {
    // Socket.IO removed - location updates disabled
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-error-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      case 'completed':
        return 'Completada'
      default:
        return status
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard..." />
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">
                Panel de control del chofer
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'En línea' : 'Fuera de línea'}
                </span>
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`btn btn-md flex items-center space-x-2 ${
                  isOnline ? 'btn-error' : 'btn-success'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isOnline ? 'Desconectar' : 'Conectar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Citas hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-info-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ganancias</p>
                <p className="text-2xl font-bold text-gray-900">${stats.earnings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Citas Disponibles (solo si está en línea) - MOSTRAR PRIMERO */}
        {isOnline && (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    🚗 Citas Disponibles
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Acepta nuevas citas cuando estés en línea
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={fetchAvailableAppointments}
                    disabled={loadingAvailable}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAvailable ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {loadingAvailable ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <p className="text-gray-600 mt-2">Buscando citas disponibles...</p>
                </div>
              ) : availableAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay citas disponibles en este momento
                  </h3>
                  <p className="text-gray-600">
                    Mantente en línea para recibir notificaciones de nuevas citas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="border-2 border-blue-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-5 h-5 text-blue-600" />
                            <p className="font-bold text-gray-900 text-lg">
                              {appointment.client?.name || 'Cliente'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-red-500" />
                            {appointment.location?.address || appointment.pickupAddress?.street || 'Dirección no disponible'}
                          </p>
                          <div className="flex items-center flex-wrap gap-3 text-sm">
                            <span className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(appointment.scheduledDate)}
                            </span>
                            {appointment.distance && (
                              <span className="flex items-center text-blue-600 font-medium">
                                📍 {appointment.distance.toFixed(1)} km de distancia
                              </span>
                            )}
                            {appointment.pricing?.total && (
                              <span className="flex items-center text-green-600 font-bold">
                                💰 ${appointment.pricing.total}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <button
                            onClick={async () => {
                              try {
                                await appointmentService.acceptAppointment(appointment._id)
                                toast.success('¡Cita aceptada exitosamente!')
                                fetchAppointments() // Refrescar citas asignadas
                                fetchAvailableAppointments() // Refrescar disponibles
                              } catch (error) {
                                toast.error(error.response?.data?.message || 'Error al aceptar la cita')
                              }
                            }}
                            className="btn btn-success btn-md flex items-center space-x-2 px-6 shadow-lg"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span>Aceptar</span>
                          </button>
                          <Link
                            to={`/driver/appointments/${appointment._id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Ver detalles →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Mis citas asignadas
                  </h2>
                  <Link
                    to="/driver/appointments"
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    Ver todas
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes citas asignadas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {isOnline ? 'Mantente en línea para recibir nuevas citas' : 'Conéctate para recibir citas'}
                    </p>
                    {!isOnline && (
                      <button
                        onClick={toggleOnlineStatus}
                        className="btn btn-primary btn-md"
                      >
                        Conectarse
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(appointment.status)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(appointment.scheduledDate)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cliente: {appointment.client?.name || 'No asignado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.pickupAddress?.street || 'Dirección no especificada'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appointment.status === 'confirmed' ? 'bg-success-100 text-success-800' :
                                appointment.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                                appointment.status === 'cancelled' ? 'bg-error-100 text-error-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusText(appointment.status)}
                              </span>
                              {appointment.pricing?.total && (
                                <span className="text-xs text-gray-500">
                                  ${appointment.pricing.total}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={async () => {
                                try {
                                  await appointmentService.acceptAppointment(appointment._id)
                                  toast.success('Cita aceptada exitosamente')
                                  fetchAppointments() // Refrescar lista
                                } catch (error) {
                                  toast.error(error.response?.data?.message || 'Error al aceptar la cita')
                                }
                              }}
                              className="btn btn-success btn-sm flex items-center space-x-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Aceptar</span>
                            </button>
                          )}
                          {appointment.status !== 'pending' && appointment.location?.coordinates && (
                            <button
                              onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${appointment.location.coordinates[1]},${appointment.location.coordinates[0]}`
                                window.open(url, '_blank')
                              }}
                              className="btn btn-secondary btn-sm flex items-center space-x-1"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Navegar</span>
                            </button>
                          )}
                          <Link
                            to={`/driver/appointments/${appointment._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Notification Panel */}
            <NotificationPanel />
            
            {/* Status Card */}
            <div className={`rounded-xl shadow-soft p-6 ${isOnline ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
              <div className="flex items-center mb-4">
                <Power className="w-8 h-8" />
                <div className="ml-3">
                  <h3 className="font-semibold">Estado</h3>
                  <p className="text-sm opacity-90">
                    {isOnline ? 'En línea y disponible' : 'Fuera de línea'}
                  </p>
                </div>
              </div>
              
              {currentLocation && isOnline && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Ubicación compartida</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={toggleOnlineStatus}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg py-2 px-4 text-sm font-medium transition-colors"
              >
                {isOnline ? 'Desconectarse' : 'Conectarse'}
              </button>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones rápidas
              </h2>
              <div className="space-y-3">
                <Link
                  to="/driver/appointments"
                  className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ver citas</span>
                </Link>
                
                <Link
                  to="/driver/route"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <Route className="w-4 h-4" />
                  <span>Planificar ruta</span>
                </Link>
                
                <Link
                  to="/driver/profile"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Mi perfil</span>
                </Link>
                
                <Link
                  to="/driver/earnings"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Ganancias</span>
                </Link>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Información del vehículo
              </h3>
              {user?.driverProfile?.vehicleInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {user.driverProfile.vehicleInfo.brand} {user.driverProfile.vehicleInfo.model}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Placa: {user.driverProfile.vehicleInfo.plates}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Completa la información de tu vehículo
                  </p>
                  <Link
                    to="/driver/profile"
                    className="w-full btn btn-secondary btn-sm"
                  >
                    Completar información
                  </Link>
                </div>
              )}
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Contacta al soporte para cualquier consulta
              </p>
              <Link
                to="/support"
                className="w-full btn btn-secondary btn-sm"
              >
                Contactar soporte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
