import React from 'react'
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react'

const PrivacyPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
          <p className="text-xl text-blue-100">
            Tu privacidad es importante para nosotros. Conoce cómo protegemos tu información.
          </p>
          <p className="text-sm text-blue-200 mt-4">Última actualización: 11 de marzo de 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600" />
              1. Información que Recopilamos
            </h2>
            <p className="text-gray-600 mb-4">
              En Verifireando recopilamos la siguiente información para brindarte nuestros servicios:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Datos personales</h3>
                <p className="text-gray-600 text-sm">Nombre completo, dirección de correo electrónico, número de teléfono y dirección física cuando solicitas un servicio.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Datos del vehículo</h3>
                <p className="text-gray-600 text-sm">Marca, modelo, año, placas, número de serie (VIN) y fotografías del vehículo registrado.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Datos de ubicación</h3>
                <p className="text-gray-600 text-sm">Ubicación GPS cuando solicitas un servicio a domicilio, utilizada exclusivamente para coordinar la visita del inspector.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Datos de pago</h3>
                <p className="text-gray-600 text-sm">Información de tarjetas procesada de forma segura a través de Stripe. No almacenamos números completos de tarjeta en nuestros servidores.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Datos de uso</h3>
                <p className="text-gray-600 text-sm">Información sobre cómo interactúas con nuestra plataforma, incluyendo páginas visitadas, funciones utilizadas y horarios de acceso.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              2. Uso de la Información
            </h2>
            <p className="text-gray-600 mb-4">Utilizamos tu información para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Procesar y gestionar tus solicitudes de verificación vehicular</li>
              <li>Coordinar la asignación de inspectores y el servicio a domicilio</li>
              <li>Procesar pagos y emitir comprobantes fiscales</li>
              <li>Enviarte notificaciones sobre el estado de tus servicios</li>
              <li>Mejorar la calidad de nuestros servicios y experiencia de usuario</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
              <li>Prevenir fraudes y proteger la seguridad de la plataforma</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              3. Protección de Datos
            </h2>
            <p className="text-gray-600 mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Cifrado</h3>
                <p className="text-gray-600 text-sm">Todas las comunicaciones están protegidas con cifrado SSL/TLS. Las contraseñas se almacenan con hash bcrypt.</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Pagos seguros</h3>
                <p className="text-gray-600 text-sm">Los pagos se procesan a través de Stripe, certificado PCI DSS Nivel 1, el estándar más alto de seguridad.</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Control de acceso</h3>
                <p className="text-gray-600 text-sm">Acceso restringido a datos personales solo al personal autorizado con autenticación de múltiples factores.</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Monitoreo</h3>
                <p className="text-gray-600 text-sm">Monitoreo continuo de seguridad y detección de accesos no autorizados a nuestros sistemas.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-600" />
              4. Compartir Información con Terceros
            </h2>
            <p className="text-gray-600 mb-4">
              No vendemos ni alquilamos tu información personal. Solo compartimos datos con:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Inspectores asignados:</strong> nombre, dirección y datos del vehículo necesarios para realizar el servicio</li>
              <li><strong>Procesadores de pago:</strong> Stripe para procesar transacciones de forma segura</li>
              <li><strong>Proveedores de servicios:</strong> hosting (AWS), notificaciones (Firebase) y análisis</li>
              <li><strong>Autoridades:</strong> cuando sea requerido por ley o para proteger derechos legales</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Tus Derechos (ARCO)</h2>
            <p className="text-gray-600 mb-4">
              De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), tienes derecho a:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Acceso</h3>
                <p className="text-blue-700 text-sm">Conocer qué datos personales tenemos sobre ti y cómo los utilizamos.</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Rectificación</h3>
                <p className="text-blue-700 text-sm">Solicitar la corrección de tus datos personales si son inexactos o están incompletos.</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Cancelación</h3>
                <p className="text-blue-700 text-sm">Solicitar la eliminación de tus datos cuando ya no sean necesarios.</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Oposición</h3>
                <p className="text-blue-700 text-sm">Oponerte al tratamiento de tus datos para fines específicos.</p>
              </div>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Para ejercer tus derechos ARCO, envía un correo a <a href="mailto:privacidad@verificandoando.com.mx" className="text-blue-600 hover:underline">privacidad@verificandoando.com.mx</a> con tu solicitud y una identificación oficial.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de Datos</h2>
            <p className="text-gray-600">
              Conservamos tus datos personales durante el tiempo necesario para cumplir con los fines para los que fueron recopilados, 
              incluyendo obligaciones legales, contables o de reporte. Los datos de verificaciones vehiculares se conservan por un mínimo 
              de 5 años conforme a la normatividad aplicable. Puedes solicitar la eliminación de tu cuenta en cualquier momento, 
              y procederemos a eliminar tus datos salvo aquellos que debamos conservar por obligación legal.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Menores de Edad</h2>
            <p className="text-gray-600">
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente 
              información de menores de edad. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos 
              de inmediato.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              8. Contacto
            </h2>
            <p className="text-gray-600 mb-4">
              Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos personales, contáctanos:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-1">
              <p><strong>Verifireando</strong></p>
              <p>Correo: <a href="mailto:privacidad@verificandoando.com.mx" className="text-blue-600 hover:underline">privacidad@verificandoando.com.mx</a></p>
              <p>Sitio web: <a href="https://www.verificandoando.com.mx/contact" className="text-blue-600 hover:underline">www.verificandoando.com.mx/contact</a></p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cambios a esta Política</h2>
            <p className="text-gray-600">
              Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. 
              Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico. 
              El uso continuado de nuestros servicios después de los cambios constituye tu aceptación de la política actualizada.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}

export default PrivacyPage
