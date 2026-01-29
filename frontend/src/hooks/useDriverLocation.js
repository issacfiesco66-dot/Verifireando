import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../contexts/SocketContext'

/**
 * Hook personalizado para rastrear y enviar la ubicación del chofer en tiempo real
 * @param {string} appointmentId - ID de la cita activa
 * @param {boolean} isTracking - Si debe rastrear la ubicación
 * @returns {Object} - Estado de ubicación y funciones de control
 */
export const useDriverLocation = (appointmentId, isTracking = false) => {
  const { socket } = useSocket()
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isWatching, setIsWatching] = useState(false)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!isTracking || !appointmentId || !socket) {
      stopTracking()
      return
    }

    startTracking()

    return () => {
      stopTracking()
    }
  }, [isTracking, appointmentId, socket])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador')
      return
    }

    // Opciones de geolocalización
    const options = {
      enableHighAccuracy: true, // Usar GPS si está disponible
      timeout: 10000, // 10 segundos timeout
      maximumAge: 0 // No usar caché
    }

    // Iniciar seguimiento continuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }

        setLocation(newLocation)
        setError(null)
        setIsWatching(true)

        // Enviar ubicación al servidor vía Socket.IO
        if (socket && appointmentId) {
          socket.emit('driver-location', {
            appointmentId,
            location: newLocation,
            timestamp: new Date().toISOString()
          })
        }
      },
      (err) => {
        console.error('Error obteniendo ubicación:', err)
        setError(getErrorMessage(err))
        setIsWatching(false)
      },
      options
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsWatching(false)
    }
  }

  const getErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado. Por favor, habilita el acceso a la ubicación.'
      case error.POSITION_UNAVAILABLE:
        return 'Ubicación no disponible. Verifica tu conexión GPS.'
      case error.TIMEOUT:
        return 'Tiempo de espera agotado al obtener ubicación.'
      default:
        return 'Error desconocido al obtener ubicación.'
    }
  }

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          setLocation(loc)
          resolve(loc)
        },
        (err) => {
          setError(getErrorMessage(err))
          reject(err)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  return {
    location,
    error,
    isWatching,
    startTracking,
    stopTracking,
    getCurrentLocation
  }
}
