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
  appType: 'mpa', // 多页面应用模式
  build: {
    rollupOptions: {
      input: {
        main: './index.html', // Vue入口
        admin: './public/index.html', // 管理系统入口
        login: './public/login.html', // 登录页面
        orders: './public/orders.html', // 订单管理
        customers: './public/customers.html', // 客户管理
        carriers: './public/carriers.html', // 承运商管理
        vehicles: './public/vehicles.html', // 车辆管理
        tenants: './public/tenants.html', // 租户管理
        applications: './public/application-list.html', // 入驻申请
        reports: './public/reports.html', // 报表统计
        diagnostic: './public/network-diagnostic.html', // 网络诊断
        apiverify: './public/api-verification.html', // API验证
        endpointverify: './public/api-endpoint-verification.html', // 端点验证
        systemverify: './public/system-verification.html' // 系统验证
      }
    }
  }
})