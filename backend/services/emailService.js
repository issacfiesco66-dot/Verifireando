const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuración del transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Función para enviar email de recuperación de contraseña
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'https://www.verificandoando.com.mx'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Verifireando" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Verifireando',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .code { background: #f3f4f6; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 16px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Verifireando</h1>
            <p>Recuperación de Contraseña</p>
          </div>
          
          <div class="content">
            <h2>Hola,</h2>
            <p>Recibimos una solicitud para recuperar la contraseña de tu cuenta.</p>
            
            <p>Para continuar con el proceso de recuperación, haz clic en el siguiente botón:</p>
            
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            
            <p>O copia y pega este enlace en tu navegador:</p>
            <div class="code">${resetUrl}</div>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Este enlace expirará en 1 hora por seguridad</li>
              <li>Si no solicitaste esta recuperación, ignora este email</li>
              <li>Nunca compartas este enlace con otras personas</li>
            </ul>
            
            <p>Si tienes problemas, contacta a nuestro soporte:</p>
            <p>📧 soporte@verificandoando.com.mx</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Verifireando. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no responder.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de recuperación enviado a ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logger.error('Error enviando email de recuperación:', error);
    return false;
  }
};

// Función para enviar email de confirmación de reset
const sendPasswordResetConfirmation = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Verifireando" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Contraseña Actualizada Exitosamente - Verifireando',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña Actualizada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Verifireando</h1>
            <p>Contraseña Actualizada</p>
          </div>
          
          <div class="content">
            <div class="success">
              ✅ ¡Tu contraseña ha sido actualizada exitosamente!
            </div>
            
            <h2>¿Qué sigue?</h2>
            <p>Ya puedes iniciar sesión con tu nueva contraseña:</p>
            <p><a href="${process.env.FRONTEND_URL || 'https://www.verificandoando.com.mx'}/auth/login" style="color: #2563eb;">Iniciar Sesión</a></p>
            
            <p><strong>Detalles de la actualización:</strong></p>
            <ul>
              <li>Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</li>
              <li>IP: ${process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'Registrada'}</li>
            </ul>
            
            <p><strong>🔒 Seguridad:</strong></p>
            <p>Si no realizaste este cambio, contacta inmediatamente a soporte@verificandoando.com.mx</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Verifireando. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no responder.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de confirmación enviado a ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logger.error('Error enviando email de confirmación:', error);
    return false;
  }
};

// Función para enviar código de verificación por email
const sendVerificationEmailOTP = async (email, name, code, role = 'client') => {
  try {
    const transporter = createTransporter();
    
    const roleText = role === 'driver' ? 'chofer' : 'cliente';
    
    const mailOptions = {
      from: `"Verifireando" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Código de Verificación - Verifireando`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificación</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .code { background: #2563eb; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; text-align: center; letter-spacing: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Verifireando</h1>
            <p>Verificación de Cuenta</p>
          </div>
          
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Gracias por registrarte como ${roleText} en Verifireando.</p>
            
            <p>Para completar tu verificación, usa el siguiente código:</p>
            
            <div class="code">${code}</div>
            
            <div class="info">
              <p><strong>⏱️ Válido por:</strong> 15 minutos</p>
              <p><strong>📱 Enviado por:</strong> Email y WhatsApp</p>
            </div>
            
            <div class="warning">
              <p><strong>🔒 Seguridad:</strong></p>
              <ul>
                <li>Nunca compartas este código con otras personas</li>
                <li>Nuestro equipo nunca te pedirá este código por llamada telefónica</li>
                <li>Si no solicitaste este código, ignora este mensaje</li>
              </ul>
            </div>
            
            <p>¿Tienes problemas? Contacta a nuestro soporte:</p>
            <p>📧 soporte@verificandoando.com.mx</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Verifireando. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no responder.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logger.error('Error enviando email de verificación:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendVerificationEmailOTP
};
