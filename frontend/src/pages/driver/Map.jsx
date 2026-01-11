import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Car,
  Route,
  Locate,
  RefreshCw
} from 'lucide-react'
import { appointmentService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Map = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
    getCurrentLocation()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await appointmentService.getDriverAppointments()
      const appointmentsData = response.data.appointments || []
      
      // Transform appointments to match the component's expected format
      const transformedAppointments = appointmentsData.map(apt => ({
        id: apt._id || apt.id,
        clientName: apt.client?.name || 'Cliente',
        clientPhone: apt.client?.phone || '',
        address: apt.pickupAddress?.street 
          ? `${apt.pickupAddress.street}, ${apt.pickupAddress.city}, ${apt.pickupAddress.state}`
          : 'Dirección no disponible',
        coordinates: apt.pickupAddress?.coordinates || { lat: 19.4326, lng: -99.1332 },
        scheduledTime: apt.scheduledTime || '00:00',
        service: apt.services?.verification 
          ? 'Verificación Vehicular' + (apt.services.additionalServices?.length > 0 ? ' + Servicios adicionales' : '')
          : 'Servicio no especificado',
        carModel: apt.car?.make && apt.car?.model 
          ? `${apt.car.make} ${apt.car.model} ${apt.car.year || ''}`.trim()
          : 'Vehículo no especificado',
        status: apt.status || 'pending',
        estimatedDuration: 45 // Default duration
      }))

      setAppointments(transformedAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Mexico City center
          setDriverLocation({ lat: 19.4326, lng: -99.1332 })
        }
      )
    } else {
      // Default to Mexico City center
      setDriverLocation({ lat: 19.4326, lng: -99.1332 })
    }
  }

  const navigateToAppointment = (appointment) => {
    const { lat, lng } = appointment.coordinates
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }

  const callClient = (phone) => {
    window.location.href = `tel:${phone}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'confirmed':
        return 'Confirmada'
      case 'in_progress':
        return 'En progreso'
      case 'completed':
        return 'Completada'
      default:
        return 'Desconocido'
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
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Citas</h1>
          <p className="text-gray-600">Navega a tus citas programadas</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={getCurrentLocation}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Locate className="w-4 h-4 mr-2" />
            Mi ubicación
          </button>
          <button
            onClick={fetchAppointments}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-96 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mapa Interactivo</h3>
            <p className="text-gray-600">
              Aquí se mostraría el mapa con las ubicaciones de las citas
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Integración con Google Maps o Mapbox pendiente
            </p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mr-3">
                      {appointment.clientName}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{appointment.scheduledTime} ({appointment.estimatedDuration} min)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{appointment.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Car className="w-4 h-4 mr-2" />
                      <span>{appointment.carModel} - {appointment.service}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => navigateToAppointment(appointment)}
                    className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navegar
                  </button>
                  <button
                    onClick={() => callClient(appointment.clientPhone)}
                    className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar
                  </button>
                </div>
              </div>
              
              {selectedAppointment === appointment.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Detalles adicionales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Teléfono:</span> {appointment.clientPhone}
                    </div>
                    <div>
                      <span className="font-medium">Servicio:</span> {appointment.service}
                    </div>
                    <div>
                      <span className="font-medium">Vehículo:</span> {appointment.carModel}
                    </div>
                    <div>
                      <span className="font-medium">Duración estimada:</span> {appointment.estimatedDuration} minutos
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setSelectedAppointment(
                  selectedAppointment === appointment.id ? null : appointment.id
                )}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                {selectedAppointment === appointment.id ? 'Ocultar detalles' : 'Ver detalles'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {appointments.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas programadas</h3>
          <p className="text-gray-600">
            No tienes citas programadas para hoy. Las nuevas citas aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  )
}

export default Map