// Force clear all Service Worker caches
export async function clearAllCaches() {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
        console.log('Service Worker unregistered')
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
        console.log('All caches cleared')
      }

      return true
    } catch (error) {
      console.error('Error clearing caches:', error)
      return false
    }
  }
  return false
}

// Auto-clear cache on load if version mismatch detected
export function checkAndClearCache() {
  const CACHE_VERSION = 'v2.2.0-driver-registration-fix';
  const storedVersion = localStorage.getItem('app-version')
  
  if (storedVersion !== CACHE_VERSION) {
    console.log('Version mismatch detected, clearing caches...')
    clearAllCaches().then(() => {
      localStorage.setItem('app-version', CACHE_VERSION)
      // Force reload to get fresh content
      window.location.reload(true)
    })
  }
}
