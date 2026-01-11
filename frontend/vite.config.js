import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Mantener archivos PWA en la raíz sin hash
          const pwaFiles = ['sw.js', 'manifest.webmanifest', 'logo.svg', 'icon-192.svg', 'icon-512.svg', 'offline.html', 'clear-sw.js', 'firebase-messaging-sw.js'];
          const fileName = assetInfo.name || '';
          if (pwaFiles.some(file => fileName.includes(file))) {
            return fileName;
          }
          // Otros assets van a assets/ con hash
          return 'assets/[name]-[hash].[ext]';
        },
      }
    }
  }
})
