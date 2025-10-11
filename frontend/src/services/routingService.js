/**
 * Routing Service using Mapbox Directions API
 * Provides route optimization, directions, and navigation features
 */

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const DIRECTIONS_API_BASE = 'https://api.mapbox.com/directions/v5/mapbox'

class RoutingService {
  /**
   * Get directions between two points
   * @param {Object} origin - { longitude, latitude }
   * @param {Object} destination - { longitude, latitude }
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Route data
   */
  async getDirections(origin, destination, options = {}) {
    try {
      const {
        profile = 'driving', // driving, walking, cycling, driving-traffic
        geometries = 'geojson',
        overview = 'full',
        steps = true,
        voice_instructions = true,
        banner_instructions = true,
        language = 'es'
      } = options

      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
      
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        geometries,
        overview,
        steps,
        voice_instructions,
        banner_instructions,
        language
      })

      const url = `${DIRECTIONS_API_BASE}/${profile}/${coordinates}?${params}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found')
      }

      const route = data.routes[0]
      
      return {
        success: true,
        route: {
          geometry: route.geometry,
          distance: route.distance, // meters
          duration: route.duration, // seconds
          steps: route.legs[0]?.steps || [],
          voiceInstructions: route.legs[0]?.steps?.map(step => step.voiceInstructions).flat() || [],
          bannerInstructions: route.legs[0]?.steps?.map(step => step.bannerInstructions).flat() || []
        },
        waypoints: data.waypoints
      }
    } catch (error) {
      console.error('Error getting directions:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Optimize route for multiple waypoints
   * @param {Array} waypoints - Array of { longitude, latitude } objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Optimized route data
   */
  async optimizeRoute(waypoints, options = {}) {
    try {
      if (waypoints.length < 2) {
        throw new Error('At least 2 waypoints are required')
      }

      const {
        profile = 'driving',
        roundtrip = false,
        source = 'first', // first, last, any
        destination = 'last', // first, last, any
        geometries = 'geojson',
        overview = 'full',
        steps = true
      } = options

      const coordinates = waypoints
        .map(wp => `${wp.longitude},${wp.latitude}`)
        .join(';')
      
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        geometries,
        overview,
        steps,
        roundtrip,
        source,
        destination
      })

      const url = `${DIRECTIONS_API_BASE}/${profile}/${coordinates}?${params}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Route optimization error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No optimized route found')
      }

      const route = data.routes[0]
      
      return {
        success: true,
        route: {
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
          legs: route.legs,
          waypoint_order: data.waypoints?.map(wp => wp.waypoint_index) || []
        },
        waypoints: data.waypoints
      }
    } catch (error) {
      console.error('Error optimizing route:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get estimated travel time between points
   * @param {Object} origin - { longitude, latitude }
   * @param {Object} destination - { longitude, latitude }
   * @param {string} profile - driving, walking, cycling
   * @returns {Promise<Object>} Travel time data
   */
  async getTravelTime(origin, destination, profile = 'driving') {
    try {
      const result = await this.getDirections(origin, destination, { 
        profile,
        overview: 'false',
        steps: false,
        voice_instructions: false,
        banner_instructions: false
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      return {
        success: true,
        duration: result.route.duration,
        distance: result.route.distance,
        durationText: this.formatDuration(result.route.duration),
        distanceText: this.formatDistance(result.route.distance)
      }
    } catch (error) {
      console.error('Error getting travel time:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Object} point1 - { latitude, longitude }
   * @param {Object} point2 - { latitude, longitude }
   * @returns {number} Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLon = this.toRadians(point2.longitude - point1.longitude)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  /**
   * Format duration in seconds to human readable format
   * @param {number} seconds 
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  /**
   * Format distance in meters to human readable format
   * @param {number} meters 
   * @returns {string} Formatted distance
   */
  formatDistance(meters) {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  /**
   * Get turn-by-turn navigation instructions
   * @param {Array} steps - Route steps from directions API
   * @returns {Array} Formatted navigation instructions
   */
  getNavigationInstructions(steps) {
    return steps.map((step, index) => ({
      id: index,
      instruction: step.maneuver?.instruction || '',
      distance: step.distance,
      duration: step.duration,
      type: step.maneuver?.type || '',
      modifier: step.maneuver?.modifier || '',
      location: step.maneuver?.location || null,
      voiceInstruction: step.voiceInstructions?.[0]?.announcement || '',
      bannerInstruction: step.bannerInstructions?.[0]?.primary?.text || ''
    }))
  }

  /**
   * Open external navigation app
   * @param {Object} destination - { latitude, longitude }
   * @param {string} app - 'google', 'apple', 'waze'
   */
  openExternalNavigation(destination, app = 'google') {
    const { latitude, longitude } = destination
    
    let url
    switch (app) {
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        break
      case 'apple':
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}`
        break
      case 'waze':
        url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
        break
      default:
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    }
    
    window.open(url, '_blank')
  }

  /**
   * Get nearby places using Mapbox Geocoding API
   * @param {Object} location - { longitude, latitude }
   * @param {string} category - poi category
   * @param {number} radius - search radius in meters
   * @returns {Promise<Object>} Nearby places
   */
  async getNearbyPlaces(location, category = 'poi', radius = 1000) {
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        proximity: `${location.longitude},${location.latitude}`,
        types: category,
        limit: 10,
        language: 'es'
      })

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${category}.json?${params}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        places: data.features.map(feature => ({
          id: feature.id,
          name: feature.text,
          address: feature.place_name,
          coordinates: {
            longitude: feature.center[0],
            latitude: feature.center[1]
          },
          category: feature.properties?.category || category,
          distance: this.calculateDistance(
            location,
            { latitude: feature.center[1], longitude: feature.center[0] }
          )
        }))
      }
    } catch (error) {
      console.error('Error getting nearby places:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const routingService = new RoutingService()
export default routingService