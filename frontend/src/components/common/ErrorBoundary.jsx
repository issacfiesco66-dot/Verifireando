import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Here you could send error to logging service
    // logErrorToService(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Oops! Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-8">
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o contactar al soporte si el problema persiste.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full btn btn-primary btn-md flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar página</span>
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full btn btn-secondary btn-md"
              >
                Intentar de nuevo
              </button>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles del error (desarrollo)
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary