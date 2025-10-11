import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Car, 
  Truck, 
  Bike,
  CheckCircle, 
  Clock, 
  MapPin, 
  Award,
  FileText,
  Camera,
  Wrench,
  AlertTriangle,
  Star,
  ArrowRight,
  Phone,
  Calendar
} from 'lucide-react'

const ServicesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const services = [
    {
      id: 'verification-auto',
      category: 'verification',
      title: 'Verificación Vehicular - Auto',
      description: 'Verificación completa para automóviles particulares según normativas oficiales.',
      price: 450,
      duration: '45-60 min',
      icon: Car,
      features: [
        'Medición de emisiones contaminantes',
        'Inspección visual completa',
        'Verificación de sistemas de seguridad',
        'Certificado digital inmediato',
        'Válido por 6 meses o 1 año'
      ],
      requirements: [
        'Tarjeta de circulación vigente',
        'Licencia de conducir',
        'Póliza de seguro vigente'
      ],
      popular: true
    },
    {
      id: 'verification-motorcycle',
      category: 'verification',
      title: 'Verificación Vehicular - Motocicleta',
      description: 'Verificación especializada para motocicletas y vehículos de dos ruedas.',
      price: 350,
      duration: '30-45 min',
      icon: Bike,
      features: [
        'Medición de emisiones específica',
        'Inspección de sistemas de frenos',
        'Verificación de luces y señales',
        'Certificado digital',
        'Proceso adaptado a motocicletas'
      ],
      requirements: [
        'Tarjeta de circulación vigente',
        'Licencia de motociclista',
        'Seguro vigente'
      ]
    },
    {
      id: 'verification-truck',
      category: 'verification',
      title: 'Verificación Vehicular - Camión',
      description: 'Verificación para vehículos de carga y transporte comercial.',
      price: 650,
      duration: '60-90 min',
      icon: Truck,
      features: [
        'Medición de emisiones diesel/gasolina',
        'Inspección de sistemas de carga',
        'Verificación de frenos neumáticos',
        'Certificado para uso comercial',
        'Cumplimiento normativas comerciales'
      ],
      requirements: [
        'Tarjeta de circulación comercial',
        'Licencia tipo B o superior',
        'Póliza de carga'
      ]
    },
    {
      id: 'maintenance-basic',
      category: 'maintenance',
      title: 'Mantenimiento Básico',
      description: 'Revisión preventiva básica para mantener tu vehículo en óptimas condiciones.',
      price: 300,
      duration: '30-45 min',
      icon: Wrench,
      features: [
        'Revisión de niveles de fluidos',
        'Inspección de luces y señales',
        'Verificación de llantas',
        'Reporte de estado general',
        'Recomendaciones preventivas'
      ],
      requirements: [
        'Vehículo en funcionamiento',
        'Acceso al motor'
      ]
    },
    {
      id: 'maintenance-complete',
      category: 'maintenance',
      title: 'Mantenimiento Completo',
      description: 'Revisión integral de todos los sistemas del vehículo.',
      price: 550,
      duration: '60-90 min',
      icon: Shield,
      features: [
        'Diagnóstico computarizado',
        'Revisión de frenos completa',
        'Inspección de suspensión',
        'Verificación eléctrica',
        'Reporte detallado con fotos',
        'Plan de mantenimiento personalizado'
      ],
      requirements: [
        'Vehículo en funcionamiento',
        'Acceso completo al vehículo'
      ]
    },
    {
      id: 'inspection-purchase',
      category: 'inspection',
      title: 'Inspección Pre-Compra',
      description: 'Evaluación completa antes de comprar un vehículo usado.',
      price: 750,
      duration: '90-120 min',
      icon: FileText,
      features: [
        'Inspección mecánica completa',
        'Verificación de documentos',
        'Historial de accidentes',
        'Evaluación de valor comercial',
        'Reporte fotográfico detallado',
        'Recomendación de compra'
      ],
      requirements: [
        'Presencia del vendedor',
        'Documentos del vehículo',
        'Acceso completo para inspección'
      ]
    }
  ]

  const categories = [
    { id: 'all', name: 'Todos los Servicios', icon: Shield },
    { id: 'verification', name: 'Verificación Vehicular', icon: CheckCircle },
    { id: 'maintenance', name: 'Mantenimiento', icon: Wrench },
    { id: 'inspection', name: 'Inspecciones', icon: FileText }
  ]

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  const benefits = [
    {
      icon: MapPin,
      title: 'Servicio a Domicilio',
      description: 'Vamos hasta tu ubicación, sin filas ni esperas'
    },
    {
      icon: Clock,
      title: 'Horarios Flexibles',
      description: 'Agenda en el horario que mejor te convenga'
    },
    {
      icon: Award,
      title: 'Inspectores Certificados',
      description: 'Personal calificado y con experiencia comprobada'
    },
    {
      icon: FileText,
      title: 'Certificados Digitales',
      description: 'Acceso inmediato y permanente a tus documentos'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Nuestros Servicios
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Verificación vehicular y mantenimiento profesional a domicilio
            </p>
            <Link
              to="/auth/register"
              className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
            >
              Agendar Servicio
              <Calendar className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Servicios Disponibles
            </h2>
            <p className="text-xl text-gray-600">
              Selecciona el servicio que necesitas
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-6 py-3 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-5 h-5 mr-2" />
                {category.name}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative">
                {service.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 inline mr-1" />
                    Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <service.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {service.title}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Incluye:</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Requisitos:</h4>
                    <ul className="space-y-2">
                      {service.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <FileText className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          ${service.price}
                        </span>
                        <span className="text-gray-500 ml-1">MXN</span>
                      </div>
                    </div>
                    
                    <Link
                      to="/auth/register"
                      className="btn btn-primary w-full"
                    >
                      Agendar Servicio
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proceso Simple y Rápido
            </h2>
            <p className="text-xl text-gray-600">
              En solo 4 pasos tienes tu servicio completo
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Agenda Online
              </h3>
              <p className="text-gray-600">
                Selecciona tu servicio y horario preferido
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmación
              </h3>
              <p className="text-gray-600">
                Recibe confirmación y detalles del inspector
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Servicio a Domicilio
              </h3>
              <p className="text-gray-600">
                Inspector llega puntual a tu ubicación
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Certificado Digital
              </h3>
              <p className="text-gray-600">
                Recibe tu certificado inmediatamente
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/how-it-works"
              className="btn btn-outline btn-lg px-8 py-4"
            >
              Ver Proceso Completo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
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
                Resolvemos tus dudas sobre nuestros servicios
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué incluye el precio del servicio?
                </h3>
                <p className="text-gray-600">
                  El precio incluye el traslado del inspector, la inspección completa, 
                  el certificado digital y todos los trámites necesarios. No hay costos ocultos.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Puedo agendar para el mismo día?
                </h3>
                <p className="text-gray-600">
                  Sí, ofrecemos servicios de emergencia el mismo día sujeto a disponibilidad. 
                  Te recomendamos agendar con al menos 24 horas de anticipación.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué formas de pago aceptan?
                </h3>
                <p className="text-gray-600">
                  Aceptamos tarjetas de crédito, débito, transferencias bancarias y pagos en efectivo. 
                  El pago se puede realizar antes o después del servicio.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué pasa si mi vehículo no pasa la verificación?
                </h3>
                <p className="text-gray-600">
                  Te proporcionamos un reporte detallado con las observaciones. 
                  Puedes corregir los problemas y reagendar sin costo adicional dentro de 30 días.
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
            ¿Necesitas Ayuda para Elegir?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Nuestro equipo está listo para ayudarte a seleccionar el servicio ideal para tu vehículo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
            >
              <Phone className="mr-2 w-5 h-5" />
              Contactar Asesor
            </Link>
            <Link
              to="/auth/register"
              className="btn btn-outline btn-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600"
            >
              Agendar Ahora
              <Calendar className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServicesPage