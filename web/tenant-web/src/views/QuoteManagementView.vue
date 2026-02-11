<template>
  <div class="quote-management-container">
    <h1>报价管理系统</h1>
    
    <!-- 报价配置面板 -->
    <section class="pricing-config-section">
      <h2>报价配置</h2>
      <div class="config-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'basic' }]" 
          @click="activeTab = 'basic'"
        >
          基础配置
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'time' }]" 
          @click="activeTab = 'time'"
        >
          时间定价
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'weather' }]" 
          @click="activeTab = 'weather'"
        >
          天气策略
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'addons' }]" 
          @click="activeTab = 'addons'"
        >
          附加服务
        </button>
      </div>
      
      <!-- 基础配置 -->
      <div v-show="activeTab === 'basic'" class="tab-content">
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
      </div>
      
      <!-- 时间定价 -->
      <div v-show="activeTab === 'time'" class="tab-content">
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
              :disabled="loading"
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
              :disabled="loading"
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
              :disabled="loading"
            />
            <span class="slider-value">{{ timePricing.offPeakMultiplier }}%</span>
          </div>
        </div>
        
        <div class="time-period-info">
          <p><strong>高峰时段:</strong> 07:00-09:00, 17:00-19:00</p>
          <p><strong>平峰时段:</strong> 09:00-17:00</p>
          <p><strong>低谷时段:</strong> 19:00-07:00</p>
        </div>
      </div>
      
      <!-- 天气策略 -->
      <div v-show="activeTab === 'weather'" class="tab-content">
        <div class="weather-strategy">
          <div class="strategy-item" v-for="(strategy, weather) in weatherStrategies" :key="weather">
            <label class="switch">
              <input 
                type="checkbox" 
                :checked="strategy.enabled"
                @change="toggleWeatherStrategy(weather)"
                :disabled="loading"
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
      </div>
      
      <!-- 附加服务 -->
      <div v-show="activeTab === 'addons'" class="tab-content">
        <div class="form-grid">
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="additionalServices.loadingEnabled"
                @change="updateConfig"
                :disabled="loading"
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
                :disabled="loading"
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
                :disabled="loading"
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
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="additionalServices.expressEnabled"
                @change="updateConfig"
                :disabled="loading"
              />
              加急服务
            </label>
            <input 
              v-if="additionalServices.expressEnabled"
              type="number" 
              v-model="additionalServices.expressMultiplier" 
              @change="updateConfig"
              min="1.1" 
              step="0.1"
              placeholder="加急倍数"
              :disabled="loading"
            />
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="saveConfig" class="btn btn-primary" :disabled="loading">
          {{ loading ? '保存中...' : '保存配置' }}
        </button>
        <button @click="resetConfig" class="btn btn-secondary" :disabled="loading">重置</button>
      </div>
    </section>
    
    <!-- 智能建议面板 -->
    <section class="suggestion-panel">
      <h2>智能建议</h2>
      <div class="suggestions-grid">
        <div class="suggestion-card">
          <h3>{{ currentSuggestion.title }}</h3>
          <p>{{ currentSuggestion.description }}</p>
          <div class="suggestion-actions">
            <button @click="applySuggestion(currentSuggestion)" class="btn btn-success">采纳建议</button>
            <button @click="nextSuggestion" class="btn btn-outline">跳过</button>
          </div>
        </div>
        <div class="market-data">
          <h3>市场参考数据</h3>
          <ul>
            <li>平均报价: ¥{{ marketData.averageQuote }}/单</li>
            <li>竞争报价范围: ¥{{ marketData.minQuote }} - ¥{{ marketData.maxQuote }}</li>
            <li>您的当前报价: ¥{{ currentQuote }}/单</li>
            <li>竞争力评分: {{ marketData.competitiveness }}/10</li>
          </ul>
        </div>
      </div>
    </section>
    
    <!-- 报价计算器 -->
    <section class="quote-calculator-section">
      <h2>报价计算器</h2>
      <div class="calculator-grid">
        <div class="calculator-inputs">
          <div class="form-group">
            <label>距离 (公里)</label>
            <input 
              type="number" 
              v-model="calculator.distance" 
              @input="calculateQuote"
              min="0" 
              step="0.1"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label>时长 (分钟)</label>
            <input 
              type="number" 
              v-model="calculator.duration" 
              @input="calculateQuote"
              min="0" 
              step="1"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label>是否冷藏</label>
            <select v-model="calculator.isRefrigerated" @change="calculateQuote" :disabled="loading">
              <option :value="false">否</option>
              <option :value="true">是</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>天气状况</label>
            <select v-model="calculator.weather" @change="calculateQuote" :disabled="loading">
              <option value="normal">正常</option>
              <option value="rain">雨天</option>
              <option value="snow">雪天</option>
              <option value="storm">风暴</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>时间槽</label>
            <select v-model="calculator.timeSlot" @change="calculateQuote" :disabled="loading">
              <option value="peak">高峰</option>
              <option value="normal">平峰</option>
              <option value="offPeak">低谷</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>是否加急</label>
            <select v-model="calculator.isExpress" @change="calculateQuote" :disabled="loading">
              <option :value="false">否</option>
              <option :value="true">是</option>
            </select>
          </div>
        </div>
        
        <div class="calculator-result">
          <h3>预估报价: ¥{{ calculatedQuote.toFixed(2) }}</h3>
          <div class="quote-breakdown">
            <p>基础费用: ¥{{ quoteBreakdown.baseFee.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.distanceFee > 0">距离费用: ¥{{ quoteBreakdown.distanceFee.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.durationFee > 0">时长费用: ¥{{ quoteBreakdown.durationFee.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.refrigeratedSurcharge > 0">冷藏附加费: ¥{{ quoteBreakdown.refrigeratedSurcharge.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.weatherSurcharge > 0">天气附加费: ¥{{ quoteBreakdown.weatherSurcharge.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.expressSurcharge > 0">加急附加费: ¥{{ quoteBreakdown.expressSurcharge.toFixed(2) }}</p>
            <p v-if="quoteBreakdown.timeMultiplier > 1">时间倍数: ×{{ quoteBreakdown.timeMultiplier.toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 待报价订单列表 -->
    <section class="pending-orders-section">
      <h2>待报价订单</h2>
      <div class="order-table-container">
        <table class="order-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>起始地</th>
              <th>目的地</th>
              <th>距离(km)</th>
              <th>货物信息</th>
              <th>预估报价</th>
              <th>操作</td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pendingOrders" :key="order.id">
              <td>{{ order.orderNumber }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.origin }}</td>
              <td>{{ order.destination }}</td>
              <td>{{ order.distance }}</td>
              <td>{{ order.cargoDescription }}</td>
              <td>¥{{ order.calculatedQuote.toFixed(2) }}</td>
              <td>
                <button 
                  @click="submitQuote(order)" 
                  class="btn btn-sm btn-primary"
                  :disabled="loading"
                >
                  提交报价
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- 加载遮罩层 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { pricingApi } from '../services/api'

export default {
  name: 'QuoteManagementView',
  setup() {
    // 当前激活的标签页
    const activeTab = ref('basic')
    
    // 基础定价配置
    const pricingConfig = reactive({
      basePrice: 10.00,
      mileageRate: 2.00,
      timeRate: 0.50,
      refrigeratedSurcharge: 5.00
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
      insuranceRate: 1.00,
      expressEnabled: false,
      expressMultiplier: 1.5
    })
    
    // 智能建议
    const suggestions = ref([
      {
        title: "提高高峰时段定价",
        description: "根据市场数据分析，高峰时段可适当提高定价至40%，以增加收益。",
        action: () => { timePricing.peakMultiplier = 40; }
      },
      {
        title: "优化冷藏服务定价",
        description: "建议将冷藏基础费用调整为12元，以匹配市场平均水平。",
        action: () => { pricingConfig.refrigeratedSurcharge = 12.00; }
      },
      {
        title: "添加加急服务选项",
        description: "开启加急服务并设置1.8倍定价，可吸引紧急订单。",
        action: () => { 
          additionalServices.expressEnabled = true;
          additionalServices.expressMultiplier = 1.8;
        }
      },
      {
        title: "降低低谷时段定价",
        description: "考虑在低谷时段提供-10%折扣，以增加订单量。",
        action: () => { timePricing.offPeakMultiplier = -10; }
      }
    ])
    
    const currentSuggestionIndex = ref(0)
    const currentSuggestion = computed(() => suggestions.value[currentSuggestionIndex.value])
    
    // 市场数据
    const marketData = reactive({
      averageQuote: 85.50,
      minQuote: 65.00,
      maxQuote: 120.00,
      competitiveness: 7
    })
    
    // 当前报价（模拟）
    const currentQuote = ref(82.30)
    
    // 计算器
    const calculator = reactive({
      distance: 10,
      duration: 45,
      isRefrigerated: false,
      weather: 'normal',
      timeSlot: 'normal',
      isExpress: false
    })
    
    // 计算结果
    const calculatedQuote = ref(0)
    const quoteBreakdown = reactive({
      baseFee: 0,
      distanceFee: 0,
      durationFee: 0,
      refrigeratedSurcharge: 0,
      weatherSurcharge: 0,
      expressSurcharge: 0,
      timeMultiplier: 1
    })
    
    // 待报价订单
    const pendingOrders = ref([
      {
        id: 1,
        orderNumber: 'ORD20231101001',
        customerName: '张三',
        origin: '北京市朝阳区',
        destination: '上海市浦东新区',
        distance: 1200,
        cargoDescription: '电子产品',
        calculatedQuote: 0
      },
      {
        id: 2,
        orderNumber: 'ORD20231101002',
        customerName: '李四',
        origin: '广州市天河区',
        destination: '深圳市南山区',
        distance: 150,
        cargoDescription: '服装',
        calculatedQuote: 0
      },
      {
        id: 3,
        orderNumber: 'ORD20231101003',
        customerName: '王五',
        origin: '杭州市西湖区',
        destination: '南京市鼓楼区',
        distance: 300,
        cargoDescription: '食品',
        calculatedQuote: 0
      }
    ])
    
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
      // 重新计算所有待报价订单
      recalculatePendingOrders()
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
    
    // 计算报价
    const calculateQuote = () => {
      // 这里实现报价计算逻辑
      let baseFee = pricingConfig.basePrice
      let distanceFee = calculator.distance * pricingConfig.mileageRate
      let durationFee = calculator.duration * pricingConfig.timeRate

      // 冷藏附加费
      let refrigeratedSurcharge = calculator.isRefrigerated ? pricingConfig.refrigeratedSurcharge : 0

      // 天气附加费
      let weatherSurcharge = 0
      if (calculator.weather !== 'normal' && weatherStrategies[calculator.weather]?.enabled) {
        weatherSurcharge = weatherStrategies[calculator.weather].surcharge
      }

      // 加急附加费
      let expressSurcharge = 0
      if (calculator.isExpress && additionalServices.expressEnabled) {
        expressSurcharge = baseFee * (additionalServices.expressMultiplier - 1)
      }

      // 时间倍数
      let timeMultiplier = 1
      if (calculator.timeSlot === 'peak') {
        timeMultiplier = 1 + (timePricing.peakMultiplier / 100)
      } else if (calculator.timeSlot === 'normal') {
        timeMultiplier = 1 + (timePricing.normalMultiplier / 100)
      } else if (calculator.timeSlot === 'offPeak') {
        timeMultiplier = 1 + (timePricing.offPeakMultiplier / 100)
      }

      // 总计
      let total = (baseFee + distanceFee + durationFee + refrigeratedSurcharge + weatherSurcharge + expressSurcharge) * timeMultiplier

      calculatedQuote.value = total

      // 更新费用明细
      quoteBreakdown.baseFee = baseFee
      quoteBreakdown.distanceFee = distanceFee
      quoteBreakdown.durationFee = durationFee
      quoteBreakdown.refrigeratedSurcharge = refrigeratedSurcharge
      quoteBreakdown.weatherSurcharge = weatherSurcharge
      quoteBreakdown.expressSurcharge = expressSurcharge
      quoteBreakdown.timeMultiplier = timeMultiplier
      
      // 重新计算所有待报价订单，因为计算器参数变化会影响所有订单的报价
      recalculatePendingOrders()
    }
    
    // 重新计算待报价订单
    const recalculatePendingOrders = () => {
      // 获取当前用户选择的时间段
      const currentTimeSlot = calculator.timeSlot;
      
      pendingOrders.value.forEach(order => {
        // 使用订单的具体参数来计算报价
        // 这里简化处理，实际应用中需要根据每个订单的具体信息来计算
        let baseFee = pricingConfig.basePrice;
        let distanceFee = order.distance * pricingConfig.mileageRate;
        let durationFee = Math.round(order.distance * 0.1) * pricingConfig.timeRate; // 简化的时长估算

        // 冷藏附加费
        let refrigeratedSurcharge = (order.cargoDescription.includes('食品') || order.cargoDescription.includes('药品')) ? pricingConfig.refrigeratedSurcharge : 0;

        // 天气附加费 - 对于订单列表，暂时使用正常天气
        let weatherSurcharge = 0;
        if (calculator.weather !== 'normal' && weatherStrategies[calculator.weather]?.enabled) {
          weatherSurcharge = weatherStrategies[calculator.weather].surcharge;
        }

        // 加急附加费 - 对于订单列表，暂时不考虑加急
        let expressSurcharge = 0;
        if (calculator.isExpress && additionalServices.expressEnabled) {
          expressSurcharge = baseFee * (additionalServices.expressMultiplier - 1);
        }

        // 时间倍数 - 使用用户在计算器中选择的时间段
        let timeMultiplier = 1;
        if (currentTimeSlot === 'peak') {
          timeMultiplier = 1 + (timePricing.peakMultiplier / 100);
        } else if (currentTimeSlot === 'normal') {
          timeMultiplier = 1 + (timePricing.normalMultiplier / 100);
        } else if (currentTimeSlot === 'offPeak') {
          timeMultiplier = 1 + (timePricing.offPeakMultiplier / 100);
        }

        // 总计
        let total = (baseFee + distanceFee + durationFee + refrigeratedSurcharge + weatherSurcharge + expressSurcharge) * timeMultiplier;

        order.calculatedQuote = total;
      });
    }
    
    // 应用智能建议
    const applySuggestion = (suggestion) => {
      suggestion.action()
      nextSuggestion()
      updateConfig()
    }
    
    // 下一个建议
    const nextSuggestion = () => {
      currentSuggestionIndex.value = (currentSuggestionIndex.value + 1) % suggestions.value.length
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
        alert('报价配置保存成功！')
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
        // 重置基础定价
        pricingConfig.basePrice = 10.00
        pricingConfig.mileageRate = 2.00
        pricingConfig.timeRate = 0.50
        pricingConfig.refrigeratedSurcharge = 5.00
        
        // 重置时间定价
        timePricing.peakMultiplier = 30
        timePricing.normalMultiplier = 10
        timePricing.offPeakMultiplier = -5
        
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
        additionalServices.expressEnabled = false
        additionalServices.expressMultiplier = 1.5
        
        // 重新计算
        updateConfig()
      }
    }
    
    // 提交报价
    const submitQuote = (order) => {
      console.log(`提交订单 ${order.orderNumber} 的报价: ¥${order.calculatedQuote.toFixed(2)}`)
      // 这里应该调用API提交报价
      alert(`已提交订单 ${order.orderNumber} 的报价: ¥${order.calculatedQuote.toFixed(2)}`)
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
        
        // 初始化报价计算
        calculateQuote()
        recalculatePendingOrders()
        
        console.log('报价管理配置加载完成')
      } catch (error) {
        console.error('加载报价管理配置失败:', error)
        // 如果加载失败，使用默认值并提示用户
        alert(`加载配置失败: ${error.message || '使用默认配置'}`)
      } finally {
        loading.value = false
      }
    })
    
    return {
      activeTab,
      pricingConfig,
      timePricing,
      weatherStrategies,
      additionalServices,
      suggestions,
      currentSuggestionIndex,
      currentSuggestion,
      marketData,
      currentQuote,
      calculator,
      calculatedQuote,
      quoteBreakdown,
      pendingOrders,
      loading,
      updateConfig,
      toggleWeatherStrategy,
      updateWeatherSurcharge,
      getWeatherLabel,
      calculateQuote,
      recalculatePendingOrders,
      applySuggestion,
      nextSuggestion,
      saveConfig,
      resetConfig,
      submitQuote
    }
  }
}
</script>

<style scoped>
.quote-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.pricing-config-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.pricing-config-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.config-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  border-bottom: 3px solid transparent;
}

.tab-btn.active {
  background: white;
  border-bottom: 3px solid #007bff;
  color: #007bff;
  font-weight: bold;
}

.tab-content {
  padding: 15px 0;
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

.form-group input[type="number"],
.form-group select {
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

.suggestion-panel {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.suggestion-panel h2 {
  color: white;
  margin-top: 0;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.suggestion-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
}

.suggestion-card h3 {
  margin-top: 0;
  color: white;
}

.suggestion-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.market-data ul {
  list-style: none;
  padding: 0;
}

.market-data li {
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.quote-calculator-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.quote-calculator-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.calculator-result {
  background: #e8f5e9;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.calculator-result h3 {
  margin-top: 0;
  color: #2e7d32;
}

.quote-breakdown p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.pending-orders-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.pending-orders-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
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

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #1e7e34;
}

.btn-outline {
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.btn-outline:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
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