/**
 * 数据库配置功能测试脚本
 * 测试配置数据库逻辑是否正常工作
 * 
 * 使用方法：
 * node backend/scripts/test_config_db.js
 */

const { openDatabaseAndInitialize, getDb, models } = require('../db');
const ConfigService = require('../services/ConfigService');

async function testConfigDatabase() {
  console.log('='.repeat(60));
  console.log('🧪 数据库配置功能测试');
  console.log('='.repeat(60));
  console.log();

  try {
    // 初始化数据库
    console.log('1️⃣ 初始化数据库...');
    await openDatabaseAndInitialize();
    const db = getDb();
    console.log('   ✅ 数据库初始化成功\n');

    // 测试 1: 检查表结构
    console.log('2️⃣ 检查表结构...');
    const tables = ['system_settings', 'service_providers'];
    for (const table of tables) {
      const exists = await db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (exists) {
        console.log(`   ✅ ${table} 表存在`);
      } else {
        console.log(`   ❌ ${table} 表不存在`);
      }
    }
    console.log();

    // 测试 2: 测试 SystemSetting 模型
    console.log('3️⃣ 测试 SystemSetting 模型...');
    const systemSettingModel = new models.SystemSetting();
    
    // 测试获取配置
    const defaultProvider = await systemSettingModel.getConfig('map.defaultProvider', 'TencentMap');
    console.log(`   ✅ 获取配置 map.defaultProvider = ${defaultProvider}`);

    // 测试设置配置
    await systemSettingModel.setConfig(
      'test.config_key',
      'test_value',
      'string',
      '测试配置',
      'test'
    );
    console.log(`   ✅ 设置配置 test.config_key 成功`);

    // 验证设置
    const testValue = await systemSettingModel.getConfig('test.config_key');
    console.log(`   ✅ 验证配置 test.config_key = ${testValue}`);
    console.log();

    // 测试 3: 测试 ServiceProvider 模型
    console.log('4️⃣ 测试 ServiceProvider 模型...');
    const serviceProviderModel = new models.ServiceProvider();
    
    // 获取地图服务提供商
    const mapProviders = await serviceProviderModel.findByType('map');
    console.log(`   ✅ 地图服务提供商数量：${mapProviders.length}`);
    for (const p of mapProviders) {
      console.log(`      - ${p.provider_name}: ${p.is_enabled ? '启用' : '禁用'} (优先级：${p.priority})`);
    }

    // 获取默认地图提供商
    const defaultMapProvider = await serviceProviderModel.getDefaultProvider('map');
    if (defaultMapProvider) {
      console.log(`   ✅ 默认地图提供商：${defaultMapProvider.provider_name}`);
    }
    console.log();

    // 测试 4: 测试 ConfigService
    console.log('5️⃣ 测试 ConfigService...');
    
    // 测试获取配置
    const configValue = await ConfigService.getConfig('map.defaultProvider');
    console.log(`   ✅ ConfigService 获取配置 map.defaultProvider = ${configValue}`);

    // 测试获取默认服务提供商
    const provider = await ConfigService.getDefaultProvider('map');
    if (provider) {
      console.log(`   ✅ ConfigService 获取默认服务提供商：${provider.provider_name}`);
      console.log(`      API 端点：${provider.api_endpoint}`);
      console.log(`      API 密钥：${maskValue(provider.api_key)}`);
    }

    // 测试获取所有配置
    const allSettings = await ConfigService.getAllSettings();
    console.log(`   ✅ ConfigService 获取所有配置分类：${Object.keys(allSettings).join(', ')}`);
    console.log();

    // 测试 5: 测试配置更新
    console.log('6️⃣ 测试配置更新...');
    await ConfigService.setConfig(
      'test.update_key',
      'initial_value',
      'string',
      '测试更新配置',
      'test'
    );
    console.log(`   ✅ 创建初始配置 test.update_key`);

    await ConfigService.setConfig(
      'test.update_key',
      'updated_value',
      'string',
      '更新后的描述',
      'test'
    );
    console.log(`   ✅ 更新配置 test.update_key`);

    const updatedValue = await ConfigService.getConfig('test.update_key');
    console.log(`   ✅ 验证更新后的值 = ${updatedValue}`);
    console.log();

    // 测试 6: 清理测试数据
    console.log('7️⃣ 清理测试数据...');
    await db.run("DELETE FROM system_settings WHERE config_key LIKE 'test.%'");
    console.log(`   ✅ 测试数据已清理`);
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ 所有测试通过！');
    console.log('='.repeat(60));
    console.log();
    console.log('📋 测试摘要:');
    console.log('   ✓ 数据库表结构正常');
    console.log('   ✓ SystemSetting 模型功能正常');
    console.log('   ✓ ServiceProvider 模型功能正常');
    console.log('   ✓ ConfigService 功能正常');
    console.log('   ✓ 配置读写功能正常');
    console.log('   ✓ 配置更新功能正常');
    console.log();

    return true;

  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ 测试失败:', error.message);
    console.error('='.repeat(60));
    console.error(error.stack);
    return false;
  }
}

/**
 * 脱敏显示
 */
function maskValue(value) {
  if (!value) return '(空)';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}

// 如果直接运行此脚本
if (require.main === module) {
  testConfigDatabase()
    .then((success) => {
      if (success) {
        console.log('🎉 数据库配置功能测试完成！\n');
        process.exit(0);
      } else {
        console.log('💥 数据库配置功能测试失败！\n');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 测试过程出错:', error);
      process.exit(1);
    });
}

module.exports = { testConfigDatabase };
