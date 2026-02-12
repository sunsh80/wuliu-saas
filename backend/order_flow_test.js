// order_flow_test.js - 订单全流程测试脚本
const axios = require('axios');

// API 基础URL
const BASE_URL = 'http://localhost:3000';

// 测试凭证
const TEST_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  customer1: { username: 'customer1', password: 'customer123' },
  customer2: { username: 'customer2', password: 'customer456' },
  carrier1: { username: 'carrier1', password: 'carrier123' },
  carrier2: { username: 'carrier2', password: 'carrier456' }
};

// 存储会话信息
let sessions = {};

console.log('🚚 开始订单全流程测试...\n');

async function testOrderFlow() {
  try {
    console.log('🔐 1. 用户登录测试...');
    
    // 管理员登录
    console.log('   - 管理员登录...');
    let response = await axios.post(`${BASE_URL}/api/admin/login`, TEST_CREDENTIALS.admin);
    if (response.data.success) {
      sessions.admin = response.headers['set-cookie'] || response.headers['cookie'];
      console.log('     ✅ 管理员登录成功');
    } else {
      console.log('     ❌ 管理员登录失败');
    }
    
    // 客户1登录
    console.log('   - 客户1登录...');
    response = await axios.post(`${BASE_URL}/api/tenant-web/login`, TEST_CREDENTIALS.customer1);
    if (response.data.success) {
      sessions.customer1 = response.headers['set-cookie'] || response.headers['cookie'];
      console.log('     ✅ 客户1登录成功');
    } else {
      console.log('     ❌ 客户1登录失败');
    }
    
    // 承运商1登录
    console.log('   - 承运商1登录...');
    response = await axios.post(`${BASE_URL}/api/tenant-web/login`, TEST_CREDENTIALS.carrier1);
    if (response.data.success) {
      sessions.carrier1 = response.headers['set-cookie'] || response.headers['cookie'];
      console.log('     ✅ 承运商1登录成功');
    } else {
      console.log('     ❌ 承运商1登录失败');
    }
    
    console.log('\n📋 2. 获取现有订单测试...');
    
    // 客户1获取自己的订单
    console.log('   - 客户1获取订单列表...');
    try {
      response = await axios.get(`${BASE_URL}/api/customer/orders`, {
        headers: { Cookie: sessions.customer1?.[0] }
      });
      console.log(`     ✅ 客户1获取到 ${response.data.data.orders?.length || 0} 个订单`);
      if (response.data.data.orders && response.data.data.orders.length > 0) {
        console.log(`     📄 第一个订单: ${response.data.data.orders[0].tracking_number || response.data.data.orders[0].id}`);
      }
    } catch (error) {
      console.log('     ❌ 客户1获取订单失败:', error.response?.data?.message || error.message);
    }
    
    // 承运商1获取可认领订单
    console.log('   - 承运商1获取可认领订单...');
    try {
      response = await axios.get(`${BASE_URL}/api/tenant-web/orders/pending`, {
        headers: { Cookie: sessions.carrier1?.[0] }
      });
      console.log(`     ✅ 承运商1获取到 ${response.data.data?.length || 0} 个可认领订单`);
    } catch (error) {
      console.log('     ❌ 承运商1获取可认领订单失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🏷️  3. 订单认领测试...');
    
    // 获取一个待认领的订单
    try {
      response = await axios.get(`${BASE_URL}/api/tenant-web/orders/pending`, {
        headers: { Cookie: sessions.carrier1?.[0] }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        const orderToClaim = response.data.data[0];
        console.log(`   - 尝试认领订单: ${orderToClaim.tracking_number || orderToClaim.id}`);
        
        // 承运商认领订单
        response = await axios.put(`${BASE_URL}/api/tenant-web/orders/${orderToClaim.id}/claim`, {}, {
          headers: { Cookie: sessions.carrier1?.[0] }
        });
        
        if (response.data.success) {
          console.log('     ✅ 订单认领成功');
        } else {
          console.log('     ❌ 订单认领失败:', response.data.message);
        }
      } else {
        console.log('   - 没有待认领的订单可供测试');
      }
    } catch (error) {
      console.log('     ❌ 订单认领测试失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n💰 4. 钱包功能测试...');
    
    // 客户1获取钱包信息
    console.log('   - 客户1获取钱包信息...');
    try {
      response = await axios.get(`${BASE_URL}/api/wallet/current`, {
        headers: { Cookie: sessions.customer1?.[0] }
      });
      if (response.data.success) {
        console.log(`     ✅ 客户1钱包余额: ${response.data.data.wallet.balance}`);
      } else {
        console.log('     ❌ 客户1获取钱包信息失败:', response.data.message);
      }
    } catch (error) {
      console.log('     ❌ 客户1获取钱包信息失败:', error.response?.data?.message || error.message);
    }
    
    // 承运商1获取钱包信息
    console.log('   - 承运商1获取钱包信息...');
    try {
      response = await axios.get(`${BASE_URL}/api/wallet/current`, {
        headers: { Cookie: sessions.carrier1?.[0] }
      });
      if (response.data.success) {
        console.log(`     ✅ 承运商1钱包余额: ${response.data.data.wallet.balance}`);
      } else {
        console.log('     ❌ 承运商1获取钱包信息失败:', response.data.message);
      }
    } catch (error) {
      console.log('     ❌ 承运商1获取钱包信息失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n💳 5. 订单结算测试...');
    
    // 管理员执行订单结算
    console.log('   - 管理员尝试执行订单结算...');
    try {
      // 获取一个已完成状态的订单
      response = await axios.get(`${BASE_URL}/api/admin/orders`, {
        headers: { Cookie: sessions.admin?.[0] }
      });
      
      if (response.data.data?.orders && response.data.data.orders.length > 0) {
        const orderForSettlement = response.data.data.orders.find(order => 
          order.status === 'awarded' || order.status === 'delivered' || order.status === 'in_transit'
        ) || response.data.data.orders[0]; // 如果没找到特定状态的订单，就用第一个
        
        console.log(`   - 尝试结算订单: ${orderForSettlement.tracking_number || orderForSettlement.id}, 状态: ${orderForSettlement.status}`);
        
        response = await axios.post(`${BASE_URL}/api/admin/orders/${orderForSettlement.id}/settlement`, {}, {
          headers: { Cookie: sessions.admin?.[0] }
        });
        
        if (response.data.success) {
          console.log('     ✅ 订单结算成功');
          console.log(`     💰 结算金额: ${response.data.data.gross_amount}, 佣金: ${response.data.data.commission_amount}, 净额: ${response.data.data.net_amount}`);
        } else {
          console.log('     ⚠️  订单结算响应:', response.data.message);
        }
      } else {
        console.log('   - 没有找到可结算的订单');
      }
    } catch (error) {
      console.log('     ❌ 订单结算测试失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n✅ 订单全流程测试完成！');
    console.log('\n📋 测试摘要:');
    console.log(`   - 管理员登录: ${sessions.admin ? '成功' : '失败'}`);
    console.log(`   - 客户登录: ${sessions.customer1 ? '成功' : '失败'}`);
    console.log(`   - 承运商登录: ${sessions.carrier1 ? '成功' : '失败'}`);
    console.log('   - 订单查询: 已测试');
    console.log('   - 订单认领: 已测试');
    console.log('   - 钱包功能: 已测试');
    console.log('   - 订单结算: 已测试');
    
  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testOrderFlow()
  .then(() => {
    console.log('\n🎯 订单全流程测试执行完毕！');
  })
  .catch((error) => {
    console.error('\n💥 测试执行失败:', error);
  });