@echo off
echo 🚀 Subiendo Verifireando al servidor AWS...

REM Verificar que existe la key
if not exist "verifireando-key.pem" (
    echo ❌ Error: No se encuentra verificando-key.pem
    echo    Asegúrate de que el archivo está en la misma carpeta
    pause
    exit /b 1
)

echo.
echo 📤 Paso 1: Subiendo script de configuracion...
pscp -i "verifireando-key.pem" setup-server.sh ubuntu@18.220.237.118:/tmp/

echo.
echo ⚙️  Paso 2: Ejecutando configuracion automatica...
plink -i "verifireando-key.pem" ubuntu@18.220.237.118 "bash /tmp/setup-server.sh"

echo.
echo 📤 Paso 3: Subiendo archivos de la aplicacion...
pscp -i "verifireando-key.pem" -r .env.production ecosystem.config.js nginx-verifireando.conf deploy.sh ubuntu@18.220.237.118:/var/www/verifireando/
pscp -i "verifireando-key.pem" -r backend/ ubuntu@18.220.237.118:/var/www/verifireando/
pscp -i "verifireando-key.pem" -r frontend/ ubuntu@18.220.237.118:/var/www/verifireando/

echo.
echo 🚀 Paso 4: Ejecutando despliegue...
plink -i "verifireando-key.pem" ubuntu@18.220.237.118 "cd /var/www/verifireando && ./deploy.sh"

echo.
echo ✅ ¡Verifireando desplegado!
echo 🌐 Visita: http://18.220.237.118
echo.
echo Presiona cualquier tecla para salir...
pause > nul
