import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/crud':   process.env.BACKEND_URL ?? 'http://localhost:8000',
      '/auth':   process.env.BACKEND_URL ?? 'http://localhost:8000',
      '/health': process.env.BACKEND_URL ?? 'http://localhost:8000',
    },
    // Windows + Docker 必须用轮询，否则文件变化不触发热更新
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
