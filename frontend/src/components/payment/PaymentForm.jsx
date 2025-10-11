import React, { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { stripeService } from '../../services/stripeService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

// Payment form component that uses Stripe Elements
const PaymentFormContent = ({ 
  appointment, 
  onSuccess, 
  onError, 
  onCancel,
  showSaveCard = true 
}) => {
  const stripe = useStripe()
  const elements = useElements()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [saveCard, setSaveCard] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              name: appointment.client?.name,
              email: appointment.client?.email,
              phone: appointment.client?.phone
            }
          }
        },
        redirect: 'if_required'
      })

      if (error) {
        setPaymentError(error.message)
        if (onError) onError(error)
        toast.error(error.message)
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment in our backend
        await stripeService.confirmPayment(
          paymentIntent.id,
          paymentIntent.payment_method,
          'card'
        )

        toast.success('¡Pago procesado exitosamente!')
        if (onSuccess) onSuccess(paymentIntent)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'Error procesando el pago')
      if (onError) onError(error)
      toast.error('Error procesando el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Información de pago
          </h3>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
            }}
          />
        </div>
      </div>

      {/* Save card option */}
      {showSaveCard && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="saveCard"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="saveCard" className="text-sm text-gray-700">
            Guardar tarjeta para futuros pagos
          </label>
        </div>
      )}

      {/* Error message */}
      {paymentError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{paymentError}</p>
        </div>
      )}

      {/* Payment summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-900">
            {stripeService.formatCurrency(appointment.pricing?.basePrice || 0)}
          </span>
        </div>
        {appointment.pricing?.additionalServices?.map((service, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{service.name}:</span>
            <span className="text-gray-900">
              {stripeService.formatCurrency(service.price)}
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (16%):</span>
          <span className="text-gray-900">
            {stripeService.formatCurrency(
              (appointment.pricing?.basePrice || 0) * 0.16 +
              (appointment.pricing?.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0) * 0.16
            )}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">
              {stripeService.formatCurrency(
                (appointment.pricing?.basePrice || 0) * 1.16 +
                (appointment.pricing?.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0) * 1.16
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn btn-secondary btn-lg"
          disabled={isProcessing}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 btn btn-primary btn-lg flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Pagar ahora</span>
            </>
          )}
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <Lock className="w-4 h-4" />
        <span>Tus datos están protegidos con encriptación SSL</span>
      </div>
    </form>
  )
}

// Main payment form component with Stripe Elements provider
const PaymentForm = ({ 
  appointment, 
  clientSecret, 
  onSuccess, 
  onError, 
  onCancel,
  showSaveCard = true 
}) => {
  const [stripe, setStripe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripeService.initialize()
        setStripe(stripeInstance)
      } catch (error) {
        console.error('Error initializing Stripe:', error)
        if (onError) onError(error)
      } finally {
        setLoading(false)
      }
    }

    initializeStripe()
  }, [onError])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Cargando formulario de pago..." />
      </div>
    )
  }

  if (!stripe || !clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error cargando el formulario de pago
          </h3>
          <p className="text-gray-600">
            No se pudo inicializar el sistema de pagos. Intenta nuevamente.
          </p>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3B82F6',
        colorBackground: '#ffffff',
        colorText: '#1F2937',
        colorDanger: '#EF4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px'
      }
    }
  }

  return (
    <Elements stripe={stripe} options={options}>
      <PaymentFormContent
        appointment={appointment}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
        showSaveCard={showSaveCard}
      />
    </Elements>
  )
}

export default PaymentForm