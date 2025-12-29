#!/bin/bash

# Script para actualizar auth.js en EC2 con registro simplificado

echo "🔧 ACTUALIZANDO ARCHIVO AUTH.JS EN PRODUCCIÓN"
echo "=============================================="
echo ""

cd /var/www/verifireando/backend/routes

# Backup del archivo actual
cp auth.js auth.js.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"

# Buscar y reemplazar el registerSchema
echo "📝 Actualizando registerSchema..."

# Crear archivo temporal con el nuevo contenido
cat > /tmp/auth_patch.txt << 'EOF'
// Esquemas de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+52)?[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'driver').default('client')
});
EOF

# Usar sed para reemplazar desde "const registerSchema" hasta el siguiente "const"
sed -i '/^const registerSchema = Joi.object({/,/^});$/c\
// Esquemas de validación\
const registerSchema = Joi.object({\
  name: Joi.string().min(2).max(100).required(),\
  email: Joi.string().email().required(),\
  phone: Joi.string().pattern(/^(\\+52)?[0-9]{10}$/).required(),\
  password: Joi.string().min(6).required(),\
  role: Joi.string().valid('\''client'\'', '\''driver'\'').default('\''client'\'')\
});' auth.js

echo "✅ registerSchema actualizado"

# Reiniciar PM2
echo ""
echo "🔄 Reiniciando servidor..."
cd /var/www/verifireando/backend
pm2 restart all

sleep 3

echo ""
echo "✅ ACTUALIZACIÓN COMPLETADA"
echo ""
echo "📋 Prueba el registro de conductor ahora"
echo "   El registro ya NO requiere licenseNumber"
echo ""
