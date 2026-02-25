import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'rewrite-to-mobile',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/') {
                        req.url = '/mobile.html';
                    }
                    next();
                });
            },
        }
    ],
    server: {
        port: 5174,
        headers: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        proxy: {
            '/api/opengreece': {
                target: 'https://online.open-greece.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/opengreece/, ''),
            },
            '/api/solvex': {
                target: 'https://iservice.solvex.bg',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/solvex/, ''),
            },
            '/api/solvex-b2b': {
                target: 'https://b2b.solvex.bg',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/solvex-b2b/, ''),
            },
            '/api/filos-v2': {
                target: 'https://api-v2.onetourismo.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/filos-v2/, ''),
            },
            '/api/filos-static': {
                target: 'https://api-static.onetourismo.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/filos-static/, ''),
            },
            '/api/ors': {
                target: 'https://api.ors.si/crs/v2',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/ors/, ''),
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: 'mobile.html'
            }
        }
    }
})
