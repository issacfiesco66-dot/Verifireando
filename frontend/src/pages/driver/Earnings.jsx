import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock,
  MapPin,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react'

const Earnings = () => {
  const [earnings, setEarnings] = useState([])
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockEarnings = [
        {
          id: 1,
          date: '2024-01-15',
          time: '09:30',
          service: 'Verificación Vehicular',
          location: 'Polanco, CDMX',
          amount: 450,
          commission: 67.5,
          status: 'completed'
        },
        {
          id: 2,
          date: '2024-01-15',
          time: '14:15',
          service: 'Verificación + Lavado',
          location: 'Roma Norte, CDMX',
          amount: 650,
          commission: 97.5,
          status: 'completed'
        },
        {
          id: 3,
          date: '2024-01-14',
          time: '11:00',
          service: 'Verificación Vehicular',
          location: 'Satelite, EdoMéx',
          amount: 450,
          commission: 67.5,
          status: 'completed'
        }
      ]

      setEarnings(mockEarnings)
      setSummary({
        today: 165,
        week: 232.5,
        month: 1250,
        total: 15680
      })
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const exportEarnings = () => {
    try {
      // Crear contenido CSV
      const headers = ['Fecha', 'Hora', 'Servicio', 'Ubicación', 'Monto', 'Comisión', 'Estado']
      const csvContent = [
        headers.join(','),
        ...earnings.map(earning => [
          earning.date,
          earning.time,
          `"${earning.service}"`,
          `"${earning.location}"`,
          earning.amount,
          earning.commission,
          earning.status
        ].join(','))
      ].join('\n')
      
      // Agregar resumen al final
      const summaryContent = [
        '',
        'RESUMEN',
        `Hoy,${formatCurrency(summary.today)}`,
        `Esta semana,${formatCurrency(summary.week)}`,
        `Este mes,${formatCurrency(summary.month)}`,
        `Total,${formatCurrency(summary.total)}`
      ].join('\n')
      
      const finalContent = csvContent + summaryContent
      
      // Crear y descargar el archivo
      const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ganancias_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Mostrar notificación de éxito (simulado con alert ya que no hay toast importado)
      alert('Ganancias exportadas correctamente')
    } catch (error) {
      console.error('Error al exportar ganancias:', error)
      alert('Error al exportar ganancias')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Ganancias</h1>
          <p className="text-gray-600">Revisa tus ingresos y comisiones</p>
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
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.today)}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.week)}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.month)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Ganancias</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mi Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(earning.date).toLocaleDateString('es-MX')}
                        </div>
                        <div className="text-sm text-gray-500">{earning.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {earning.service}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{earning.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(earning.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(earning.commission)}
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
      </div>
    </div>
  )
}

export default Earnings