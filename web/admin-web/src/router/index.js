import { createRouter, createWebHistory } from 'vue-router'
import AdminPricingView from '../views/AdminPricingView.vue'
import CarrierPricingView from '../views/CarrierPricingView.vue'
import ViolationManagementView from '../views/ViolationManagementView.vue'
import CommissionManagementView from '../views/CommissionManagementView.vue'
import InternalSettingsView from '../views/InternalSettingsView.vue'

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
    path: '/violations',
    name: 'ViolationManagement',
    component: ViolationManagementView
  },
  {
    path: '/commissions',
    name: 'CommissionManagement',
    component: CommissionManagementView
  },
  {
    path: '/settings',
    name: 'InternalSettings',
    component: InternalSettingsView
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