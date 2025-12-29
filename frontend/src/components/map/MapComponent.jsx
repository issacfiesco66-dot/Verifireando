import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, Locate, Route, Clock } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { routingService } from '../../services/routingService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

// Set Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

const MapComponent = ({
  center = [-99.1332, 19.4326], // Mexico City default
  zoom = 12,
  markers = [],
  showUserLocation = true,
  showDrivers = false,
  showRoute = false,
  routeStart = null,
  routeEnd = null,
  onLocationSelect,
  onMarkerClick,
  onRouteCalculated,
  height = '400px',
  className = '',
  interactive = true,
  showRouteControls = false
}) => {
  // If token is missing, render a friendly fallback instead of initializing Mapbox
  const isTokenMissing = !MAPBOX_TOKEN
  if (isTokenMissing) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <p className="text-gray-700 font-semibold">Mapa deshabilitado</p>
          <p className="text-sm text-gray-500 mt-1">Falta configurar la variable <code>VITE_MAPBOX_ACCESS_TOKEN</code>.</p>
        </div>
      </div>
    )
  }

  const mapContainer = useRef(null)
  const map = useRef(null)
  const userLocationMarker = useRef(null)
  const markersRef = useRef([])
  const routeLayerId = 'route'
  
  const { currentLocation, driverLocations, getCurrentLocation } = useLocation()
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [routeData, setRouteData] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  // Initialize map
  useEffect(() => {
    if (map.current) return // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      interactive: interactive
    })

    map.current.on('load', () => {
      setMapLoaded(true)
      setLoading(false)
    })

    // Add navigation controls
    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right')
    }

    // Handle map clicks for location selection
    if (onLocationSelect) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat
        onLocationSelect({ lng, lat })
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Update user location marker
  useEffect(() => {
    if (!mapLoaded || !showUserLocation || !currentLocation) return

    if (userLocationMarker.current) {
      userLocationMarker.current.remove()
    }

    // Create user location marker
    const el = document.createElement('div')
    el.className = 'user-location-marker'
    el.innerHTML = `
      <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
    `

    userLocationMarker.current = new mapboxgl.Marker(el)
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .addTo(map.current)

    // Center map on user location
    map.current.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 15
    })
  }, [mapLoaded, showUserLocation, currentLocation])

  // Update markers
  useEffect(() => {
    if (!mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    markers.forEach((markerData, index) => {
      const el = document.createElement('div')
      el.className = 'custom-marker'
      
      // Different marker styles based on type
      if (markerData.type === 'appointment') {
        el.innerHTML = `
          <div class="w-8 h-8 bg-primary-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        `
      } else if (markerData.type === 'driver') {
        el.innerHTML = `
          <div class="w-8 h-8 bg-success-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        `
      } else {
        el.innerHTML = `
          <div class="w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg"></div>
        `
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map.current)

      // Add popup if provided
      if (markerData.popup) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(markerData.popup)
        marker.setPopup(popup)
      }

      // Handle marker click
      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(markerData, index)
        })
      }

      markersRef.current.push(marker)
    })
  }, [mapLoaded, markers, onMarkerClick])

  // Show driver locations
  useEffect(() => {
    if (!mapLoaded || !showDrivers || !driverLocations.length) return

    // Clear existing driver markers
    const existingDriverMarkers = markersRef.current.filter(marker => 
      marker.getElement().classList.contains('driver-marker')
    )
    existingDriverMarkers.forEach(marker => marker.remove())

    // Add driver markers
    driverLocations.forEach(driver => {
      const el = document.createElement('div')
      el.className = 'driver-marker'
      el.innerHTML = `
        <div class="w-10 h-10 bg-success-500 border-3 border-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      `

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${driver.name}</h3>
            <p class="text-sm text-gray-600">Chofer disponible</p>
            <p class="text-xs text-gray-500">Última actualización: ${new Date(driver.lastUpdate).toLocaleTimeString()}</p>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.location.longitude, driver.location.latitude])
        .setPopup(popup)
        .addTo(map.current)

      markersRef.current.push(marker)
    })
  }, [mapLoaded, showDrivers, driverLocations])

  // Calculate and display route
  useEffect(() => {
    if (!mapLoaded || !showRoute || !routeStart || !routeEnd) {
      // Remove existing route if any
      try {
        if (map.current && map.current.getLayer && map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId)
          map.current.removeSource(routeLayerId)
        }
      } catch (error) {
        // Ignore errors when style is not loaded yet
      }
      return
    }

    calculateRoute()
  }, [mapLoaded, showRoute, routeStart, routeEnd])

  const calculateRoute = async () => {
    if (!routeStart || !routeEnd || !map.current) return

    setRouteLoading(true)
    try {
      const route = await routingService.getDirections(routeStart, routeEnd, 'driving-traffic')
      setRouteData(route)

      // Remove existing route
      try {
        if (map.current.getLayer && map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId)
          map.current.removeSource(routeLayerId)
        }
      } catch (error) {
        // Ignore errors when style is not loaded yet
      }

      // Add route to map
      map.current.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        }
      })

      map.current.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 5,
          'line-opacity': 0.8
        }
      })

      // Fit map to route bounds
      const coordinates = route.geometry.coordinates
      const bounds = new mapboxgl.LngLatBounds()
      coordinates.forEach(coord => bounds.extend(coord))
      map.current.fitBounds(bounds, { padding: 50 })

      // Call callback with route data
      if (onRouteCalculated) {
        onRouteCalculated(route)
      }

      toast.success(`Ruta calculada: ${route.distance} en ${route.duration}`)
    } catch (error) {
      console.error('Error calculating route:', error)
      toast.error('Error al calcular la ruta')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      setLoading(true)
      await getCurrentLocation()
    } catch (error) {
      console.error('Error getting location:', error)
    } finally {
      setLoading(false)
    }
  }

  const fitBounds = () => {
    if (!mapLoaded || markersRef.current.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()
    
    markersRef.current.forEach(marker => {
      bounds.extend(marker.getLngLat())
    })

    if (currentLocation && showUserLocation) {
      bounds.extend([currentLocation.longitude, currentLocation.latitude])
    }

    map.current.fitBounds(bounds, { padding: 50 })
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <LoadingSpinner text="Cargando mapa..." />
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      {interactive && (
        <div className="absolute top-4 left-4 space-y-2 z-10">
          <button
            onClick={handleGetCurrentLocation}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Obtener mi ubicación"
          >
            <Locate className="w-5 h-5 text-gray-600" />
          </button>
          
          {markersRef.current.length > 1 && (
            <button
              onClick={fitBounds}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Ajustar vista"
            >
              <Navigation className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {showRouteControls && routeStart && routeEnd && (
            <button
              onClick={calculateRoute}
              disabled={routeLoading}
              className="bg-primary-500 text-white p-2 rounded-lg shadow-md hover:bg-primary-600 transition-colors disabled:opacity-50"
              title="Calcular ruta"
            >
              {routeLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Route className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Route Info */}
      {routeData && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-10 max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <Route className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Información de Ruta</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{routeData.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{routeData.distance}</span>
            </div>
            <button
              onClick={() => routingService.openExternalNavigation(routeStart, routeEnd)}
              className="w-full mt-2 bg-primary-500 text-white py-2 px-3 rounded-md text-sm hover:bg-primary-600 transition-colors"
            >
              Abrir en Navegador
            </button>
          </div>
        </div>
      )}

      {/* Location Info */}
      {currentLocation && !routeData && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-10">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Tu ubicación</p>
              <p className="text-xs text-gray-600">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapComponent