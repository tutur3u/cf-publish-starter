import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Plugin order follows Cloudflare's TanStack Start guide.
// allowedHosts lets `npm run share` (Cloudflare Quick Tunnel) reach the
// local server through a https://*.trycloudflare.com address.
export default defineConfig({
  server: { allowedHosts: ['.trycloudflare.com'] },
  preview: { allowedHosts: ['.trycloudflare.com'] },
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), tanstackStart(), viteReact()],
})
