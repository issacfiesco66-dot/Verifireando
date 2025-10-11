import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  CreditCard, 
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLocation } from '../../contexts/LocationContext'
import { appointmentService, carService } from '../../services/api'
import { stripeService } from '../../services/stripeService'
import MapComponent from '../../components/map/MapComponent'
import PaymentForm from '../../components/payment/PaymentForm'
import PaymentMethods from '../../components/payment/PaymentMethods'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const NewAppointment = () => {
  const { user } = useAuth()
  const { currentLocation, reverseGeocode } = useLocation()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [cars, setCars] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationAddress, setLocationAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [appointmentData, setAppointmentData] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      scheduledDate: '',
      scheduledTime: '',
      carId: '',
      serviceType: 'verification',
      notes: '',
      paymentMethod: 'card'
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    fetchUserCars()
  }, [])

  useEffect(() => {
    if (currentLocation && !selectedLocation) {
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      })
      handleLocationSelect({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      })
    }
  }, [currentLocation])

  const fetchUserCars = async () => {
    try {
      setLoading(true)
      const response = await carService.getMyCars()
      setCars(response.data.cars || [])
    } catch (error) {
      toast.error('Error al cargar los vehículos')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = async (location) => {
    try {
      setSelectedLocation({
        latitude: location.lat,
        longitude: location.lng
      })
      
      const address = await reverseGeocode(location.lng, location.lat)
      setLocationAddress(address)
    } catch (error) {
      console.error('Error getting address:', error)
      setLocationAddress('Ubicación seleccionada')
    }
  }

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return watchedValues.scheduledDate && watchedValues.scheduledTime
      case 2:
        return selectedLocation && locationAddress
      case 3:
        return watchedValues.carId
      case 4:
        return watchedValues.paymentMethod
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    } else {
      toast.error('Por favor completa todos los campos requeridos')
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const onSubmit = async (data) => {
    if (step < 5) {
      return
    }

    // If payment method is cash, create appointment directly
    if (data.paymentMethod === 'cash') {
      try {
        setSubmitting(true)
        
        const appointmentData = {
          scheduledDate: new Date(`${data.scheduledDate}T${data.scheduledTime}`),
          carId: data.carId,
          serviceType: data.serviceType,
          location: {
            type: 'Point',
            coordinates: [selectedLocation.longitude, selectedLocation.latitude],
            address: locationAddress
          },
          notes: data.notes,
          paymentMethod: data.paymentMethod,
          pricing: calculateAppointmentCost(),
          paymentStatus: 'pending'
        }

        const response = await appointmentService.createAppointment(appointmentData)
        
        toast.success('Cita programada exitosamente')
        navigate(`/client/appointments/${response.data.appointment._id}`)
        
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al programar la cita')
      } finally {
        setSubmitting(false)
      }
    } else {
      // For card payment, show payment form
      await createPaymentIntent()
      setShowPaymentForm(true)
    }
  }

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setSubmitting(true)
      
      const appointmentData = {
        scheduledDate: new Date(`${watchedValues.scheduledDate}T${watchedValues.scheduledTime}`),
        carId: watchedValues.carId,
        serviceType: watchedValues.serviceType,
        location: {
          type: 'Point',
          coordinates: [selectedLocation.longitude, selectedLocation.latitude],
          address: locationAddress
        },
        notes: watchedValues.notes,
        paymentMethod: watchedValues.paymentMethod,
        pricing: calculateAppointmentCost(),
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id
      }

      const response = await appointmentService.createAppointment(appointmentData)
      
      toast.success('¡Cita programada y pago procesado exitosamente!')
      navigate(`/client/appointments/${response.data.appointment._id}`)
      
    } catch (error) {
      console.error('Error creating appointment after payment:', error)
      toast.error('Error al finalizar la cita. Contacta soporte.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    toast.error('Error en el pago. Intenta nuevamente.')
    setShowPaymentForm(false)
  }

  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    setPaymentIntent(null)
    setClientSecret(null)
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const getMinTime = () => {
    const selectedDate = new Date(watchedValues.scheduledDate)
    const today = new Date()
    
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentHour = today.getHours()
      const currentMinute = today.getMinutes()
      return `${String(currentHour + 1).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    }
    
    return '08:00'
  }

  const calculateAppointmentCost = () => {
    const servicePrices = {
      verification: 500,
      inspection: 800,
      emissions: 300
    }
    
    const basePrice = servicePrices[watchedValues.serviceType] || 500
    const tax = basePrice * 0.16 // 16% IVA
    
    return {
      basePrice,
      tax,
      total: basePrice + tax
    }
  }

  const createPaymentIntent = async () => {
    try {
      setLoading(true)
      const pricing = calculateAppointmentCost()
      
      const appointmentDetails = {
        scheduledDate: new Date(`${watchedValues.scheduledDate}T${watchedValues.scheduledTime}`),
        location: selectedLocation,
        carId: watchedValues.carId,
        serviceType: watchedValues.serviceType,
        notes: watchedValues.notes,
        pricing
      }

      setAppointmentData(appointmentDetails)

      const paymentIntentData = await stripeService.createPaymentIntent(
        pricing.total * 100, // Convert to cents
        'mxn',
        {
          appointment: appointmentDetails,
          client: user
        }
      )

      setPaymentIntent(paymentIntentData)
      setClientSecret(paymentIntentData.client_secret)
      
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast.error('Error preparando el pago')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando información..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Programar nueva cita
              </h1>
              <p className="text-gray-600">
                Paso {step} de 5
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber < step ? 'bg-success-500 text-white' :
                  stepNumber === step ? 'bg-primary-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber < step ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepNumber < step ? 'bg-success-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Date and Time */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="text-center mb-8">
                <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Selecciona fecha y hora
                </h2>
                <p className="text-gray-600">
                  Elige cuándo quieres realizar la verificación
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    min={getMinDate()}
                    className={`input input-md w-full ${errors.scheduledDate ? 'border-error-500' : ''}`}
                    {...register('scheduledDate', {
                      required: 'La fecha es requerida'
                    })}
                  />
                  {errors.scheduledDate && (
                    <p className="mt-1 text-sm text-error-600">{errors.scheduledDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    min={getMinTime()}
                    max="18:00"
                    className={`input input-md w-full ${errors.scheduledTime ? 'border-error-500' : ''}`}
                    {...register('scheduledTime', {
                      required: 'La hora es requerida'
                    })}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-sm text-error-600">{errors.scheduledTime.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Horario de atención: 8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary btn-md"
                  disabled={!validateStep(1)}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="text-center mb-8">
                <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Selecciona la ubicación
                </h2>
                <p className="text-gray-600">
                  Haz clic en el mapa para elegir dónde realizar la verificación
                </p>
              </div>

              <div className="space-y-6">
                <MapComponent
                  height="400px"
                  showUserLocation={true}
                  onLocationSelect={handleLocationSelect}
                  markers={selectedLocation ? [{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    type: 'appointment',
                    popup: `<div class="p-2"><strong>Ubicación seleccionada</strong><br/>${locationAddress}</div>`
                  }] : []}
                  className="rounded-lg border"
                />

                {locationAddress && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-primary-900">Ubicación seleccionada</h3>
                        <p className="text-primary-700 text-sm">{locationAddress}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary btn-md"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary btn-md"
                  disabled={!validateStep(2)}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Selection */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="text-center mb-8">
                <Car className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Selecciona tu vehículo
                </h2>
                <p className="text-gray-600">
                  Elige el vehículo que quieres verificar
                </p>
              </div>

              {cars.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes vehículos registrados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Necesitas registrar al menos un vehículo para programar una cita
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/client/cars/new')}
                    className="btn btn-primary btn-md"
                  >
                    Registrar vehículo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cars.map((car) => (
                    <label
                      key={car._id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        watchedValues.carId === car._id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={car._id}
                        className="sr-only"
                        {...register('carId', {
                          required: 'Selecciona un vehículo'
                        })}
                      />
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Car className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {car.make} {car.model} {car.year}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placas: {car.licensePlate}
                          </p>
                          <p className="text-sm text-gray-600">
                            VIN: {car.vin}
                          </p>
                        </div>
                        {watchedValues.carId === car._id && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </label>
                  ))}
                  
                  {errors.carId && (
                    <p className="text-sm text-error-600">{errors.carId.message}</p>
                  )}
                </div>
              )}

              {cars.length > 0 && (
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary btn-md"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary btn-md"
                    disabled={!validateStep(3)}
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Service Type and Notes */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="text-center mb-8">
                <Check className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Detalles del servicio
                </h2>
                <p className="text-gray-600">
                  Especifica el tipo de verificación y notas adicionales
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de servicio
                  </label>
                  <select
                    className="input input-md w-full"
                    {...register('serviceType')}
                  >
                    <option value="verification">Verificación vehicular</option>
                    <option value="inspection">Inspección completa</option>
                    <option value="emissions">Prueba de emisiones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    rows={4}
                    className="input input-md w-full"
                    placeholder="Agrega cualquier información adicional que el chofer deba saber..."
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary btn-md"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary btn-md"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Payment Method and Confirmation */}
          {step === 5 && !showPaymentForm && (
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="text-center mb-8">
                <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Método de pago y confirmación
                </h2>
                <p className="text-gray-600">
                  Revisa los detalles y confirma tu cita
                </p>
              </div>

              <div className="space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Método de pago
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="card"
                        className="mr-3"
                        {...register('paymentMethod')}
                      />
                      <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                      <span>Tarjeta de crédito/débito</span>
                    </label>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="cash"
                        className="mr-3"
                        {...register('paymentMethod')}
                      />
                      <span className="w-5 h-5 text-gray-400 mr-3">💵</span>
                      <span>Efectivo</span>
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Resumen de la cita</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha y hora:</span>
                      <span className="font-medium">
                        {watchedValues.scheduledDate && watchedValues.scheduledTime &&
                          new Date(`${watchedValues.scheduledDate}T${watchedValues.scheduledTime}`).toLocaleString('es-ES')
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span className="font-medium text-right max-w-xs">{locationAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehículo:</span>
                      <span className="font-medium">
                        {cars.find(car => car._id === watchedValues.carId)?.make} {cars.find(car => car._id === watchedValues.carId)?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servicio:</span>
                      <span className="font-medium">
                        {watchedValues.serviceType === 'verification' ? 'Verificación vehicular' :
                         watchedValues.serviceType === 'inspection' ? 'Inspección completa' :
                         'Prueba de emisiones'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${calculateAppointmentCost().basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA (16%):</span>
                      <span className="font-medium">${calculateAppointmentCost().tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-lg">${calculateAppointmentCost().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary btn-md"
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {watchedValues.paymentMethod === 'cash' ? 'Confirmar cita' : 'Proceder al pago'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payment Form Modal */}
          {showPaymentForm && clientSecret && appointmentData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Procesar pago
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Completa tu pago para confirmar la cita
                  </p>
                </div>
                
                <div className="p-6">
                  <PaymentForm
                    appointment={{
                      ...appointmentData,
                      client: user,
                      pricing: calculateAppointmentCost()
                    }}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                    showSaveCard={true}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default NewAppointment