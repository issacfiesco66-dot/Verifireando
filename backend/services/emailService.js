const { Resend } = require('resend');
const logger = require('../utils/logger');

const FROM_EMAIL = process.env.FROM_EMAIL || 'Verifireando <noreply@verificandoando.com.mx>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.verificandoando.com.mx';

const isEmailConfigured = () => !!(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) throw new Error(JSON.stringify(error));
    logger.info(`Email enviado a ${to}: ${data?.id}`);
    return true;
  } catch (error) {
    logger.error(`Error enviando email a ${to}: ${error.message || JSON.stringify(error)}`);
    return false;
  }
};

const sendPasswordResetEmail = async (email, name, resetToken) => {
  if (!isEmailConfigured()) {
    logger.warn(`Email no configurado. Token de recuperación para ${email}: ${resetToken}`);
    return false;
  }
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - Verifireando',
    html: `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .code { background: #f3f4f6; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; word-break: break-all; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      <div class="header"><h1>Verifireando</h1><p>Recuperación de Contraseña</p></div>
      <div class="content">
        <h2>Hola${name ? ', ' + name : ''},</h2>
        <p>Recibimos una solicitud para recuperar la contraseña de tu cuenta.</p>
        <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
        <p>O copia este enlace en tu navegador:</p>
        <div class="code">${resetUrl}</div>
        <ul>
          <li>Este enlace expira en <strong>1 hora</strong></li>
          <li>Si no solicitaste esto, ignora este email</li>
        </ul>
        <p>Soporte: soporte@verificandoando.com.mx</p>
      </div>
      <div class="footer"><p>© 2026 Verifireando. Todos los derechos reservados.</p></div>
      </div></body></html>
    `
  });
};

const sendPasswordResetConfirmation = async (email, name) => {
  if (!isEmailConfigured()) {
    logger.warn(`Email no configurado. Confirmación de reset NO enviada a ${email}`);
    return false;
  }
  return sendEmail({
    to: email,
    subject: 'Contraseña Actualizada - Verifireando',
    html: `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      <div class="header"><h1>Verifireando</h1><p>Contraseña Actualizada</p></div>
      <div class="content">
        <h2>Hola${name ? ', ' + name : ''},</h2>
        <div class="success">Tu contraseña ha sido actualizada exitosamente.</div>
        <p>Ya puedes <a href="${FRONTEND_URL}/auth/login" style="color:#2563eb">iniciar sesión</a> con tu nueva contraseña.</p>
        <p>Si no realizaste este cambio, contacta a soporte@verificandoando.com.mx inmediatamente.</p>
      </div>
      <div class="footer"><p>© 2026 Verifireando. Todos los derechos reservados.</p></div>
      </body></html>
    `
  });
};

const sendVerificationEmailOTP = async (email, name, code, role = 'client') => {
  if (!isEmailConfigured()) {
    logger.warn(`Email no configurado. OTP NO enviado a ${email}. Código: ${code}`);
    return false;
  }
  const roleText = role === 'driver' ? 'chofer' : 'cliente';
  return sendEmail({
    to: email,
    subject: 'Código de Verificación - Verifireando',
    html: `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .otp { background: #2563eb; color: white; font-size: 36px; font-weight: bold; padding: 20px; border-radius: 8px; text-align: center; letter-spacing: 8px; margin: 20px 0; }
        .info { background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      <div class="header"><h1>Verifireando</h1><p>Verificación de Cuenta</p></div>
      <div class="content">
        <h2>Hola ${name || ''},</h2>
        <p>Gracias por registrarte como ${roleText}. Tu código de verificación es:</p>
        <div class="otp">${code}</div>
        <div class="info">
          <p><strong>Válido por 15 minutos.</strong></p>
          <p>Nunca compartas este código con nadie.</p>
        </div>
        <p>Soporte: soporte@verificandoando.com.mx</p>
      </div>
      <div class="footer"><p>© 2026 Verifireando. Todos los derechos reservados.</p></div>
      </body></html>
    `
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendVerificationEmailOTP
};
