import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  User,
  CheckCircle
} from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Contact form data:', data)
      setIsSubmitted(true)
      toast.success('Mensaje enviado exitosamente')
      reset()
      
      // Reset success state after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Teléfono',
      details: ['+52 55 1234 5678', '+52 55 8765 4321'],
      description: 'Lunes a Viernes: 8:00 AM - 6:00 PM'
    },
    {
      icon: Mail,
      title: 'Correo Electrónico',
      details: ['contacto@verifireando.com', 'soporte@verifireando.com'],
      description: 'Respuesta en menos de 24 horas'
    },
    {
      icon: MapPin,
      title: 'Oficina Principal',
      details: ['Av. Reforma 123, Col. Centro', 'Ciudad de México, CDMX 06000'],
      description: 'Lunes a Viernes: 9:00 AM - 5:00 PM'
    },
    {
      icon: MessageCircle,
      title: 'Chat en Vivo',
      details: ['Disponible en nuestra plataforma'],
      description: 'Lunes a Sábado: 8:00 AM - 8:00 PM'
    }
  ]

  const faqs = [
    {
      question: '¿En qué horarios ofrecen el servicio?',
      answer: 'Ofrecemos servicios de lunes a sábado de 8:00 AM a 6:00 PM. Los domingos tenemos horario especial de 9:00 AM a 3:00 PM.'
    },
    {
      question: '¿Cuánto tiempo toma la verificación?',
      answer: 'Una verificación completa toma aproximadamente 45-60 minutos, dependiendo del tipo de vehículo y los servicios solicitados.'
    },
    {
      question: '¿Qué documentos necesito?',
      answer: 'Necesitas tu licencia de conducir vigente, tarjeta de circulación, póliza de seguro vigente y una identificación oficial.'
    },
    {
      question: '¿Cubren toda la zona metropolitana?',
      answer: 'Sí, cubrimos toda la zona metropolitana de la Ciudad de México y área conurbada. Consulta disponibilidad para zonas específicas.'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contáctanos
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Estamos aquí para ayudarte. Ponte en contacto con nosotros.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {info.title}
                </h3>
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-700 font-medium">
                    {detail}
                  </p>
                ))}
                <p className="text-sm text-gray-500 mt-2">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Envíanos un Mensaje
              </h2>
              <p className="text-xl text-gray-600">
                ¿Tienes alguna pregunta? Nos encantaría escucharte.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    ¡Mensaje Enviado!
                  </h3>
                  <p className="text-gray-600">
                    Gracias por contactarnos. Te responderemos en menos de 24 horas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          className={`input input-md w-full pl-10 ${errors.name ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                          placeholder="Tu nombre completo"
                          {...register('name', {
                            required: 'El nombre es requerido',
                            minLength: {
                              value: 2,
                              message: 'El nombre debe tener al menos 2 caracteres'
                            }
                          })}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          className={`input input-md w-full pl-10 ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                          placeholder="tu@email.com"
                          {...register('email', {
                            required: 'El correo electrónico es requerido',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Correo electrónico inválido'
                            }
                          })}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          className="input input-md w-full pl-10"
                          placeholder="+52 55 1234 5678"
                          {...register('phone')}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Asunto *
                      </label>
                      <select
                        id="subject"
                        className={`input input-md w-full ${errors.subject ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                        {...register('subject', {
                          required: 'Selecciona un asunto'
                        })}
                      >
                        <option value="">Selecciona un asunto</option>
                        <option value="general">Consulta General</option>
                        <option value="appointment">Agendar Cita</option>
                        <option value="support">Soporte Técnico</option>
                        <option value="complaint">Queja o Reclamo</option>
                        <option value="suggestion">Sugerencia</option>
                        <option value="other">Otro</option>
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-error-600">{errors.subject.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      className={`input input-md w-full resize-none ${errors.message ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                      placeholder="Escribe tu mensaje aquí..."
                      {...register('message', {
                        required: 'El mensaje es requerido',
                        minLength: {
                          value: 10,
                          message: 'El mensaje debe tener al menos 10 caracteres'
                        }
                      })}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-error-600">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary btn-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-xl text-gray-600">
                Encuentra respuestas a las preguntas más comunes
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage