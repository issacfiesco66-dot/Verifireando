import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Settings,
  Download,
  Shield,
  Clock,
  Wrench,
  FileText
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Cars = () => {
  const { user } = useAuth()
  const [cars, setCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedCar, setSelectedCar] = useState(null)
  const [showCarModal, setShowCarModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [carToDelete, setCarToDelete] = useState(null)

  useEffect(() => {
    fetchCars()
  }, [])

  useEffect(() => {
    filterCars()
  }, [cars, searchTerm, statusFilter, verificationFilter, typeFilter])

  const fetchCars = async () => {
    try {
      setLoading(true)
      const data = await adminService.getCars()
      setCars(data)
    } catch (error) {
      console.error('Error fetching cars:', error)
      toast.error('Error al cargar los vehículos')
    } finally {
      setLoading(false)
    }
  }

  const filterCars = () => {
    let filtered = cars

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.owner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.year.toString().includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => {
        if (statusFilter === 'active') return car.isActive
        if (statusFilter === 'inactive') return !car.isActive
        if (statusFilter === 'maintenance') return car.maintenanceStatus === 'required'
        if (statusFilter === 'available') return car.isActive && car.maintenanceStatus !== 'required'
        return true
      })
    }

    // Filter by verification
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(car => {
        if (verificationFilter === 'verified') return car.isVerified
        if (verificationFilter === 'pending') return !car.isVerified && car.documents?.length > 0
        if (verificationFilter === 'unverified') return !car.isVerified && (!car.documents || car.documents.length === 0)
        return true
      })
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(car => car.type === typeFilter)
    }

    setFilteredCars(filtered)
  }

  const handleViewCar = (carData) => {
    setSelectedCar(carData)
    setShowCarModal(true)
  }

  const handleDeleteCar = (carData) => {
    setCarToDelete(carData)
    setShowDeleteModal(true)
  }

  const confirmDeleteCar = async () => {
    try {
      await adminService.deleteCar(carToDelete._id)
      setCars(cars.filter(c => c._id !== carToDelete._id))
      toast.success('Vehículo eliminado exitosamente')
      setShowDeleteModal(false)
      setCarToDelete(null)
    } catch (error) {
      console.error('Error deleting car:', error)
      toast.error('Error al eliminar el vehículo')
    }
  }

  const handleToggleCarStatus = async (carId, currentStatus) => {
    try {
      await adminService.toggleCarStatus(carId, !currentStatus)
      setCars(cars.map(c => 
        c._id === carId ? { ...c, isActive: !currentStatus } : c
      ))
      toast.success(`Vehículo ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
    } catch (error) {
      console.error('Error toggling car status:', error)
      toast.error('Error al cambiar el estado del vehículo')
    }
  }

  const handleVerifyCar = async (carId, approved) => {
    try {
      await adminService.verifyCar(carId, approved)
      setCars(cars.map(c => 
        c._id === carId ? { ...c, isVerified: approved } : c
      ))
      toast.success(`Vehículo ${approved ? 'verificado' : 'rechazado'} exitosamente`)
    } catch (error) {
      console.error('Error verifying car:', error)
      toast.error('Error al verificar el vehículo')
    }
  }

  const exportCars = async () => {
    try {
      const blob = await adminService.exportCars()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vehiculos_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Vehículos exportados exitosamente')
    } catch (error) {
      console.error('Error exporting cars:', error)
      toast.error('Error al exportar vehículos')
    }
  }

  const getVerificationStatus = (car) => {
    if (car.isVerified) {
      return { text: 'Verificado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else if (car.documents && car.documents.length > 0) {
      return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { text: 'Sin verificar', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
  }

  const getMaintenanceStatus = (car) => {
    if (car.maintenanceStatus === 'required') {
      return { text: 'Requerido', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else if (car.maintenanceStatus === 'scheduled') {
      return { text: 'Programado', color: 'bg-yellow-100 text-yellow-800', icon: Calendar }
    } else {
      return { text: 'Al día', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      sedan: 'bg-blue-100 text-blue-800',
      suv: 'bg-purple-100 text-purple-800',
      hatchback: 'bg-green-100 text-green-800',
      pickup: 'bg-orange-100 text-orange-800',
      coupe: 'bg-pink-100 text-pink-800',
      convertible: 'bg-indigo-100 text-indigo-800',
      wagon: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
            Gestión de Vehículos
          </h1>
          <p className="text-gray-600">
            Administra y verifica todos los vehículos del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCars}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="btn btn-primary btn-md flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuevo Vehículo</span>
          </button>
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
              placeholder="Buscar vehículos..."
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="available">Disponibles</option>
            <option value="maintenance">En mantenimiento</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las verificaciones</option>
            <option value="verified">Verificados</option>
            <option value="pending">Pendientes</option>
            <option value="unverified">Sin verificar</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="sedan">Sedán</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="pickup">Pickup</option>
            <option value="coupe">Coupé</option>
            <option value="convertible">Convertible</option>
            <option value="wagon">Wagon</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setVerificationFilter('all')
              setTypeFilter('all')
            }}
            className="btn btn-secondary btn-md"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verificados</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter(c => c.isVerified).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter(c => !c.isVerified && c.documents?.length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Wrench className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter(c => c.maintenanceStatus === 'required').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cars Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Vehículos ({filteredCars.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mantenimiento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCars.map((car) => {
                const verification = getVerificationStatus(car)
                const maintenance = getMaintenanceStatus(car)
                
                return (
                  <tr key={car._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {car.photos && car.photos.length > 0 ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={car.photos[0]}
                              alt={`${car.make} ${car.model}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <Car className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {car.make} {car.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {car.year} • {car.licensePlate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {car.owner?.name || 'Sin propietario'}
                          </div>
                          {car.owner?.email && (
                            <div className="text-sm text-gray-500">
                              {car.owner.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(car.type)}`}>
                        {car.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        car.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {car.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${verification.color}`}>
                        {React.createElement(verification.icon, { className: "w-3 h-3 mr-1" })}
                        {verification.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${maintenance.color}`}>
                        {React.createElement(maintenance.icon, { className: "w-3 h-3 mr-1" })}
                        {maintenance.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewCar(car)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!car.isVerified && car.documents?.length > 0 && (
                          <>
                            <button
                              onClick={() => handleVerifyCar(car._id, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyCar(car._id, false)}
                              className="text-red-600 hover:text-red-900"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleCarStatus(car._id, car.isActive)}
                          className={`${
                            car.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={car.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron vehículos</p>
          </div>
        )}
      </div>

      {/* Car Details Modal */}
      {showCarModal && selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalles del Vehículo
                </h2>
                <button
                  onClick={() => setShowCarModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Car Info */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {selectedCar.photos && selectedCar.photos.length > 0 ? (
                    <img
                      className="h-20 w-20 rounded-lg object-cover"
                      src={selectedCar.photos[0]}
                      alt={`${selectedCar.make} ${selectedCar.model}`}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Car className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placas: {selectedCar.licensePlate}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedCar.type)}`}>
                      {selectedCar.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      Color: {selectedCar.color}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner and Technical Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Información del Propietario</h4>
                  {selectedCar.owner ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <p className="text-sm text-gray-900">{selectedCar.owner.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">{selectedCar.owner.email}</p>
                      </div>
                      {selectedCar.owner.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                          </label>
                          <p className="text-sm text-gray-900">{selectedCar.owner.phone}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Sin propietario asignado</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Información Técnica</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motor
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCar.engine || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmisión
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCar.transmission || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kilometraje
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} km` : 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Verification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedCar.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCar.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verificación
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getVerificationStatus(selectedCar).color}`}>
                    {React.createElement(getVerificationStatus(selectedCar).icon, { className: "w-3 h-3 mr-1" })}
                    {getVerificationStatus(selectedCar).text}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mantenimiento
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getMaintenanceStatus(selectedCar).color}`}>
                    {React.createElement(getMaintenanceStatus(selectedCar).icon, { className: "w-3 h-3 mr-1" })}
                    {getMaintenanceStatus(selectedCar).text}
                  </span>
                </div>
              </div>

              {/* Photos */}
              {selectedCar.photos && selectedCar.photos.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Fotos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCar.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${selectedCar.make} ${selectedCar.model} - ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedCar.documents && selectedCar.documents.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCar.documents.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                            <p className="text-xs text-gray-500">
                              Subido: {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-900">
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCarModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cerrar
              </button>
              {!selectedCar.isVerified && selectedCar.documents?.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleVerifyCar(selectedCar._id, false)
                      setShowCarModal(false)
                    }}
                    className="btn btn-danger btn-md"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => {
                      handleVerifyCar(selectedCar._id, true)
                      setShowCarModal(false)
                    }}
                    className="btn btn-success btn-md"
                  >
                    Verificar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && carToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar Vehículo
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que deseas eliminar el vehículo <strong>{carToDelete.make} {carToDelete.model}</strong>? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCar}
                  className="btn btn-danger btn-md"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cars