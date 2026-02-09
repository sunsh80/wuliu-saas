<template>
  <div class="order-management-container">
    <h1>订单管理</h1>
    
    <!-- 订单列表 -->
    <section class="order-list-section">
      <h2>订单列表</h2>
      <div class="order-filters">
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="搜索订单号、客户..." 
          class="filter-input"
        />
        <select v-model="filters.status" class="filter-select">
          <option value="">所有状态</option>
          <option value="pending">待处理</option>
          <option value="quoted">已报价</option>
          <option value="confirmed">已确认</option>
          <option value="in_transit">运输中</option>
          <option value="delivered">已送达</option>
        </select>
        <button @click="applyFilters" class="btn btn-primary">筛选</button>
      </div>
      
      <div class="order-table-container">
        <table class="order-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>起始地</th>
              <th>目的地</th>
              <th>距离(km)</th>
              <th>预估费用</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td>{{ order.orderNumber }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.origin }}</td>
              <td>{{ order.destination }}</td>
              <td>{{ order.distance }}</td>
              <td>¥{{ order.quoteAmount?.toFixed(2) || '待报价' }}</td>
              <td>
                <span :class="['status-badge', `status-${order.status}`]">
                  {{ getStatusText(order.status) }}
                </span>
              </td>
              <td>
                <button 
                  @click="viewOrderDetails(order)" 
                  class="btn btn-sm btn-outline"
                >
                  查看
                </button>
                <button 
                  v-if="order.status === 'quoted'" 
                  @click="confirmOrder(order)" 
                  class="btn btn-sm btn-success"
                >
                  确认
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- 订单详情模态框 -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeOrderDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>订单详情 - {{ selectedOrder.orderNumber }}</h2>
          <button @click="closeOrderDetails" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="order-summary">
            <div class="summary-item">
              <label>客户:</label>
              <span>{{ selectedOrder.customerName }}</span>
            </div>
            <div class="summary-item">
              <label>起始地:</label>
              <span>{{ selectedOrder.origin }}</span>
            </div>
            <div class="summary-item">
              <label>目的地:</label>
              <span>{{ selectedOrder.destination }}</span>
            </div>
            <div class="summary-item">
              <label>距离:</label>
              <span>{{ selectedOrder.distance }} km</span>
            </div>
            <div class="summary-item">
              <label>预计时长:</label>
              <span>{{ selectedOrder.estimatedDuration }} 分钟</span>
            </div>
            <div class="summary-item">
              <label>货物信息:</label>
              <span>{{ selectedOrder.cargoDescription }}</span>
            </div>
            <div class="summary-item">
              <label>是否冷藏:</label>
              <span>{{ selectedOrder.isRefrigerated ? '是' : '否' }}</span>
            </div>
            <div class="summary-item">
              <label>订单状态:</label>
              <span :class="['status-badge', `status-${selectedOrder.status}`]">
                {{ getStatusText(selectedOrder.status) }}
              </span>
            </div>
          </div>
          
          <!-- 报价详情 -->
          <div class="quote-details" v-if="selectedOrder.quotes && selectedOrder.quotes.length > 0">
            <h3>报价详情</h3>
            <div 
              v-for="quote in selectedOrder.quotes" 
              :key="quote.carrierId"
              class="quote-item"
            >
              <div class="quote-header">
                <h4>{{ quote.carrierName }}</h4>
                <span class="quote-price">¥{{ quote.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="quote-breakdown">
                <p>基础费用: ¥{{ quote.baseFee.toFixed(2) }}</p>
                <p v-if="quote.distanceFee > 0">距离费用: ¥{{ quote.distanceFee.toFixed(2) }}</p>
                <p v-if="quote.durationFee > 0">时长费用: ¥{{ quote.durationFee.toFixed(2) }}</p>
                <p v-if="quote.surcharge > 0">附加费: ¥{{ quote.surcharge.toFixed(2) }}</p>
              </div>
              <div class="quote-actions" v-if="selectedOrder.status === 'quoted'">
                <button 
                  @click="acceptQuote(selectedOrder.id, quote.carrierId)" 
                  class="btn btn-sm btn-success"
                >
                  接受此报价
                </button>
              </div>
            </div>
          </div>
          
          <!-- 附加费管理 -->
          <div class="addons-section" v-if="selectedOrder.status === 'confirmed'">
            <h3>附加费管理</h3>
            
            <div class="addon-form">
              <div class="form-row">
                <input 
                  v-model="newAddon.description" 
                  type="text" 
                  placeholder="附加费描述"
                  class="form-input"
                />
                <input 
                  v-model="newAddon.amount" 
                  type="number" 
                  placeholder="金额"
                  class="form-input"
                />
                <button @click="addAddon" class="btn btn-primary">添加附加费</button>
              </div>
            </div>
            
            <div class="addons-list" v-if="selectedOrder.addons && selectedOrder.addons.length > 0">
              <div 
                v-for="(addon, index) in selectedOrder.addons" 
                :key="index"
                class="addon-item"
              >
                <div class="addon-info">
                  <span class="addon-description">{{ addon.description }}</span>
                  <span class="addon-amount">¥{{ addon.amount.toFixed(2) }}</span>
                </div>
                <div class="addon-status">
                  <span :class="['status-badge', `status-${addon.status}`]">
                    {{ getAddonStatusText(addon.status) }}
                  </span>
                </div>
                <div class="addon-actions">
                  <button 
                    v-if="addon.status === 'pending'" 
                    @click="confirmAddon(addon.id)" 
                    class="btn btn-sm btn-success"
                  >
                    确认
                  </button>
                  <button 
                    v-if="addon.status === 'pending'" 
                    @click="rejectAddon(addon.id)" 
                    class="btn btn-sm btn-danger"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeOrderDetails" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { pricingApi } from '../services/api'

export default {
  name: 'OrderManagementView',
  setup() {
    // 示例订单数据
    const orders = ref([
      {
        id: 1,
        orderNumber: 'ORD20231101001',
        customerName: '张三',
        origin: '北京市朝阳区',
        destination: '上海市浦东新区',
        distance: 1200,
        estimatedDuration: 720,
        cargoDescription: '电子产品',
        isRefrigerated: false,
        status: 'quoted',
        quoteAmount: 1250.50,
        quotes: [
          {
            carrierId: 1,
            carrierName: '顺丰速运',
            baseFee: 800.00,
            distanceFee: 240.00,
            durationFee: 120.00,
            surcharge: 90.50,
            totalAmount: 1250.50
          },
          {
            carrierId: 2,
            carrierName: '圆通快递',
            baseFee: 750.00,
            distanceFee: 200.00,
            durationFee: 100.00,
            surcharge: 80.00,
            totalAmount: 1130.00
          }
        ],
        addons: []
      },
      {
        id: 2,
        orderNumber: 'ORD20231101002',
        customerName: '李四',
        origin: '广州市天河区',
        destination: '深圳市南山区',
        distance: 150,
        estimatedDuration: 120,
        cargoDescription: '服装',
        isRefrigerated: true,
        status: 'confirmed',
        quoteAmount: 320.00,
        quotes: [],
        addons: [
          {
            id: 1,
            description: '夜间配送服务',
            amount: 50.00,
            status: 'pending'
          },
          {
            id: 2,
            description: '保价服务',
            amount: 30.00,
            status: 'confirmed'
          }
        ]
      },
      {
        id: 3,
        orderNumber: 'ORD20231101003',
        customerName: '王五',
        origin: '杭州市西湖区',
        destination: '南京市鼓楼区',
        distance: 300,
        estimatedDuration: 240,
        cargoDescription: '食品',
        isRefrigerated: true,
        status: 'pending',
        quoteAmount: null,
        quotes: [],
        addons: []
      }
    ])
    
    // 筛选条件
    const filters = ref({
      search: '',
      status: ''
    })
    
    // 选中的订单
    const selectedOrder = ref(null)
    
    // 新增附加费
    const newAddon = ref({
      description: '',
      amount: 0
    })
    
    // 计算属性：过滤后的订单
    const filteredOrders = computed(() => {
      return orders.value.filter(order => {
        const matchesSearch = !filters.value.search || 
          order.orderNumber.includes(filters.value.search) || 
          order.customerName.includes(filters.value.search)
        
        const matchesStatus = !filters.value.status || order.status === filters.value.status
        
        return matchesSearch && matchesStatus
      })
    })
    
    // 应用筛选
    const applyFilters = () => {
      // 过滤逻辑已经在computed属性中实现
    }
    
    // 查看订单详情
    const viewOrderDetails = (order) => {
      selectedOrder.value = order
    }
    
    // 关闭订单详情
    const closeOrderDetails = () => {
      selectedOrder.value = null
      newAddon.value = { description: '', amount: 0 }
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        pending: '待处理',
        quoted: '已报价',
        confirmed: '已确认',
        in_transit: '运输中',
        delivered: '已送达'
      }
      return statusMap[status] || status
    }
    
    // 获取附加费状态文本
    const getAddonStatusText = (status) => {
      const statusMap = {
        pending: '待确认',
        confirmed: '已确认',
        rejected: '已拒绝'
      }
      return statusMap[status] || status
    }
    
    // 接受报价
    const acceptQuote = (orderId, carrierId) => {
      console.log(`接受订单 ${orderId} 的承运商 ${carrierId} 的报价`)
      // 这里应该调用API来接受报价
      alert(`已接受报价，订单状态将更新`)
    }
    
    // 添加附加费
    const addAddon = () => {
      if (!newAddon.value.description || newAddon.value.amount <= 0) {
        alert('请输入有效的附加费描述和金额')
        return
      }
      
      // 添加到订单的附加费列表
      if (selectedOrder.value) {
        selectedOrder.value.addons.push({
          id: Date.now(), // 临时ID
          description: newAddon.value.description,
          amount: parseFloat(newAddon.value.amount),
          status: 'pending'
        })
        
        // 清空表单
        newAddon.value = { description: '', amount: 0 }
        
        alert('附加费已添加，等待客户确认')
      }
    }
    
    // 确认附加费
    const confirmAddon = (addonId) => {
      const addon = selectedOrder.value.addons.find(a => a.id === addonId)
      if (addon) {
        addon.status = 'confirmed'
        alert('附加费已确认')
      }
    }
    
    // 拒绝附加费
    const rejectAddon = (addonId) => {
      const addon = selectedOrder.value.addons.find(a => a.id === addonId)
      if (addon) {
        addon.status = 'rejected'
        alert('附加费已拒绝')
      }
    }
    
    // 确认订单
    const confirmOrder = (order) => {
      console.log(`确认订单 ${order.orderNumber}`)
      // 这里应该调用API来确认订单
      alert(`订单 ${order.orderNumber} 已确认`)
    }
    
    return {
      orders,
      filteredOrders,
      filters,
      selectedOrder,
      newAddon,
      applyFilters,
      viewOrderDetails,
      closeOrderDetails,
      getStatusText,
      getAddonStatusText,
      acceptQuote,
      addAddon,
      confirmAddon,
      rejectAddon,
      confirmOrder
    }
  }
}
</script>

<style scoped>
.order-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.order-list-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.order-list-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.order-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-input, .filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-input {
  flex-grow: 1;
  min-width: 200px;
}

.order-table-container {
  overflow-x: auto;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
}

.order-table th,
.order-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.order-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #555;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending { background-color: #ffc107; color: #333; }
.status-quoted { background-color: #17a2b8; color: white; }
.status-confirmed { background-color: #28a745; color: white; }
.status-in_transit { background-color: #007bff; color: white; }
.status-delivered { background-color: #6f42c1; color: white; }

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.order-summary {
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-item label {
  font-weight: bold;
  width: 120px;
  color: #555;
}

.quote-details {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.quote-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quote-header h4 {
  margin: 0;
  color: #333;
}

.quote-price {
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
}

.quote-breakdown p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.quote-actions {
  margin-top: 10px;
  text-align: right;
}

.addons-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.addon-form {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.addons-list {
  margin-top: 15px;
}

.addon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.addon-info {
  flex-grow: 1;
}

.addon-description {
  font-weight: bold;
  display: block;
}

.addon-amount {
  color: #007bff;
  font-weight: bold;
}

.addon-status {
  margin: 0 15px;
  min-width: 80px;
}

.addon-actions {
  display: flex;
  gap: 5px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  text-align: right;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}
</style>