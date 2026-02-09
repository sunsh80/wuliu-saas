<template>
  <div class="carrier-pricing-container">
    <h1>承运商配价配置</h1>
    
    <!-- 时间定价配置 -->
    <section class="pricing-section">
      <h2>时间定价配置</h2>
      <div class="time-pricing-sliders">
        <div class="slider-item">
          <label>高峰时段加价: {{ timePricing.peakMultiplier }}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            v-model.number="timePricing.peakMultiplier"
            @change="updateConfig"
            class="slider"
          />
          <span class="slider-value">{{ timePricing.peakMultiplier }}%</span>
        </div>
        
        <div class="slider-item">
          <label>平峰时段加价: {{ timePricing.normalMultiplier }}%</label>
          <input 
            type="range" 
            min="0" 
            max="50" 
            v-model.number="timePricing.normalMultiplier"
            @change="updateConfig"
            class="slider"
          />
          <span class="slider-value">{{ timePricing.normalMultiplier }}%</span>
        </div>
        
        <div class="slider-item">
          <label>低谷时段加价: {{ timePricing.offPeakMultiplier }}%</label>
          <input 
            type="range" 
            min="-20" 
            max="30" 
            v-model.number="timePricing.offPeakMultiplier"
            @change="updateConfig"
            class="slider"
          />
          <span class="slider-value">{{ timePricing.offPeakMultiplier }}%</span>
        </div>
      </div>
      
      <div class="time-period-info">
        <p><strong>高峰时段:</strong> 07:00-09:00, 17:00-19:00</p>
        <p><strong>平峰时段:</strong> 09:00-17:00</p>
        <p><strong>低谷时段:</strong> 19:00-07:00</p>
      </div>
    </section>
    
    <!-- 冷藏额外收费配置 -->
    <section class="pricing-section">
      <h2>冷藏额外收费配置</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="refrigeratedBaseFee">冷藏基础费用 (元)</label>
          <input 
            type="number" 
            id="refrigeratedBaseFee" 
            v-model="pricingConfig.refrigeratedBaseFee" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="refrigeratedPerKm">冷藏里程附加费 (元/公里)</label>
          <input 
            type="number" 
            id="refrigeratedPerKm" 
            v-model="pricingConfig.refrigeratedPerKm" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="refrigeratedPerHour">冷藏时长附加费 (元/小时)</label>
          <input 
            type="number" 
            id="refrigeratedPerHour" 
            v-model="pricingConfig.refrigeratedPerHour" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            :disabled="loading"
          />
        </div>
      </div>
    </section>
    
    <!-- 天气接单策略 -->
    <section class="pricing-section">
      <h2>天气接单策略</h2>
      <div class="weather-strategy">
        <div class="strategy-item" v-for="(strategy, weather) in weatherStrategies" :key="weather">
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="strategy.enabled"
              @change="toggleWeatherStrategy(weather)"
            />
            <span class="slider-toggle"></span>
          </label>
          <span class="strategy-label">{{ getWeatherLabel(weather) }}</span>
          <input 
            type="number" 
            v-if="strategy.enabled"
            :value="strategy.surcharge"
            @change="updateWeatherSurcharge(weather, $event.target.value)"
            min="0"
            step="0.5"
            class="surcharge-input"
            :disabled="loading"
          />
          <span v-if="strategy.enabled" class="surcharge-label">元附加费</span>
        </div>
      </div>
    </section>
    
    <!-- 附加服务配置 -->
    <section class="pricing-section">
      <h2>附加服务配置</h2>
      <div class="form-grid">
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="additionalServices.loadingEnabled"
              @change="updateConfig"
            />
            装卸服务
          </label>
          <input 
            v-if="additionalServices.loadingEnabled"
            type="number" 
            v-model="additionalServices.loadingFee" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            placeholder="装卸服务费用"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="additionalServices.waitingEnabled"
              @change="updateConfig"
            />
            等待费
          </label>
          <input 
            v-if="additionalServices.waitingEnabled"
            type="number" 
            v-model="additionalServices.waitingFeePerHour" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            placeholder="每小时等待费"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="additionalServices.insuranceEnabled"
              @change="updateConfig"
            />
            保险服务
          </label>
          <input 
            v-if="additionalServices.insuranceEnabled"
            type="number" 
            v-model="additionalServices.insuranceRate" 
            @change="updateConfig"
            min="0" 
            step="0.01"
            placeholder="保险费率 (%)"
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
  name: 'CarrierPricingView',
  setup() {
    // 初始化承运商定价配置数据
    const pricingConfig = reactive({
      refrigeratedBaseFee: 10.00,
      refrigeratedPerKm: 1.00,
      refrigeratedPerHour: 5.00
    })
    
    // 时间定价配置
    const timePricing = reactive({
      peakMultiplier: 30,    // 高峰时段加价30%
      normalMultiplier: 10,  // 平峰时段加价10%
      offPeakMultiplier: -5  // 低谷时段减价5%
    })
    
    // 天气策略
    const weatherStrategies = reactive({
      rain: { enabled: false, surcharge: 10.00 },
      snow: { enabled: false, surcharge: 15.00 },
      fog: { enabled: false, surcharge: 5.00 },
      storm: { enabled: true, surcharge: 20.00 },
      extreme_heat: { enabled: false, surcharge: 8.00 },
      extreme_cold: { enabled: false, surcharge: 12.00 }
    })
    
    // 附加服务
    const additionalServices = reactive({
      loadingEnabled: true,
      loadingFee: 20.00,
      waitingEnabled: true,
      waitingFeePerHour: 30.00,
      insuranceEnabled: false,
      insuranceRate: 1.00
    })
    
    // 加载状态
    const loading = ref(false)
    
    // 更新配置
    const updateConfig = () => {
      console.log('配置已更新:', {
        pricingConfig,
        timePricing,
        weatherStrategies,
        additionalServices
      })
    }
    
    // 切换天气策略启用状态
    const toggleWeatherStrategy = (weatherType) => {
      weatherStrategies[weatherType].enabled = !weatherStrategies[weatherType].enabled
      updateConfig()
    }
    
    // 更新天气附加费
    const updateWeatherSurcharge = (weatherType, value) => {
      weatherStrategies[weatherType].surcharge = parseFloat(value) || 0
      updateConfig()
    }
    
    // 获取天气标签
    const getWeatherLabel = (weatherType) => {
      const labels = {
        rain: '雨天',
        snow: '雪天',
        fog: '雾天',
        storm: '风暴',
        extreme_heat: '高温',
        extreme_cold: '严寒'
      }
      return labels[weatherType] || weatherType
    }
    
    // 保存配置到后端
    const saveConfig = async () => {
      try {
        loading.value = true
        
        // 构造完整的配置对象
        const configData = {
          pricingConfig,
          timePricing,
          weatherStrategies,
          additionalServices
        }
        
        // 调用后端API保存配置
        const response = await pricingApi.updateCarrierPricingConfigs(configData)
        
        console.log('承运商配置保存成功:', response)
        alert('承运商配置保存成功！')
      } catch (error) {
        console.error('保存承运商配置失败:', error)
        alert(`保存失败: ${error.message || '未知错误'}`)
      } finally {
        loading.value = false
      }
    }
    
    // 重置配置
    const resetConfig = () => {
      if (confirm('确定要重置所有配置吗？')) {
        // 重置时间定价
        timePricing.peakMultiplier = 30
        timePricing.normalMultiplier = 10
        timePricing.offPeakMultiplier = -5
        
        // 重置冷藏费用
        pricingConfig.refrigeratedBaseFee = 10.00
        pricingConfig.refrigeratedPerKm = 1.00
        pricingConfig.refrigeratedPerHour = 5.00
        
        // 重置天气策略
        weatherStrategies.rain.enabled = false
        weatherStrategies.rain.surcharge = 10.00
        weatherStrategies.snow.enabled = false
        weatherStrategies.snow.surcharge = 15.00
        weatherStrategies.fog.enabled = false
        weatherStrategies.fog.surcharge = 5.00
        weatherStrategies.storm.enabled = true
        weatherStrategies.storm.surcharge = 20.00
        weatherStrategies.extreme_heat.enabled = false
        weatherStrategies.extreme_heat.surcharge = 8.00
        weatherStrategies.extreme_cold.enabled = false
        weatherStrategies.extreme_cold.surcharge = 12.00
        
        // 重置附加服务
        additionalServices.loadingEnabled = true
        additionalServices.loadingFee = 20.00
        additionalServices.waitingEnabled = true
        additionalServices.waitingFeePerHour = 30.00
        additionalServices.insuranceEnabled = false
        additionalServices.insuranceRate = 1.00
      }
    }
    
    // 组件挂载时加载现有配置
    onMounted(async () => {
      try {
        loading.value = true
        
        // 从后端API加载现有配置
        const response = await pricingApi.getCarrierPricingConfigs()
        
        // 如果API返回了数据，则更新本地配置
        if (response && response.data) {
          // 这里可以根据实际API返回的数据结构来更新配置
          console.log('承运商配置加载完成:', response.data)
        }
        
        console.log('承运商配置加载完成')
      } catch (error) {
        console.error('加载承运商配置失败:', error)
        // 如果加载失败，使用默认值并提示用户
        alert(`加载配置失败: ${error.message || '使用默认配置'}`)
      } finally {
        loading.value = false
      }
    })
    
    return {
      pricingConfig,
      timePricing,
      weatherStrategies,
      additionalServices,
      loading,
      updateConfig,
      toggleWeatherStrategy,
      updateWeatherSurcharge,
      getWeatherLabel,
      saveConfig,
      resetConfig
    }
  }
}
</script>

<style scoped>
.carrier-pricing-container {
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

.form-group input[type="number"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.time-pricing-sliders {
  margin-top: 15px;
}

.slider-item {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.slider-item label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.slider {
  width: 100%;
  margin-bottom: 5px;
}

.slider-value {
  align-self: flex-end;
  font-size: 14px;
  color: #666;
}

.time-period-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
}

.weather-strategy {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.strategy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-toggle {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider-toggle:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider-toggle {
  background-color: #2196F3;
}

input:checked + .slider-toggle:before {
  transform: translateX(26px);
}

.strategy-label {
  font-weight: bold;
  min-width: 80px;
}

.surcharge-input {
  width: 100px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.surcharge-label {
  margin-left: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
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