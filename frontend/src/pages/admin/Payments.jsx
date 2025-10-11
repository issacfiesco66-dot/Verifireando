import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Car,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Payments = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [paymentToRefund, setPaymentToRefund] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    successRate: 0,
    monthlyGrowth: 0,
    topPaymentMethods: [],
    revenueByMonth: []
  })

  useEffect(() => {
    fetchPayments()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter])

  useEffect(() => {
    if (socket) {
      socket.on('paymentCreated', handlePaymentUpdate)
      socket.on('paymentUpdated', handlePaymentUpdate)
      socket.on('refundProcessed', handlePaymentUpdate)
      
      return () => {
        socket.off('paymentCreated', handlePaymentUpdate)
        socket.off('paymentUpdated', handlePaymentUpdate)
        socket.off('refundProcessed', handlePaymentUpdate)
      }
    }
  }, [socket])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const data = await adminService.getPayments()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Error al cargar los pagos')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const data = await adminService.getPaymentAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handlePaymentUpdate = (paymentData) => {
    setPayments(prev => {
      const index = prev.findIndex(p => p._id === paymentData._id)
      if (index !== -1) {
        const updated = [...prev]
        updated[index] = paymentData
        return updated
      } else {
        return [paymentData, ...prev]
      }
    })
    fetchAnalytics() // Refresh analytics when payments change
  }

  const filterPayments = () => {
    let filtered = payments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.appointment?._id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Filter by payment method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return paymentDate >= today
          case 'yesterday':
            return paymentDate >= yesterday && paymentDate < today
          case 'week':
            return paymentDate >= weekAgo
          case 'month':
            return paymentDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    setFilteredPayments(filtered)
  }

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handleRefundPayment = (payment) => {
    setPaymentToRefund(payment)
    setRefundAmount(payment.amount.toString())
    setRefundReason('')
    setShowRefundModal(true)
  }

  const confirmRefund = async () => {
    try {
      await adminService.processRefund(paymentToRefund._id, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      })
      
      setPayments(payments.map(p => 
        p._id === paymentToRefund._id 
          ? { ...p, status: 'refunded', refundAmount: parseFloat(refundAmount), refundReason }
          : p
      ))
      
      toast.success('Reembolso procesado exitosamente')
      setShowRefundModal(false)
      setPaymentToRefund(null)
      setRefundAmount('')
      setRefundReason('')
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error('Error al procesar el reembolso')
    }
  }

  const exportPayments = async () => {
    try {
      const blob = await adminService.exportPayments()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pagos_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Pagos exportados exitosamente')
    } catch (error) {
      console.error('Error exporting payments:', error)
      toast.error('Error al exportar pagos')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock
      case 'completed':
        return CheckCircle
      case 'failed':
        return XCircle
      case 'refunded':
        return RefreshCw
      default:
        return AlertTriangle
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return CreditCard
      case 'cash':
        return DollarSign
      case 'transfer':
        return ArrowUpRight
      default:
        return Receipt
    }
  }

  const getMethodText = (method) => {
    const methodMap = {
      card: 'Tarjeta',
      cash: 'Efectivo',
      transfer: 'Transferencia',
      wallet: 'Billetera digital'
    }
    return methodMap[method] || method
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
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
            Gestión de Pagos
          </h1>
          <p className="text-gray-600">
            Administra transacciones, reembolsos y analíticas financieras
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportPayments}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="btn btn-primary btn-md flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuevo Pago</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{analytics.monthlyGrowth}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTransactions}</p>
              <p className="text-sm text-gray-500 mt-1">Total procesadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.averageTransaction)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Por transacción</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.successRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Pagos exitosos</p>
            </div>
          </div>
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
              placeholder="Buscar pagos..."
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
            <option value="completed">Completados</option>
            <option value="failed">Fallidos</option>
            <option value="refunded">Reembolsados</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los métodos</option>
            <option value="card">Tarjeta</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="wallet">Billetera digital</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setMethodFilter('all')
              setDateFilter('all')
            }}
            className="btn btn-secondary btn-md"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Transacciones ({filteredPayments.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transacción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status)
                const MethodIcon = getMethodIcon(payment.paymentMethod)
                
                return (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{payment._id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(payment.createdAt)} • {formatTime(payment.createdAt)}
                        </div>
                        {payment.transactionId && (
                          <div className="text-xs text-gray-400">
                            ID: {payment.transactionId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {payment.client?.avatar ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={payment.client.avatar}
                              alt={payment.client.name}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {payment.client?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.client?.name || 'Cliente no disponible'}
                          </div>
                          {payment.client?.email && (
                            <div className="text-sm text-gray-500">
                              {payment.client.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.appointment ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            #{payment.appointment._id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.appointment.serviceType}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin cita asociada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MethodIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getMethodText(payment.paymentMethod)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.refundAmount && (
                        <div className="text-sm text-red-600">
                          -{formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'completed' && !payment.refundAmount && (
                          <button
                            onClick={() => handleRefundPayment(payment)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Procesar reembolso"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron pagos</p>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalles del Pago
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Pago</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID de Transacción</label>
                      <p className="text-sm text-gray-900">#{selectedPayment._id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID Externo</label>
                      <p className="text-sm text-gray-900">{selectedPayment.transactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedPayment.createdAt)} a las {formatTime(selectedPayment.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                        {React.createElement(getStatusIcon(selectedPayment.status), { className: "w-3 h-3 mr-1" })}
                        {getStatusText(selectedPayment.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                      <div className="flex items-center">
                        {React.createElement(getMethodIcon(selectedPayment.paymentMethod), { className: "w-4 h-4 text-gray-400 mr-2" })}
                        <span className="text-sm text-gray-900">
                          {getMethodText(selectedPayment.paymentMethod)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles Financieros</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monto Original</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                    {selectedPayment.refundAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Monto Reembolsado</label>
                        <p className="text-lg font-semibold text-red-600">
                          -{formatCurrency(selectedPayment.refundAmount)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monto Neto</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedPayment.amount - (selectedPayment.refundAmount || 0))}
                      </p>
                    </div>
                    {selectedPayment.fees && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Comisiones</label>
                        <p className="text-sm text-gray-900">
                          {formatCurrency(selectedPayment.fees)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              {selectedPayment.client && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente</h3>
                  <div className="flex items-center space-x-4">
                    {selectedPayment.client.avatar ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={selectedPayment.client.avatar}
                        alt={selectedPayment.client.name}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {selectedPayment.client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedPayment.client.name}</p>
                      <p className="text-sm text-gray-500">{selectedPayment.client.email}</p>
                      {selectedPayment.client.phone && (
                        <p className="text-sm text-gray-500">{selectedPayment.client.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Info */}
              {selectedPayment.appointment && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cita Asociada</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ID de Cita</label>
                        <p className="text-sm text-gray-900">#{selectedPayment.appointment._id.slice(-8)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
                        <p className="text-sm text-gray-900">{selectedPayment.appointment.serviceType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Cita</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedPayment.appointment.scheduledDate)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estado de Cita</label>
                        <p className="text-sm text-gray-900">{selectedPayment.appointment.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Info */}
              {selectedPayment.refundReason && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Reembolso</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedPayment.refundReason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cerrar
              </button>
              {selectedPayment.status === 'completed' && !selectedPayment.refundAmount && (
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    handleRefundPayment(selectedPayment)
                  }}
                  className="btn btn-primary btn-md"
                >
                  Procesar Reembolso
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && paymentToRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Procesar Reembolso
                  </h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Reembolsar
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={paymentToRefund.amount}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {formatCurrency(paymentToRefund.amount)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del Reembolso
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe la razón del reembolso..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRefund}
                  disabled={!refundAmount || !refundReason}
                  className="btn btn-primary btn-md"
                >
                  Procesar Reembolso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments