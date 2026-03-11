import React, { useState, useEffect } from 'react';
import { Shield, QrCode, AlertCircle, CheckCircle, Camera, X } from 'lucide-react';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/api';

/**
 * Componente para verificar la identidad del chofer
 * Incluye verificación por código y escaneo de QR
 */
const DriverIdentityVerifier = ({ 
  appointment, 
  onVerificationSuccess,
  onClose
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState('code'); // 'code' o 'qr'

  // Generar un código de verificación para el cliente
  useEffect(() => {
    if (appointment && !appointment.clientVerificationCode) {
      // Generar un código aleatorio de 6 dígitos
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // En un sistema real, este código se guardaría en la base de datos
      // y se enviaría al backend para validación
      localStorage.setItem(`clientCode_${appointment._id}`, randomCode);
    }
  }, [appointment]);

  const getClientCode = () => {
    return localStorage.getItem(`clientCode_${appointment._id}`) || '------';
  };

  const verifyDriverCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa un código válido de 6 dígitos');
      return;
    }

    try {
      setIsVerifying(true);
      
      // En un sistema real, esto verificaría el código contra el backend
      // Simulamos una verificación exitosa si el código coincide con el pickupCode
      if (verificationCode === appointment.pickupCode) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        setIsSuccess(true);
        toast.success('¡Identidad del chofer verificada!');
        
        if (onVerificationSuccess) {
          onVerificationSuccess();
        }
      } else {
        toast.error('Código incorrecto. Verifica con el chofer.');
      }
    } catch (error) {
      toast.error('Error al verificar el código');
      console.error('Error verificando código:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQrScan = async (data) => {
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        
        // Verificar que los datos del QR corresponden al chofer asignado
        if (parsedData.driverId === appointment.driver._id && 
            parsedData.appointmentId === appointment._id) {
          
          setScannedData(parsedData);
          setIsSuccess(true);
          toast.success('¡Identidad del chofer verificada por QR!');
          
          if (onVerificationSuccess) {
            onVerificationSuccess();
          }
        } else {
          toast.error('El código QR no corresponde a este chofer o cita');
        }
      } catch (error) {
        toast.error('Código QR inválido');
        console.error('Error escaneando QR:', error);
      } finally {
        setShowQrScanner(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-green-900">
            Verificación de Seguridad
          </h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isSuccess ? (
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">
            ¡Identidad verificada!
          </h3>
          <p className="text-green-700">
            Has verificado correctamente la identidad del chofer.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-gray-900">Importante: Verifica antes de entregar tu vehículo</h4>
            </div>
            <p className="text-gray-700 mb-4">
              Para tu seguridad, verifica la identidad del chofer antes de entregar tu vehículo. 
              Puedes hacerlo de dos formas:
            </p>
            
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setVerificationMethod('code')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                  verificationMethod === 'code' 
                    ? 'bg-green-100 border-2 border-green-400 text-green-800' 
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Verificar por código</span>
              </button>
              
              <button
                onClick={() => setVerificationMethod('qr')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                  verificationMethod === 'qr' 
                    ? 'bg-green-100 border-2 border-green-400 text-green-800' 
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>Escanear QR</span>
              </button>
            </div>
            
            {verificationMethod === 'code' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingresa el código que te muestra el chofer
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                    placeholder="Código de 6 dígitos"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-2xl font-mono tracking-wider"
                    maxLength={6}
                  />
                </div>
                
                <button
                  onClick={verifyDriverCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Verificar código</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {showQrScanner ? (
                  <div className="relative">
                    <div className="rounded-lg overflow-hidden">
                      <QrReader
                        constraints={{ facingMode: 'environment' }}
                        onResult={(result, error) => {
                          if (result) {
                            handleQrScan(result?.text);
                          }
                          if (error) {
                            console.info(error);
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button
                      onClick={() => setShowQrScanner(false)}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md"
                    >
                      <X className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowQrScanner(true)}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Abrir escáner de QR</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Código del cliente para verificación bidireccional */}
          <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span>Tu código de verificación</span>
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Proporciona este código al chofer para verificación bidireccional:
            </p>
            <div className="bg-white rounded-lg p-3 text-center border border-amber-300">
              <span className="text-3xl font-bold text-amber-800 font-mono tracking-wider">
                {getClientCode()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              El chofer debe ingresar este código para confirmar tu identidad
            </p>
          </div>
        </>
      )}
      
      <div className="mt-6 bg-green-100 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-700" />
          <p className="text-sm text-green-700 font-medium">
            Recomendaciones de seguridad:
          </p>
        </div>
        <ul className="mt-2 text-sm text-green-700 space-y-1 pl-6 list-disc">
          <li>Verifica que la foto y nombre del chofer coincidan</li>
          <li>Confirma el número de licencia del chofer</li>
          <li>No entregues tu vehículo sin completar la verificación</li>
          <li>Reporta cualquier irregularidad inmediatamente</li>
        </ul>
      </div>
    </div>
  );
};

export default DriverIdentityVerifier;
