import React, { useState, useEffect } from 'react'
import { MapPin, Search, Locate, Check, X } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import MapComponent from './MapComponent'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

// Token de Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const MapSelector = ({ 
  onLocationSelect, 
  initialLocation = null,
  placeholder = "Buscar dirección...",
  height = "400px",
  showCurrentLocation = true,
  className = ""
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [mapCenter, setMapCenter] = useState([-99.1332, 19.4326]) // Mexico City default
  
  const { 
    currentLocation, 
    getCurrentLocation, 
    getCoordinatesFromAddress,
    getAddressFromCoordinates,
    loading: locationLoading 
  } = useLocation()

  // Update map center when current location is available
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.longitude, currentLocation.latitude])
    }
  }, [currentLocation])

  // Update selected location when initial location changes
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation)
      setMapCenter([initialLocation.longitude, initialLocation.latitude])
    }
  }, [initialLocation])

  // Search for addresses
  const searchAddresses = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    if (!MAPBOX_TOKEN) {
      toast.error('Mapas deshabilitados: agrega VITE_MAPBOX_ACCESS_TOKEN para buscar direcciones')
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=mx&language=es&limit=5`
      )
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.features || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error searching addresses:', error)
      toast.error('Error al buscar direcciones')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Debounce search
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      searchAddresses(query)
    }, 500)
  }

  // Handle search result selection
  const handleSearchResultSelect = async (result) => {
    const [longitude, latitude] = result.center
    const location = {
      latitude,
      longitude,
      address: result.place_name
    }
    
    setSelectedLocation(location)
    setSearchQuery(result.place_name)
    setShowResults(false)
    setMapCenter([longitude, latitude])
    
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  // Handle map click
  const handleMapLocationSelect = async ({ lng, lat }) => {
    try {
      const address = await getAddressFromCoordinates(lat, lng)
      const location = {
        latitude: lat,
        longitude: lng,
        address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
      
      setSelectedLocation(location)
      setSearchQuery(location.address)
      setShowResults(false)
      
      if (onLocationSelect) {
        onLocationSelect(location)
      }
    } catch (error) {
      console.error('Error getting address:', error)
      toast.error('Error al obtener la dirección')
    }
  }

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation()
      if (location) {
        const address = await getAddressFromCoordinates(location.latitude, location.longitude)
        const locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        }
        
        setSelectedLocation(locationData)
        setSearchQuery(locationData.address)
        setMapCenter([location.longitude, location.latitude])
        
        if (onLocationSelect) {
          onLocationSelect(locationData)
        }
        
        toast.success('Ubicación actual obtenida')
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      toast.error('Error al obtener ubicación actual')
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedLocation(null)
    setSearchQuery('')
    setShowResults(false)
    
    if (onLocationSelect) {
      onLocationSelect(null)
    }
  }

  // Prepare markers for map
  const markers = selectedLocation ? [{
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    type: 'selected',
    popup: `<div class="p-2"><strong>Ubicación seleccionada</strong><br/>${selectedLocation.address}</div>`
  }] : []

  return (
    <div className={`space-y-4 ${className}`}>
      {!MAPBOX_TOKEN && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3">
          Mapas deshabilitados: agrega <code>VITE_MAPBOX_ACCESS_TOKEN</code> para habilitar búsqueda y visualización.
        </div>
      )}
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
            {showCurrentLocation && (
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locationLoading}
                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                title="Usar ubicación actual"
              >
                {locationLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                ) : (
                  <Locate className="w-4 h-4" />
                )}
              </button>
            )}
            {selectedLocation && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                title="Limpiar selección"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSearchResultSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
              >
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.text}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.place_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading indicator for search */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">Buscando direcciones...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-green-900">
                Ubicación seleccionada
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {selectedLocation.address}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <MapComponent
          center={mapCenter}
          zoom={selectedLocation ? 16 : 12}
          markers={markers}
          onLocationSelect={handleMapLocationSelect}
          height={height}
          showUserLocation={showCurrentLocation}
          interactive={true}
        />
      </div>
    </div>
  )
}

export default MapSelector