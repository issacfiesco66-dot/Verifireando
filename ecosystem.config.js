// PM2 Configuration for Production
module.exports = {
  apps: [{
    name: 'verifireando-backend',
    script: './backend/server.js',
    instances: 1, // Cambiar de 'max' a 1 para evitar problemas con Socket.IO
    exec_mode: 'fork', // Cambiar de 'cluster' a 'fork' para Socket.IO
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
