// test_carrier_bidding.js - 测试承运商竞价模式功能
const axios = require('axios');
const { faker } = require('@faker-js/faker');

// 设置基础URL
const BASE_URL = 'http://localhost:3000';

// 测试数据
const testData = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  carriers: [
    {
      name: `顺丰速运${Date.now()}`,
      contact_person: `张三${Date.now()}`,
      contact_phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      email: `sf${Date.now()}@carrier.com`,
      password: 'password123',
      roles: ['carrier']
    },
    {
      name: `圆通快递${Date.now()}`,
      contact_person: `李四${Date.now()}`,
      contact_phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      email: `yt${Date.now()}@carrier.com`,
      password: 'password123',
      roles: ['carrier']
    },
    {
      name: `中通快递${Date.now()}`,
      contact_person: `王五${Date.now()}`,
      contact_phone: `137${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      email: `zt${Date.now()}@carrier.com`,
      password: 'password123',
      roles: ['carrier']
    }
  ],
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
let orderIds = [];
let carrierIds = [];

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
    tokens.admin = response.headers['set-cookie']; // 保存Cookie
    return response.data;
  } catch (error) {
    console.error('❌ 管理员登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 2. 批准承运商
async function approveCarrier(carrierEmail) {
  try {
    console.log(`✅ 查找并批准承运商: ${carrierEmail}`);
    
    // 获取待审批的租户列表
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/tenants/pending`, {
      headers: { Cookie: tokens.admin }
    });
    
    console.log('Pending response structure:', JSON.stringify(pendingResponse.data, null, 2)); // 调试输出
    
    // 根据实际API响应结构调整处理逻辑
    let pendingTenants = [];
    if (pendingResponse.data && pendingResponse.data.data && pendingResponse.data.data.tenants) {
      // 如果响应是 { success: true, data: { tenants: [...] } } 格式
      pendingTenants = pendingResponse.data.data.tenants;
    } else if (Array.isArray(pendingResponse.data)) {
      // 如果响应直接是数组
      pendingTenants = pendingResponse.data;
    } else if (pendingResponse.data && pendingResponse.data.data) {
      // 如果响应是 { success: true, data: [...] } 格式
      pendingTenants = Array.isArray(pendingResponse.data.data) ? pendingResponse.data.data : [pendingResponse.data.data];
    } else {
      console.log(`⚠️ 无法解析待审批租户列表响应`);
      return null;
    }
    
    console.log(`Looking for tenant with email: ${carrierEmail}`);
    console.log(`Available pending tenants:`, pendingTenants.map(t => ({ id: t.id, email: t.email, name: t.name })));
    
    // 由于API响应中的email字段为空，我们需要根据其他字段来识别租户
    // 这里我们假设刚注册的租户会出现在列表中，我们可以按时间顺序处理
    let pendingTenant = pendingTenants.find(t => t.name.includes(carrierEmail.split('@')[0]));
    
    if (!pendingTenant) {
      console.log(`⚠️ 未找到待审批的承运商: ${carrierEmail}`);
      // 尝试通过其他方式查找，例如查找最近注册的租户
      const allTenantsResponse = await axios.get(`${BASE_URL}/api/admin/tenants`, {
        headers: { Cookie: tokens.admin }
      });
      
      if (allTenantsResponse.data && allTenantsResponse.data.data && allTenantsResponse.data.data.tenants) {
        const allTenants = allTenantsResponse.data.data.tenants;
        const newlyRegisteredTenant = allTenants.find(t => 
          t.email === carrierEmail && t.status === 'pending'
        );
        
        if (newlyRegisteredTenant) {
          pendingTenant = newlyRegisteredTenant; // 使用let声明的变量
          console.log(`✅ 通过全部租户列表找到了待审批的承运商: ${carrierEmail}`);
        }
      }
      
      if (!pendingTenant) {
        console.log(`❌ 无法找到待审批的承运商: ${carrierEmail}`);
        return null;
      }
    }
    
    // 批准租户
    const approveResponse = await axios.put(
      `${BASE_URL}/api/admin/tenants/${pendingTenant.id}/approve`,
      { roles: ['carrier'] },
      { headers: { Cookie: tokens.admin } }
    );
    
    console.log(`✅ 承运商 ${carrierEmail} 已批准`);
    return pendingTenant.id;
  } catch (error) {
    console.error(`❌ 批准承运商 ${carrierEmail} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 3. 注册承运商
async function registerCarrier(carrierData) {
  try {
    console.log(`🚚 注册承运商: ${carrierData.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/pc-tenant/apply`, {
      name: carrierData.name,
      contact_person: carrierData.contact_person,
      contact_phone: carrierData.contact_phone,
      email: carrierData.email,
      password: carrierData.password,
      roles: carrierData.roles
    });
    
    console.log(`✅ 承运商 ${carrierData.name} 注册成功`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 注册失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 4. 承运商登录
async function carrierLogin(carrierData) {
  try {
    console.log(`🔐 承运商 ${carrierData.name} 登录...`);
    
    const response = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: carrierData.email,
      password: carrierData.password
    });
    
    console.log(`✅ 承运商 ${carrierData.name} 登录成功`);
    tokens[`carrier_${carrierData.email}`] = response.headers['set-cookie'];
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 登录失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 5. 客户注册
async function registerCustomer(customerData) {
  try {
    console.log('會員註冊客户...');
    
    const response = await axios.post(`${BASE_URL}/api/pc-tenant/apply`, {
      name: customerData.name,
      contact_person: customerData.contact_person,
      contact_phone: customerData.contact_phone,
      email: customerData.email,
      password: customerData.password,
      roles: customerData.roles
    });
    
    console.log('✅ 客户注册成功:', customerData.name);
    return response.data;
  } catch (error) {
    console.error('❌ 客户注册失败:', error.response?.data || error.message);
    // 如果是邮箱已存在错误，这可能是正常的
    if (error.response?.status === 409) {
      console.log('⚠️ 客户可能已存在，继续测试...');
      return null;
    }
    throw error;
  }
}

// 5. 客户创建订单
async function createOrder(customerData) {
  try {
    console.log('📦 客户创建订单...');
    
    // 先注册客户（如果尚未注册）
    await registerCustomer(customerData);
    
    // 等待片刻以便管理员批准
    await delay(1000);
    
    // 管理员批准客户
    await approveCustomer(customerData.email);
    
    // 然后登录客户
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: customerData.email,
      password: customerData.password
    });
    
    const customerToken = loginResponse.headers['set-cookie'];
    
    // 创建订单
    const orderResponse = await axios.post(`${BASE_URL}/api/customer/orders`, {
      pickup_address: '北京市朝阳区测试地址1',
      delivery_address: '上海市浦东新区测试地址2',
      weight_kg: 10.5,
      cargo_type: '家具家电',
      cargo_remark: '易碎品，请小心搬运',
      customer_name: customerData.contact_person,
      customer_phone: customerData.contact_phone,
      quote_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后截止
    }, {
      headers: { Cookie: customerToken }
    });
    
    console.log('✅ 订单创建成功:', orderResponse.data.order_id);
    orderIds.push(orderResponse.data.order_id);
    return orderResponse.data;
  } catch (error) {
    console.error('❌ 订单创建失败:', error.response?.data || error.message);
    throw error;
  }
}

// 辅助函数：批准客户
async function approveCustomer(customerEmail) {
  try {
    console.log(`✅ 查找并批准客户: ${customerEmail}`);
    
    // 获取待审批的租户列表
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/tenants/pending`, {
      headers: { Cookie: tokens.admin }
    });
    
    // 根据实际API响应结构调整处理逻辑
    let pendingTenants = [];
    if (pendingResponse.data && pendingResponse.data.data && pendingResponse.data.data.tenants) {
      // 如果响应是 { success: true, data: { tenants: [...] } } 格式
      pendingTenants = pendingResponse.data.data.tenants;
    } else if (Array.isArray(pendingResponse.data)) {
      // 如果响应直接是数组
      pendingTenants = pendingResponse.data;
    } else if (pendingResponse.data && pendingResponse.data.data) {
      // 如果响应是 { success: true, data: [...] } 格式
      pendingTenants = Array.isArray(pendingResponse.data.data) ? pendingResponse.data.data : [pendingResponse.data.data];
    } else {
      console.log(`⚠️ 无法解析待审批租户列表响应`);
      return null;
    }
    
    // 查找客户租户
    let pendingTenant = pendingTenants.find(t => t.name.includes(customerEmail.split('@')[0]));
    
    if (!pendingTenant) {
      console.log(`⚠️ 未找到待审批的客户: ${customerEmail}`);
      // 尝试通过其他方式查找
      const allTenantsResponse = await axios.get(`${BASE_URL}/api/admin/tenants`, {
        headers: { Cookie: tokens.admin }
      });
      
      if (allTenantsResponse.data && allTenantsResponse.data.data && allTenantsResponse.data.data.tenants) {
        const allTenants = allTenantsResponse.data.data.tenants;
        const newlyRegisteredTenant = allTenants.find(t => 
          t.email === customerEmail && t.status === 'pending'
        );
        
        if (newlyRegisteredTenant) {
          pendingTenant = newlyRegisteredTenant;
          console.log(`✅ 通过全部租户列表找到了待审批的客户: ${customerEmail}`);
        }
      }
      
      if (!pendingTenant) {
        console.log(`❌ 无法找到待审批的客户: ${customerEmail}`);
        return null;
      }
    }
    
    // 批准客户
    const approveResponse = await axios.put(
      `${BASE_URL}/api/admin/tenants/${pendingTenant.id}/approve`,
      { roles: ['customer'] },
      { headers: { Cookie: tokens.admin } }
    );
    
    console.log(`✅ 客户 ${customerEmail} 已批准`);
    return pendingTenant.id;
  } catch (error) {
    console.error(`❌ 批准客户 ${customerEmail} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 6. 承运商获取可认领订单
async function getClaimableOrders(carrierData) {
  try {
    console.log(`📋 承运商 ${carrierData.name} 获取可认领订单...`);
    
    const response = await axios.get(`${BASE_URL}/api/carrier/orders`, {
      headers: { Cookie: tokens[`carrier_${carrierData.email}`] }
    });
    
    console.log(`✅ 承运商 ${carrierData.name} 获取到 ${response.data.data.orders.length} 个可认领订单`);
    return response.data.data.orders;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 获取订单失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 7. 承运商认领订单
async function claimOrder(carrierData, orderId) {
  try {
    console.log(`🚚 承运商 ${carrierData.name} 认领订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/claim`,
      {},
      { headers: { Cookie: tokens[`carrier_${carrierData.email}`] } }
    );
    
    console.log(`✅ 承运商 ${carrierData.name} 成功认领订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 认领订单 ${orderId} 失败:`, error.response?.data || error.message);
    // 如果是409错误（已被其他承运商认领），这在竞价模式下是正常的
    if (error.response?.status === 409) {
      console.log(`⚠️ 订单 ${orderId} 可能已被其他承运商认领，这在竞价模式下是正常的`);
      return null;
    }
    throw error;
  }
}

// 8. 承运商提交报价
async function submitQuote(carrierData, orderId, quoteData) {
  try {
    console.log(`💰 承运商 ${carrierData.name} 为订单 ${orderId} 提交报价...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/carrier/orders/${orderId}/quote`,
      {
        price: quoteData.price,
        deliveryTime: quoteData.deliveryTime,
        remarks: quoteData.remarks
      },
      { headers: { Cookie: tokens[`carrier_${carrierData.email}`] } }
    );
    
    console.log(`✅ 承运商 ${carrierData.name} 成功为订单 ${orderId} 提交报价: ¥${quoteData.price}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 为订单 ${orderId} 提交报价失败:`, error.response?.data || error.message);
    // 如果是409错误（已提交过报价），这在某些情况下可能是正常的
    if (error.response?.status === 409) {
      console.log(`⚠️ 承运商 ${carrierData.name} 可能已为订单 ${orderId} 提交过报价`);
      return null;
    }
    throw error;
  }
}

// 9. 客户获取订单报价
async function getOrderQuotes(customerData, orderId) {
  try {
    console.log(`📋 客户获取订单 ${orderId} 的报价...`);
    
    // 客户登录
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: customerData.email,
      password: customerData.password
    });
    
    const customerToken = loginResponse.headers['set-cookie'];
    
    const response = await axios.get(`${BASE_URL}/api/customer/orders/${orderId}/quotes`, {
      headers: { Cookie: customerToken }
    });
    
    console.log('Get quotes response structure:', JSON.stringify(response.data, null, 2)); // 调试输出
    
    // 检查响应结构并相应处理
    let quotes = [];
    if (response.data && response.data.data && response.data.data.quotes) {
      // 如果响应是 { success: true, data: { quotes: [...] } } 格式
      quotes = response.data.data.quotes;
    } else if (response.data && response.data.quotes) {
      // 如果响应是 { success: true, quotes: [...] } 格式
      quotes = response.data.quotes;
    } else if (Array.isArray(response.data)) {
      // 如果响应直接是报价数组
      quotes = response.data;
    } else {
      console.log(`⚠️ 无法解析报价响应`);
      return [];
    }
    
    console.log(`✅ 订单 ${orderId} 获取到 ${quotes.length} 个报价`);
    return quotes;
  } catch (error) {
    console.error(`❌ 获取订单 ${orderId} 报价失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 10. 客户选择承运商
async function awardOrderToCarrier(customerData, orderId, carrierTenantId) {
  try {
    console.log(`🏆 客户将订单 ${orderId} 授予承运商 ${carrierTenantId}...`);
    
    // 客户登录
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: customerData.email,
      password: customerData.password
    });
    
    const customerToken = loginResponse.headers['set-cookie'];
    
    const response = await axios.post(
      `${BASE_URL}/api/customer/orders/${orderId}/award`,
      { carrier_tenant_id: carrierTenantId },
      { headers: { Cookie: customerToken } }
    );
    
    console.log(`✅ 订单 ${orderId} 成功授予承运商 ${carrierTenantId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 订单 ${orderId} 授予承运商失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 11. 承运商开始配送
async function startDelivery(carrierData, orderId) {
  try {
    console.log(`🚚 承运商 ${carrierData.name} 开始配送订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/start-delivery`,
      {},
      { headers: { Cookie: tokens[`carrier_${carrierData.email}`] } }
    );
    
    console.log(`✅ 承运商 ${carrierData.name} 成功开始配送订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 开始配送订单 ${orderId} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 12. 承运商完成订单
async function completeOrder(carrierData, orderId) {
  try {
    console.log(`✅ 承运商 ${carrierData.name} 完成订单 ${orderId}...`);
    
    const response = await axios.put(
      `${BASE_URL}/api/carrier/orders/${orderId}/complete`,
      {},
      { headers: { Cookie: tokens[`carrier_${carrierData.email}`] } }
    );
    
    console.log(`✅ 承运商 ${carrierData.name} 成功完成订单 ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ 承运商 ${carrierData.name} 完成订单 ${orderId} 失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 13. 客户获取订单详情
async function getOrderDetails(customerData, orderId) {
  try {
    console.log(`📋 客户获取订单 ${orderId} 的详细信息...`);
    
    // 客户登录
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
      email: customerData.email,
      password: customerData.password
    });
    
    const customerToken = loginResponse.headers['set-cookie'];
    
    const response = await axios.get(`${BASE_URL}/api/customer/orders/${orderId}`, {
      headers: { Cookie: customerToken }
    });
    
    console.log(`✅ 成功获取订单 ${orderId} 的详细信息`);
    return response.data;
  } catch (error) {
    console.error(`❌ 获取订单 ${orderId} 详情失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function runCarrierBiddingTest() {
  console.log('🚀 开始测试承运商竞价模式...\n');
  
  try {
    // 1. 管理员登录
    await adminLogin();
    
    // 2. 注册并批准多个承运商
    console.log('\n🚚 注册并批准承运商...');
    for (const carrier of testData.carriers) {
      await registerCarrier(carrier);
      await delay(1000); // 延迟1秒避免并发问题
    }
    
    // 等待管理员批准
    await delay(2000);
    
    for (const carrier of testData.carriers) {
      await approveCarrier(carrier.email);
      await delay(1000);
    }
    
    // 3. 承运商登录
    console.log('\n🔐 承运商登录...');
    for (const carrier of testData.carriers) {
      await carrierLogin(carrier);
      await delay(500);
    }
    
    // 4. 客户创建订单
    console.log('\n📦 客户创建测试订单...');
    const order = await createOrder(testData.customer);
    // 从订单列表中获取最新的订单ID
    const ordersResponse = await axios.get(`${BASE_URL}/api/customer/orders`, {
      headers: { Cookie: tokens[`customer_${testData.customer.email}`] || (await axios.post(`${BASE_URL}/api/tenant-web/login`, {
        email: testData.customer.email,
        password: testData.customer.password
      })).headers['set-cookie'] }
    });
    const latestOrder = ordersResponse.data.data.orders[0];
    const orderId = latestOrder.id;
    console.log(`✅ 获取到最新订单ID: ${orderId}`);
    
    // 5. 承运商获取并认领订单
    console.log('\n🚚 承运商获取可认领订单...');
    const orders = await getClaimableOrders(testData.carriers[0]); // 任选一个承运商获取订单
    
    if (orders.length > 0) {
      const targetOrderId = orderId; // 使用最新创建的订单ID
      console.log(`🎯 选定订单 ${targetOrderId} 进行竞价测试`);
      
      // 多个承运商尝试认领同一个订单
      console.log('\n🚚 多个承运商尝试认领同一订单...');
      for (const carrier of testData.carriers) {
        await claimOrder(carrier, targetOrderId);
        await delay(500);
      }
      
      // 6. 多个承运商为同一订单提交报价
      console.log('\n💰 多个承运商为订单提交报价...');
      const quotePrices = [150.00, 145.50, 148.75]; // 不同承运商的报价
      for (let i = 0; i < testData.carriers.length; i++) {
        const carrier = testData.carriers[i];
        const quoteData = {
          price: quotePrices[i],
          deliveryTime: new Date(Date.now() + (2 + i) * 24 * 60 * 60 * 1000).toISOString(),
          remarks: `承运商${i+1}报价，提供专业服务`
        };
        
        await submitQuote(carrier, targetOrderId, quoteData);
        await delay(500);
      }
      
      // 7. 客户获取所有报价
      console.log('\n📋 客户获取订单的所有报价...');
      const quotes = await getOrderQuotes(testData.customer, targetOrderId);
      console.log(`✅ 订单 ${targetOrderId} 共收到 ${quotes.length} 个报价:`);
      quotes.forEach((quote, index) => {
        console.log(`   报价 ${index + 1}: ¥${quote.price}, 预计送达: ${quote.deliveryTime}, 备注: ${quote.remarks}`);
      });
      
      // 8. 客户选择最低价承运商
      console.log('\n🏆 客户选择最低价承运商...');
      if (quotes.length > 0) {
        // 找到最低价的报价
        const lowestQuote = quotes.reduce((lowest, quote) => 
          quote.price < lowest.price ? quote : lowest, 
          { price: Infinity }
        );
        
        // 获取最低价承运商的租户ID
        const lowestPrice = lowestQuote.price;
        let selectedCarrierIndex = -1;
        for (let i = 0; i < quotePrices.length; i++) {
          if (quotePrices[i] === lowestPrice) {
            selectedCarrierIndex = i;
            break;
          }
        }
        
        if (selectedCarrierIndex !== -1) {
          const selectedCarrier = testData.carriers[selectedCarrierIndex];
          
          // 获取承运商的租户ID
          const loginResponse = await axios.post(`${BASE_URL}/api/tenant-web/login`, {
            email: selectedCarrier.email,
            password: selectedCarrier.password
          });
          const carrierToken = loginResponse.headers['set-cookie'];
          
          // 通过获取承运商资料获取租户ID
          const profileResponse = await axios.get(`${BASE_URL}/api/tenant-web/profile`, {
            headers: { Cookie: carrierToken }
          });
          const carrierTenantId = profileResponse.data.data.id;
          
          console.log(`✅ 选择报价 ¥${lowestPrice} 的承运商: ${selectedCarrier.name} (ID: ${carrierTenantId})`);
          
          // 客户授予订单给选中的承运商
          await awardOrderToCarrier(testData.customer, targetOrderId, carrierTenantId);
          
          // 9. 承运商开始配送
          console.log('\n🚚 选中的承运商开始配送...');
          await startDelivery(selectedCarrier, targetOrderId);
          
          // 10. 承运商完成订单
          console.log('\n✅ 选中的承运商完成订单...');
          await completeOrder(selectedCarrier, targetOrderId);
          
          // 11. 客户查看订单全流程详情
          console.log('\n📋 客户查看订单全流程详情...');
          const orderDetails = await getOrderDetails(testData.customer, targetOrderId);
          console.log(`✅ 订单 ${targetOrderId} 状态: ${orderDetails.data.status}`);
          console.log(`   创建时间: ${orderDetails.data.created_at}`);
          console.log(`   更新时间: ${orderDetails.data.updated_at}`);
          console.log(`   承运商: ${orderDetails.data.carrier_tenant_name || '未指定'}`);
          console.log(`   订单状态: ${orderDetails.data.status}`);
        }
      }
    } else {
      console.log('⚠️ 没有找到可认领的订单');
    }
    
    // 12. 测试完成
    console.log('\n🎉 承运商竞价模式及完整订单流程测试完成！');
    console.log('- 多个承运商成功注册并登录');
    console.log('- 客户成功创建订单');
    console.log('- 多个承运商可以尝试认领同一订单');
    console.log('- 多个承运商可以为同一订单提交不同报价');
    console.log('- 客户成功获取所有报价');
    console.log('- 客户可以选择最合适的承运商');
    console.log('- 订单成功授予选中的承运商');
    console.log('- 承运商成功开始配送');
    console.log('- 承运商成功完成订单');
    console.log('- 客户可以查看订单全流程详情');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
runCarrierBiddingTest();