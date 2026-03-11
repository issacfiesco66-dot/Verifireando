import React from 'react'
import { Cookie, Settings, BarChart3, Shield, ToggleLeft } from 'lucide-react'

const CookiesPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Cookie className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Política de Cookies</h1>
          <p className="text-xl text-blue-100">
            Información sobre cómo utilizamos cookies y tecnologías similares.
          </p>
          <p className="text-sm text-blue-200 mt-4">Última actualización: 11 de marzo de 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ¿Qué son las Cookies?</h2>
            <p className="text-gray-600">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (computadora, tablet o teléfono móvil) 
              cuando visitas un sitio web. Las cookies permiten que el sitio recuerde tus acciones y preferencias durante un periodo 
              de tiempo, para que no tengas que volver a configurarlos cada vez que visites el sitio o navegues entre sus páginas.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              2. Tipos de Cookies que Utilizamos
            </h2>

            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-800 text-lg">Cookies Esenciales</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Son necesarias para el funcionamiento básico de la plataforma. Incluyen cookies de autenticación 
                  (para mantener tu sesión iniciada), seguridad y preferencias básicas. Sin estas cookies, 
                  la plataforma no puede funcionar correctamente.
                </p>
                <p className="text-xs text-gray-500 mt-2">Duración: Sesión / hasta 30 días</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-800 text-lg">Cookies de Funcionalidad</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Permiten recordar tus preferencias como idioma, tema (claro/oscuro) y configuraciones de notificaciones. 
                  Mejoran tu experiencia al personalizar la plataforma según tus preferencias.
                </p>
                <p className="text-xs text-gray-500 mt-2">Duración: hasta 1 año</p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-800 text-lg">Cookies de Rendimiento y Análisis</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Nos ayudan a entender cómo los usuarios interactúan con la plataforma, qué páginas visitan con mayor frecuencia 
                  y si experimentan errores. Toda la información es anónima y se utiliza únicamente para mejorar el funcionamiento 
                  de la plataforma.
                </p>
                <p className="text-xs text-gray-500 mt-2">Duración: hasta 2 años</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-800 text-lg">Cookies de Terceros</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Algunas cookies son establecidas por servicios de terceros que aparecen en nuestras páginas:
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
                  <li><strong>Firebase:</strong> Para autenticación con Google y notificaciones push</li>
                  <li><strong>Stripe:</strong> Para el procesamiento seguro de pagos con tarjeta</li>
                  <li><strong>Mapbox:</strong> Para la visualización de mapas y ubicaciones</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">Duración: varía según el proveedor</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              3. Almacenamiento Local (Local Storage)
            </h2>
            <p className="text-gray-600 mb-4">
              Además de cookies, utilizamos el almacenamiento local del navegador (Local Storage) para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Token de autenticación (JWT):</strong> Para mantener tu sesión activa de forma segura</li>
              <li><strong>Preferencias de usuario:</strong> Configuraciones de la aplicación como tema y notificaciones</li>
              <li><strong>Cache de datos:</strong> Para mejorar el rendimiento y reducir tiempos de carga</li>
              <li><strong>Service Worker:</strong> Para el funcionamiento offline de la aplicación (PWA)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ToggleLeft className="w-6 h-6 text-blue-600" />
              4. Gestión de Cookies
            </h2>
            <p className="text-gray-600 mb-4">
              Puedes controlar y gestionar las cookies de varias formas:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Configuración del navegador</h3>
                <p className="text-gray-600 text-sm">
                  La mayoría de los navegadores te permiten ver, administrar, bloquear y eliminar cookies. 
                  Ten en cuenta que si bloqueas todas las cookies, algunas funciones de la plataforma podrían no funcionar correctamente.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Eliminar datos del sitio</h3>
                <p className="text-gray-600 text-sm">
                  Puedes eliminar los datos almacenados localmente desde las herramientas de desarrollo de tu navegador 
                  (generalmente en Configuración &gt; Privacidad &gt; Borrar datos de navegación).
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Desinstalar la PWA</h3>
                <p className="text-gray-600 text-sm">
                  Si instalaste Verifireando como aplicación web progresiva (PWA), puedes desinstalarla desde 
                  la configuración de tu dispositivo para eliminar todos los datos almacenados localmente.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              5. Base Legal
            </h2>
            <p className="text-gray-600">
              El uso de cookies esenciales se basa en nuestro interés legítimo de proporcionar un servicio funcional y seguro. 
              Para las cookies de análisis y terceros, nos basamos en tu consentimiento, el cual puedes retirar en cualquier momento 
              ajustando la configuración de tu navegador. Esta política cumple con la Ley Federal de Protección de Datos Personales 
              en Posesión de los Particulares (LFPDPPP) de México.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cambios a esta Política</h2>
            <p className="text-gray-600">
              Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en nuestras prácticas o 
              por razones operativas, legales o regulatorias. Te recomendamos revisar esta página regularmente.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contacto</h2>
            <p className="text-gray-600">
              Si tienes preguntas sobre nuestra Política de Cookies, contáctanos en{' '}
              <a href="mailto:privacidad@verificandoando.com.mx" className="text-blue-600 hover:underline">privacidad@verificandoando.com.mx</a> o 
              visita nuestra página de <a href="/contact" className="text-blue-600 hover:underline">contacto</a>.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}

export default CookiesPage
