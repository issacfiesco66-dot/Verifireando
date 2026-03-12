import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { paymentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const X_ICON = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const Payments = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('history')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null)
  const [showAddMethodModal, setShowAddMethodModal] = useState(false)
  const [addMethodForm, setAddMethodForm] = useState({ cardNumber: '', expiry: '', cvv: '', name: '' })
  const [addingMethod, setAddingMethod] = useState(false)
  const [settingDefault, setSettingDefault] = useState(null)

  useEffect(() => {
    fetchPayments()
    fetchPaymentMethods()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter, dateFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentService.getMyPayments()
      setPayments(response.data.payments || [])
    } catch (error) {
      console.error('Error al cargar pagos:', error)
      toast.error('Error al cargar pagos')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentService.getPaymentMethods()
      setPaymentMethods(response.data || [])
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error)
      toast.error('Error al cargar métodos de pago')
      setPaymentMethods([])
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          )
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          )
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          )
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          )
          break
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    setFilteredPayments(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-error-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-info-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'failed':
        return 'Fallido'
      case 'pending':
        return 'Pendiente'
      case 'refunded':
        return 'Reembolsado'
      default:
        return 'Desconocido'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'failed':
        return 'bg-error-100 text-error-800'
      case 'pending':
        return 'bg-warning-100 text-warning-800'
      case 'refunded':
        return 'bg-info-100 text-info-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadReceipt = async (paymentId) => {
    try {
      const response = await paymentService.downloadReceipt(paymentId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `recibo-${paymentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Error al descargar el recibo')
    }
  }

  const deletePaymentMethod = async (methodId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      return
    }

    try {
      await paymentService.deletePaymentMethod(methodId)
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
      toast.success('Método de pago eliminado')
    } catch (error) {
      toast.error('Error al eliminar el método de pago')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
  }

  const showPaymentDetails = (payment) => {
    setSelectedPaymentDetail(payment)
    setShowDetailModal(true)
  }

  const handleSetDefault = async (methodId) => {
    try {
      setSettingDefault(methodId)
      await paymentService.setDefaultPaymentMethod(methodId)
      setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: (m._id || m.id) === methodId })))
      toast.success('Método predeterminado actualizado')
    } catch (error) {
      toast.error('Error al actualizar el método predeterminado')
    } finally {
      setSettingDefault(null)
    }
  }

  const handleAddMethod = async (e) => {
    e.preventDefault()
    try {
      setAddingMethod(true)
      const res = await paymentService.addPaymentMethod(addMethodForm)
      setPaymentMethods(prev => [...prev, res.data])
      toast.success('Método de pago agregado')
      setShowAddMethodModal(false)
      setAddMethodForm({ cardNumber: '', expiry: '', cvv: '', name: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar el método de pago')
    } finally {
      setAddingMethod(false)
    }
  }

  const getMethodText = (method) => {
    const methodMap = {
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'cash': 'Efectivo',
      'transfer': 'Transferencia Bancaria'
    }
    return methodMap[method] || method
  }

  const tabs = [
    { id: 'history', label: 'Historial de pagos' },
    { id: 'methods', label: 'Métodos de pago' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
            <p className="text-gray-600">
              Gestiona tu historial de pagos y métodos de pago
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="p-8">
              {/* Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar por ID de pago, descripción o cita..."
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
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
                    <option value="failed">Fallido</option>
                    <option value="refunded">Reembolsado</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="input input-md w-full sm:w-auto"
                  >
                    <option value="all">Todas las fechas</option>
                    <option value="today">Hoy</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mes</option>
                    <option value="year">Último año</option>
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
                <div className="text-sm text-gray-600">
                  {filteredPayments.length === 0 ? (
                    'No se encontraron pagos'
                  ) : (
                    `Mostrando ${filteredPayments.length} de ${payments.length} pagos`
                  )}
                </div>
              </div>

              {/* Loading */}
              {loading ? (
                <LoadingSpinner text="Cargando historial de pagos..." />
              ) : (
                <>
                  {/* Payments List */}
                  {filteredPayments.length > 0 ? (
                    <div className="space-y-4">
                      {filteredPayments.map((payment) => (
                        <div
                          key={payment._id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(payment.status)}
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  Pago #{payment.id}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(payment.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                {formatAmount(payment.amount)}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {getStatusText(payment.status)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Descripción</p>
                              <p className="font-medium text-gray-900">
                                {payment.description || 'Verificación vehicular'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Método de pago</p>
                              <p className="font-medium text-gray-900">
                                {payment.paymentMethod || 'Tarjeta de crédito'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">ID de cita</p>
                              <p className="font-medium text-gray-900">
                                {payment.appointmentId || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">ID de transacción</p>
                              <p className="font-medium text-gray-900 font-mono text-xs">
                                {payment.transactionId || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex items-center justify-end space-x-3">
                            {payment.status === 'completed' && (
                              <button
                                onClick={() => downloadReceipt(payment.id)}
                                className="btn btn-secondary btn-sm flex items-center space-x-2"
                              >
                                <Download className="w-4 h-4" />
                                <span>Descargar recibo</span>
                              </button>
                            )}
                            <button 
                              onClick={() => showPaymentDetails(payment)}
                              className="btn btn-primary btn-sm flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver detalles</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'No se encontraron pagos'
                          : 'No tienes pagos registrados'
                        }
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Cuando realices pagos, aparecerán aquí'
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
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Métodos de pago
                  </h2>
                  <p className="text-gray-600">
                    Gestiona tus tarjetas y métodos de pago guardados
                  </p>
                </div>
                <button onClick={() => setShowAddMethodModal(true)} className="btn btn-primary btn-md flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Agregar método</span>
                </button>
              </div>

              {/* Payment Methods List */}
              {paymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paymentMethods.map((method) => (
                    <div
                      key={method._id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              **** **** **** {method.last4}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {method.brand?.toUpperCase()} • Exp. {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                            Predeterminada
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-2">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method._id || method.id)}
                            disabled={settingDefault === (method._id || method.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            {settingDefault === (method._id || method.id) ? 'Guardando...' : 'Hacer predeterminada'}
                          </button>
                        )}
                        <button
                          onClick={() => deletePaymentMethod(method.id)}
                          className="btn btn-error btn-sm flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes métodos de pago guardados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Agrega una tarjeta para realizar pagos más rápido
                  </p>
                  <button onClick={() => setShowAddMethodModal(true)} className="btn btn-primary btn-md flex items-center space-x-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    <span>Agregar método de pago</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Payment Detail Modal */}
      {showDetailModal && selectedPaymentDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detalle del Pago</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X_ICON className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">ID del Pago</span><span className="font-mono font-medium">{selectedPaymentDetail._id || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Número de Cita</span><span className="font-medium">{selectedPaymentDetail.appointmentNumber || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className="font-bold text-lg">{formatAmount(selectedPaymentDetail.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="font-medium">{formatDate(selectedPaymentDetail.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPaymentDetail.status)}`}>{getStatusText(selectedPaymentDetail.status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Método</span><span className="font-medium">{getMethodText(selectedPaymentDetail.method)}</span></div>
              {selectedPaymentDetail.description && <div className="flex justify-between"><span className="text-gray-500">Descripción</span><span className="font-medium">{selectedPaymentDetail.description}</span></div>}
              {selectedPaymentDetail.transactionId && <div className="flex justify-between"><span className="text-gray-500">Transacción</span><span className="font-mono text-xs">{selectedPaymentDetail.transactionId}</span></div>}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary btn-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Método de Pago</h3>
              <button onClick={() => setShowAddMethodModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X_ICON className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMethod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la tarjeta *</label>
                <input type="text" required value={addMethodForm.name} onChange={e => setAddMethodForm(p => ({...p, name: e.target.value}))} className="input input-md w-full" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta *</label>
                <input type="text" required maxLength={19} value={addMethodForm.cardNumber} onChange={e => setAddMethodForm(p => ({...p, cardNumber: e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim()}))} className="input input-md w-full font-mono" placeholder="0000 0000 0000 0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento *</label>
                  <input type="text" required maxLength={5} value={addMethodForm.expiry} onChange={e => setAddMethodForm(p => ({...p, expiry: e.target.value.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2')}))} className="input input-md w-full font-mono" placeholder="MM/AA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                  <input type="password" required maxLength={4} value={addMethodForm.cvv} onChange={e => setAddMethodForm(p => ({...p, cvv: e.target.value.replace(/\D/g,'')}))} className="input input-md w-full font-mono" placeholder="123" />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                Tus datos de pago son encriptados y protegidos de forma segura.
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAddMethodModal(false)} className="btn btn-secondary btn-md">Cancelar</button>
                <button type="submit" disabled={addingMethod} className="btn btn-primary btn-md">{addingMethod ? 'Agregando...' : 'Agregar tarjeta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments