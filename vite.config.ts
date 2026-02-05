import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 5173,
    headers: {
      // Security Headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    },
    proxy: {
      // Proxy for Open Greece API to bypass CORS
      '/api/opengreece': {
        target: 'https://online.open-greece.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/opengreece/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🇬🇷 Proxying Open Greece API request:', req.url);
          });
        }
      },
      // Proxy for Solvex API to bypass CORS
      '/api/solvex': {
        target: 'https://iservice.solvex.bg',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/solvex/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🇧🇬 Proxying Solvex API request:', req.url);
          });
          proxy.on('proxyRes', (_proxyRes, _req, _res) => {
            // Handle potential SOAP specific issues if needed
          });
        }
      },
      // Proxy for ORS API to bypass CORS
      '/api/ors': {
        target: 'https://api.ors.si/crs/v2',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ors/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🇪🇺 Proxying ORS API request:', req.url);
          });
        }
      }
    }
  }
})
