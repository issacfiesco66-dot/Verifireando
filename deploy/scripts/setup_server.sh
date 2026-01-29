#!/usr/bin/env bash
set -euo pipefail

# Usage:
# sudo bash setup_server.sh --domain verificandoando.com.mx --app-dir /srv/verificandoando/backend --port 5000 [--install-node]

DOMAIN=""
APP_DIR=""
PORT="5000"
INSTALL_NODE="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2;;
    --app-dir) APP_DIR="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;
    --install-node) INSTALL_NODE="true"; shift 1;;
    *) echo "Unknown option $1"; exit 1;;
  esac
done

if [[ -z "$DOMAIN" || -z "$APP_DIR" ]]; then
  echo "Usage: sudo bash setup_server.sh --domain <your-domain> --app-dir <backend-path> [--port <port>] [--install-node]"
  exit 1
fi

echo "==> Creating Nginx site structure"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

echo "==> Writing Nginx config for $DOMAIN (upstream :$PORT)"
cat > /etc/nginx/sites-available/${DOMAIN}.conf <<NGINXCONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    root /var/www/verificandoando/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:${PORT}/uploads/;
        proxy_set_header Host $host;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}.conf

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default || true
fi

echo "==> Testing and reloading Nginx"
nginx -t
systemctl reload nginx || systemctl restart nginx

if [[ "$INSTALL_NODE" == "true" ]]; then
  echo "==> Installing Node.js (20.x LTS)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating/Updating systemd service verifireando"
cat > /etc/systemd/system/verifireando.service <<SERVICE
[Unit]
Description=Verificandoando Backend
After=network.target

[Service]
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable verifireando || true
systemctl restart verifireando

echo "==> Checking backend health"
sleep 2
curl -sf http://127.0.0.1:${PORT}/health || echo "Health check failed, check: journalctl -u verifireando -n 200 --no-pager"

echo "==> Done. If you use HTTPS, run certbot and add an SSL server block."
