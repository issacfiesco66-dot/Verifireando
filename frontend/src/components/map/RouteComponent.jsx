import React, { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Route, 
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { routingService } from '../../services/routingService'
import { useLocation } from '../../contexts/LocationContext'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

// Set Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken = MAPBOX_TOKEN

const RouteComponent = ({
  origin,
  destination,
  waypoints = [],
  profile = 'driving',
  showNavigation = true,
  onRouteCalculated,
  onNavigationStart,
  onNavigationEnd,
  height = '400px',
  className = ''
}) => {
  // If token is missing, render a friendly fallback instead of initializing Mapbox
  const isTokenMissing = !MAPBOX_TOKEN
  if (isTokenMissing) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <p className="text-gray-700 font-semibold">Navegación deshabilitada</p>
          <p className="text-sm text-gray-500 mt-1">Falta configurar la variable <code>VITE_MAPBOX_ACCESS_TOKEN</code>.</p>
        </div>
      </div>
    )
  }

  const mapContainer = useRef(null)
  const map = useRef(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [route, setRoute] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [navigationInstructions, setNavigationInstructions] = useState([])
  
  const { currentLocation } = useLocation()

  // Initialize map
  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: origin ? [origin.longitude, origin.latitude] : [-99.1332, 19.4326],
      zoom: 12
    })

    map.current.on('load', () => {
      setLoading(false)
      
      // Add route source and layer
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      })

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
          'line-opacity': 0.8
        }
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Calculate route when origin/destination changes
  useEffect(() => {
    if (!origin || !destination || !map.current) return
    calculateRoute()
  }, [origin, destination, waypoints, profile])

  const calculateRoute = async () => {
    setCalculating(true)
    
    try {
      let result
      
      if (waypoints.length > 0) {
        // Optimize route with waypoints
        const allPoints = [origin, ...waypoints, destination]
        result = await routingService.optimizeRoute(allPoints, { profile })
      } else {
        // Simple point-to-point route
        result = await routingService.getDirections(origin, destination, { profile })
      }

      if (result.success) {
        setRoute(result.route)
        setNavigationInstructions(
          routingService.getNavigationInstructions(result.route.steps || [])
        )
        
        // Update map with route
        updateMapRoute(result.route.geometry)
        
        // Add markers
        addRouteMarkers()
        
        // Fit map to route bounds
        fitMapToRoute(result.route.geometry)
        
        // Notify parent component
        if (onRouteCalculated) {
          onRouteCalculated(result.route)
        }
        
        toast.success(`Ruta calculada: ${routingService.formatDistance(result.route.distance)}`)
      } else {
        toast.error(`Error calculando ruta: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      toast.error('Error calculando la ruta')
    } finally {
      setCalculating(false)
    }
  }

  const updateMapRoute = (geometry) => {
    if (!map.current || !geometry) return
    
    map.current.getSource('route').setData({
      type: 'Feature',
      properties: {},
      geometry
    })
  }

  const addRouteMarkers = () => {
    if (!map.current) return
    
    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.route-marker')
    existingMarkers.forEach(marker => marker.remove())
    
    // Add origin marker
    if (origin) {
      const originEl = document.createElement('div')
      originEl.className = 'route-marker'
      originEl.innerHTML = `
        <div class="w-8 h-8 bg-green-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `
      
      new mapboxgl.Marker(originEl)
        .setLngLat([origin.longitude, origin.latitude])
        .addTo(map.current)
    }
    
    // Add destination marker
    if (destination) {
      const destEl = document.createElement('div')
      destEl.className = 'route-marker'
      destEl.innerHTML = `
        <div class="w-8 h-8 bg-red-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-white" />
        </div>
      `
      
      new mapboxgl.Marker(destEl)
        .setLngLat([destination.longitude, destination.latitude])
        .addTo(map.current)
    }
    
    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const waypointEl = document.createElement('div')
      waypointEl.className = 'route-marker'
      waypointEl.innerHTML = `
        <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <span class="text-xs text-white font-bold">${index + 1}</span>
        </div>
      `
      
      new mapboxgl.Marker(waypointEl)
        .setLngLat([waypoint.longitude, waypoint.latitude])
        .addTo(map.current)
    })
  }

  const fitMapToRoute = (geometry) => {
    if (!map.current || !geometry || !geometry.coordinates) return
    
    const bounds = new mapboxgl.LngLatBounds()
    geometry.coordinates.forEach(coord => bounds.extend(coord))
    
    map.current.fitBounds(bounds, { padding: 50 })
  }

  const startNavigation = () => {
    if (!route) return
    
    setIsNavigating(true)
    setCurrentStep(0)
    
    if (onNavigationStart) {
      onNavigationStart(route)
    }
    
    toast.success('Navegación iniciada')
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    setCurrentStep(0)
    
    if (onNavigationEnd) {
      onNavigationEnd()
    }
    
    toast.success('Navegación finalizada')
  }

  const nextStep = () => {
    if (currentStep < navigationInstructions.length - 1) {
      setCurrentStep(currentStep + 1)
      
      if (voiceEnabled && navigationInstructions[currentStep + 1]?.voiceInstruction) {
        speakInstruction(navigationInstructions[currentStep + 1].voiceInstruction)
      }
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const openExternalNavigation = () => {
    if (destination) {
      routingService.openExternalNavigation(destination)
    }
  }

  const recalculateRoute = () => {
    calculateRoute()
  }

  if (loading) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <LoadingSpinner text="Cargando mapa..." />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Route Controls */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        <button
          onClick={recalculateRoute}
          disabled={calculating}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Recalcular ruta"
        >
          {calculating ? (
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        <button
          onClick={openExternalNavigation}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Abrir en navegador externo"
        >
          <Navigation className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Route Info */}
      {route && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-10 max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <Route className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Información de Ruta</h3>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{routingService.formatDuration(route.duration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{routingService.formatDistance(route.distance)}</span>
            </div>
          </div>
          
          {showNavigation && (
            <div className="mt-3 space-y-2">
              {!isNavigating ? (
                <button
                  onClick={startNavigation}
                  className="w-full btn btn-primary btn-sm flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Navegación</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={stopNavigation}
                    className="w-full btn btn-secondary btn-sm flex items-center justify-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Detener</span>
                  </button>
                  
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="w-full btn btn-outline btn-sm flex items-center justify-center space-x-2"
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    <span>{voiceEnabled ? 'Silenciar' : 'Activar Voz'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Instructions */}
      {isNavigating && navigationInstructions.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-md z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              Paso {currentStep + 1} de {navigationInstructions.length}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === navigationInstructions.length - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {navigationInstructions[currentStep] && (
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">
                {navigationInstructions[currentStep].instruction}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{routingService.formatDistance(navigationInstructions[currentStep].distance)}</span>
                <span>{routingService.formatDuration(navigationInstructions[currentStep].duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RouteComponent