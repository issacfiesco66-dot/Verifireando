import React from 'react'
import { cn } from '../../utils/cn'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className,
  text,
  fullScreen = false 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    white: 'border-white',
    success: 'border-success-600',
    warning: 'border-warning-600',
    error: 'border-error-600',
  }

  const spinner = (
    <div className={cn(
      'animate-spin rounded-full border-2 border-gray-300',
      sizeClasses[size],
      colorClasses[color],
      'border-t-transparent',
      className
    )} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="text-center">
          {spinner}
          {text && (
            <p className="mt-4 text-gray-600 font-medium">{text}</p>
          )}
        </div>
      </div>
    )
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        {spinner}
        <p className="text-gray-600 font-medium text-sm">{text}</p>
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner