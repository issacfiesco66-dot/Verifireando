import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Download, 
  RefreshCw, 
  Calendar, 
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react'
import { stripeService } from '../../services/stripeService'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'

const PaymentHistory = ({ userId, userType = 'client' }) => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    searchTerm: ''
  })
  const [downloadingReceipt, setDownloadingReceipt] = useState(null)

  useEffect(() => {
    loadPaymentHistory()
  }, [userId, filters])

  const loadPaymentHistory = async () => {
    try {
      setLoading(true)
      const history = await stripeService.getPaymentHistory(userId, filters)
      setPayments(history)
    } catch (error) {
      console.error('Error loading payment history:', error)
      toast.error('Error cargando historial de pagos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (paymentId) => {
    try {
      setDownloadingReceipt(paymentId)
      await stripeService.downloadReceipt(paymentId)
      toast.success('Recibo descargado exitosamente')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      toast.error('Error descargando recibo')
    } finally {
      setDownloadingReceipt(null)
    }
  }

  const handleRequestRefund = async (paymentId, reason) => {
    try {
      await stripeService.requestRefund(paymentId, reason)
      toast.success('Solicitud de reembolso enviada')
      loadPaymentHistory() // Refresh the list
    } catch (error) {
      console.error('Error requesting refund:', error)
      toast.error('Error solicitando reembolso')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-blue-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      succeeded: 'Exitoso',
      failed: 'Fallido',
      pending: 'Pendiente',
      refunded: 'Reembolsado',
      canceled: 'Cancelado'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'refunded':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filters.status === 'all' || payment.status === filters.status
    const matchesSearch = !filters.searchTerm || 
      payment.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner text="Cargando historial de pagos..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Historial de pagos
        </h3>
        <button
          onClick={loadPaymentHistory}
          className="btn btn-secondary btn-sm flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID o descripción..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10 input"
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="all">Todos los estados</option>
            <option value="succeeded">Exitosos</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidos</option>
            <option value="refunded">Reembolsados</option>
          </select>

          {/* Date range filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="input"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      {/* Payment list */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron pagos
          </h4>
          <p className="text-gray-600">
            {filters.status !== 'all' || filters.searchTerm
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Aún no tienes pagos registrados'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {stripeService.formatCurrency(payment.amount)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {payment.description || 'Pago de servicio'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(payment.created * 1000).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View details */}
                  <button
                    onClick={() => {
                      setSelectedPayment(payment)
                      setShowDetailsModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Download receipt */}
                  {payment.status === 'succeeded' && (
                    <button
                      onClick={() => handleDownloadReceipt(payment.id)}
                      disabled={downloadingReceipt === payment.id}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Descargar recibo"
                    >
                      {downloadingReceipt === payment.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del pago"
        size="lg"
      >
        {selectedPayment && (
          <PaymentDetails
            payment={selectedPayment}
            onRequestRefund={handleRequestRefund}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </Modal>
    </div>
  )
}

// Payment details component
const PaymentDetails = ({ payment, onRequestRefund, onClose }) => {
  const [requestingRefund, setRequestingRefund] = useState(false)
  const [refundReason, setRefundReason] = useState('')

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error('Por favor proporciona una razón para el reembolso')
      return
    }

    try {
      setRequestingRefund(true)
      await onRequestRefund(payment.id, refundReason)
      onClose()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setRequestingRefund(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID de transacción
          </label>
          <p className="text-sm text-gray-900 font-mono">{payment.id}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto
          </label>
          <p className="text-sm text-gray-900 font-semibold">
            {stripeService.formatCurrency(payment.amount)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <div className="flex items-center space-x-2">
            {getStatusIcon(payment.status)}
            <span className="text-sm text-gray-900">
              {getStatusText(payment.status)}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <p className="text-sm text-gray-900">
            {new Date(payment.created * 1000).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Payment method */}
      {payment.payment_method && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de pago
          </label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-900">
              {payment.payment_method.card?.brand?.toUpperCase()} •••• {payment.payment_method.card?.last4}
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      {payment.description && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <p className="text-sm text-gray-900">{payment.description}</p>
        </div>
      )}

      {/* Refund section */}
      {payment.status === 'succeeded' && !payment.refunded && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Solicitar reembolso
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del reembolso
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Explica por qué solicitas el reembolso..."
                rows={3}
                className="input"
              />
            </div>
            <button
              onClick={handleRefundRequest}
              disabled={requestingRefund || !refundReason.trim()}
              className="btn btn-secondary flex items-center space-x-2"
            >
              {requestingRefund ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Solicitando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Solicitar reembolso</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button onClick={onClose} className="btn btn-secondary">
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default PaymentHistory