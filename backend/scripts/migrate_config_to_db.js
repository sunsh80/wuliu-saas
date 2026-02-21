/**
 * 数据库配置迁移脚本
 * 将环境变量中的配置迁移到数据库
 * 
 * 使用方法：
 * node backend/scripts/migrate_config_to_db.js
 */

const { openDatabaseAndInitialize, getDb } = require('../db');
const bcrypt = require('bcryptjs');

async function migrateConfigToDatabase() {
  console.log('🚀 开始迁移配置到数据库...\n');

  try {
    // 初始化数据库
    await openDatabaseAndInitialize();
    const db = getDb();

    // 检查是否已迁移
    const configCount = await db.get('SELECT COUNT(*) as total FROM system_settings');
    if (configCount.total > 0) {
      console.log('ℹ️  检测到数据库中已有配置，跳过迁移\n');
    } else {
      console.log('📝 开始初始化默认配置...\n');
      // 触发 schema 初始化，会自动创建默认配置
      console.log('✅ 默认配置已初始化\n');
    }

    // 从环境变量迁移 API 密钥
    console.log('🔑 开始迁移 API 密钥...\n');
    
    const migrations = [
      {
        table: 'service_providers',
        name: 'TencentMap',
        type: 'map',
        key: 'api_key',
        env: 'TENCENT_MAP_API_KEY'
      },
      {
        table: 'service_providers',
        name: 'BaiduMap',
        type: 'map',
        key: 'api_key',
        env: 'BAIDU_MAP_API_KEY'
      },
      {
        table: 'service_providers',
        name: 'AutoXAVRoute',
        type: 'route',
        key: 'api_key',
        env: 'AUTOX_AV_ROUTE_API_KEY'
      },
      {
        table: 'service_providers',
        name: 'VehicleCompanyTracking',
        type: 'tracking',
        key: 'auth_token',
        env: 'VEHICLE_COMPANY_AUTH_TOKEN'
      }
    ];

    for (const migration of migrations) {
      const envValue = process.env[migration.env];
      if (envValue) {
        const result = await db.run(
          `UPDATE ${migration.table} SET ${migration.key} = ?, updated_at = datetime('now') WHERE provider_name = ? AND provider_type = ?`,
          [envValue, migration.name, migration.type]
        );
        
        if (result.changes > 0) {
          console.log(`   ✅ ${migration.name}.${migration.key} = ${maskValue(envValue)}`);
        } else {
          console.log(`   ⚠️  ${migration.name} 未找到，可能需要先初始化数据库`);
        }
      } else {
        console.log(`   ⚠️  环境变量 ${migration.env} 未设置，跳过`);
      }
    }

    console.log('\n✅ 配置迁移完成！\n');

    // 显示配置统计
    console.log('📊 配置统计：');
    const stats = {
      systemSettings: await db.get('SELECT COUNT(*) as total FROM system_settings').then(r => r.total),
      serviceProviders: await db.get('SELECT COUNT(*) as total FROM service_providers').then(r => r.total)
    };

    console.log(`   - 系统配置：${stats.systemSettings} 条`);
    console.log(`   - 服务提供商：${stats.serviceProviders} 条`);

    // 显示服务提供商配置
    console.log('\n📋 服务提供商配置：');
    const providers = await db.all('SELECT provider_name, provider_type, is_enabled FROM service_providers ORDER BY provider_type, priority');
    for (const p of providers) {
      console.log(`   - ${p.provider_name} (${p.provider_type}): ${p.is_enabled ? '✅ 启用' : '❌ 禁用'}`);
    }

  } catch (error) {
    console.error('❌ 配置迁移失败:', error);
    throw error;
  }
}

/**
 * 脱敏显示敏感值
 */
function maskValue(value) {
  if (!value) return '(空)';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateConfigToDatabase()
    .then(() => {
      console.log('\n🎉 配置迁移完成！\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 配置迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { migrateConfigToDatabase };
