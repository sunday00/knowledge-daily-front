import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import unocss from 'unocss/vite'
import path from 'node:path'
import { sitemap } from './vite-plugins/sitemap.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      unocss(),
      react(),
      sitemap({
        siteUrl: env.VITE_SITE_URL ?? 'http://localhost:5080',
        endpoint: env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // wasm 인코더가 자기 위치(import.meta.url) 기준으로 파일을 찾으므로 사전 번들에서 뺀다.
    optimizeDeps: {
      exclude: ['@jsquash/webp'],
    },
    server: {
      host: '0.0.0.0',
      port: 5080,
      strictPort: true,
    },
  }
})
