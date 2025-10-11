import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  Car,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Activity,
  Target,
  Zap,
  Eye,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Reports = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [reportType, setReportType] = useState('overview')
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalDrivers: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      averageRating: 0,
      completionRate: 0,
      growthRate: 0,
      activeUsers: 0
    },
    charts: {
      appointmentsByMonth: [],
      revenueByMonth: [],
      userGrowth: [],
      appointmentsByStatus: [],
      appointmentsByService: [],
      topDrivers: [],
      topLocations: [],
      paymentMethods: []
    },
    trends: {
      appointments: { value: 0, change: 0, trend: 'up' },
      revenue: { value: 0, change: 0, trend: 'up' },
      users: { value: 0, change: 0, trend: 'up' },
      satisfaction: { value: 0, change: 0, trend: 'up' }
    }
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAnalytics(dateRange)
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Error al cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const blob = await adminService.exportReport(reportType, dateRange)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${reportType}_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Reporte exportado exitosamente')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Error al exportar el reporte')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  const getDateRangeText = (range) => {
    const rangeMap = {
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
      '90d': 'Últimos 90 días',
      '1y': 'Último año'
    }
    return rangeMap[range] || range
  }

  const getTrendIcon = (trend) => {
    return trend === 'up' ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
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
            Reportes y Analíticas
          </h1>
          <p className="text-gray-600">
            Análisis detallado del rendimiento del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalytics}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={exportReport}
            className="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Resumen General</option>
                <option value="financial">Financiero</option>
                <option value="operational">Operacional</option>
                <option value="customer">Clientes</option>
                <option value="driver">Choferes</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Datos para: {getDateRangeText(dateRange)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.trends.appointments.value.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(analytics.trends.appointments.trend), {
                  className: `w-4 h-4 mr-1 ${getTrendColor(analytics.trends.appointments.trend)}`
                })}
                <span className={`text-sm ${getTrendColor(analytics.trends.appointments.trend)}`}>
                  {formatPercentage(analytics.trends.appointments.change)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.trends.revenue.value)}
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(analytics.trends.revenue.trend), {
                  className: `w-4 h-4 mr-1 ${getTrendColor(analytics.trends.revenue.trend)}`
                })}
                <span className={`text-sm ${getTrendColor(analytics.trends.revenue.trend)}`}>
                  {formatPercentage(analytics.trends.revenue.change)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.trends.users.value.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(analytics.trends.users.trend), {
                  className: `w-4 h-4 mr-1 ${getTrendColor(analytics.trends.users.trend)}`
                })}
                <span className={`text-sm ${getTrendColor(analytics.trends.users.trend)}`}>
                  {formatPercentage(analytics.trends.users.change)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfacción</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.trends.satisfaction.value.toFixed(1)}/5.0
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(analytics.trends.satisfaction.trend), {
                  className: `w-4 h-4 mr-1 ${getTrendColor(analytics.trends.satisfaction.trend)}`
                })}
                <span className={`text-sm ${getTrendColor(analytics.trends.satisfaction.trend)}`}>
                  {formatPercentage(analytics.trends.satisfaction.change)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Month */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Citas por Mes
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.charts.appointmentsByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.count / Math.max(...analytics.charts.appointmentsByMonth.map(i => i.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Ingresos por Mes
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.charts.revenueByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(item.amount / Math.max(...analytics.charts.revenueByMonth.map(i => i.amount))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Citas por Estado
            </h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.charts.appointmentsByStatus.map((item, index) => {
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500']
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{formatPercentage(item.percentage)}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Mejores Choferes
            </h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.charts.topDrivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.appointments} citas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {driver.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Types */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Servicios Más Solicitados
          </h3>
          <div className="space-y-3">
            {analytics.charts.appointmentsByService.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{service.type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {service.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ubicaciones Populares
          </h3>
          <div className="space-y-3">
            {analytics.charts.topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{location.area}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {location.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métodos de Pago
          </h3>
          <div className="space-y-3">
            {analytics.charts.paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{method.method}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{formatPercentage(method.percentage)}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(method.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Indicadores de Rendimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercentage(analytics.overview.completionRate)}
            </p>
            <p className="text-sm text-gray-600">Tasa de Completación</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.overview.activeUsers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Usuarios Activos</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-3">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.overview.averageRating.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Calificación Promedio</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercentage(analytics.overview.growthRate)}
            </p>
            <p className="text-sm text-gray-600">Crecimiento Mensual</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Reporte Detallado</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Exportar Datos</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Vista Personalizada</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Activity className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Monitoreo en Vivo</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports