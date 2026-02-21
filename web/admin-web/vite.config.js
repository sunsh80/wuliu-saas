// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // 不需要 rewrite，因为我们的路径已经是 /api 开头
      }
    }
  }
})