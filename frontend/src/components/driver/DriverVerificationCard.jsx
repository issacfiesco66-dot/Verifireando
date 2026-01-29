import React, { useState, useEffect } from 'react';
import { QrCode, Shield, User, Award, FileCheck, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

/**
 * Componente para mostrar la información de verificación del chofer
 * Incluye código QR, información de licencia y código de verificación
 */
const DriverVerificationCard = ({ 
  driver, 
  verificationCode, 
  appointmentId,
  showQR = true
}) => {
  const [copied, setCopied] = useState(false);
  const [qrValue, setQrValue] = useState('');
  
  useEffect(() => {
    // Generar datos para el código QR
    if (driver && appointmentId) {
      const qrData = JSON.stringify({
        driverId: driver._id || driver.id,
        name: driver.name,
        licenseNumber: driver.licenseNumber || driver.driverProfile?.licenseNumber,
        appointmentId: appointmentId,
        timestamp: new Date().toISOString()
      });
      setQrValue(qrData);
    }
  }, [driver, appointmentId]);

  const copyToClipboard = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!driver) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-blue-900">
          Verificación de Identidad
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Información del chofer */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{driver.name}</h3>
              <p className="text-gray-600">{driver.email}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Información de licencia</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Número de licencia</p>
                <p className="font-medium text-gray-900">{driver.licenseNumber || driver.driverProfile?.licenseNumber || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Experiencia</p>
                <div className="flex items-center">
                  <Award className="w-4 h-4 text-yellow-500 mr-1" />
                  <p className="font-medium text-gray-900">
                    {driver.totalTrips || driver.driverProfile?.totalTrips || 0} servicios completados
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Código de verificación */}
          {verificationCode && (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Código de verificación</h4>
                <button
                  onClick={copyToClipboard}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-sm">{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <span className="text-3xl font-bold text-blue-900 font-mono tracking-wider">
                  {verificationCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Muestra este código al cliente para verificar tu identidad
              </p>
            </div>
          )}
        </div>
        
        {/* Columna derecha: Código QR */}
        {showQR && qrValue && (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-inner">
              <QRCode 
                value={qrValue}
                size={180}
                level="H"
                includeMargin={true}
                renderAs="svg"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center">
              El cliente puede escanear este código QR para verificar tu identidad
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-blue-100 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-700" />
          <p className="text-sm text-blue-700 font-medium">
            Instrucciones de seguridad:
          </p>
        </div>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 pl-6 list-disc">
          <li>Muestra tu identificación oficial y licencia al cliente</li>
          <li>Pide al cliente que verifique tu código o escanee el QR</li>
          <li>El cliente debe proporcionarte un código de verificación</li>
          <li>No inicies el servicio sin completar la verificación</li>
        </ul>
      </div>
    </div>
  );
};

export default DriverVerificationCard;
