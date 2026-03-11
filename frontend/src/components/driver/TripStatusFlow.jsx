import React, { useState } from 'react';
import { 
  Navigation, 
  Car, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  MapPin,
  ArrowRight,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Componente para gestionar el flujo de estados de un viaje para el chofer
 * Incluye verificación de código, cambios de estado y botones de acción
 */
const TripStatusFlow = ({ 
  appointment, 
  onUpdateStatus,
  isUpdating = false
}) => {
  const [clientCode, setClientCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Verificar el código proporcionado por el cliente contra el código real de la cita
  const verifyClientCode = () => {
    if (!clientCode || clientCode.length !== 6) {
      toast.error('Ingresa un código válido de 6 dígitos');
      return;
    }
    
    // Verificar contra el código real de la cita
    if (appointment.pickupCode && clientCode === appointment.pickupCode) {
      setVerificationSuccess(true);
      toast.success('¡Identidad del cliente verificada!');
      
      setTimeout(() => {
        setShowVerification(false);
      }, 2000);
    } else {
      toast.error('Código incorrecto. Pide al cliente que verifique su código.');
      setClientCode('');
    }
  };
  
  // Obtener el siguiente estado basado en el estado actual
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned':
        return 'driver_enroute';
      case 'driver_enroute':
        return 'picked_up';
      case 'picked_up':
        return 'in_verification';
      case 'in_verification':
        return 'completed';
      case 'completed':
        return 'delivered';
      default:
        return currentStatus;
    }
  };
  
  // Obtener texto para el botón de acción según el estado actual
  const getActionButtonText = (status) => {
    switch (status) {
      case 'assigned':
        return 'Iniciar viaje a recogida';
      case 'driver_enroute':
        return 'Llegué al punto de recogida';
      case 'picked_up':
        return 'Iniciar verificación';
      case 'in_verification':
        return 'Completar verificación';
      case 'completed':
        return 'Entregar vehículo';
      default:
        return 'Actualizar estado';
    }
  };
  
  // Obtener icono para el botón de acción según el estado actual
  const getActionButtonIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <Navigation className="w-5 h-5" />;
      case 'driver_enroute':
        return <MapPin className="w-5 h-5" />;
      case 'picked_up':
        return <Car className="w-5 h-5" />;
      case 'in_verification':
        return <CheckCircle className="w-5 h-5" />;
      case 'completed':
        return <ArrowRight className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };
  
  // Obtener color para el botón de acción según el estado actual
  const getActionButtonColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'driver_enroute':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'picked_up':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'in_verification':
        return 'bg-green-600 hover:bg-green-700';
      case 'completed':
        return 'bg-teal-600 hover:bg-teal-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };
  
  // Manejar el clic en el botón de acción
  const handleActionClick = () => {
    // Si estamos en estado de recogida, mostrar verificación primero
    if (appointment.status === 'driver_enroute') {
      setShowVerification(true);
      return;
    }
    
    // Para otros estados, actualizar directamente
    const nextStatus = getNextStatus(appointment.status);
    if (onUpdateStatus) {
      onUpdateStatus(nextStatus);
    }
  };
  
  // Renderizar el componente de verificación de cliente
  const renderClientVerification = () => {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-amber-900">
            Verificación de Seguridad
          </h2>
        </div>
        
        {verificationSuccess ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900 mb-2">
              ¡Identidad verificada!
            </h3>
            <p className="text-green-700 mb-4">
              Has verificado correctamente la identidad del cliente.
            </p>
            <button
              onClick={() => {
                setShowVerification(false);
                const nextStatus = getNextStatus(appointment.status);
                if (onUpdateStatus) {
                  onUpdateStatus(nextStatus);
                }
              }}
              className="btn btn-success btn-md"
            >
              Continuar con el servicio
            </button>
          </div>
        ) : (
          <>
            <p className="text-amber-700 mb-4">
              Antes de recoger el vehículo, verifica la identidad del cliente pidiéndole su código de verificación.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingresa el código que te proporciona el cliente
                </label>
                <input
                  type="text"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.slice(0, 6))}
                  placeholder="Código de 6 dígitos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center text-2xl font-mono tracking-wider"
                  maxLength={6}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={verifyClientCode}
                  disabled={clientCode.length !== 6}
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>Verificar código</span>
                </button>
                
                <button
                  onClick={() => setShowVerification(false)}
                  className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
            
            <div className="mt-6 bg-amber-100 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <p className="text-sm text-amber-700 font-medium">
                  Importante:
                </p>
              </div>
              <ul className="mt-2 text-sm text-amber-700 space-y-1 pl-6 list-disc">
                <li>No recojas el vehículo sin verificar la identidad del cliente</li>
                <li>Verifica que la persona sea el propietario del vehículo</li>
                <li>Solicita identificación oficial adicional si tienes dudas</li>
              </ul>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Si no hay cita o está cancelada, no mostrar nada
  if (!appointment || appointment.status === 'cancelled') {
    return null;
  }
  
  // Si la cita ya está entregada, mostrar mensaje de completado
  if (appointment.status === 'delivered') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-green-900">
            Servicio completado
          </h2>
        </div>
        <p className="text-green-700 mt-2">
          Este servicio ha sido completado exitosamente.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Mostrar verificación de cliente si es necesario */}
      {showVerification && renderClientVerification()}
      
      {/* Panel de acciones de estado */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary-600 mr-2" />
          Estado del servicio
        </h2>
        
        <div className="flex flex-col space-y-4">
          {/* Barra de progreso */}
          <div className="relative">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                style={{ 
                  width: (() => {
                    switch (appointment.status) {
                      case 'assigned': return '10%';
                      case 'driver_enroute': return '30%';
                      case 'picked_up': return '50%';
                      case 'in_verification': return '75%';
                      case 'completed': return '90%';
                      case 'delivered': return '100%';
                      default: return '0%';
                    }
                  })()
                }}
              ></div>
            </div>
          </div>
          
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  switch (appointment.status) {
                    case 'assigned':
                      return <Clock className="w-5 h-5 text-blue-600" />;
                    case 'driver_enroute':
                      return <Navigation className="w-5 h-5 text-amber-600" />;
                    case 'picked_up':
                      return <Car className="w-5 h-5 text-purple-600" />;
                    case 'in_verification':
                      return <Shield className="w-5 h-5 text-indigo-600" />;
                    case 'completed':
                      return <CheckCircle className="w-5 h-5 text-green-600" />;
                    default:
                      return <Clock className="w-5 h-5 text-gray-600" />;
                  }
                })()}
                <div>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      switch (appointment.status) {
                        case 'assigned': return 'Asignado';
                        case 'driver_enroute': return 'En camino a recogida';
                        case 'picked_up': return 'Vehículo recogido';
                        case 'in_verification': return 'En verificación';
                        case 'completed': return 'Verificación completada';
                        default: return 'Estado desconocido';
                      }
                    })()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      switch (appointment.status) {
                        case 'assigned': return 'Prepárate para iniciar el viaje';
                        case 'driver_enroute': return 'Dirigiéndote al punto de recogida';
                        case 'picked_up': return 'Vehículo en tu posesión';
                        case 'in_verification': return 'Realizando verificación vehicular';
                        case 'completed': return 'Listo para entregar el vehículo';
                        default: return '';
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botón de acción principal */}
          <button
            onClick={handleActionClick}
            disabled={isUpdating}
            className={`w-full py-3 px-4 ${getActionButtonColor(appointment.status)} text-white rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-70`}
          >
            {isUpdating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                {getActionButtonIcon(appointment.status)}
                <span>{getActionButtonText(appointment.status)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripStatusFlow;
