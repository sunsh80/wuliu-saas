<template>
  <div class="admin-pricing-container">
    <h1>平台定价规则配置</h1>
    
    <!-- 基础定价配置 -->
    <section class="pricing-section">
      <h2>基础定价配置</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="basePrice">起步价 (元)</label>
          <input 
            type="number" 
            id="basePrice" 
            v-model="pricingConfig.basePrice" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="mileageRate">里程单价 (元/公里)</label>
          <input 
            type="number" 
            id="mileageRate" 
            v-model="pricingConfig.mileageRate" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="timeRate">时长单价 (元/分钟)</label>
          <input 
            type="number" 
            id="timeRate" 
            v-model="pricingConfig.timeRate" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="refrigeratedSurcharge">冷藏附加费 (元/单)</label>
          <input 
            type="number" 
            id="refrigeratedSurcharge" 
            v-model="pricingConfig.refrigeratedSurcharge" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
      </div>
    </section>
    
    <!-- 时间规则配置 -->
    <section class="pricing-section">
      <h2>时间规则配置 (15分钟粒度)</h2>
      <div class="time-rules-container">
        <div 
          v-for="(rule, index) in pricingConfig.timeRules" 
          :key="index"
          class="time-rule-item"
        >
          <div class="time-slot">{{ formatTimeSlot(rule.startTime, rule.endTime) }}</div>
          <div class="time-multiplier">
            <label>价格倍数:</label>
            <input 
              type="number" 
              v-model="rule.multiplier" 
              @change="updateConfig"
              min="0" 
              step="0.1"
              :disabled="loading"
            />
          </div>
        </div>
      </div>
    </section>
    
    <!-- 承运商浮动边界设置 -->
    <section class="pricing-section">
      <h2>承运商浮动边界设置</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="minMarkup">最低上浮比例 (%)</label>
          <input 
            type="number" 
            id="minMarkup" 
            v-model="pricingConfig.minMarkup" 
            @change="updateConfig"
            min="-100" 
            max="1000"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="maxMarkup">最高上浮比例 (%)</label>
          <input 
            type="number" 
            id="maxMarkup" 
            v-model="pricingConfig.maxMarkup" 
            @change="updateConfig"
            min="-100" 
            max="1000"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="markupStep">调整步长 (%)</label>
          <input 
            type="number" 
            id="markupStep" 
            v-model="pricingConfig.markupStep" 
            @change="updateConfig"
            min="0.1" 
            step="0.1"
            :disabled="loading"
          />
        </div>
      </div>
    </section>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="saveConfig" class="btn btn-primary" :disabled="loading">
        {{ loading ? '保存中...' : '保存配置' }}
      </button>
      <button @click="resetConfig" class="btn btn-secondary" :disabled="loading">重置</button>
    </div>
    
    <!-- 加载遮罩层 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { pricingApi } from '../api'

export default {
  name: 'AdminPricingView',
  setup() {
    // 初始化定价配置数据
    const pricingConfig = reactive({
      basePrice: 10.00,
      mileageRate: 2.00,
      timeRate: 0.50,
      refrigeratedSurcharge: 5.00,
      minMarkup: -10,  // 最低下浮10%
      maxMarkup: 50,   // 最高上浮50%
      markupStep: 1,   // 调整步长1%
      timeRules: [
        { startTime: '00:00', endTime: '06:00', multiplier: 1.5 },  // 夜间时段
        { startTime: '06:00', endTime: '09:00', multiplier: 1.2 },  // 早高峰
        { startTime: '09:00', endTime: '17:00', multiplier: 1.0 },  // 平峰
        { startTime: '17:00', endTime: '21:00', multiplier: 1.3 },  // 晚高峰
        { startTime: '21:00', endTime: '23:59', multiplier: 1.4 }   // 夜间
      ]
    })

    // 加载状态
    const loading = ref(false)
    
    // 格式化时间段显示
    const formatTimeSlot = (startTime, endTime) => {
      return `${startTime} - ${endTime}`
    }

    // 更新配置
    const updateConfig = () => {
      console.log('配置已更新:', pricingConfig)
    }

    // 保存配置到后端
    const saveConfig = async () => {
      try {
        loading.value = true
        
        // 调用后端API保存配置
        const response = await pricingApi.updatePlatformPricingRules(pricingConfig)
        
        console.log('配置保存成功:', response)
        alert('配置保存成功！')
      } catch (error) {
        console.error('保存配置失败:', error)
        alert(`配置保存失败: ${error.message || '未知错误'}`)
      } finally {
        loading.value = false
      }
    }

    // 重置配置
    const resetConfig = () => {
      if (confirm('确定要重置所有配置吗？')) {
        pricingConfig.basePrice = 10.00
        pricingConfig.mileageRate = 2.00
        pricingConfig.timeRate = 0.50
        pricingConfig.refrigeratedSurcharge = 5.00
        pricingConfig.minMarkup = -10
        pricingConfig.maxMarkup = 50
        pricingConfig.markupStep = 1
        pricingConfig.timeRules = [
          { startTime: '00:00', endTime: '06:00', multiplier: 1.5 },
          { startTime: '06:00', endTime: '09:00', multiplier: 1.2 },
          { startTime: '09:00', endTime: '17:00', multiplier: 1.0 },
          { startTime: '17:00', endTime: '21:00', multiplier: 1.3 },
          { startTime: '21:00', endTime: '23:59', multiplier: 1.4 }
        ]
      }
    }

    // 组件挂载时加载现有配置
    onMounted(async () => {
      try {
        loading.value = true
        
        // 从后端API加载现有配置
        const response = await pricingApi.getPlatformPricingRules()
        
        // 如果API返回了数据，则更新本地配置
        if (response && response.data) {
          Object.assign(pricingConfig, response.data)
        }
        
        console.log('配置加载完成')
      } catch (error) {
        console.error('加载配置失败:', error)
        // 如果加载失败，使用默认值并提示用户
        alert(`加载配置失败: ${error.message || '使用默认配置'}`)
      } finally {
        loading.value = false
      }
    })

    return {
      pricingConfig,
      loading,
      formatTimeSlot,
      updateConfig,
      saveConfig,
      resetConfig
    }
  }
}
</script>

<style scoped>
.admin-pricing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.pricing-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.pricing-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.time-rules-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.time-rule-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  background-color: #f9f9f9;
  transition: box-shadow 0.3s;
}

.time-rule-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.time-slot {
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  background-color: #e9ecef;
  padding: 5px;
  border-radius: 4px;
  text-align: center;
}

.time-multiplier {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time-multiplier label {
  margin-right: 10px;
  font-weight: bold;
}

.time-multiplier input {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
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
  font-size: 16px;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
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