import { createRouter, createWebHistory } from 'vue-router'
import AdminPricingView from '../views/AdminPricingView.vue'
import CarrierPricingView from '../views/CarrierPricingView.vue'

const routes = [
  {
    path: '/admin/pricing',
    name: 'AdminPricing',
    component: AdminPricingView
  },
  {
    path: '/carrier/pricing',
    name: 'CarrierPricing',
    component: CarrierPricingView
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/admin/pricing'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router