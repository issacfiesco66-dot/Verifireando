import { loadStripe } from '@stripe/stripe-js'
import { api } from './api'

// Initialize Stripe
let stripePromise = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export class StripeService {
  constructor() {
    this.stripe = null
    this.elements = null
    this.paymentElement = null
  }

  async initialize() {
    if (!this.stripe) {
      this.stripe = await getStripe()
    }
    return this.stripe
  }

  // Create payment intent for appointment
  async createPaymentIntent(appointmentId, paymentMethod = 'card', currency = 'mxn') {
    try {
      const response = await api.post('/payments/create-intent', {
        appointmentId,
        paymentMethod,
        currency
      })
      return response.data
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, paymentMethodId, paymentMethod = 'card') {
    try {
      const response = await api.post('/payments/confirm', {
        paymentIntentId,
        paymentMethodId,
        paymentMethod
      })
      return response.data
    } catch (error) {
      console.error('Error confirming payment:', error)
      throw error
    }
  }

  // Create Stripe Elements
  async createElements(clientSecret, options = {}) {
    await this.initialize()
    
    const defaultOptions = {
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
        },
        rules: {
          '.Input': {
            border: '1px solid #D1D5DB',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          },
          '.Input:focus': {
            border: '1px solid #3B82F6',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }
        }
      },
      ...options
    }

    this.elements = this.stripe.elements(defaultOptions)
    return this.elements
  }

  // Create payment element
  createPaymentElement(elements, options = {}) {
    const defaultOptions = {
      layout: 'tabs',
      paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
      ...options
    }

    this.paymentElement = elements.create('payment', defaultOptions)
    return this.paymentElement
  }

  // Process payment with Stripe
  async processPayment(elements, confirmParams = {}) {
    await this.initialize()

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
        ...confirmParams
      },
      redirect: 'if_required'
    })

    if (error) {
      console.error('Payment failed:', error)
      throw error
    }

    return paymentIntent
  }

  // Get payment methods for customer
  async getPaymentMethods() {
    try {
      const response = await api.get('/payments/methods')
      return response.data
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw error
    }
  }

  // Save payment method
  async savePaymentMethod(paymentMethodId, isDefault = false) {
    try {
      const response = await api.post('/payments/methods', {
        paymentMethodId,
        isDefault
      })
      return response.data
    } catch (error) {
      console.error('Error saving payment method:', error)
      throw error
    }
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId) {
    try {
      const response = await api.delete(`/payments/methods/${paymentMethodId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw error
    }
  }

  // Get payment history
  async getPaymentHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await api.get(`/payments/history?${params}`)
      return response.data
    } catch (error) {
      console.error('Error fetching payment history:', error)
      throw error
    }
  }

  // Download receipt
  async downloadReceipt(paymentId) {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `receipt-${paymentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Error downloading receipt:', error)
      throw error
    }
  }

  // Request refund
  async requestRefund(paymentId, amount = null, reason = '') {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, {
        amount,
        reason
      })
      return response.data
    } catch (error) {
      console.error('Error requesting refund:', error)
      throw error
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'MXN') {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  // Get payment status color
  getPaymentStatusColor(status) {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      refunded: 'text-purple-600 bg-purple-100',
      partial_refund: 'text-orange-600 bg-orange-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  // Get payment method icon
  getPaymentMethodIcon(method) {
    const icons = {
      card: '💳',
      cash: '💵',
      transfer: '🏦',
      wallet: '📱'
    }
    return icons[method] || '💳'
  }
}

// Export singleton instance
export const stripeService = new StripeService()