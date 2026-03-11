# Resolver Divergencia y Deploy

## Paso 1: Resolver ramas divergentes en el servidor

Ejecuta estos comandos en el servidor:

```bash
cd /home/ubuntu/Verifireando

# Ver el estado actual
git status

# Opción A: Hacer merge (recomendado)
git pull origin master --no-rebase

# Si hay conflictos, resolverlos y luego:
# git add .
# git commit -m "Merge cambios locales con remoto"

# Opción B: Si prefieres descartar cambios locales y usar solo remoto
# git fetch origin
# git reset --hard origin/master
```

## Paso 2: Deploy manual (ya que el script no existe aún)

```bash
cd /home/ubuntu/Verifireando

# Backend
cd backend
npm install
pm2 restart verifireando-backend
pm2 save
cd ..

# Frontend
cd frontend
npm install
sudo chown -R ubuntu:ubuntu dist 2>/dev/null || true
npm run build
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist
cd ..

# Recargar Nginx
sudo nginx -t
sudo systemctl reload nginx

# Verificar
pm2 status
```

## Paso 3: Crear el script para futuros deploys

```bash
cd /home/ubuntu/Verifireando

# Crear el script
cat > deploy-registro-separado.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 Iniciando deploy..."
cd /home/ubuntu/Verifireando
git pull origin master
cd backend && npm install && pm2 restart verifireando-backend && pm2 save && cd ..
cd frontend && npm install && sudo chown -R ubuntu:ubuntu dist 2>/dev/null || true && npm run build && sudo chown -R www-data:www-data dist && sudo chmod -R 755 dist && cd ..
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Deploy completado!"
EOF

# Dar permisos de ejecución
chmod +x deploy-registro-separado.sh
```
