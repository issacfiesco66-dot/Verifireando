import React from 'react'
import { 
  Shield, 
  Users, 
  Award, 
  Clock, 
  MapPin, 
  Star,
  CheckCircle,
  Target,
  Eye,
  Heart
} from 'lucide-react'

const AboutPage = () => {
  const values = [
    {
      icon: Shield,
      title: 'Confiabilidad',
      description: 'Garantizamos servicios de la más alta calidad con inspectores certificados y procesos estandarizados.'
    },
    {
      icon: Clock,
      title: 'Puntualidad',
      description: 'Respetamos tu tiempo. Nuestros inspectores llegan puntualmente a la hora acordada.'
    },
    {
      icon: Heart,
      title: 'Compromiso',
      description: 'Estamos comprometidos con la satisfacción del cliente y la excelencia en el servicio.'
    },
    {
      icon: CheckCircle,
      title: 'Transparencia',
      description: 'Procesos claros, precios justos y comunicación honesta en cada paso del servicio.'
    }
  ]

  const team = [
    {
      name: 'Carlos Rodríguez',
      position: 'Director General',
      image: '/api/placeholder/150/150',
      description: 'Más de 15 años de experiencia en la industria automotriz y verificación vehicular.'
    },
    {
      name: 'María González',
      position: 'Directora de Operaciones',
      image: '/api/placeholder/150/150',
      description: 'Especialista en logística y gestión de servicios a domicilio con certificación internacional.'
    },
    {
      name: 'Luis Martínez',
      position: 'Jefe de Inspectores',
      image: '/api/placeholder/150/150',
      description: 'Ingeniero mecánico con certificaciones en sistemas de verificación vehicular.'
    }
  ]

  const stats = [
    { number: '2018', label: 'Año de Fundación' },
    { number: '10,000+', label: 'Vehículos Verificados' },
    { number: '50+', label: 'Inspectores Certificados' },
    { number: '98%', label: 'Satisfacción del Cliente' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Sobre Nosotros
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Líderes en servicios de verificación vehicular a domicilio en México
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-primary-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Nuestra Misión</h2>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Revolucionar la industria de verificación vehicular ofreciendo servicios profesionales, 
                confiables y convenientes directamente en el domicilio de nuestros clientes, 
                utilizando tecnología de vanguardia y personal altamente capacitado.
              </p>
            </div>
            
            <div>
              <div className="flex items-center mb-6">
                <Eye className="w-8 h-8 text-primary-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Nuestra Visión</h2>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Ser la empresa líder en servicios de verificación vehicular a domicilio en México, 
                reconocida por nuestra excelencia, innovación y compromiso con la satisfacción del cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Números
            </h2>
            <p className="text-xl text-gray-600">
              Cifras que respaldan nuestro compromiso y experiencia
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Los principios que guían cada una de nuestras acciones y decisiones
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestro Equipo
            </h2>
            <p className="text-xl text-gray-600">
              Profesionales comprometidos con la excelencia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mt-8 mb-4"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-4">
                    {member.position}
                  </p>
                  <p className="text-gray-600">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestra Historia
              </h2>
              <p className="text-xl text-gray-600">
                El camino hacia la innovación en verificación vehicular
              </p>
            </div>

            <div className="space-y-12">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-primary-600 font-bold">2018</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Fundación</h3>
                  <p className="text-gray-600">
                    Verifireando nace con la visión de transformar la experiencia de verificación vehicular, 
                    llevando el servicio directamente al cliente.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-primary-600 font-bold">2019</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Expansión</h3>
                  <p className="text-gray-600">
                    Ampliamos nuestros servicios a toda la zona metropolitana y certificamos 
                    a nuestro primer grupo de inspectores especializados.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-primary-600 font-bold">2021</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Digitalización</h3>
                  <p className="text-gray-600">
                    Lanzamos nuestra plataforma digital completa, permitiendo a los clientes 
                    agendar, seguir y pagar sus servicios en línea.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-primary-600 font-bold">2024</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Liderazgo</h3>
                  <p className="text-gray-600">
                    Nos consolidamos como líderes en el mercado con más de 10,000 vehículos verificados 
                    y una calificación promedio de 4.9 estrellas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage