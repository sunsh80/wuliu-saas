// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.2.250:3000',
        changeOrigin: true,
        secure: false, // 如果后端使用自签名证书，设置为false
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        onProxyReq: (proxyReq, req, res) => {
          console.log('Proxying request:', req.method, req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('Received response:', proxyRes.statusCode, req.url);
        }
      }
    },
    cors: true // 启用CORS
  },
  appType: 'spa', // 单页面应用模式
})