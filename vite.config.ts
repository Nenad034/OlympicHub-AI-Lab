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
        target: 'https://evaluation.solvex.bg',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/solvex/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🇧🇬 Proxying Solvex API request:', req.url);
          });
        }
      },
      // Proxy for Solvex B2B (Images)
      '/api/solvex-b2b': {
        target: 'https://b2b.solvex.bg',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/solvex-b2b/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🖼️ Proxying Solvex B2B Image request:', req.url);
          });
        }
      },
      // Proxy for Filos API V2
      '/api/filos-v2': {
        target: 'https://api-v2.onetourismo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/filos-v2/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🇬🇷 Proxying Filos V2 API request:', req.url);
          });
        }
      },
      // Proxy for Filos Static API
      '/api/filos-static': {
        target: 'https://api-static.onetourismo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/filos-static/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🏛️ Proxying Filos Static API request:', req.url);
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
      },
      // Proxy for OpenClaw Gateway (Besplatni AI most)
      '/api/openclaw': {
        target: 'http://127.0.0.1:18791',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/openclaw/, ''),
      },
      // Proxy for Google Gemini as Secure Backup
      '/api/ai/google': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ai\/google/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🌟 Google Backup Tunnel Active:', req.url);
          });
        }
      }
    }
  }
})
