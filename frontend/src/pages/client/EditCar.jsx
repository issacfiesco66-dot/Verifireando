import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeft,
  Car, 
  Upload,
  X,
  Check,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { carService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const EditCar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [car, setCar] = useState(null)
  const [documents, setDocuments] = useState({
    registration: null,
    insurance: null
  })
  const [documentPreviews, setDocumentPreviews] = useState({
    registration: null,
    insurance: null
  })
  const [existingDocuments, setExistingDocuments] = useState({
    registration: null,
    insurance: null
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm()

  const watchedValues = watch()

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedán' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'coupe', label: 'Coupé' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'wagon', label: 'Station Wagon' },
    { value: 'van', label: 'Van' },
    { value: 'motorcycle', label: 'Motocicleta' },
    { value: 'truck', label: 'Camión' }
  ]

  const fuelTypes = [
    { value: 'gasoline', label: 'Gasolina' },
    { value: 'diesel', label: 'Diésel' },
    { value: 'hybrid', label: 'Híbrido' },
    { value: 'electric', label: 'Eléctrico' },
    { value: 'lpg', label: 'Gas LP' },
    { value: 'cng', label: 'Gas Natural' }
  ]

  const colors = [
    'Blanco', 'Negro', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 
    'Amarillo', 'Naranja', 'Morado', 'Café', 'Dorado', 'Rosa'
  ]

  useEffect(() => {
    fetchCar()
  }, [id])

  const fetchCar = async () => {
    try {
      setLoading(true)
      const response = await carService.getCarById(id)
      const carData = response.data

      setCar(carData)
      
      // Set form values
      Object.keys(carData).forEach(key => {
        if (key !== 'documents' && key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
          setValue(key, carData[key])
        }
      })

      // Set existing documents
      if (carData.documents) {
        setExistingDocuments({
          registration: carData.documents.registration || null,
          insurance: carData.documents.insurance || null
        })
      }
    } catch (error) {
      toast.error('Error al cargar la información del vehículo')
      navigate('/client/cars')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (type, event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o PDF')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB')
      return
    }

    setDocuments(prev => ({ ...prev, [type]: file }))

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setDocumentPreviews(prev => ({ ...prev, [type]: e.target.result }))
      }
      reader.readAsDataURL(file)
    } else {
      setDocumentPreviews(prev => ({ ...prev, [type]: null }))
    }
  }

  const removeDocument = (type) => {
    setDocuments(prev => ({ ...prev, [type]: null }))
    setDocumentPreviews(prev => ({ ...prev, [type]: null }))
  }

  const removeExistingDocument = (type) => {
    setExistingDocuments(prev => ({ ...prev, [type]: null }))
  }

  const downloadDocument = async (type) => {
    try {
      const response = await carService.downloadDocument(id, type)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}-${car.licensePlate}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Error al descargar el documento')
    }
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)

      // Create FormData for file upload
      const formData = new FormData()
      
      // Add car data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key])
      })

      // Add new documents
      if (documents.registration) {
        formData.append('registration', documents.registration)
      }
      if (documents.insurance) {
        formData.append('insurance', documents.insurance)
      }

      // Add flags for removed existing documents
      if (existingDocuments.registration === null && car.documents?.registration) {
        formData.append('removeRegistration', 'true')
      }
      if (existingDocuments.insurance === null && car.documents?.insurance) {
        formData.append('removeInsurance', 'true')
      }

      const response = await carService.updateCar(id, formData)
      
      toast.success('Vehículo actualizado exitosamente')
      navigate('/client/cars')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el vehículo')
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentYear = () => new Date().getFullYear()

  if (loading) {
    return <LoadingSpinner text="Cargando información del vehículo..." />
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vehículo no encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            El vehículo que buscas no existe o no tienes permisos para verlo.
          </p>
          <button
            onClick={() => navigate('/client/cars')}
            className="btn btn-primary btn-md"
          >
            Volver a mis vehículos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => navigate('/client/cars')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar vehículo
              </h1>
              <p className="text-gray-600">
                {car.make} {car.model} {car.year} - {car.licensePlate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <div className="flex items-center mb-6">
              <Car className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Información básica
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  placeholder="ej. Toyota, Honda, Ford"
                  className={`input input-md w-full ${errors.make ? 'border-error-500' : ''}`}
                  {...register('make', {
                    required: 'La marca es requerida',
                    minLength: {
                      value: 2,
                      message: 'La marca debe tener al menos 2 caracteres'
                    }
                  })}
                />
                {errors.make && (
                  <p className="mt-1 text-sm text-error-600">{errors.make.message}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo *
                </label>
                <input
                  type="text"
                  placeholder="ej. Corolla, Civic, Focus"
                  className={`input input-md w-full ${errors.model ? 'border-error-500' : ''}`}
                  {...register('model', {
                    required: 'El modelo es requerido',
                    minLength: {
                      value: 2,
                      message: 'El modelo debe tener al menos 2 caracteres'
                    }
                  })}
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-error-600">{errors.model.message}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año *
                </label>
                <input
                  type="number"
                  min="1900"
                  max={getCurrentYear() + 1}
                  className={`input input-md w-full ${errors.year ? 'border-error-500' : ''}`}
                  {...register('year', {
                    required: 'El año es requerido',
                    min: {
                      value: 1900,
                      message: 'El año debe ser mayor a 1900'
                    },
                    max: {
                      value: getCurrentYear() + 1,
                      message: `El año no puede ser mayor a ${getCurrentYear() + 1}`
                    }
                  })}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-error-600">{errors.year.message}</p>
                )}
              </div>

              {/* License Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placas *
                </label>
                <input
                  type="text"
                  placeholder="ej. ABC-123-D"
                  className={`input input-md w-full ${errors.licensePlate ? 'border-error-500' : ''}`}
                  {...register('licensePlate', {
                    required: 'Las placas son requeridas',
                    pattern: {
                      value: /^[A-Z0-9-]+$/i,
                      message: 'Formato de placas inválido'
                    }
                  })}
                />
                {errors.licensePlate && (
                  <p className="mt-1 text-sm text-error-600">{errors.licensePlate.message}</p>
                )}
              </div>

              {/* VIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIN (Número de serie) *
                </label>
                <input
                  type="text"
                  placeholder="17 caracteres alfanuméricos"
                  className={`input input-md w-full ${errors.vin ? 'border-error-500' : ''}`}
                  {...register('vin', {
                    required: 'El VIN es requerido',
                    minLength: {
                      value: 17,
                      message: 'El VIN debe tener exactamente 17 caracteres'
                    },
                    maxLength: {
                      value: 17,
                      message: 'El VIN debe tener exactamente 17 caracteres'
                    },
                    pattern: {
                      value: /^[A-HJ-NPR-Z0-9]{17}$/i,
                      message: 'Formato de VIN inválido'
                    }
                  })}
                />
                {errors.vin && (
                  <p className="mt-1 text-sm text-error-600">{errors.vin.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  className={`input input-md w-full ${errors.color ? 'border-error-500' : ''}`}
                  {...register('color', {
                    required: 'El color es requerido'
                  })}
                >
                  <option value="">Selecciona un color</option>
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                {errors.color && (
                  <p className="mt-1 text-sm text-error-600">{errors.color.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Especificaciones del vehículo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de vehículo *
                </label>
                <select
                  className={`input input-md w-full ${errors.vehicleType ? 'border-error-500' : ''}`}
                  {...register('vehicleType', {
                    required: 'El tipo de vehículo es requerido'
                  })}
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.vehicleType && (
                  <p className="mt-1 text-sm text-error-600">{errors.vehicleType.message}</p>
                )}
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de combustible *
                </label>
                <select
                  className={`input input-md w-full ${errors.fuelType ? 'border-error-500' : ''}`}
                  {...register('fuelType', {
                    required: 'El tipo de combustible es requerido'
                  })}
                >
                  {fuelTypes.map(fuel => (
                    <option key={fuel.value} value={fuel.value}>{fuel.label}</option>
                  ))}
                </select>
                {errors.fuelType && (
                  <p className="mt-1 text-sm text-error-600">{errors.fuelType.message}</p>
                )}
              </div>

              {/* Engine Size */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño del motor (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. 2.0L, 1.6L, 3.5L"
                  className="input input-md w-full"
                  {...register('engineSize')}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Documentos del vehículo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarjeta de circulación
                </label>
                
                {/* Existing Document */}
                {existingDocuments.registration && (
                  <div className="mb-4 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Check className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Documento actual
                          </p>
                          <p className="text-xs text-gray-500">
                            Subido anteriormente
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => downloadDocument('registration')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingDocument('registration')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Eliminar"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Document Upload */}
                {!documents.registration ? (
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {existingDocuments.registration ? 'Subir nuevo documento' : 'Haz clic para subir o arrastra el archivo aquí'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG o PDF (máx. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('registration', e)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                          <Check className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {documents.registration.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(documents.registration.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument('registration')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    
                    {documentPreviews.registration && (
                      <div className="mt-3">
                        <img
                          src={documentPreviews.registration}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Insurance Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Póliza de seguro
                </label>
                
                {/* Existing Document */}
                {existingDocuments.insurance && (
                  <div className="mb-4 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Check className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Documento actual
                          </p>
                          <p className="text-xs text-gray-500">
                            Subido anteriormente
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => downloadDocument('insurance')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingDocument('insurance')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Eliminar"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Document Upload */}
                {!documents.insurance ? (
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {existingDocuments.insurance ? 'Subir nuevo documento' : 'Haz clic para subir o arrastra el archivo aquí'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG o PDF (máx. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('insurance', e)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                          <Check className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {documents.insurance.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(documents.insurance.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument('insurance')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    
                    {documentPreviews.insurance && (
                      <div className="mt-3">
                        <img
                          src={documentPreviews.insurance}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/client/cars')}
              className="btn btn-secondary btn-md"
            >
              Cancelar
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
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCar