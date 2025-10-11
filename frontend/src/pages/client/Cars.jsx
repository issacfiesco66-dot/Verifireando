import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { carService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Cars = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [cars, setCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [carToDelete, setCarToDelete] = useState(null)

  useEffect(() => {
    fetchCars()
  }, [])

  useEffect(() => {
    filterCars()
  }, [cars, searchTerm, statusFilter])

  const fetchCars = async () => {
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

  const filterCars = () => {
    let filtered = [...cars]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(car => 
        car.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.vin?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by verification status
    if (statusFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(car => {
        if (!car.lastVerification) {
          return statusFilter === 'expired'
        }
        
        const verificationDate = new Date(car.lastVerification.date)
        const expirationDate = new Date(verificationDate)
        expirationDate.setFullYear(expirationDate.getFullYear() + 1)
        
        const isExpired = expirationDate < now
        const isExpiringSoon = expirationDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        
        switch (statusFilter) {
          case 'valid':
            return !isExpired && !isExpiringSoon
          case 'expiring':
            return !isExpired && isExpiringSoon
          case 'expired':
            return isExpired
          default:
            return true
        }
      })
    }

    setFilteredCars(filtered)
  }

  const handleDeleteCar = async () => {
    if (!carToDelete) return

    try {
      setDeleting(carToDelete._id)
      await carService.deleteCar(carToDelete._id)
      
      setCars(prev => prev.filter(car => car._id !== carToDelete._id))
      setShowDeleteModal(false)
      setCarToDelete(null)
      toast.success('Vehículo eliminado exitosamente')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el vehículo')
    } finally {
      setDeleting(null)
    }
  }

  const getVerificationStatus = (car) => {
    if (!car.lastVerification) {
      return {
        status: 'expired',
        text: 'Sin verificar',
        color: 'text-error-600',
        bgColor: 'bg-error-100',
        icon: <AlertCircle className="w-4 h-4" />
      }
    }

    const now = new Date()
    const verificationDate = new Date(car.lastVerification.date)
    const expirationDate = new Date(verificationDate)
    expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    
    const isExpired = expirationDate < now
    const isExpiringSoon = expirationDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    if (isExpired) {
      return {
        status: 'expired',
        text: 'Vencida',
        color: 'text-error-600',
        bgColor: 'bg-error-100',
        icon: <AlertCircle className="w-4 h-4" />
      }
    } else if (isExpiringSoon) {
      return {
        status: 'expiring',
        text: 'Por vencer',
        color: 'text-warning-600',
        bgColor: 'bg-warning-100',
        icon: <AlertCircle className="w-4 h-4" />
      }
    } else {
      return {
        status: 'valid',
        text: 'Vigente',
        color: 'text-success-600',
        bgColor: 'bg-success-100',
        icon: <CheckCircle className="w-4 h-4" />
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando vehículos..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis vehículos</h1>
              <p className="text-gray-600">
                Gestiona la información de tus vehículos registrados
              </p>
            </div>
            <button
              onClick={() => navigate('/client/cars/new')}
              className="btn btn-primary btn-md flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar vehículo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </h2>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por placas, marca, modelo, VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-md w-full pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input input-md w-full"
            >
              <option value="all">Todos los estados</option>
              <option value="valid">Verificación vigente</option>
              <option value="expiring">Por vencer (30 días)</option>
              <option value="expired">Verificación vencida</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredCars.length} de {cars.length} vehículos
          </p>
        </div>

        {/* Cars List */}
        {filteredCars.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {cars.length === 0 ? 'No tienes vehículos registrados' : 'No se encontraron vehículos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {cars.length === 0 
                ? 'Agrega tu primer vehículo para comenzar a programar citas'
                : 'Intenta ajustar los filtros para encontrar lo que buscas'
              }
            </p>
            {cars.length === 0 && (
              <button
                onClick={() => navigate('/client/cars/new')}
                className="btn btn-primary btn-md"
              >
                Agregar primer vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => {
              const verificationStatus = getVerificationStatus(car)
              
              return (
                <div
                  key={car._id}
                  className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow"
                >
                  {/* Car Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-sm text-gray-600">{car.year}</p>
                      </div>
                    </div>
                    
                    {/* Actions Dropdown */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/client/cars/${car._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => navigate(`/client/cars/${car._id}/edit`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setCarToDelete(car)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-error-600" />
                      </button>
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Placas: </span>
                      <span className="font-medium text-gray-900">{car.licensePlate}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600">Color: </span>
                      <span className="font-medium text-gray-900">{car.color}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600">Tipo: </span>
                      <span className="font-medium text-gray-900">{car.vehicleType}</span>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado de verificación:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${verificationStatus.bgColor} ${verificationStatus.color}`}>
                        {verificationStatus.icon}
                        <span>{verificationStatus.text}</span>
                      </div>
                    </div>
                    
                    {car.lastVerification && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          Última verificación: {new Date(car.lastVerification.date).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/client/appointments/new?carId=${car._id}`)}
                        className="btn btn-primary btn-sm flex-1 flex items-center justify-center space-x-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Programar cita</span>
                      </button>
                      
                      <button
                        onClick={() => navigate(`/client/cars/${car._id}`)}
                        className="btn btn-secondary btn-sm flex items-center justify-center"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && carToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Eliminar vehículo</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setCarToDelete(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-error-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {carToDelete.make} {carToDelete.model} {carToDelete.year}
                  </h4>
                  <p className="text-sm text-gray-600">Placas: {carToDelete.licensePlate}</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                ¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer.
              </p>
              
              <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-700">
                  <strong>Advertencia:</strong> Si eliminas este vehículo, también se cancelarán todas las citas pendientes asociadas a él.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setCarToDelete(null)
                }}
                className="btn btn-secondary btn-md flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCar}
                disabled={deleting === carToDelete._id}
                className="btn btn-error btn-md flex-1 flex items-center justify-center space-x-2"
              >
                {deleting === carToDelete._id ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cars