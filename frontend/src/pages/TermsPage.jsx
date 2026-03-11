import React from 'react'
import { FileText, AlertTriangle, Scale, CreditCard, ShieldCheck, Ban } from 'lucide-react'

const TermsPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Términos y Condiciones</h1>
          <p className="text-xl text-blue-100">
            Condiciones de uso de la plataforma Verifireando.
          </p>
          <p className="text-sm text-blue-200 mt-4">Última actualización: 11 de marzo de 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-600">
              Al acceder y utilizar la plataforma Verifireando (en adelante, "la Plataforma"), aceptas estos Términos y Condiciones 
              en su totalidad. Si no estás de acuerdo con alguno de estos términos, te pedimos que no utilices nuestros servicios. 
              El uso continuado de la Plataforma después de cualquier modificación constituye la aceptación de los términos actualizados.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-600 mb-4">
              Verifireando es una plataforma digital que conecta a propietarios de vehículos con inspectores certificados 
              para realizar verificaciones vehiculares y servicios de mantenimiento a domicilio. Nuestros servicios incluyen:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Verificación vehicular de emisiones y seguridad</li>
              <li>Inspecciones pre-compra de vehículos usados</li>
              <li>Mantenimiento preventivo básico y completo</li>
              <li>Diagnósticos computarizados</li>
              <li>Emisión de certificados digitales de verificación</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              3. Registro y Cuentas de Usuario
            </h2>
            <p className="text-gray-600 mb-4">Para utilizar nuestros servicios debes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Ser mayor de 18 años</li>
              <li>Proporcionar información veraz, completa y actualizada</li>
              <li>Mantener la confidencialidad de tu contraseña y credenciales de acceso</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de tu cuenta</li>
              <li>Ser responsable de toda la actividad realizada bajo tu cuenta</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos, 
              proporcionen información falsa o realicen actividades fraudulentas.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600" />
              4. Obligaciones del Cliente
            </h2>
            <p className="text-gray-600 mb-4">Al solicitar un servicio, el cliente se compromete a:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Proporcionar información precisa sobre el vehículo a verificar</li>
              <li>Asegurar que el vehículo esté disponible y accesible en la dirección y horario acordados</li>
              <li>Entregar las llaves del vehículo al inspector cuando sea necesario</li>
              <li>Garantizar que el vehículo cuenta con la documentación en regla (tarjeta de circulación, seguro vigente)</li>
              <li>Realizar el pago completo del servicio en los términos acordados</li>
              <li>Tratar con respeto al inspector asignado</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Obligaciones del Inspector (Chofer)</h2>
            <p className="text-gray-600 mb-4">Los inspectores registrados en la plataforma se comprometen a:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Contar con las certificaciones y licencias vigentes requeridas</li>
              <li>Realizar las verificaciones conforme a los estándares establecidos</li>
              <li>Llegar puntualmente a la ubicación del cliente</li>
              <li>Tratar con respeto y profesionalismo a los clientes</li>
              <li>Mantener la confidencialidad de la información del cliente y su vehículo</li>
              <li>No solicitar pagos fuera de la plataforma</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              6. Pagos y Precios
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Los precios de los servicios se muestran en pesos mexicanos (MXN) e incluyen IVA. 
                Los precios pueden variar según el tipo de servicio, vehículo y ubicación.
              </p>
              <p>
                Aceptamos pagos con tarjeta de crédito/débito (procesados por Stripe), transferencia bancaria y efectivo. 
                El pago se realiza al momento de confirmar la cita o al finalizar el servicio, según el método seleccionado.
              </p>
              <p>
                <strong>Política de reembolso:</strong> Si el servicio no se puede completar por causas atribuibles a Verifireando 
                o al inspector, se realizará un reembolso completo. Si el cliente cancela con menos de 2 horas de anticipación, 
                se podrá aplicar un cargo por cancelación del 20% del costo del servicio.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="w-6 h-6 text-blue-600" />
              7. Cancelaciones
            </h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>Por el cliente:</strong> Puedes cancelar una cita sin cargo con al menos 2 horas de anticipación a la hora programada.</p>
              <p><strong>Por Verifireando:</strong> Nos reservamos el derecho de cancelar un servicio si no hay inspectores disponibles, por condiciones climáticas adversas, o por razones de seguridad. En estos casos, se te notificará y se ofrecerá reprogramar sin costo.</p>
              <p><strong>No-show:</strong> Si el cliente no está disponible al momento de la visita del inspector, se considerará como cancelación tardía y podrá generar un cargo.</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
              8. Limitación de Responsabilidad
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Verifireando actúa como intermediario entre clientes e inspectores. Si bien verificamos las credenciales 
                de nuestros inspectores, no somos responsables de:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Resultados de la verificación vehicular (aprobado/rechazado)</li>
                <li>Daños preexistentes en el vehículo no reportados por el cliente</li>
                <li>Retrasos causados por condiciones de tráfico o climáticas</li>
                <li>Pérdidas indirectas o consecuentes derivadas del uso de la plataforma</li>
              </ul>
              <p>
                Nuestra responsabilidad máxima se limita al monto pagado por el servicio en cuestión.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Propiedad Intelectual</h2>
            <p className="text-gray-600">
              Todos los contenidos de la Plataforma, incluyendo textos, gráficos, logotipos, íconos, imágenes, software 
              y código fuente, son propiedad de Verifireando o de sus licenciantes y están protegidos por las leyes de 
              propiedad intelectual aplicables. Queda prohibida la reproducción, distribución o modificación de cualquier 
              contenido sin autorización expresa por escrito.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Uso Prohibido</h2>
            <p className="text-gray-600 mb-4">Queda estrictamente prohibido:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Utilizar la plataforma para fines ilegales o no autorizados</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Interferir con el funcionamiento de la plataforma o sus servidores</li>
              <li>Publicar información falsa o engañosa</li>
              <li>Utilizar robots, scrapers u otros medios automatizados para extraer datos</li>
              <li>Suplantar la identidad de otra persona o entidad</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Resolución de Disputas</h2>
            <p className="text-gray-600">
              Cualquier controversia derivada de estos Términos se resolverá preferentemente mediante negociación directa. 
              En caso de no llegar a un acuerdo, las partes se someterán a la jurisdicción de los tribunales competentes 
              de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de domicilio 
              presente o futuro.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Ley Aplicable</h2>
            <p className="text-gray-600">
              Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos, 
              incluyendo la Ley Federal de Protección al Consumidor y la Ley Federal de Protección de Datos 
              Personales en Posesión de los Particulares.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contacto</h2>
            <p className="text-gray-600">
              Para cualquier duda sobre estos Términos y Condiciones, contáctanos en{' '}
              <a href="mailto:legal@verificandoando.com.mx" className="text-blue-600 hover:underline">legal@verificandoando.com.mx</a> o 
              visita nuestra página de <a href="/contact" className="text-blue-600 hover:underline">contacto</a>.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}

export default TermsPage
