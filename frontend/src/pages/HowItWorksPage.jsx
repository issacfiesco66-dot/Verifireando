import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  MapPin, 
  Shield, 
  FileText, 
  Clock, 
  User,
  Car,
  CheckCircle,
  ArrowRight,
  Smartphone,
  CreditCard,
  Bell,
  Star,
  Award,
  Camera
} from 'lucide-react'

const HowItWorksPage = () => {
  const steps = [
    {
      number: 1,
      title: 'Regístrate y Agenda',
      description: 'Crea tu cuenta, selecciona el servicio que necesitas y agenda tu cita en el horario que mejor te convenga.',
      icon: Calendar,
      details: [
        'Registro rápido en menos de 2 minutos',
        'Selección de fecha y hora disponible',
        'Confirmación inmediata por email y SMS',
        'Recordatorios automáticos'
      ]
    },
    {
      number: 2,
      title: 'Inspector a tu Ubicación',
      description: 'Nuestro inspector certificado llega puntualmente a tu domicilio con todo el equipo necesario.',
      icon: MapPin,
      details: [
        'Inspector certificado y uniformado',
        'Equipo profesional de verificación',
        'Llegada puntual en el horario acordado',
        'Identificación y credenciales verificables'
      ]
    },
    {
      number: 3,
      title: 'Inspección Profesional',
      description: 'Realizamos una inspección completa de tu vehículo siguiendo los estándares oficiales más estrictos.',
      icon: Shield,
      details: [
        'Verificación de emisiones contaminantes',
        'Inspección visual completa',
        'Revisión de sistemas de seguridad',
        'Documentación fotográfica del proceso'
      ]
    },
    {
      number: 4,
      title: 'Certificado Digital',
      description: 'Recibe tu certificado de verificación digital inmediatamente y accede a él desde cualquier dispositivo.',
      icon: FileText,
      details: [
        'Certificado digital oficial',
        'Acceso inmediato desde tu cuenta',
        'Válido ante todas las autoridades',
        'Respaldo en la nube permanente'
      ]
    }
  ]

  const features = [
    {
      icon: Clock,
      title: 'Ahorra Tiempo',
      description: 'No pierdas horas en filas. Nosotros vamos a ti.'
    },
    {
      icon: Shield,
      title: 'Servicio Confiable',
      description: 'Inspectores certificados y procesos estandarizados.'
    },
    {
      icon: Smartphone,
      title: 'Tecnología Avanzada',
      description: 'Plataforma digital moderna y fácil de usar.'
    },
    {
      icon: Star,
      title: 'Calidad Garantizada',
      description: 'Más del 98% de satisfacción de nuestros clientes.'
    }
  ]

  const timeline = [
    {
      time: '5 min',
      action: 'Registro y selección de servicio'
    },
    {
      time: '2 min',
      action: 'Agendamiento de cita'
    },
    {
      time: '24-48h',
      action: 'Confirmación y preparación'
    },
    {
      time: '45-60 min',
      action: 'Inspección en tu domicilio'
    },
    {
      time: 'Inmediato',
      action: 'Certificado digital disponible'
    }
  ]

  const requirements = [
    {
      icon: FileText,
      title: 'Documentos Necesarios',
      items: [
        'Tarjeta de circulación vigente',
        'Licencia de conducir válida',
        'Póliza de seguro vigente',
        'Identificación oficial'
      ]
    },
    {
      icon: Car,
      title: 'Condiciones del Vehículo',
      items: [
        'Motor en funcionamiento',
        'Tanque con al menos 1/4 de combustible',
        'Luces y sistemas eléctricos operando',
        'Acceso libre al vehículo'
      ]
    },
    {
      icon: MapPin,
      title: 'Ubicación',
      items: [
        'Espacio adecuado para la inspección',
        'Acceso vehicular disponible',
        'Dirección exacta y referencias',
        'Persona responsable presente'
      ]
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              ¿Cómo Funciona?
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Verificación vehicular profesional en 4 simples pasos
            </p>
            <Link
              to="/auth/register"
              className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center mb-20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2 mb-8 lg:mb-0">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-2xl font-bold text-primary-600">{step.number}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h2>
                    <p className="text-xl text-gray-600 mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className={`lg:w-1/2 ${index % 2 === 1 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                  <div className="bg-gray-100 rounded-2xl p-12 text-center">
                    <step.icon className="w-24 h-24 text-primary-600 mx-auto mb-4" />
                    <div className="text-gray-500">Paso {step.number}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Línea de Tiempo del Proceso
            </h2>
            <p className="text-xl text-gray-600">
              Desde el registro hasta el certificado en tu mano
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary-200"></div>
              
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="text-2xl font-bold text-primary-600 mb-2">
                        {item.time}
                      </div>
                      <div className="text-gray-700">
                        {item.action}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué Elegir Nuestro Servicio?
            </h2>
            <p className="text-xl text-gray-600">
              Ventajas que nos hacen únicos en el mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Requisitos para el Servicio
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas tener listo para tu cita
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {requirements.map((req, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <req.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {req.title}
                  </h3>
                </div>
                
                <ul className="space-y-3">
                  {req.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-xl text-gray-600">
                Resolvemos tus dudas sobre el proceso
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué pasa si mi vehículo no pasa la verificación?
                </h3>
                <p className="text-gray-600">
                  Te proporcionamos un reporte detallado con las observaciones y recomendaciones. 
                  Puedes corregir los problemas y reagendar sin costo adicional dentro de 30 días.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Puedo cancelar o reprogramar mi cita?
                </h3>
                <p className="text-gray-600">
                  Sí, puedes cancelar o reprogramar tu cita hasta 2 horas antes del horario acordado 
                  sin ningún costo adicional a través de nuestra plataforma.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿El certificado digital tiene la misma validez que el físico?
                </h3>
                <p className="text-gray-600">
                  Sí, nuestro certificado digital tiene plena validez oficial y es aceptado por todas las autoridades. 
                  Además, siempre está disponible en tu cuenta para descarga.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué medidas de seguridad tienen sus inspectores?
                </h3>
                <p className="text-gray-600">
                  Todos nuestros inspectores están certificados, uniformados, portan identificación oficial 
                  y siguen estrictos protocolos de seguridad. Puedes verificar su identidad antes del servicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Agenda tu verificación vehicular ahora y experimenta la comodidad de nuestro servicio a domicilio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
            >
              Crear Cuenta
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="btn btn-outline btn-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600"
            >
              Ver Precios
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowItWorksPage