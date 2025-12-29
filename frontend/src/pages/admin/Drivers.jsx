import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Navigation,
  Download,
  Shield,
  Clock
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Drivers = () => {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [filteredDrivers, setFilteredDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [driverToVerify, setDriverToVerify] = useState(null)

  useEffect(() => {
    fetchDrivers()
  }, [])

  useEffect(() => {
    filterDrivers()
  }, [drivers, searchTerm, statusFilter, verificationFilter])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDrivers()
      setDrivers(data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Error al cargar los choferes')
    } finally {
      setLoading(false)
    }
  }

  const filterDrivers = () => {
    let filtered = drivers

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm) ||
        driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => {
        if (statusFilter === 'active') return driver.isActive
        if (statusFilter === 'inactive') return !driver.isActive
        if (statusFilter === 'online') return onlineDrivers?.some(d => d.id === driver._id)
        if (statusFilter === 'offline') return !onlineDrivers?.some(d => d.id === driver._id)
        return true
      })
    }

    // Filter by verification
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(driver => {
        if (verificationFilter === 'verified') return driver.isVerified
        if (verificationFilter === 'pending') return !driver.isVerified && driver.documents?.length > 0
        if (verificationFilter === 'unverified') return !driver.isVerified && (!driver.documents || driver.documents.length === 0)
        return true
      })
    }

    setFilteredDrivers(filtered)
  }

  const handleViewDriver = (driverData) => {
    setSelectedDriver(driverData)
    setShowDriverModal(true)
  }

  const handleVerifyDriver = (driverData) => {
    setDriverToVerify(driverData)
    setShowVerificationModal(true)
  }

  const confirmVerifyDriver = async (approved) => {
    try {
      await adminService.verifyDriver(driverToVerify._id, approved)
      setDrivers(drivers.map(d => 
        d._id === driverToVerify._id ? { ...d, isVerified: approved } : d
      ))
      toast.success(`Chofer ${approved ? 'verificado' : 'rechazado'} exitosamente`)
      setShowVerificationModal(false)
      setDriverToVerify(null)
    } catch (error) {
      console.error('Error verifying driver:', error)
      toast.error('Error al verificar el chofer')
    }
  }

  const handleToggleDriverStatus = async (driverId, currentStatus) => {
    try {
      await adminService.toggleDriverStatus(driverId, !currentStatus)
      setDrivers(drivers.map(d => 
        d._id === driverId ? { ...d, isActive: !currentStatus } : d
      ))
      toast.success(`Chofer ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
    } catch (error) {
      console.error('Error toggling driver status:', error)
      toast.error('Error al cambiar el estado del chofer')
    }
  }

  const exportDrivers = async () => {
    try {
      const blob = await adminService.exportDrivers()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `choferes_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Choferes exportados exitosamente')
    } catch (error) {
      console.error('Error exporting drivers:', error)
      toast.error('Error al exportar choferes')
    }
  }

  const getVerificationStatus = (driver) => {
    if (driver.isVerified) {
      return { text: 'Verificado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else if (driver.documents && driver.documents.length > 0) {
      return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { text: 'Sin verificar', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
  }

  const isDriverOnline = (driverId) => {
    return onlineDrivers?.some(d => d.id === driverId)
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
            Gestión de Choferes
          </h1>
          <p className="text-gray-600">
            Administra y verifica a todos los choferes del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportDrivers}
            className="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="btn btn-primary btn-md flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nuevo Chofer</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar choferes..."
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
            <option value="online">En línea</option>
            <option value="offline">Fuera de línea</option>
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

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setVerificationFilter('all')
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
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => d.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Navigation className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En línea</p>
              <p className="text-2xl font-bold text-gray-900">
                {onlineDrivers?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verificados</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => d.isVerified).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter(d => !d.isVerified && d.documents?.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Choferes ({filteredDrivers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chofer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calificación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => {
                const verification = getVerificationStatus(driver)
                const isOnline = isDriverOnline(driver._id)
                
                return (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {driver.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={driver.avatar}
                              alt={driver.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {driver.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {driver._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {driver.email}
                      </div>
                      {driver.phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.licenseNumber || 'No registrada'}
                      </div>
                      {driver.licenseExpiry && (
                        <div className="text-sm text-gray-500">
                          Vence: {formatDate(driver.licenseExpiry)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          driver.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isOnline 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isOnline ? 'En línea' : 'Fuera de línea'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${verification.color}`}>
                        {React.createElement(verification.icon, { className: "w-3 h-3 mr-1" })}
                        {verification.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">
                          {driver.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({driver.totalAppointments || 0} citas)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDriver(driver)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!driver.isVerified && driver.documents?.length > 0 && (
                          <button
                            onClick={() => handleVerifyDriver(driver)}
                            className="text-green-600 hover:text-green-900"
                            title="Verificar"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleDriverStatus(driver._id, driver.isActive)}
                          className={`${
                            driver.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={driver.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {driver.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron choferes</p>
          </div>
        )}
      </div>

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalles del Chofer
                </h2>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Driver Info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {selectedDriver.avatar ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedDriver.avatar}
                      alt={selectedDriver.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium text-xl">
                        {selectedDriver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                    isDriverOnline(selectedDriver._id) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedDriver.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">
                        {selectedDriver.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {selectedDriver.totalAppointments || 0} citas completadas
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact and License Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Información de Contacto</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{selectedDriver.email}</p>
                  </div>
                  {selectedDriver.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <p className="text-sm text-gray-900">{selectedDriver.phone}</p>
                    </div>
                  )}
                  {selectedDriver.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <p className="text-sm text-gray-900">{selectedDriver.address}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Información de Licencia</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Licencia
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedDriver.licenseNumber || 'No registrada'}
                    </p>
                  </div>
                  {selectedDriver.licenseExpiry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Vencimiento
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedDriver.licenseExpiry)}
                      </p>
                    </div>
                  )}
                  {selectedDriver.vehicle && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehículo
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedDriver.vehicle.make} {selectedDriver.vehicle.model} ({selectedDriver.vehicle.year})
                      </p>
                      <p className="text-xs text-gray-500">
                        Placas: {selectedDriver.vehicle.licensePlate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Verification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedDriver.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedDriver.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verificación
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getVerificationStatus(selectedDriver).color}`}>
                    {React.createElement(getVerificationStatus(selectedDriver).icon, { className: "w-3 h-3 mr-1" })}
                    {getVerificationStatus(selectedDriver).text}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado en línea
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isDriverOnline(selectedDriver._id) 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isDriverOnline(selectedDriver._id) ? 'En línea' : 'Fuera de línea'}
                  </span>
                </div>
              </div>

              {/* Documents */}
              {selectedDriver.documents && selectedDriver.documents.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDriver.documents.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                            <p className="text-xs text-gray-500">
                              Subido: {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
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
                onClick={() => setShowDriverModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cerrar
              </button>
              {!selectedDriver.isVerified && selectedDriver.documents?.length > 0 && (
                <button
                  onClick={() => {
                    setShowDriverModal(false)
                    handleVerifyDriver(selectedDriver)
                  }}
                  className="btn btn-primary btn-md"
                >
                  Verificar Chofer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && driverToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Verificar Chofer
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                ¿Deseas aprobar o rechazar la verificación de <strong>{driverToVerify.name}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmVerifyDriver(false)}
                  className="btn btn-danger btn-md"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => confirmVerifyDriver(true)}
                  className="btn btn-success btn-md"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Drivers