Deploy en producción (AWS + Nginx + systemd)

1. Copiar archivos de configuración al servidor

- Nginx: copiar `deploy/nginx/verificandoando.conf` a `/etc/nginx/sites-available/verificandoando.conf` y crear symlink a `sites-enabled`.
- systemd: copiar `deploy/systemd/verifireando.service` a `/etc/systemd/system/verifireando.service`.

2. Ajustar rutas y puertos

- Editar `verificandoando.conf` si el backend usa un puerto distinto a `5000`.
- Asegurar que el frontend esté construido en `/var/www/verificandoando/frontend/dist` o ajustar `root`.
- Colocar el `.env` junto al backend en `/srv/verificandoando/backend/.env`.

3. Comandos

```
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl daemon-reload
sudo systemctl enable verifireando
sudo systemctl start verifireando
sudo systemctl status verifireando
curl -v http://127.0.0.1:5000/health
```

4. Atlas y Seguridad

- Añadir la IP pública del EC2 en la lista de IPs permitidas de MongoDB Atlas.
- Abrir puertos necesarios en el Security Group de AWS (HTTP 80/HTTPS 443). El backend se consume por Nginx vía localhost.

