import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Check, 
  X, 
  Star, 
  Shield, 
  Clock, 
  MapPin,
  Car,
  Wrench,
  FileText,
  Award,
  ArrowRight
} from 'lucide-react'

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('single') // 'single' or 'package'

  const services = [
    {
      name: 'Verificación Básica',
      icon: Shield,
      price: 500,
      packagePrice: 450,
      description: 'Verificación estándar para cumplir con los requisitos legales',
      features: [
        'Inspección visual completa',
        'Verificación de emisiones',
        'Certificado digital',
        'Reporte básico',
        'Servicio a domicilio',
        'Garantía de 30 días'
      ],
      notIncluded: [
        'Inspección mecánica detallada',
        'Reporte fotográfico',
        'Seguimiento post-servicio'
      ],
      popular: false,
      color: 'gray'
    },
    {
      name: 'Inspección Completa',
      icon: Car,
      price: 800,
      packagePrice: 720,
      description: 'Inspección integral del vehículo con reporte detallado',
      features: [
        'Todo lo de Verificación Básica',
        'Inspección mecánica completa',
        'Revisión de sistemas eléctricos',
        'Evaluación de frenos y suspensión',
        'Reporte fotográfico detallado',
        'Recomendaciones de mantenimiento',
        'Garantía de 60 días',
        'Seguimiento post-servicio'
      ],
      notIncluded: [
        'Reparaciones incluidas',
        'Piezas de repuesto'
      ],
      popular: true,
      color: 'primary'
    },
    {
      name: 'Mantenimiento Premium',
      icon: Wrench,
      price: 1200,
      packagePrice: 1080,
      description: 'Servicio completo con mantenimiento básico incluido',
      features: [
        'Todo lo de Inspección Completa',
        'Cambio de aceite y filtros',
        'Revisión y ajuste de frenos',
        'Alineación básica',
        'Limpieza de inyectores',
        'Certificado premium',
        'Garantía de 90 días',
        'Soporte técnico 24/7',
        'Recordatorios de mantenimiento'
      ],
      notIncluded: [],
      popular: false,
      color: 'secondary'
    }
  ]

  const packages = [
    {
      name: 'Paquete Familiar',
      description: 'Para familias con múltiples vehículos',
      vehicles: '2-3 vehículos',
      discount: '10%',
      features: [
        'Descuento del 10% en todos los servicios',
        'Programación coordinada',
        'Un solo pago',
        'Reporte familiar consolidado'
      ]
    },
    {
      name: 'Paquete Empresarial',
      description: 'Para empresas con flotillas',
      vehicles: '5+ vehículos',
      discount: '20%',
      features: [
        'Descuento del 20% en todos los servicios',
        'Gestión centralizada',
        'Facturación empresarial',
        'Reportes ejecutivos',
        'Soporte dedicado'
      ]
    }
  ]

  const addOns = [
    {
      name: 'Servicio Express',
      price: 100,
      description: 'Servicio en menos de 2 horas'
    },
    {
      name: 'Fin de Semana',
      price: 150,
      description: 'Servicio en sábados y domingos'
    },
    {
      name: 'Reporte Extendido',
      price: 200,
      description: 'Reporte técnico detallado con recomendaciones'
    },
    {
      name: 'Certificado Físico',
      price: 50,
      description: 'Certificado impreso entregado a domicilio'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Precios Transparentes
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Servicios profesionales de verificación vehicular con precios justos y sin sorpresas
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex bg-primary-700 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('single')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'single'
                    ? 'bg-white text-primary-600'
                    : 'text-primary-100 hover:text-white'
                }`}
              >
                Servicio Individual
              </button>
              <button
                onClick={() => setBillingCycle('package')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'package'
                    ? 'bg-white text-primary-600'
                    : 'text-primary-100 hover:text-white'
                }`}
              >
                Paquetes (Ahorra 10%)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                  service.popular ? 'ring-2 ring-primary-500 scale-105' : ''
                }`}
              >
                {service.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white text-center py-2 text-sm font-medium">
                    Más Popular
                  </div>
                )}
                
                <div className={`p-8 ${service.popular ? 'pt-12' : ''}`}>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 bg-${service.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <service.icon className={`w-8 h-8 text-${service.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        ${billingCycle === 'single' ? service.price : service.packagePrice}
                      </span>
                      <span className="text-gray-500 ml-2">MXN</span>
                      {billingCycle === 'package' && (
                        <div className="text-sm text-green-600 font-medium">
                          Ahorras ${service.price - service.packagePrice} MXN
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {service.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start opacity-50">
                        <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/auth/register"
                    className={`w-full btn ${
                      service.popular 
                        ? 'btn-primary' 
                        : 'btn-outline border-gray-300 text-gray-700 hover:bg-gray-50'
                    } btn-lg`}
                  >
                    Agendar Servicio
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Deals */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Paquetes Especiales
            </h2>
            <p className="text-xl text-gray-600">
              Descuentos adicionales para múltiples vehículos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {packages.map((pkg, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {pkg.description}
                  </p>
                  <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4 mr-1" />
                    {pkg.discount} de descuento
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-center text-gray-600 mb-4">
                    Para {pkg.vehicles}
                  </div>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/contact"
                  className="w-full btn btn-outline btn-lg"
                >
                  Solicitar Cotización
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Servicios Adicionales
            </h2>
            <p className="text-xl text-gray-600">
              Personaliza tu experiencia con estos servicios extra
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {addon.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {addon.description}
                </p>
                <div className="text-2xl font-bold text-primary-600">
                  +${addon.price}
                </div>
                <div className="text-sm text-gray-500">MXN</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Preguntas sobre Precios
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Los precios incluyen IVA?
                </h3>
                <p className="text-gray-600">
                  Sí, todos nuestros precios ya incluyen el IVA (16%). No hay costos ocultos.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué métodos de pago aceptan?
                </h3>
                <p className="text-gray-600">
                  Aceptamos tarjetas de crédito, débito, transferencias bancarias y pagos en efectivo al momento del servicio.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Hay costo adicional por el servicio a domicilio?
                </h3>
                <p className="text-gray-600">
                  No, el servicio a domicilio está incluido en todos nuestros precios dentro de la zona metropolitana.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Ofrecen garantía en sus servicios?
                </h3>
                <p className="text-gray-600">
                  Sí, todos nuestros servicios incluyen garantía. La duración varía según el tipo de servicio contratado.
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
            ¿Listo para agendar tu servicio?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Obtén tu verificación vehicular con el mejor servicio y precios justos.
          </p>
          <Link
            to="/auth/register"
            className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
          >
            Comenzar Ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default PricingPage