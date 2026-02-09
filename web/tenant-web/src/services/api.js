// tenant-web的API服务模块
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // 后端API的基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 可用于添加认证token等
apiClient.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么，比如添加认证头
    const token = localStorage.getItem('token'); // 获取存储的token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器 - 可用于统一处理响应
apiClient.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    return response.data;
  },
  error => {
    // 对响应错误做点什么
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 定义API方法
export const pricingApi = {
  // 获取承运商定价配置
  getCarrierPricingConfigs: () => {
    return apiClient.get('/carrier/pricing-configs');
  },

  // 更新承运商定价配置
  updateCarrierPricingConfigs: (data) => {
    return apiClient.put('/carrier/pricing-configs', data);
  },
  
  // 获取承运商特定定价配置
  getCarrierSpecificPricing: (carrierId) => {
    return apiClient.get(`/carrier/${carrierId}/pricing-config`);
  },
  
  // 更新承运商特定定价配置
  updateCarrierSpecificPricing: (carrierId, data) => {
    return apiClient.put(`/carrier/${carrierId}/pricing-config`, data);
  }
};

export default apiClient;