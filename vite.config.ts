import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import unocss from 'unocss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [unocss(), react()],
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
})
