<template>
  <div class="commission-management-container">
    <h1>抽佣管理</h1>

    <!-- 抽佣配置区域 -->
    <section class="commission-config-section">
      <h2>抽佣规则配置</h2>
      
      <div class="config-form">
        <div class="form-row">
          <div class="form-group">
            <label for="platformCommissionRate">平台抽佣比例 (%):</label>
            <input
              type="number"
              id="platformCommissionRate"
              v-model="commissionConfig.platformRate"
              min="0"
              max="100"
              step="0.01"
              @change="updateConfig"
            />
            <span class="unit">%</span>
          </div>
          
          <div class="form-group">
            <label for="carrierCommissionRate">承运商抽佣比例 (%):</label>
            <input
              type="number"
              id="carrierCommissionRate"
              v-model="commissionConfig.carrierRate"
              min="0"
              max="100"
              step="0.01"
              @change="updateConfig"
            />
            <span class="unit">%</span>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="minCommissionAmount">最低抽佣金额 (元):</label>
            <input
              type="number"
              id="minCommissionAmount"
              v-model="commissionConfig.minAmount"
              min="0"
              step="0.01"
              @change="updateConfig"
            />
            <span class="unit">元</span>
          </div>
          
          <div class="form-group">
            <label for="maxCommissionAmount">最高抽佣金额 (元):</label>
            <input
              type="number"
              id="maxCommissionAmount"
              v-model="commissionConfig.maxAmount"
              min="0"
              step="0.01"
              @change="updateConfig"
            />
            <span class="unit">元</span>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group full-width">
            <label for="commissionDescription">抽佣说明:</label>
            <textarea
              id="commissionDescription"
              v-model="commissionConfig.description"
              rows="3"
              placeholder="请输入抽佣规则说明..."
              @change="updateConfig"
            ></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 分级抽佣配置 -->
    <section class="tiered-commission-section">
      <h2>分级抽佣配置</h2>
      
      <div class="tiered-commission-table">
        <table class="commission-table">
          <thead>
            <tr>
              <th>级别</th>
              <th>订单金额范围 (元)</th>
              <th>平台抽佣比例 (%)</th>
              <th>承运商抽佣比例 (%)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tier, index) in commissionConfig.tiers" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <div class="amount-range">
                  <input
                    type="number"
                    v-model="tier.minAmount"
                    min="0"
                    step="0.01"
                    placeholder="最小金额"
                    @change="updateConfig"
                  />
                  <span class="range-separator">-</span>
                  <input
                    type="number"
                    v-model="tier.maxAmount"
                    min="0"
                    step="0.01"
                    placeholder="最大金额"
                    @change="updateConfig"
                  />
                </div>
              </td>
              <td>
                <input
                  type="number"
                  v-model="tier.platformRate"
                  min="0"
                  max="100"
                  step="0.01"
                  @change="updateConfig"
                />
              </td>
              <td>
                <input
                  type="number"
                  v-model="tier.carrierRate"
                  min="0"
                  max="100"
                  step="0.01"
                  @change="updateConfig"
                />
              </td>
              <td>
                <button @click="removeTier(index)" class="btn btn-danger btn-sm">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <button @click="addTier" class="btn btn-primary">添加分级</button>
      </div>
    </section>

    <!-- 特殊商品/服务抽佣配置 -->
    <section class="special-commission-section">
      <h2>特殊商品/服务抽佣配置</h2>
      
      <div class="special-commission-controls">
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="commissionConfig.specialCommissions.refrigerated.enabled"
              @change="updateConfig"
            />
            冷藏商品抽佣
          </label>
          <div v-if="commissionConfig.specialCommissions.refrigerated.enabled" class="nested-config">
            <div class="form-row">
              <div class="form-group">
                <label>固定费用 (元):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.refrigerated.fixedFee"
                  min="0"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
              <div class="form-group">
                <label>百分比 (%):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.refrigerated.percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="commissionConfig.specialCommissions.insurance.enabled"
              @change="updateConfig"
            />
            保险服务抽佣
          </label>
          <div v-if="commissionConfig.specialCommissions.insurance.enabled" class="nested-config">
            <div class="form-row">
              <div class="form-group">
                <label>固定费用 (元):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.insurance.fixedFee"
                  min="0"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
              <div class="form-group">
                <label>百分比 (%):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.insurance.percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="commissionConfig.specialCommissions.loading.enabled"
              @change="updateConfig"
            />
            装卸服务抽佣
          </label>
          <div v-if="commissionConfig.specialCommissions.loading.enabled" class="nested-config">
            <div class="form-row">
              <div class="form-group">
                <label>固定费用 (元):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.loading.fixedFee"
                  min="0"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
              <div class="form-group">
                <label>百分比 (%):</label>
                <input
                  type="number"
                  v-model="commissionConfig.specialCommissions.loading.percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  @change="updateConfig"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 抽佣历史记录 -->
    <section class="commission-history-section">
      <div class="section-header">
        <h2>抽佣历史记录</h2>
        <div class="history-actions">
          <button @click="exportHistory" class="btn btn-outline">导出记录</button>
        </div>
      </div>
      
      <div class="history-filters">
        <div class="filter-item">
          <label>时间范围:</label>
          <input type="date" v-model="historyFilters.startDate" />
          <span class="date-separator">至</span>
          <input type="date" v-model="historyFilters.endDate" />
        </div>
        <div class="filter-item">
          <label>订单类型:</label>
          <select v-model="historyFilters.orderType">
            <option value="">全部</option>
            <option value="regular">普通订单</option>
            <option value="refrigerated">冷藏订单</option>
            <option value="express">加急订单</option>
          </select>
        </div>
        <div class="filter-item">
          <button @click="applyHistoryFilters" class="btn btn-primary">查询</button>
        </div>
      </div>
      
      <div class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>订单金额 (元)</th>
              <th>平台抽佣 (元)</th>
              <th>承运商抽佣 (元)</th>
              <th>抽佣时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in commissionHistory" :key="record.id">
              <td>{{ record.orderId }}</td>
              <td>{{ formatCurrency(record.orderAmount) }}</td>
              <td>{{ formatCurrency(record.platformCommission) }}</td>
              <td>{{ formatCurrency(record.carrierCommission) }}</td>
              <td>{{ formatDate(record.commissionTime) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(record.status)">
                  {{ getStatusName(record.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="saveConfig" class="btn btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '保存配置' }}
      </button>
      <button @click="resetConfig" class="btn btn-secondary" :disabled="saving">重置</button>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="saving" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'CommissionManagementView',
  setup() {
    // 抽佣配置数据
    const commissionConfig = reactive({
      platformRate: 5.00,  // 平台抽佣比例
      carrierRate: 3.00,   // 承运商抽佣比例
      minAmount: 0.50,     // 最低抽佣金额
      maxAmount: 50.00,    // 最高抽佣金额
      description: '默认抽佣规则：平台抽取5%，承运商抽取3%',
      tiers: [             // 分级抽佣配置
        {
          minAmount: 0,
          maxAmount: 100,
          platformRate: 6.00,
          carrierRate: 3.50
        },
        {
          minAmount: 100,
          maxAmount: 500,
          platformRate: 5.00,
          carrierRate: 3.00
        },
        {
          minAmount: 500,
          maxAmount: Infinity,
          platformRate: 4.00,
          carrierRate: 2.50
        }
      ],
      specialCommissions: {  // 特殊商品/服务抽佣
        refrigerated: {
          enabled: true,
          fixedFee: 2.00,
          percentage: 2.00
        },
        insurance: {
          enabled: true,
          fixedFee: 1.00,
          percentage: 1.00
        },
        loading: {
          enabled: false,
          fixedFee: 0.00,
          percentage: 0.00
        }
      }
    })

    // 历史记录过滤条件
    const historyFilters = reactive({
      startDate: '',
      endDate: '',
      orderType: ''
    })

    // 示例抽佣历史记录
    const commissionHistory = ref([
      {
        id: 1,
        orderId: 'ORD001',
        orderAmount: 120.50,
        platformCommission: 6.03,
        carrierCommission: 3.62,
        commissionTime: '2023-10-15T10:30:00Z',
        status: 'completed'
      },
      {
        id: 2,
        orderId: 'ORD002',
        orderAmount: 85.00,
        platformCommission: 4.25,
        carrierCommission: 2.55,
        commissionTime: '2023-10-15T14:20:00Z',
        status: 'completed'
      },
      {
        id: 3,
        orderId: 'ORD003',
        orderAmount: 250.75,
        platformCommission: 10.03,
        carrierCommission: 6.02,
        commissionTime: '2023-10-16T09:15:00Z',
        status: 'pending'
      },
      {
        id: 4,
        orderId: 'ORD004',
        orderAmount: 65.20,
        platformCommission: 3.26,
        carrierCommission: 1.96,
        commissionTime: '2023-10-16T16:45:00Z',
        status: 'completed'
      },
      {
        id: 5,
        orderId: 'ORD005',
        orderAmount: 180.00,
        platformCommission: 7.20,
        carrierCommission: 4.32,
        commissionTime: '2023-10-17T11:30:00Z',
        status: 'completed'
      }
    ])

    // 保存状态
    const saving = ref(false)

    // 添加分级
    const addTier = () => {
      commissionConfig.tiers.push({
        minAmount: 0,
        maxAmount: 0,
        platformRate: 0,
        carrierRate: 0
      })
    }

    // 删除分级
    const removeTier = (index) => {
      if (commissionConfig.tiers.length > 1) {
        commissionConfig.tiers.splice(index, 1)
      } else {
        alert('至少需要保留一个分级配置')
      }
    }

    // 更新配置
    const updateConfig = () => {
      console.log('抽佣配置已更新:', commissionConfig)
    }

    // 保存配置
    const saveConfig = async () => {
      try {
        saving.value = true
        
        // 这里应该调用API保存配置
        console.log('保存抽佣配置:', commissionConfig)
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        alert('抽佣配置保存成功！')
      } catch (error) {
        console.error('保存抽佣配置失败:', error)
        alert('保存失败: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    // 重置配置
    const resetConfig = () => {
      if (confirm('确定要重置所有抽佣配置吗？')) {
        // 重置为默认值
        commissionConfig.platformRate = 5.00
        commissionConfig.carrierRate = 3.00
        commissionConfig.minAmount = 0.50
        commissionConfig.maxAmount = 50.00
        commissionConfig.description = '默认抽佣规则：平台抽取5%，承运商抽取3%'
        
        commissionConfig.tiers = [
          {
            minAmount: 0,
            maxAmount: 100,
            platformRate: 6.00,
            carrierRate: 3.50
          },
          {
            minAmount: 100,
            maxAmount: 500,
            platformRate: 5.00,
            carrierRate: 3.00
          },
          {
            minAmount: 500,
            maxAmount: Infinity,
            platformRate: 4.00,
            carrierRate: 2.50
          }
        ]
        
        commissionConfig.specialCommissions = {
          refrigerated: {
            enabled: true,
            fixedFee: 2.00,
            percentage: 2.00
          },
          insurance: {
            enabled: true,
            fixedFee: 1.00,
            percentage: 1.00
          },
          loading: {
            enabled: false,
            fixedFee: 0.00,
            percentage: 0.00
          }
        }
      }
    }

    // 格式化货币
    const formatCurrency = (amount) => {
      return amount.toFixed(2)
    }

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }

    // 获取状态名称
    const getStatusName = (status) => {
      const statusMap = {
        'completed': '已完成',
        'pending': '待处理',
        'failed': '失败'
      }
      return statusMap[status] || status
    }

    // 获取状态样式类
    const getStatusClass = (status) => {
      return `status-${status}`
    }

    // 应用历史记录过滤
    const applyHistoryFilters = () => {
      console.log('应用历史记录过滤:', historyFilters)
    }

    // 导出历史记录
    const exportHistory = () => {
      console.log('导出抽佣历史记录')
      alert('正在导出抽佣历史记录...')
    }

    return {
      commissionConfig,
      historyFilters,
      commissionHistory,
      saving,
      addTier,
      removeTier,
      updateConfig,
      saveConfig,
      resetConfig,
      formatCurrency,
      formatDate,
      getStatusName,
      getStatusClass,
      applyHistoryFilters,
      exportHistory
    }
  }
}
</script>

<style scoped>
.commission-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.commission-config-section,
.tiered-commission-section,
.special-commission-section,
.commission-history-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.commission-config-section h2,
.tiered-commission-section h2,
.special-commission-section h2,
.commission-history-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.config-form {
  margin-top: 15px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  width: 100%;
  min-width: auto;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.unit {
  align-self: flex-start;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 5px;
}

.range-separator {
  color: #666;
}

.nested-config {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.commission-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.commission-table th,
.commission-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.commission-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #555;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  align-items: end;
}

.history-filters .filter-item {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.history-filters .filter-item label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.history-filters .filter-item input,
.history-filters .filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-separator {
  margin: 0 10px;
  align-self: center;
}

.history-table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #555;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.status-completed {
  background-color: #00b894;
  color: white;
}

.status-pending {
  background-color: #74b9ff;
  color: white;
}

.status-failed {
  background-color: #d63031;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
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

.loading-overlay {
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

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>