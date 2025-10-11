import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Clock, 
  MapPin, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Car,
  Users,
  Award,
  Smartphone
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verificación Confiable',
      description: 'Inspectores certificados y procesos estandarizados para garantizar la calidad.'
    },
    {
      icon: Clock,
      title: 'Servicio Rápido',
      description: 'Agenda tu cita y recibe el servicio en el horario que mejor te convenga.'
    },
    {
      icon: MapPin,
      title: 'A Domicilio',
      description: 'Nuestros inspectores van hasta tu ubicación, sin necesidad de trasladarte.'
    },
    {
      icon: Smartphone,
      title: 'Fácil de Usar',
      description: 'Plataforma intuitiva para agendar, seguir y pagar tus servicios.'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Vehículos Verificados' },
    { number: '500+', label: 'Clientes Satisfechos' },
    { number: '50+', label: 'Inspectores Certificados' },
    { number: '4.9', label: 'Calificación Promedio' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Verificación Vehicular
              <span className="block text-primary-200">a Domicilio</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Servicio profesional de verificación e inspección vehicular en la comodidad de tu hogar u oficina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register"
                className="btn btn-white btn-lg px-8 py-4 text-primary-600 hover:text-primary-700"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/how-it-works"
                className="btn btn-outline btn-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600"
              >
                ¿Cómo Funciona?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Verifireando?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos el mejor servicio de verificación vehicular con tecnología de punta y profesionales certificados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
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

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-200 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proceso Simple en 3 Pasos
            </h2>
            <p className="text-xl text-gray-600">
              Obtén tu verificación vehicular de manera rápida y sencilla
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Agenda tu Cita
              </h3>
              <p className="text-gray-600">
                Selecciona fecha, hora y ubicación que mejor te convenga a través de nuestra plataforma.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Inspector a Domicilio
              </h3>
              <p className="text-gray-600">
                Nuestro inspector certificado llega a tu ubicación con todo el equipo necesario.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Recibe tu Certificado
              </h3>
              <p className="text-gray-600">
                Obtén tu certificado de verificación digital inmediatamente después de la inspección.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para verificar tu vehículo?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya confían en nuestro servicio profesional de verificación vehicular.
          </p>
          <Link
            to="/auth/register"
            className="btn btn-primary btn-lg px-8 py-4"
          >
            Crear Cuenta Gratis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage