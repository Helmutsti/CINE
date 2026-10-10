import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import pkg from './package.json' with { type: 'json' }

// In sviluppo il server di Vite fa da ponte verso Jellyfin, come nginx nel contenitore:
// JELLYFIN_URL e JELLYFIN_API_KEY si mettono in client/.env.local (non nel repository).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'JELLYFIN_')
  const server = (env.JELLYFIN_URL || 'http://localhost:8096').replace(/\/$/, '')
  return {
    plugins: [react()],
    define: { __VERSIONE__: JSON.stringify(pkg.version) },
    server: {
      proxy: {
        '/jf': {
          target: server,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/jf/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (req, inReq) => {
              const dev = (inReq.headers['x-cineteca-device'] as string) || 'cineteca-web'
              req.setHeader(
                'Authorization',
                `MediaBrowser Client="Cineteca", Device="Cineteca web", DeviceId="${dev}", Version="${pkg.version}", Token="${env.JELLYFIN_API_KEY ?? ''}"`,
              )
            })
          },
        },
      },
    },
  }
})
