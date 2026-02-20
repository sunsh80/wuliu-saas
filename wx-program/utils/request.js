// utils/request.js (修改，读取 'token')
const BASE_URL = 'http://192.168.2.250:3000'; // 替换为您的实际 API 基础地址

function getCurrentPagePath() {
 const pages = getCurrentPages();
 const currentPage = pages[pages.length - 1];
 return '/' + currentPage.route;
}

function request(options) {
 return new Promise((resolve, reject) => {
   // 默认显示加载动画
   if (options.showLoading !== false) {
     wx.showLoading({ title: '加载中...', mask: true });
   }

   // 从本地缓存读取身份凭证
   const connectSid = wx.getStorageSync('connect_sid');
   // const authToken = wx.getStorageSync('authToken'); // ❌ 注释掉旧的读取方式
   const authToken = wx.getStorageSync('token'); // ✅ 修改为读取 'token'，与 app.js 保持一致

   console.log('[Request Debug] Read connect.sid from storage:', connectSid);
   console.log('[Request Debug] Read token from storage:', authToken); // ✅ 日志也对应修改

   // 如果没有身份凭证，提示用户登录
   if (!connectSid && !authToken) { // 检查 connectSid 和 token
     console.log('[Request Debug] No credentials found, showing login modal.');
     wx.hideLoading(); // 避免加载动画一直显示
     wx.showModal({
       title: '需要登录',
       content: '该操作需要登录以继续。',
       confirmText: '去登录',
       cancelText: '取消',
       success: (res) => {
         if (res.confirm) {
           const currentPath = getCurrentPagePath();
           wx.navigateTo({
             url: `/pages/login/login?redirect=${encodeURIComponent(currentPath)}`
           });
         }
         // ✅ 无论点击确认还是取消，都 reject
         reject(new Error('未登录'));
       },
       // ✅ 增加 fail 回调
       fail: () => {
         console.error('[Request Debug] Login modal failed.');
         reject(new Error('操作失败'));
       }
     });
     // ✅ 在 showModal 后 return
     return;
   }

   // 构造请求头
   const headers = {
     'Content-Type': 'application/json',
   };

   // 正确格式化 Cookie
if (connectSid) {
  // ✅ 关键修复：解码 URL 编码的 Session ID
  const decodedConnectSid = decodeURIComponent(connectSid);
  headers.Cookie = `connect.sid=${decodedConnectSid}`;
  console.log('[Request Debug] Cookie being sent:', headers.Cookie);
} else {
  headers.Cookie = '';
}

   // 如果存在 token，则添加 Authorization 头部
   if (authToken) {
     headers.Authorization = `Bearer ${authToken}`; // 使用读取到的 token
   }

   // 合并用户自定义 header
   if (options.header) {
     Object.assign(headers, options.header);
   }

   // 发起请求
   wx.request({
     url: `${BASE_URL}${options.url}`,
     method: options.method || 'GET',
     header: headers,
     data: options.data,
     success: (res) => {
       // 隐藏加载动画
       if (options.showLoading !== false) {
         wx.hideLoading();
       }
       console.log('[Request Debug] Request to', `${BASE_URL}${options.url}`, 'returned with status code:', res.statusCode);
       console.log('[Request Debug] Response data:', res.data);

       // 处理 HTTP 状态码
       switch (res.statusCode) {
         case 200:
           // 检查 res.data.success
           if (res.data && typeof res.data.success === 'boolean') {
             if (res.data.success) {
               console.log('[Request Debug] Request successful, data:', res.data);
               resolve(res);
             } else {
               console.log('[Request Debug] Server returned 200 but success=false:', res.data.message);
               reject(new Error(res.data.message || '服务器返回错误'));
             }
           } else {
             console.warn('[Request Debug] Server returned 200 but success field is missing or invalid:', res.data);
             reject(new Error('服务器响应格式异常'));
           }
           break;
         case 401:
           console.log('[Request Debug] Received 401, clearing credentials and showing re-login modal.');
           // Session 过期或未登录
           wx.removeStorageSync('connect.sid');
           // wx.removeStorageSync('authToken'); // ❌ 注释掉，因为我们现在读取的是 'token'
           wx.removeStorageSync('token'); // ✅ 清除 'token'
           wx.removeStorageSync('isLoggedIn');
           wx.removeStorageSync('userInfo');
           wx.showModal({
             title: '登录已过期',
             content: '请重新登录以继续操作。',
             confirmText: '去登录',
             cancelText: '取消',
             success: (modalRes) => {
               if (modalRes.confirm) {
                 const currentPath = getCurrentPagePath();
                 wx.navigateTo({
                   url: `/pages/login/login?redirect=${encodeURIComponent(currentPath)}`
                 });
               }
               // ✅ 无论点击确认还是取消，都 reject
               reject(new Error('登录过期'));
             },
             fail: () => {
                 console.error('[Request Debug] Re-login modal failed.');
                 reject(new Error('操作失败'));
             }
           });
           // ✅ 在 showModal 后 return
           return;
         case 403:
           // 权限不足
           wx.showToast({ title: '无权访问', icon: 'none', duration: 2000 });
           reject(new Error('权限不足'));
           break;
         case 500:
         case 502:
         case 503:
           // 服务器错误
           wx.showToast({ title: '服务器错误', icon: 'none', duration: 2000 });
           reject(new Error('服务器错误'));
           break;
         default:
           // 其他错误
           console.warn('[Request Debug] Received unexpected status code:', res.statusCode);
           wx.showToast({ title: `请求失败(${res.statusCode})`, icon: 'none', duration: 2000 });
           reject(new Error(`HTTP ${res.statusCode}`));
       }
     },
     fail: (err) => {
       // 隐藏加载动画
       if (options.showLoading !== false) {
         wx.hideLoading();
       }
       console.error('[Request Debug] Request failed:', err);
       // 网络错误或超时
       console.error('Request failed:', err);
       wx.showToast({ title: '网络错误，请检查网络连接', icon: 'none', duration: 2000 });
       reject(err);
     }
   });
 });
}

module.exports = request;