import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Clock,
  MapPin,
  Download,
  CheckCircle
} from 'lucide-react'
import { appointmentService } from '../../services/api'
import toast from 'react-hot-toast'

const Earnings = () => {
  const [completedAppointments, setCompletedAppointments] = useState([])
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  })
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [selectedPeriod])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const response = await appointmentService.getMyAppointments()
      const appointments = response.data?.appointments || response.data || []
      
      const completed = appointments.filter(a => a.status === 'completed' || a.status === 'delivered')

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      setSummary({
        today: completed.filter(a => new Date(a.updatedAt || a.createdAt) >= startOfToday).length,
        week: completed.filter(a => new Date(a.updatedAt || a.createdAt) >= startOfWeek).length,
        month: completed.filter(a => new Date(a.updatedAt || a.createdAt) >= startOfMonth).length,
        total: completed.length
      })

      setCompletedAppointments(completed)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error al cargar el historial de servicios')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return completedAppointments.filter(a => {
      const date = new Date(a.updatedAt || a.createdAt)
      if (selectedPeriod === 'week') return date >= startOfWeek
      if (selectedPeriod === 'month') return date >= startOfMonth
      if (selectedPeriod === 'year') return date >= startOfYear
      return true
    })
  }

  const exportEarnings = () => {
    try {
      const filtered = getFilteredAppointments()
      const headers = ['Fecha', 'Número de cita', 'Dirección', 'Estado']
      const csvContent = [
        headers.join(','),
        ...filtered.map(a => [
          new Date(a.scheduledDate || a.createdAt).toLocaleDateString('es-MX'),
          a.appointmentNumber || a._id,
          `"${a.pickupAddress?.street || a.address || ''}"`,
          a.status
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `servicios_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(anchor)
      toast.success('Historial exportado correctamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar el historial')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filtered = getFilteredAppointments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Servicios</h1>
          <p className="text-gray-600">Historial de servicios completados</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
          <button
            onClick={exportEarnings}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{summary.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Esta semana</p>
              <p className="text-2xl font-bold text-gray-900">{summary.week}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Este mes</p>
              <p className="text-2xl font-bold text-gray-900">{summary.month}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Servicios</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No hay servicios completados en este período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cita #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(appt.scheduledDate || appt.updatedAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appt.appointmentNumber || appt._id?.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate max-w-xs">
                          {appt.pickupAddress?.street || appt.address || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Completado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Earnings