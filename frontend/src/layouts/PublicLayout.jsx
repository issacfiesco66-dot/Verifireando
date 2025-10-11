import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-blue-600">
                Verifireando
              </a>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Inicio
              </a>
              <a href="/about" className="text-gray-700 hover:text-blue-600">
                Nosotros
              </a>
              <a href="/how-it-works" className="text-gray-700 hover:text-blue-600">
                Cómo funciona
              </a>
              <a href="/pricing" className="text-gray-700 hover:text-blue-600">
                Precios
              </a>
              <a href="/contact" className="text-gray-700 hover:text-blue-600">
                Contacto
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <a
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600"
              >
                Iniciar sesión
              </a>
              <a
                href="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Registrarse
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Verifireando</h3>
              <p className="text-gray-300">
                Tu plataforma confiable para verificaciones vehiculares a domicilio.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Verificación vehicular</li>
                <li>Inspección completa</li>
                <li>Prueba de emisiones</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/about" className="hover:text-white">Nosotros</a></li>
                <li><a href="/contact" className="hover:text-white">Contacto</a></li>
                <li><a href="/pricing" className="hover:text-white">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/help" className="hover:text-white">Ayuda</a></li>
                <li><a href="/terms" className="hover:text-white">Términos</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Verifireando. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout