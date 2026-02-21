/**
 * 腾讯地图 API 代理
 * 用于解决前端 JSONP/CORS 问题
 */
const https = require('https');

// 内存缓存：存储最近请求的结果
// 结构：Map<cacheKey, { data, timestamp }>
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

// 进行中的请求队列，避免重复请求
// 结构：Map<cacheKey, Promise>
const pendingRequests = new Map();

/**
 * 生成缓存键
 */
function getCacheKey(type, keyword) {
  return `${type}:${keyword}`;
}

/**
 * 检查缓存是否有效
 */
function isValidCache(cached) {
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

/**
 * 清理过期缓存（定期清理，避免内存泄漏）
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// 每 10 分钟清理一次过期缓存
setInterval(cleanupCache, 10 * 60 * 1000);

module.exports = async (c) => {
  try {
    console.log('[MAP PROXY] 请求参数:', c.request.query);
    
    const { type, keyword, address, key } = c.request.query;

    if (!key) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'MISSING_API_KEY',
          message: '缺少 API Key'
        }
      };
    }

    // 生成缓存键
    const cacheKey = getCacheKey(type, type === 'geocoder' ? address : keyword);
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (isValidCache(cached)) {
      console.log('[MAP PROXY] ✅ 使用缓存:', cacheKey);
      return {
        status: 200,
        body: cached.data
      };
    }
    
    // 检查是否有进行中的相同请求，有的话等待它完成
    if (pendingRequests.has(cacheKey)) {
      console.log('[MAP PROXY] ⏳ 等待进行中的请求:', cacheKey);
      try {
        const data = await pendingRequests.get(cacheKey);
        return {
          status: 200,
          body: data
        };
      } catch (err) {
        // 如果等待的请求失败，继续执行下面的新请求
        console.log('[MAP PROXY] 等待的请求失败，重新发起请求');
      }
    }

    const baseUrl = type === 'geocoder' 
      ? 'https://apis.map.qq.com/ws/geocoder/v1/' 
      : 'https://apis.map.qq.com/ws/place/v1/suggestion/';
    
    const params = new URLSearchParams();
    params.append('key', key);
    
    if (type === 'geocoder') {
      if (!address) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'MISSING_ADDRESS',
            message: '缺少地址参数'
          }
        };
      }
      params.append('address', address);
    } else {
      if (!keyword) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'MISSING_KEYWORD',
            message: '缺少关键词参数'
          }
        };
      }
      params.append('keyword', keyword);
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log('[MAP PROXY] 请求腾讯地图 URL:', url);

    // 创建请求 Promise
    const requestPromise = new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('[MAP PROXY] 腾讯地图返回:', result);
            
            // 成功响应才缓存（status: 0 表示成功）
            if (result.status === 0) {
              cache.set(cacheKey, { data: result, timestamp: Date.now() });
              console.log('[MAP PROXY] 💾 已缓存结果:', cacheKey);
            }
            
            resolve(result);
          } catch (e) {
            console.error('[MAP PROXY] 解析错误:', e);
            reject(e);
          }
        });
      }).on('error', (err) => {
        console.error('[MAP PROXY] 请求错误:', err);
        reject(err);
      });
    });

    try {
      // 存储进行中的请求
      pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      
      return {
        status: 200,
        body: result
      };
    } catch (err) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'REQUEST_ERROR',
          message: '请求腾讯地图 API 失败',
          details: err.message
        }
      };
    } finally {
      // 请求完成后移除 pending 状态
      pendingRequests.delete(cacheKey);
    }
  } catch (err) {
    console.error('[MAP PROXY] 未捕获错误:', err);
    console.error('[MAP PROXY] 错误堆栈:', err.stack);
    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '服务器内部错误',
        details: err.message,
        stack: err.stack
      }
    };
  }
};
