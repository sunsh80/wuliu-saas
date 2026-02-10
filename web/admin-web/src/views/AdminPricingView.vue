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

    <!-- 24小时时间段配置 -->
    <section class="pricing-section">
      <h2>24小时时间段配置 (15分钟粒度)</h2>
      <div class="time-slots-table">
        <table class="time-slots-grid">
          <thead>
            <tr>
              <th>时间段</th>
              <th>价格倍数</th>
              <th>起步价 (元)</th>
              <th>里程单价 (元/km)</th>
              <th>时长单价 (元/分钟)</th>
              <th>冷藏附加费 (元)</th>
              <th>天气附加费 (元)</th>
              <th>车型附加费 (元)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="timeSlot in timeSlots24H" :key="timeSlot.timeRange">
              <td>{{ timeSlot.timeRange }}</td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.multiplier" 
                  @change="updateConfig"
                  min="0" 
                  step="0.1"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.basePrice" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.mileageRate" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.timeRate" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.refrigeratedSurcharge" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.weatherSurcharge" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="timeSlot.vehicleSurcharge" 
                  @change="updateConfig"
                  min="0" 
                  step="0.01"
                  :disabled="loading"
                />
              </td>
            </tr>
          </tbody>
        </table>
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

    // 24小时时间段配置（每15分钟一个时间槽）
    const timeSlots24H = ref([])
    
    // 生成24小时时间段数据
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const startHour = String(hour).padStart(2, '0')
        const startMinute = String(minute).padStart(2, '0')
        const endHour = minute === 45 ? String(hour + 1).padStart(2, '0') : startHour
        const endMinute = minute === 45 ? '00' : String(minute + 15).padStart(2, '0')
        const timeRange = `${startHour}:${startMinute}-${endHour}:${endMinute}`
        
        timeSlots24H.value.push({
          timeRange: timeRange,
          multiplier: 1.0, // 默认倍数
          basePrice: pricingConfig.basePrice,
          mileageRate: pricingConfig.mileageRate,
          timeRate: pricingConfig.timeRate,
          refrigeratedSurcharge: pricingConfig.refrigeratedSurcharge,
          weatherSurcharge: 0,
          vehicleSurcharge: 0
        })
      }
    }

    // 加载状态
    const loading = ref(false)

    // 更新配置
    const updateConfig = () => {
      console.log('配置已更新:', {
        pricingConfig,
        timeSlots24H: timeSlots24H.value
      })
    }

    // 保存配置到后端
    const saveConfig = async () => {
      try {
        loading.value = true

        // 构造完整的配置对象
        const configData = {
          pricingConfig,
          timeSlots24H: timeSlots24H.value
        }

        // 调用后端API保存配置
        const response = await pricingApi.updatePlatformPricingRules(configData)

        console.log('平台配置保存成功:', response)
        alert('平台配置保存成功！')
      } catch (error) {
        console.error('保存平台配置失败:', error)
        alert(`保存失败: ${error.message || '未知错误'}`)
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

        // 重置24小时时间段配置
        for (let i = 0; i < timeSlots24H.value.length; i++) {
          timeSlots24H.value[i].multiplier = 1.0
          timeSlots24H.value[i].basePrice = 10.00
          timeSlots24H.value[i].mileageRate = 2.00
          timeSlots24H.value[i].timeRate = 0.50
          timeSlots24H.value[i].refrigeratedSurcharge = 5.00
          timeSlots24H.value[i].weatherSurcharge = 0
          timeSlots24H.value[i].vehicleSurcharge = 0
        }
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
          // 这里可以根据实际API返回的数据结构来更新配置
          console.log('平台配置加载完成:', response.data)
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
      timeSlots24H,
      loading,
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

.time-slots-table {
  overflow-x: auto;
}

.time-slots-grid {
  width: 100%;
  border-collapse: collapse;
}

.time-slots-grid th,
.time-slots-grid td {
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;
}

.time-slots-grid th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #555;
  position: sticky;
  top: 0;
}

.time-slots-grid td input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: center;
}

.time-slots-grid tr:nth-child(even) {
  background-color: #f9f9f9;
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