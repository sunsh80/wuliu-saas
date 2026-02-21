/**
 * 简化版配置数据库测试
 */
const { openDatabaseAndInitialize, getDb } = require('../db');

async function quickTest() {
  console.log('🧪 快速测试数据库配置功能...\n');
  
  await openDatabaseAndInitialize();
  const db = getDb();
  
  // 检查系统配置
  console.log('📋 系统配置:');
  const settings = await db.all('SELECT config_key, config_value FROM system_settings LIMIT 5');
  for (const s of settings) {
    console.log(`   ${s.config_key} = ${s.config_value}`);
  }
  
  // 检查服务提供商
  console.log('\n📋 服务提供商:');
  const providers = await db.all('SELECT provider_name, provider_type, api_endpoint, is_enabled FROM service_providers');
  for (const p of providers) {
    console.log(`   ${p.provider_name} (${p.provider_type}): ${p.api_endpoint} [${p.is_enabled ? '启用' : '禁用'}]`);
  }
  
  console.log('\n✅ 测试完成！');
}

quickTest().catch(console.error);
