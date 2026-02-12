<template>
  <div class="violation-management-container">
    <h1>供应商违规处理</h1>

    <!-- 违规记录搜索过滤器 -->
    <section class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label for="supplierFilter">供应商名称:</label>
          <input
            type="text"
            id="supplierFilter"
            v-model="filters.supplierName"
            placeholder="输入供应商名称"
          />
        </div>
        
        <div class="filter-item">
          <label for="violationTypeFilter">违规类型:</label>
          <select id="violationTypeFilter" v-model="filters.violationType">
            <option value="">全部</option>
            <option value="delivery_delay">配送延迟</option>
            <option value="quality_issue">质量问题</option>
            <option value="service_complaint">服务投诉</option>
            <option value="document_error">单据错误</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div class="filter-item">
          <label for="dateRangeFilter">日期范围:</label>
          <input
            type="date"
            id="startDateFilter"
            v-model="filters.startDate"
          />
          <span class="date-separator">至</span>
          <input
            type="date"
            id="endDateFilter"
            v-model="filters.endDate"
          />
        </div>
        
        <div class="filter-item">
          <button @click="applyFilters" class="btn btn-primary">搜索</button>
          <button @click="resetFilters" class="btn btn-secondary">重置</button>
        </div>
      </div>
    </section>

    <!-- 违规记录表格 -->
    <section class="violation-table-section">
      <div class="table-header">
        <h2>违规记录列表</h2>
        <div class="table-actions">
          <button @click="exportViolations" class="btn btn-outline">导出数据</button>
        </div>
      </div>
      
      <div class="table-container">
        <table class="violation-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>供应商名称</th>
              <th>违规类型</th>
              <th>违规描述</th>
              <th>发生时间</th>
              <th>严重程度</th>
              <th>处理状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(violation, index) in filteredViolations" :key="violation.id">
              <td>{{ index + 1 }}</td>
              <td>{{ violation.supplierName }}</td>
              <td>
                <span class="violation-type-badge" :class="getViolationTypeClass(violation.type)">
                  {{ getViolationTypeName(violation.type) }}
                </span>
              </td>
              <td>{{ violation.description }}</td>
              <td>{{ formatDate(violation.timestamp) }}</td>
              <td>
                <span class="severity-badge" :class="getSeverityClass(violation.severity)">
                  {{ getSeverityName(violation.severity) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(violation.status)">
                  {{ getStatusName(violation.status) }}
                </span>
              </td>
              <td>
                <button @click="viewDetails(violation)" class="btn btn-sm btn-outline">详情</button>
                <button @click="handleViolation(violation)" class="btn btn-sm btn-warning">处理</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 违规统计信息 -->
    <section class="statistics-section">
      <h2>违规统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ totalViolations }}</div>
          <div class="stat-label">总违规次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ pendingViolations }}</div>
          <div class="stat-label">待处理</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ resolvedViolations }}</div>
          <div class="stat-label">已处理</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ criticalViolations }}</div>
          <div class="stat-label">严重违规</div>
        </div>
      </div>
    </section>

    <!-- 违规处理弹窗 -->
    <div v-if="showHandleModal" class="modal-overlay" @click="closeHandleModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>处理违规记录</h3>
          <button class="close-btn" @click="closeHandleModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>供应商: {{ currentViolation?.supplierName }}</label>
          </div>
          <div class="form-group">
            <label>违规类型: {{ getViolationTypeName(currentViolation?.type) }}</label>
          </div>
          <div class="form-group">
            <label for="handleResult">处理结果:</label>
            <textarea
              id="handleResult"
              v-model="handleForm.result"
              rows="4"
              placeholder="请输入处理结果或措施..."
            ></textarea>
          </div>
          <div class="form-group">
            <label for="penaltyPoints">处罚积分:</label>
            <input
              type="number"
              id="penaltyPoints"
              v-model="handleForm.penaltyPoints"
              min="0"
              max="100"
            />
          </div>
          <div class="form-group">
            <label for="warningLevel">警告等级:</label>
            <select id="warningLevel" v-model="handleForm.warningLevel">
              <option value="normal">普通</option>
              <option value="medium">中等</option>
              <option value="high">高级</option>
              <option value="critical">严重</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeHandleModal" class="btn btn-secondary">取消</button>
          <button @click="submitHandle" class="btn btn-primary">提交处理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ViolationManagementView',
  setup() {
    // 示例违规记录数据
    const violations = ref([
      {
        id: 1,
        supplierName: '顺丰速运',
        type: 'delivery_delay',
        description: '订单#ORD001配送超时2小时',
        timestamp: '2023-10-15T10:30:00Z',
        severity: 'medium',
        status: 'pending'
      },
      {
        id: 2,
        supplierName: '圆通快递',
        type: 'quality_issue',
        description: '货物在运输过程中出现损坏',
        timestamp: '2023-10-16T14:20:00Z',
        severity: 'high',
        status: 'resolved'
      },
      {
        id: 3,
        supplierName: '韵达快递',
        type: 'service_complaint',
        description: '客户投诉配送员态度恶劣',
        timestamp: '2023-10-17T09:15:00Z',
        severity: 'low',
        status: 'pending'
      },
      {
        id: 4,
        supplierName: '中通快递',
        type: 'document_error',
        description: '运单信息填写错误',
        timestamp: '2023-10-18T16:45:00Z',
        severity: 'low',
        status: 'resolved'
      },
      {
        id: 5,
        supplierName: '申通快递',
        type: 'delivery_delay',
        description: '批量订单配送延迟超过4小时',
        timestamp: '2023-10-19T11:30:00Z',
        severity: 'critical',
        status: 'pending'
      }
    ])

    // 过滤条件
    const filters = ref({
      supplierName: '',
      violationType: '',
      startDate: '',
      endDate: ''
    })

    // 弹窗相关
    const showHandleModal = ref(false)
    const currentViolation = ref(null)
    const handleForm = ref({
      result: '',
      penaltyPoints: 0,
      warningLevel: 'normal'
    })

    // 计算属性：根据过滤条件筛选违规记录
    const filteredViolations = computed(() => {
      return violations.value.filter(violation => {
        // 供应商名称过滤
        if (filters.value.supplierName && 
            !violation.supplierName.toLowerCase().includes(filters.value.supplierName.toLowerCase())) {
          return false
        }

        // 违规类型过滤
        if (filters.value.violationType && violation.type !== filters.value.violationType) {
          return false
        }

        // 日期范围过滤
        if (filters.value.startDate && new Date(violation.timestamp) < new Date(filters.value.startDate)) {
          return false
        }
        if (filters.value.endDate && new Date(violation.timestamp) > new Date(filters.value.endDate)) {
          return false
        }

        return true
      })
    })

    // 统计计算属性
    const totalViolations = computed(() => violations.value.length)
    const pendingViolations = computed(() => violations.value.filter(v => v.status === 'pending').length)
    const resolvedViolations = computed(() => violations.value.filter(v => v.status === 'resolved').length)
    const criticalViolations = computed(() => violations.value.filter(v => v.severity === 'critical').length)

    // 方法
    const applyFilters = () => {
      console.log('应用过滤条件:', filters.value)
    }

    const resetFilters = () => {
      filters.value = {
        supplierName: '',
        violationType: '',
        startDate: '',
        endDate: ''
      }
    }

    const getViolationTypeName = (type) => {
      const types = {
        'delivery_delay': '配送延迟',
        'quality_issue': '质量问题',
        'service_complaint': '服务投诉',
        'document_error': '单据错误',
        'other': '其他'
      }
      return types[type] || type
    }

    const getViolationTypeClass = (type) => {
      return `badge-${type.replace('_', '-')}`
    }

    const getSeverityName = (severity) => {
      const severities = {
        'low': '低',
        'medium': '中',
        'high': '高',
        'critical': '严重'
      }
      return severities[severity] || severity
    }

    const getSeverityClass = (severity) => {
      return `severity-${severity}`
    }

    const getStatusName = (status) => {
      const statuses = {
        'pending': '待处理',
        'resolved': '已处理',
        'in_progress': '处理中'
      }
      return statuses[status] || status
    }

    const getStatusClass = (status) => {
      return `status-${status.replace('_', '-')}`
    }

    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN')
    }

    const viewDetails = (violation) => {
      console.log('查看违规详情:', violation)
      alert(`违规详情:\n供应商: ${violation.supplierName}\n类型: ${getViolationTypeName(violation.type)}\n描述: ${violation.description}`)
    }

    const handleViolation = (violation) => {
      currentViolation.value = violation
      showHandleModal.value = true
      handleForm.value = {
        result: '',
        penaltyPoints: 0,
        warningLevel: 'normal'
      }
    }

    const closeHandleModal = () => {
      showHandleModal.value = false
      currentViolation.value = null
    }

    const submitHandle = () => {
      console.log('提交处理结果:', {
        violation: currentViolation.value,
        form: handleForm.value
      })
      
      // 更新违规记录状态
      const violation = violations.value.find(v => v.id === currentViolation.value.id)
      if (violation) {
        violation.status = 'resolved'
      }
      
      alert('违规处理提交成功！')
      closeHandleModal()
    }

    const exportViolations = () => {
      console.log('导出违规记录')
      alert('正在导出违规记录...')
    }

    return {
      violations,
      filteredViolations,
      filters,
      showHandleModal,
      currentViolation,
      handleForm,
      totalViolations,
      pendingViolations,
      resolvedViolations,
      criticalViolations,
      applyFilters,
      resetFilters,
      getViolationTypeName,
      getViolationTypeClass,
      getSeverityName,
      getSeverityClass,
      getStatusName,
      getStatusClass,
      formatDate,
      viewDetails,
      handleViolation,
      closeHandleModal,
      submitHandle,
      exportViolations
    }
  }
}
</script>

<style scoped>
.violation-management-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.filter-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.filter-item label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.filter-item input,
.filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-separator {
  margin: 0 10px;
  align-self: center;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-header h2 {
  margin: 0;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.violation-table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

.violation-table {
  width: 100%;
  border-collapse: collapse;
}

.violation-table th,
.violation-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.violation-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #555;
  position: sticky;
  top: 0;
}

.violation-table tr:hover {
  background-color: #f5f5f5;
}

.violation-type-badge,
.severity-badge,
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.badge-delivery-delay {
  background-color: #ffeaa7;
  color: #d68910;
}

.badge-quality-issue {
  background-color: #fd79a8;
  color: #a55eea;
}

.badge-service-complaint {
  background-color: #fdcb6e;
  color: #e17055;
}

.badge-document-error {
  background-color: #636e72;
  color: #b2bec3;
}

.badge-other {
  background-color: #ddd;
  color: #555;
}

.severity-low {
  background-color: #00b894;
  color: white;
}

.severity-medium {
  background-color: #fdcb6e;
  color: #2d3436;
}

.severity-high {
  background-color: #e17055;
  color: white;
}

.severity-critical {
  background-color: #d63031;
  color: white;
}

.status-pending {
  background-color: #74b9ff;
  color: white;
}

.status-resolved {
  background-color: #00b894;
  color: white;
}

.status-in-progress {
  background-color: #fdcb6e;
  color: #2d3436;
}

.statistics-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 1em;
  color: #666;
  margin-top: 5px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-sm {
  padding: 4px 8px;
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

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
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
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>