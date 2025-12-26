import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Plus, 
  Bell, 
  CreditCard,
  User,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { appointmentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const { onlineDrivers } = useSocket()
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getMyAppointments()
      const appointmentsData = response.data.appointments || []
      
      setAppointments(appointmentsData.slice(0, 5)) // Show only recent 5
      
      // Calculate stats
      const stats = appointmentsData.reduce((acc, appointment) => {
        acc.total++
        acc[appointment.status] = (acc[appointment.status] || 0) + 1
        return acc
      }, { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
      
      setStats(stats)
    } catch (error) {
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
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
                Bienvenido a tu panel de control
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>{onlineDrivers.length} choferes en línea</span>
              </div>
              <Link
                to="/client/appointments/new"
                className="btn btn-primary btn-md flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva cita</span>
              </Link>
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
                <p className="text-sm font-medium text-gray-600">Total de citas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-info-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Citas recientes
                  </h2>
                  <Link
                    to="/client/appointments"
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
                      No tienes citas aún
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Programa tu primera cita de verificación vehicular
                    </p>
                    <Link
                      to="/client/appointments/new"
                      className="btn btn-primary btn-md"
                    >
                      Programar cita
                    </Link>
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
                              {appointment.location?.address || 'Dirección no especificada'}
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
                              {appointment.driver && (
                                <span className="text-xs text-gray-500">
                                  Chofer: {appointment.driver.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/client/appointments/${appointment._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones rápidas
              </h2>
              <div className="space-y-3">
                <Link
                  to="/client/appointments/new"
                  className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva cita</span>
                </Link>
                
                <Link
                  to="/client/appointments"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ver mis citas</span>
                </Link>
                
                <Link
                  to="/client/profile"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Mi perfil</span>
                </Link>
                
                <Link
                  to="/client/payments"
                  className="w-full btn btn-secondary btn-md flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagos</span>
                </Link>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-soft p-6 text-white">
              <div className="flex items-center mb-4">
                <User className="w-8 h-8" />
                <div className="ml-3">
                  <h3 className="font-semibold">Perfil</h3>
                  <p className="text-primary-100 text-sm">
                    {user?.isVerified ? 'Verificado' : 'Pendiente verificación'}
                  </p>
                </div>
              </div>
              
              {!user?.isVerified && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                  <p className="text-sm mb-2">
                    Verifica tu email para acceder a todas las funciones
                  </p>
                  <Link
                    to="/auth/verify-email"
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    Verificar ahora
                  </Link>
                </div>
              )}
              
              <Link
                to="/client/profile"
                className="inline-flex items-center text-sm font-medium hover:underline"
              >
                Completar perfil
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Nuestro equipo de soporte está aquí para ayudarte
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