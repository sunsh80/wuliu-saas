import { createRouter, createWebHistory } from 'vue-router'
// 注意：暂时使用异步导入，稍后会创建实际的组件
const QuoteManagementView = () => import('../views/QuoteManagementView.vue')
const OrderManagementView = () => import('../views/OrderManagementView.vue')

const routes = [
  {
    path: '/quotes',
    name: 'QuoteManagement',
    component: QuoteManagementView
  },
  {
    path: '/orders',
    name: 'OrderManagement',
    component: OrderManagementView
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/quotes'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router