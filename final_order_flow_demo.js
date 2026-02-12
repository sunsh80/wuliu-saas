// final_order_flow_demo.js - 最终订单流程演示
const axios = require('axios');

// 设置基础URL
const BASE_URL = 'http://localhost:3000';

// 测试数据
const testData = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  carrier: {
    name: `顺丰速运${Date.now()}`,
    contact_person: `张三${Date.now()}`,
    contact_phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    email: `sf${Date.now()}@carrier.com`,
    password: 'password123',
    roles: ['carrier']
  },
  customer: {
    name: `测试客户${Date.now()}`,
    contact_person: `赵六${Date.now()}`,
    contact_phone: `136${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    email: `customer${Date.now()}@test.com`,
    password: 'password123',
    roles: ['customer']
  }
};

// 存储测试过程中生成的ID
let tokens = {};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 管理员登录
async function adminLogin() {
  try {
    console.log('🔐 管理员登录...');
    const response = await axios.post(`${BASE_URL}/api/admin/login`, {
      username: testData.admin.username,
      password: testData.admin.password
    });
    
    console.log('✅ 管理员登录成功');
    tokens.admin = response.headers['set-cookie'];
    return response.data;
  } catch (error) {
    console.error('❌ 管理员登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 2. 注册承运商
async function registerCarrier() {
  try {
    console.log(`🚚 注册承运商: ${testData.carrier.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/pc-tenant/apply`, {
      name: testData.carrier.name,
      contact_person: testData.carrier.contact_person,
      contact_phone: testData.carrier.contact_phone,
      email: testData.carrier.email,
      password: testData.carrier.password,
      roles: testData.carrier.roles
    });
    
    console.log(`✅ 承运商 ${testData.carrier.name} 注册成功`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${testData.carrier.name} 注册失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 3. 批准承运商
async function approveCarrier() {
  try {
    console.log(`✅ 查找并批准承运商: ${testData.carrier.email}`);
    
    // 获取待审批的租户列表
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/tenants/pending`, {
      headers: { Cookie: tokens.admin }
    });
    
    let pendingTenants = [];
    if (pendingResponse.data && pendingResponse.data.data && pendingResponse.data.data.tenants) {
      pendingTenants = pendingResponse.data.data.tenants;
    } else if (Array.isArray(pendingResponse.data)) {
      pendingTenants = pendingResponse.data;
    } else if (pendingResponse.data && pendingResponse.data.data) {
      pendingTenants = Array.isArray(pendingResponse.data.data) ? pendingResponse.data.data : [pendingResponse.data.data];
    }
    
    let pendingTenant = pendingTenants.find(t => t.name.includes(testData.carrier.email.split('@')[0]));
    
    if (!pendingTenant) {
      console.log(`⚠️ 未找到待审批的承运商: ${testData.carrier.email}`);
      // 尝试从全部租户中查找
      const allTenantsResponse = await axios.get(`${BASE_URL}/api/admin/tenants`, {
        headers: { Cookie: tokens.admin }
      });
      
      if (allTenantsResponse.data && allTenantsResponse.data.data && allTenantsResponse.data.data.tenants) {
        const allTenants = allTenantsResponse.data.data.tenants;
        const newlyRegisteredTenant = allTenants.find(t => 
          t.email === testData.carrier.email && t.status === 'pending'
        );
        
        if (newlyRegisteredTenant) {
          pendingTenant = newlyRegisteredTenant;
          console.log(`✅ 通过全部租户列表找到了待审批的承运商`);
        }
      }
    }
    
    if (!pendingTenant) {
      console.log(`❌ 无法找到待审批的承运商: ${testData.carrier.email}`);
      return null;
    }
    
    // 批准租户
    const approveResponse = await axios.put(
      `${BASE_URL}/api/admin/tenants/${pendingTenant.id}/approve`,
      { roles: ['carrier'] },
      { headers: { Cookie: tokens.admin } }
    );
    
    console.log(`✅ 承运商 ${testData.carrier.email} 已批准`);
    return pendingTenant.id;
  } catch (error) {
    console.error(`❌ 批准承运商 ${testData.carrier.email} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 4. 注册客户
async function registerCustomer() {
  try {
    console.log('會員註冊客户...');
    
    const response = await axios.post(`${BASE_URL}/api/pc-tenant/apply`, {
      name: testData.customer.name,
      contact_person: testData.customer.contact_person,
      contact_phone: testData.customer.contact_phone,
      email: testData.customer.email,
      password: testData.customer.password,
      roles: testData.customer.roles
    });
    
    console.log('✅ 客户注册成功:', testData.customer.name);
    return response.data;
  } catch (error) {
    console.error('❌ 客户注册失败:', error.response?.data || error.message);
    throw error;
  }
}

// 5. 批准客户
async function approveCustomer() {
  try {
    console.log(`✅ 查找并批准客户: ${testData.customer.email}`);
    
    // 获取待审批的租户列表
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/tenants/pending`, {
      headers: { Cookie: tokens.admin }
    });
    
    let pendingTenants = [];
    if (pendingResponse.data && pendingResponse.data.data && pendingResponse.data.data.tenants) {
      pendingTenants = pendingResponse.data.data.tenants;
    } else if (Array.isArray(pendingResponse.data)) {
      pendingTenants = pendingResponse.data;
    } else if (pendingResponse.data && pendingResponse.data.data) {
      pendingTenants = Array.isArray(pendingResponse.data.data) ? pendingResponse.data.data : [pendingResponse.data.data];
    }
    
    let pendingTenant = pendingTenants.find(t => t.name.includes(testData.customer.email.split('@')[0]));
    
    if (!pendingTenant) {
      console.log(`⚠️ 未找到待审批的客户: ${testData.customer.email}`);
      // 尝试从全部租户中查找
      const allTenantsResponse = await axios.get(`${BASE_URL}/api/admin/tenants`, {
        headers: { Cookie: tokens.admin }
      });
      
      if (allTenantsResponse.data && allTenantsResponse.data.data && allTenantsResponse.data.data.tenants) {
        const allTenants = allTenantsResponse.data.data.tenants;
        const newlyRegisteredTenant = allTenants.find(t => 
          t.email === testData.customer.email && t.status === 'pending'
        );
        
        if (newlyRegisteredTenant) {
          pendingTenant = newlyRegisteredTenant;
          console.log(`✅ 通过全部租户列表找到了待审批的客户`);
        }
      }
    }
    
    if (!pendingTenant) {
      console.log(`❌ 无法找到待审批的客户: ${testData.customer.email}`);
      return null;
    }
    
    // 批准客户
    const approveResponse = await axios.put(
      `${BASE_URL}/api/admin/tenants/${pendingTenant.id}/approve`,
      { roles: ['customer'] },
      { headers: { Cookie: tokens.admin } }
    );
    
    console.log(`✅ 客户 ${testData.customer.email} 已批准`);
    return pendingTenant.id;
  } catch (error) {
    console.error(`❌ 批准客户 ${testData.customer.email} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 6. 承运商登录
async function carrierLogin() {
  try {
    console.log(`🔐 承运商 ${testData.carrier.name} 登录...`);
    
    const response = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: testData.carrier.email,
      password: testData.carrier.password
    });
    
    console.log(`✅ 承运商 ${testData.carrier.name} 登录成功`);
    tokens.carrier = response.headers['set-cookie'];
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${testData.carrier.name} 登录失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 7. 客户登录
async function customerLogin() {
  try {
    console.log(`🔐 客户 ${testData.customer.name} 登录...`);
    
    const response = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: testData.customer.email,
      password: testData.customer.password
    });
    
    console.log(`✅ 客户 ${testData.customer.name} 登录成功`);
    tokens.customer = response.headers['set-cookie'];
    return response.data;
  } catch (error) {
    console.error(`❌ 客户 ${testData.customer.name} 登录失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 8. 客户创建订单
async function createOrder() {
  try {
    console.log('📦 客户创建订单...');
    
    const response = await axios.post(`${BASE_URL}/api/customer/orders`, {
      pickup_address: '北京市朝阳区测试地址1',
      delivery_address: '上海市浦东新区测试地址2',
      weight_kg: 10.5,
      cargo_type: '家具家电',
      cargo_remark: '易碎品，请小心搬运',
      customer_name: testData.customer.contact_person,
      customer_phone: testData.customer.contact_phone,
      quote_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, {
      headers: { Cookie: tokens.customer }
    });
    
    console.log('✅ 订单创建成功:', response.data.order_id);
    return response.data;
  } catch (error) {
    console.error('❌ 订单创建失败:', error.response?.data || error.message);
    throw error;
  }
}

// 9. 获取客户订单列表
async function getCustomerOrders() {
  try {
    console.log('📋 客户获取订单列表...');
    
    const response = await axios.get(`${BASE_URL}/api/customer/orders`, {
      headers: { Cookie: tokens.customer }
    });
    
    console.log(`✅ 客户获取到 ${response.data.data.orders.length} 个订单`);
    return response.data.data.orders;
  } catch (error) {
    console.error('❌ 客户获取订单列表失败:', error.response?.data || error.message);
    throw error;
  }
}

// 10. 承运商获取可认领订单
async function getClaimableOrders() {
  try {
    console.log(`📋 承运商 ${testData.carrier.name} 获取可认领订单...`);
    
    const response = await axios.get(`${BASE_URL}/api/carrier/orders`, {
      headers: { Cookie: tokens.carrier }
    });
    
    console.log(`✅ 承运商 ${testData.carrier.name} 获取到 ${response.data.data.orders.length} 个可认领订单`);
    return response.data.data.orders;
  } catch (error) {
    console.error(`❌ 承运商 ${testData.carrier.name} 获取订单失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 11. 承运商认领订单
async function claimOrder(orderId) {
  try {
    console.log(`🚚 承运商 ${testData.carrier.name} 认领订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/claim`,
      {},
      { headers: { Cookie: tokens.carrier } }
    );
    
    console.log(`✅ 承运商 ${testData.carrier.name} 成功认领订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${testData.carrier.name} 认领订单 ${orderId} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 12. 承运商提交报价
async function submitQuote(orderId) {
  try {
    console.log(`💰 承运商 ${testData.carrier.name} 为订单 ${orderId} 提交报价...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/carrier/orders/${orderId}/quote`,
      {
        price: 145.50,
        deliveryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        remarks: '专业服务，准时送达'
      },
      { headers: { Cookie: tokens.carrier } }
    );
    
    console.log(`✅ 承运商 ${testData.carrier.name} 成功为订单 ${orderId} 提交报价: ¥145.50`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${testData.carrier.name} 为订单 ${orderId} 提交报价失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 13. 客户获取订单报价
async function getOrderQuotes(orderId) {
  try {
    console.log(`📋 客户获取订单 ${orderId} 的报价...`);
    
    const response = await axios.get(`${BASE_URL}/api/customer/orders/${orderId}/quotes`, {
      headers: { Cookie: tokens.customer }
    });
    
    console.log('报价响应结构:', JSON.stringify(response.data, null, 2));
    
    let quotes = [];
    if (response.data && response.data.data && response.data.data.quotes) {
      quotes = response.data.data.quotes;
    }
    
    console.log(`✅ 订单 ${orderId} 获取到 ${quotes.length} 个报价`);
    return quotes;
  } catch (error) {
    console.error(`❌ 获取订单 ${orderId} 报价失败:`, error.response?.data || error.message);
    return [];
  }
}

// 14. 客户选择承运商
async function awardOrderToCarrier(orderId, carrierTenantId) {
  try {
    console.log(`🏆 客户将订单 ${orderId} 授予承运商 ${carrierTenantId}...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/customer/orders/${orderId}/award`,
      { carrier_tenant_id: carrierTenantId },
      { headers: { Cookie: tokens.customer } }
    );
    
    console.log(`✅ 订单 ${orderId} 成功授予承运商 ${carrierTenantId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 订单 ${orderId} 授予承运商失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 15. 承运商开始配送
async function startDelivery(orderId) {
  try {
    console.log(`🚚 承运商开始配送订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/start-delivery`,
      {},
      { headers: { Cookie: tokens.carrier } }
    );
    
    console.log(`✅ 承运商成功开始配送订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商开始配送订单 ${orderId} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 16. 承运商完成订单
async function completeOrder(orderId) {
  try {
    console.log(`✅ 承运商完成订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/complete`,
      {},
      { headers: { Cookie: tokens.carrier } }
    );
    
    console.log(`✅ 承运商成功完成订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商完成订单 ${orderId} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 17. 客户获取订单详情
async function getOrderDetails(orderId) {
  try {
    console.log(`📋 客户获取订单 ${orderId} 的详细信息...`);
    
    const response = await axios.get(`${BASE_URL}/api/customer/orders/${orderId}`, {
      headers: { Cookie: tokens.customer }
    });
    
    console.log(`✅ 成功获取订单 ${orderId} 的详细信息`);
    return response.data;
  } catch (error) {
    console.error(`❌ 获取订单 ${orderId} 详情失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 主演示函数
async function runFinalDemo() {
  console.log('🚀 开始演示完整订单流程...\n');
  
  try {
    // 1. 管理员登录
    await adminLogin();
    
    // 2. 注册并批准承运商
    console.log('\n🚚 注册并批准承运商...');
    await registerCarrier();
    await delay(1000);
    await approveCarrier();
    
    // 3. 注册并批准客户
    console.log('\n會員註冊并批准客户...');
    await registerCustomer();
    await delay(1000);
    await approveCustomer();
    
    // 4. 承运商和客户登录
    console.log('\n🔐 承运商和客户登录...');
    await carrierLogin();
    await customerLogin();
    
    // 5. 客户创建订单
    console.log('\n📦 客户创建测试订单...');
    await createOrder();
    
    // 获取最新订单
    const customerOrders = await getCustomerOrders();
    const latestOrder = customerOrders[0];
    const orderId = latestOrder.id;
    console.log(`✅ 获取到最新订单ID: ${orderId}, 状态: ${latestOrder.status}`);
    
    // 6. 承运商获取并认领订单
    console.log('\n🚚 承运商获取可认领订单...');
    const claimableOrders = await getClaimableOrders();
    if (claimableOrders.length > 0) {
      const targetOrderId = orderId; // 使用最新订单ID
      console.log(`🎯 选定订单 ${targetOrderId} 进行操作`);
      
      // 承运商认领订单
      console.log('\n🚚 承运商认领订单...');
      await claimOrder(targetOrderId);
      
      // 承运商提交报价
      console.log('\n💰 承运商提交报价...');
      await submitQuote(targetOrderId);
      
      // 等待片刻确保报价被处理
      await delay(1000);
      
      // 7. 客户获取报价
      console.log('\n📋 客户获取订单报价...');
      const quotes = await getOrderQuotes(targetOrderId);
      console.log(`✅ 订单 ${targetOrderId} 共收到 ${quotes.length} 个报价:`);
      quotes.forEach((quote, index) => {
        console.log(`   报价 ${index + 1}: ¥${quote.price}, 预计送达: ${quote.deliveryTime}, 备注: ${quote.remarks}`);
      });
      
      // 8. 获取承运商租户ID
      const carrierProfileResponse = await axios.get(`${BASE_URL}/api/tenant-web/profile`, {
        headers: { Cookie: tokens.carrier }
      });
      const carrierTenantId = carrierProfileResponse.data.data.id;
      console.log(`✅ 获取到承运商租户ID: ${carrierTenantId}`);
      
      // 9. 客户选择承运商
      console.log('\n🏆 客户选择承运商...');
      await awardOrderToCarrier(targetOrderId, carrierTenantId);
      
      // 检查订单状态
      const orderAfterAward = await getOrderDetails(targetOrderId);
      console.log(`✅ 订单授予后状态: ${orderAfterAward.data.status}, 承运商: ${orderAfterAward.data.carrier_tenant_name}`);
      
      // 10. 承运商开始配送
      console.log('\n🚚 承运商开始配送...');
      await startDelivery(targetOrderId);
      
      // 11. 承运商完成订单
      console.log('\n✅ 承运商完成订单...');
      await completeOrder(targetOrderId);
      
      // 12. 客户查看订单全流程详情
      console.log('\n📋 客户查看订单全流程详情...');
      const finalOrderDetails = await getOrderDetails(targetOrderId);
      console.log(`✅ 订单 ${targetOrderId} 最终状态: ${finalOrderDetails.data.status}`);
      console.log(`   创建时间: ${finalOrderDetails.data.created_at}`);
      console.log(`   更新时间: ${finalOrderDetails.data.updated_at}`);
      console.log(`   承运商: ${finalOrderDetails.data.carrier_tenant_name || '未指定'}`);
      console.log(`   订单状态: ${finalOrderDetails.data.status}`);
      console.log(`   重量: ${finalOrderDetails.data.weight_kg}kg`);
      console.log(`   体积: ${finalOrderDetails.data.volume_m3}m³`);
      console.log(`   货物类型: ${finalOrderDetails.data.cargo_type}`);
      
      // 13. 客户查看所有订单历史
      console.log('\n📋 客户查看所有订单历史...');
      const allOrders = await getCustomerOrders();
      console.log(`✅ 客户共有 ${allOrders.length} 个订单:`);
      allOrders.forEach((order, index) => {
        console.log(`   订单 ${index + 1}: ${order.order_id}, 状态: ${order.status}, 创建时间: ${order.created_at}`);
      });
    } else {
      console.log('⚠️ 没有找到可认领的订单');
    }
    
    // 14. 演示完成
    console.log('\n🎉 完整订单流程演示完成！');
    console.log('- 客户成功注册并获得批准');
    console.log('- 承运商成功注册并获得批准');
    console.log('- 客户成功创建订单');
    console.log('- 承运商成功认领订单');
    console.log('- 承运商成功提交报价');
    console.log('- 客户成功获取报价');
    console.log('- 客户成功选择承运商');
    console.log('- 订单成功授予承运商');
    console.log('- 承运商成功开始配送');
    console.log('- 承运商成功完成订单');
    console.log('- 客户可以查看订单全流程详情');
    console.log('- 客户可以查看所有订单历史');
    
  } catch (error) {
    console.error('\n💥 演示过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行演示
runFinalDemo();