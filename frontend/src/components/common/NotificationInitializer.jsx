import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

/**
 * Component to handle notification initialization
 * This component is rendered within the NotificationProvider context
 */
function NotificationInitializer() {
  const { user } = useAuth()
  const { requestPermission } = useNotification()

  // Request notification permission when user is available
  React.useEffect(() => {
    if (user) {
      requestPermission()
    }
  }, [user, requestPermission])

  // This component doesn't render anything
  return null
}

export default NotificationInitializer