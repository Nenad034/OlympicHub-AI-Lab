import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // Determine dynamic proxy targets
  const solvexUrl = env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg';
  let solvexOrigin = 'https://iservice.solvex.bg';
  try {
    solvexOrigin = new URL(solvexUrl).origin;
  } catch (e) {
    console.warn('Invalid VITE_SOLVEX_API_URL, using default origin');
  }

  return {
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
        // Proxy for Solvex B2B (Images & JSON API)
        '/api/solvex-b2b': {
          target: 'https://b2b.solvex.bg',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/solvex-b2b/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🖼️ Proxying Solvex Media request:', req.url);
            });
          }
        },
        // Proxy for Solvex API to bypass CORS
        '/api/solvex': {
          target: solvexOrigin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/solvex/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🇧🇬 Proxying Solvex API request:', req.url);
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
        // Proxy for Filos API (One Tourismo)
        '/api/filos-v2': {
          target: 'https://api-v2.onetourismo.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/filos-v2/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🇬🇷 Proxying Filos V2 request:', req.url);
            });
          }
        },
        '/api/filos-static': {
          target: 'https://api-static.onetourismo.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/filos-static/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🇬🇷 Proxying Filos Static request:', req.url);
            });
          }
        }
      }
    }
  }
})
