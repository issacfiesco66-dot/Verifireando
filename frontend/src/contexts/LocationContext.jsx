import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'
import { toast } from 'react-hot-toast'

const LocationContext = createContext()

// Location reducer
const locationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_CURRENT_LOCATION':
      return { 
        ...state, 
        currentLocation: action.payload, 
        loading: false,
        error: null 
      }
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        loading: false 
      }
    case 'SET_WATCHING':
      return { ...state, watching: action.payload }
    case 'SET_PERMISSION':
      return { ...state, permission: action.payload }
    case 'UPDATE_DRIVER_LOCATION':
      return {
        ...state,
        driverLocations: {
          ...state.driverLocations,
          [action.payload.driverId]: action.payload.location,
        },
      }
    case 'REMOVE_DRIVER_LOCATION':
      const { [action.payload]: removed, ...rest } = state.driverLocations
      return {
        ...state,
        driverLocations: rest,
      }
    case 'SET_ADDRESS':
      return { ...state, currentAddress: action.payload }
    default:
      return state
  }
}

const initialState = {
  currentLocation: null,
  currentAddress: null,
  driverLocations: {},
  loading: false,
  watching: false,
  error: null,
  permission: null,
}

export const LocationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(locationReducer, initialState)
  const { user } = useAuth()
  const { updateDriverLocation, subscribe } = useSocket()
  const watchId = React.useRef(null)

  // Check geolocation support and permission
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        dispatch({ type: 'SET_PERMISSION', payload: result.state })
        
        result.addEventListener('change', () => {
          dispatch({ type: 'SET_PERMISSION', payload: result.state })
        })
      })
    }
  }, [])

  // Subscribe to driver location updates
  useEffect(() => {
    const unsubscribe = subscribe('driver-location-updated', (event) => {
      const { driverId, location } = event.detail
      dispatch({ 
        type: 'UPDATE_DRIVER_LOCATION', 
        payload: { driverId, location } 
      })
    })

    return unsubscribe
  }, [subscribe])

  // Get current position
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const error = new Error('Geolocation is not supported')
        dispatch({ type: 'SET_ERROR', payload: error.message })
        reject(error)
        return
      }

      dispatch({ type: 'SET_LOADING', payload: true })

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          }
          
          dispatch({ type: 'SET_CURRENT_LOCATION', payload: location })
          getAddressFromCoordinates(location.latitude, location.longitude)
          resolve(location)
        },
        (error) => {
          let errorMessage = 'Error getting location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Acceso a ubicación denegado'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible'
              break
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado'
              break
            default:
              errorMessage = 'Error desconocido al obtener ubicación'
              break
          }
          
          dispatch({ type: 'SET_ERROR', payload: errorMessage })
          toast.error(errorMessage)
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }

  // Start watching position (for drivers)
  const startWatching = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported')
      return
    }

    if (watchId.current) {
      stopWatching()
    }

    dispatch({ type: 'SET_WATCHING', payload: true })

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp),
        }
        
        dispatch({ type: 'SET_CURRENT_LOCATION', payload: location })
        
        // Update driver location via socket if user is a driver
        if (user?.role === 'driver') {
          updateDriverLocation(location)
        }
      },
      (error) => {
        console.error('Watch position error:', error)
        let errorMessage = 'Error watching location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Acceso a ubicación denegado'
            stopWatching()
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible'
            break
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado'
            break
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // 1 minute
      }
    )
  }

  // Stop watching position
  const stopWatching = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
      dispatch({ type: 'SET_WATCHING', payload: false })
    }
  }

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&language=es`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          const address = data.features[0].place_name
          dispatch({ type: 'SET_ADDRESS', payload: address })
          return address
        }
      }
    } catch (error) {
      console.error('Error getting address:', error)
    }
    return null
  }

  // Get coordinates from address using geocoding
  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&country=mx&language=es`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center
          return { latitude, longitude }
        }
      }
    } catch (error) {
      console.error('Error getting coordinates:', error)
    }
    return null
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  // Find nearby drivers
  const findNearbyDrivers = (maxDistance = 10) => {
    if (!state.currentLocation) return []
    
    return Object.entries(state.driverLocations)
      .map(([driverId, location]) => {
        const distance = calculateDistance(
          state.currentLocation.latitude,
          state.currentLocation.longitude,
          location.latitude,
          location.longitude
        )
        return { driverId, location, distance }
      })
      .filter(driver => driver.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
  }

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const location = await getCurrentLocation()
      return location
    } catch (error) {
      throw error
    }
  }

  // Auto-start watching for drivers
  useEffect(() => {
    if (user?.role === 'driver' && state.permission === 'granted') {
      startWatching()
    }
    
    return () => {
      if (user?.role === 'driver') {
        stopWatching()
      }
    }
  }, [user, state.permission])

  const value = {
    currentLocation: state.currentLocation,
    currentAddress: state.currentAddress,
    driverLocations: state.driverLocations,
    loading: state.loading,
    watching: state.watching,
    error: state.error,
    permission: state.permission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
    calculateDistance,
    findNearbyDrivers,
    requestLocationPermission,
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}