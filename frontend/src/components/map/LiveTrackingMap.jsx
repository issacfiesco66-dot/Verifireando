import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, Loader, Locate, Clock, Info, AlertTriangle, Car } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Configurar token de Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

/**
 * Componente de mapa para seguimiento en tiempo real del chofer
 * Usa Mapbox GL JS para mostrar la ubicación del chofer y la ruta
 */
const LiveTrackingMap = ({ 
  driverLocation, 
  pickupLocation, 
  deliveryLocation,
  showRoute = true,
  height = '400px',
  appointmentStatus = 'driver_enroute',
  driverName = '',
  showETA = true
}) => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const deliveryMarkerRef = useRef(null)
  const routeRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [eta, setEta] = useState(null)
  const [distance, setDistance] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)

  // Verificar si el token está configurado
  if (!MAPBOX_TOKEN) {
    return (
      <div 
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-700 font-semibold">Mapa no disponible</p>
          <p className="text-sm text-yellow-600 mt-1">
            Configura VITE_MAPBOX_ACCESS_TOKEN para habilitar el seguimiento
          </p>
        </div>
      </div>
    )
  }

  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current) return // Ya está inicializado

    try {
      // Centro por defecto (Ciudad de México) o ubicación de recogida
      const center = pickupLocation 
        ? [pickupLocation.lng, pickupLocation.lat]
        : [-99.1332, 19.4326]

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: 13,
        attributionControl: false
      })

      // Agregar controles de navegación
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      mapRef.current.on('load', () => {
        setMapLoaded(true)
      })

      mapRef.current.on('error', (e) => {
        console.error('Error en Mapbox:', e)
        setError('Error al cargar el mapa')
      })

    } catch (err) {
      console.error('Error inicializando mapa:', err)
      setError('Error al inicializar el mapa')
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Crear marcador de recogida
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !pickupLocation) return

    // Limpiar marcador anterior
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove()
    }

    // Crear elemento HTML para el marcador
    const el = document.createElement('div')
    el.className = 'marker-pickup'
    el.style.width = '30px'
    el.style.height = '30px'
    el.style.borderRadius = '50%'
    el.style.backgroundColor = '#3B82F6'
    el.style.border = '3px solid white'
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

    pickupMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Punto de Recogida</strong>'))
      .addTo(mapRef.current)

  }, [mapLoaded, pickupLocation])

  // Crear marcador de entrega
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !deliveryLocation) return

    // Limpiar marcador anterior
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.remove()
    }

    // Crear elemento HTML para el marcador
    const el = document.createElement('div')
    el.className = 'marker-delivery'
    el.style.width = '30px'
    el.style.height = '30px'
    el.style.borderRadius = '50%'
    el.style.backgroundColor = '#10B981'
    el.style.border = '3px solid white'
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

    deliveryMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Punto de Entrega</strong>'))
      .addTo(mapRef.current)

  }, [mapLoaded, deliveryLocation])

  // Actualizar ubicación del chofer
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !driverLocation) return

    try {
      // Crear o actualizar marcador del chofer
      if (!driverMarkerRef.current) {
        // Crear elemento HTML para el marcador del chofer
        const el = document.createElement('div')
        el.className = 'marker-driver'
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background-color: #EF4444;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        `

        driverMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([driverLocation.lng, driverLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML('<strong>Chofer en Ruta</strong>'))
          .addTo(mapRef.current)

        // Centrar en el chofer
        mapRef.current.flyTo({
          center: [driverLocation.lng, driverLocation.lat],
          zoom: 14,
          duration: 1000
        })
      } else {
        // Actualizar posición con animación suave
        driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat])
        
        // Centrar mapa en el chofer
        mapRef.current.panTo([driverLocation.lng, driverLocation.lat])
      }

      // Dibujar ruta si está habilitado
      if (showRoute && pickupLocation) {
        drawRoute(driverLocation, pickupLocation)
      }

    } catch (err) {
      console.error('Error actualizando ubicación del chofer:', err)
    }
  }, [driverLocation, mapLoaded, showRoute, pickupLocation])

  // Dibujar ruta entre chofer y destino usando Mapbox Directions API
  const drawRoute = async (origin, destination) => {
    if (!mapRef.current) return

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&steps=true&overview=full&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const geometry = route.geometry
        
        // Guardar información de la ruta
        routeRef.current = route
        
        // Calcular ETA y distancia
        const durationMinutes = Math.round(route.duration / 60)
        const distanceKm = (route.distance / 1000).toFixed(1)
        
        setEta(durationMinutes)
        setDistance(distanceKm)
        
        // Guardar información de pasos para mostrar instrucciones
        if (route.legs && route.legs.length > 0) {
          const steps = route.legs[0].steps
          setRouteInfo(steps)
        }

        // Remover capa de ruta anterior si existe
        if (mapRef.current.getLayer('route')) {
          mapRef.current.removeLayer('route')
        }
        if (mapRef.current.getSource('route')) {
          mapRef.current.removeSource('route')
        }

        // Agregar nueva ruta
        mapRef.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry
          }
        })

        // Agregar capa de ruta principal
        mapRef.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
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
        
        // Agregar capa de contorno para efecto de resplandor
        mapRef.current.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#93C5FD',
            'line-width': 8,
            'line-opacity': 0.4,
            'line-blur': 3
          }
        }, 'route')

        // Ajustar vista para mostrar toda la ruta
        const coordinates = geometry.coordinates
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        })
      }
    } catch (err) {
      console.error('Error dibujando ruta:', err)
    }
  }

  // Centrar en chofer
  const centerOnDriver = () => {
    if (mapRef.current && driverLocation) {
      mapRef.current.flyTo({
        center: [driverLocation.lng, driverLocation.lat],
        zoom: 15,
        duration: 1000
      })
    }
  }

  if (error) {
    return (
      <div 
        className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  // Formatear tiempo estimado de llegada
  const formatETA = (minutes) => {
    if (!minutes) return 'Calculando...'
    
    if (minutes < 1) {
      return 'Menos de 1 minuto'
    } else if (minutes === 1) {
      return '1 minuto'
    } else if (minutes < 60) {
      return `${minutes} minutos`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
      } else {
        return `${hours} ${hours === 1 ? 'hora' : 'horas'} y ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`
      }
    }
  }
  
  // Obtener mensaje de estado según el estado de la cita
  const getStatusMessage = () => {
    switch (appointmentStatus) {
      case 'driver_enroute':
        return 'El chofer está en camino a recoger tu vehículo'
      case 'picked_up':
        return 'El chofer está llevando tu vehículo a verificación'
      case 'in_verification':
        return 'Tu vehículo está en proceso de verificación'
      case 'completed':
        return 'Servicio completado'
      default:
        return 'Chofer asignado'
    }
  }

  return (
    <div className="relative">
      {/* Panel de información de ETA */}
      {showETA && driverLocation && eta !== null && (
        <div className="absolute top-4 left-4 right-16 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Llegada estimada: <span className="text-primary-600">{formatETA(eta)}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {distance && `Distancia: ${distance} km`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Car className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">
                {driverName || 'Chofer'}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 flex items-center">
              <Info className="w-3 h-3 mr-1 text-primary-500" />
              {getStatusMessage()}
            </p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="rounded-lg border border-gray-200 shadow-sm"
        style={{ height, width: '100%' }}
      />
      
      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-sm z-10">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-700">Chofer</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-700">Recogida</span>
        </div>
        {deliveryLocation && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Entrega</span>
          </div>
        )}
        {routeInfo && (
          <div className="flex items-center space-x-2 cursor-pointer" 
               onClick={() => alert('Próximamente: Instrucciones paso a paso')}>
            <Navigation className="w-3 h-3 text-blue-600" />
            <span className="text-blue-600 underline">Ver instrucciones</span>
          </div>
        )}
      </div>

      {/* Botones de control */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        {driverLocation && mapLoaded && (
          <button
            onClick={centerOnDriver}
            className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
            title="Centrar en chofer"
          >
            <Locate className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {/* Botón de emergencia */}
        <button
          onClick={() => alert('Próximamente: Contacto de emergencia')}
          className="bg-red-500 hover:bg-red-600 rounded-lg shadow-lg p-2 transition-colors"
          title="Emergencia"
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Indicador de carga */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader className="w-8 h-8 text-primary-600 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveTrackingMap
