import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, Edit, Check, X, AlertCircle } from 'lucide-react'
import { stripeService } from '../../services/stripeService'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'

const PaymentMethods = ({ userId, onMethodSelect, selectedMethodId }) => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingMethodId, setDeletingMethodId] = useState(null)

  useEffect(() => {
    loadPaymentMethods()
  }, [userId])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const methods = await stripeService.getPaymentMethods(userId)
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error('Error cargando métodos de pago')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMethod = async (methodId) => {
    try {
      setDeletingMethodId(methodId)
      await stripeService.deletePaymentMethod(methodId)
      setPaymentMethods(methods => methods.filter(m => m.id !== methodId))
      toast.success('Método de pago eliminado')
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast.error('Error eliminando método de pago')
    } finally {
      setDeletingMethodId(null)
    }
  }

  const getCardIcon = (brand) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      diners: '💳',
      jcb: '💳',
      unionpay: '💳'
    }
    return icons[brand] || '💳'
  }

  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner text="Cargando métodos de pago..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Métodos de pago guardados
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar tarjeta</span>
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No tienes métodos de pago guardados
          </h4>
          <p className="text-gray-600 mb-4">
            Agrega una tarjeta para realizar pagos más rápido
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Agregar primera tarjeta
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethodId === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onMethodSelect && onMethodSelect(method)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getCardIcon(method.card?.brand)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {method.card?.brand?.toUpperCase()} 
                      </span>
                      <span className="text-gray-600">
                        {formatCardNumber(method.card?.last4)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Expira {method.card?.exp_month}/{method.card?.exp_year}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedMethodId === method.id && (
                    <div className="flex items-center space-x-1 text-primary-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Seleccionada</span>
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMethod(method.id)
                    }}
                    disabled={deletingMethodId === method.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar tarjeta"
                  >
                    {deletingMethodId === method.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar método de pago"
        size="lg"
      >
        <AddPaymentMethodForm
          userId={userId}
          onSuccess={(newMethod) => {
            setPaymentMethods(methods => [...methods, newMethod])
            setShowAddModal(false)
            toast.success('Método de pago agregado exitosamente')
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  )
}

// Component for adding new payment methods
const AddPaymentMethodForm = ({ userId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // This would typically use Stripe Elements to securely collect card data
      // For now, we'll show a placeholder implementation
      
      // In a real implementation, you would:
      // 1. Use Stripe Elements to collect card data
      // 2. Create a payment method with Stripe
      // 3. Attach it to the customer
      // 4. Save it in your backend
      
      toast.info('Funcionalidad de agregar tarjeta en desarrollo')
      onCancel()
      
    } catch (error) {
      console.error('Error adding payment method:', error)
      setError(error.message || 'Error agregando método de pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <div>
            <h4 className="font-medium text-blue-900">
              Funcionalidad en desarrollo
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              La funcionalidad para agregar nuevos métodos de pago estará disponible próximamente.
              Por ahora, puedes agregar tarjetas durante el proceso de pago.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn btn-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn btn-primary"
        >
          {loading ? 'Agregando...' : 'Agregar tarjeta'}
        </button>
      </div>
    </form>
  )
}

export default PaymentMethods