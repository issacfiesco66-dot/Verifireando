const winston = require('winston');
const fs = require('fs');
const path = require('path');

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [];

// Activar logs a archivo solo si se habilita explícitamente
if (process.env.ENABLE_FILE_LOGS === 'true') {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    transports.push(new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }));
    transports.push(new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }));
  } catch (e) {
    // Si falla crear directorio, continuar con consola para no romper producción
    // La consola se añade abajo segun entorno/flag
  }
}

// Log a consola en desarrollo o cuando se fuerza con LOG_TO_CONSOLE=true o cuando no hay archivos
if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true' || transports.length === 0) {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: baseFormat,
  defaultMeta: { service: 'verifireando-backend' },
  transports
});

module.exports = logger;