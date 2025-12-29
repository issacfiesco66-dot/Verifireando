import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Star
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, new: 0 },
    drivers: { total: 0, active: 0, online: 0 },
    appointments: { total: 0, today: 0, pending: 0, completed: 0 },
    revenue: { total: 0, today: 0, month: 0 },
    cars: { total: 0, verified: 0, pending: 0 }
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [topDrivers, setTopDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, activityData, driversData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivity(),
        adminService.getTopDrivers()
      ])
      
      setStats(statsData)
      setRecentActivity(activityData)
      setTopDrivers(driversData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return <UserCheck className="w-4 h-4 text-green-500" />
      case 'appointment_created':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'payment_completed':
        return <DollarSign className="w-4 h-4 text-green-500" />
      case 'driver_verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'car_registered':
        return <Car className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'user_registered':
        return `Nuevo usuario registrado: ${activity.data.name}`
      case 'appointment_created':
        return `Nueva cita creada por ${activity.data.clientName}`
      case 'payment_completed':
        return `Pago completado: $${activity.data.amount}`
      case 'driver_verified':
        return `Chofer verificado: ${activity.data.name}`
      case 'car_registered':
        return `Vehículo registrado: ${activity.data.make} ${activity.data.model}`
      default:
        return activity.description
    }
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
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.name}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleTimeString('es-MX')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{stats.users.new} nuevos hoy
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Drivers Stats */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Choferes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.drivers.total}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {onlineDrivers?.length || 0} en línea
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/drivers"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Appointments Stats */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.appointments.total}</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {stats.appointments.today} hoy
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/appointments"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.revenue.total.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <DollarSign className="w-3 h-3 mr-1" />
                ${stats.revenue.today.toLocaleString()} hoy
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/payments"
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Ver pagos →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Actividad Reciente
            </h2>
            <Link
              to="/admin/reports"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver reportes
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Mejores Choferes
            </h2>
            <Link
              to="/admin/drivers"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </Link>
          </div>
          
          <div className="space-y-4">
            {topDrivers.length > 0 ? (
              topDrivers.map((driver, index) => (
                <div key={driver._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {driver.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">
                          {driver.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">
                        {driver.completedAppointments} citas
                      </span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    onlineDrivers?.some(d => d.id === driver._id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }`}></div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay datos de choferes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Gestionar Usuarios</span>
          </Link>
          
          <Link
            to="/admin/drivers"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Gestionar Choferes</span>
          </Link>
          
          <Link
            to="/admin/appointments"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Ver Citas</span>
          </Link>
          
          <Link
            to="/admin/reports"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard