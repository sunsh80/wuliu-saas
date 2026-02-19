// backend/scripts/init_management_data.js
/**
 * 初始化运营管理数据
 * - 运行数据库迁移
 * - 插入测试数据
 */

const { getDb } = require('../db/connection');

async function runMigration() {
  console.log('📦 开始运行数据库迁移...');
  const migration = require('../db/migrations/002_add_management_tables');
  await migration.up();
  console.log('✅ 数据库迁移完成');
}

async function insertTestData() {
  const db = getDb();
  console.log('\n📝 开始插入测试数据...');
  
  // 1. 插入违规记录测试数据
  console.log('  - 插入违规记录...');
  const violations = [
    [1, '顺丰速运', 'delivery_delay', '订单#ORD001 配送超时 2 小时', '2023-10-15', 'medium', 'pending', null, null, null],
    [2, '圆通快递', 'quality_issue', '货物在运输过程中出现损坏', '2023-10-16', 'high', 'processed', 1, '已赔偿客户损失', '2023-10-17'],
    [3, '韵达快递', 'service_complaint', '客户投诉配送员态度恶劣', '2023-10-17', 'low', 'pending', null, null, null],
    [4, '中通快递', 'document_error', '运单信息填写错误', '2023-10-18', 'low', 'processed', 1, '已更正信息', '2023-10-19'],
    [5, '申通快递', 'delivery_delay', '批量订单配送延迟超过 4 小时', '2023-10-19', 'critical', 'pending', null, null, null]
  ];
  
  for (const v of violations) {
    await db.run(`
      INSERT INTO violations (tenant_id, tenant_name, violation_type, description, violation_date, severity, status, handler_id, handle_notes, handle_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, v);
  }
  console.log(`    ✅ 插入 ${violations.length} 条违规记录`);
  
  // 2. 插入抽佣配置测试数据
  console.log('  - 插入抽佣配置...');
  await db.run(`
    INSERT INTO commission_configs (platform_rate, carrier_rate, min_amount, max_amount, effective_date, notes, created_at, updated_at)
    VALUES (0.05, 0.03, 0.5, 50.0, datetime('now'), '默认抽佣配置', datetime('now'), datetime('now'))
  `);
  const configResult = await db.run('SELECT last_insert_rowid() as id', []);
  const configId = configResult.lastID || 1;
  console.log(`    ✅ 插入抽佣配置 (ID: ${configId})`);
  
  // 3. 插入分级抽佣测试数据
  console.log('  - 插入分级抽佣...');
  const tiers = [
    [configId, 0, 100, 0.06, 0.035],
    [configId, 100, 500, 0.05, 0.03],
    [configId, 500, null, 0.04, 0.025]
  ];
  
  for (const t of tiers) {
    await db.run(`
      INSERT INTO commission_tiers (config_id, min_amount, max_amount, platform_rate, carrier_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, t);
  }
  console.log(`    ✅ 插入 ${tiers.length} 条分级抽佣配置`);
  
  // 4. 插入抽佣记录测试数据
  console.log('  - 插入抽佣记录...');
  const commissions = [
    [1, 120.50, 6.03, 3.62, 'completed', '2023-10-16'],
    [2, 85.00, 4.25, 2.55, 'completed', '2023-10-16'],
    [3, 250.75, 10.03, 6.02, 'pending', null],
    [4, 65.20, 3.26, 1.96, 'completed', '2023-10-17'],
    [5, 180.00, 7.20, 4.32, 'completed', '2023-10-18']
  ];
  
  for (const c of commissions) {
    await db.run(`
      INSERT INTO commission_records (order_id, order_amount, platform_commission, carrier_commission, status, paid_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, c);
  }
  console.log(`    ✅ 插入 ${commissions.length} 条抽佣记录`);
  
  // 5. 插入系统设置测试数据
  console.log('  - 插入系统设置...');
  const settings = [
    ['system', 'system_name', '物流管理系统', 'string', '系统名称', 1],
    ['system', 'system_version', '1.0.0', 'string', '系统版本', 1],
    ['system', 'timezone', 'Asia/Shanghai', 'string', '时区设置', 1],
    ['system', 'date_format', 'YYYY-MM-DD', 'string', '日期格式', 1],
    ['user', 'password_min_length', '8', 'number', '密码最小长度', 0],
    ['user', 'password_complexity', 'medium', 'string', '密码复杂度', 0],
    ['user', 'session_timeout', '60', 'number', '会话超时时间 (分钟)', 0],
    ['security', 'login_attempts_limit', '5', 'number', '登录尝试限制', 0],
    ['security', 'account_lock_duration', '30', 'number', '账户锁定时长 (分钟)', 0],
    ['notification', 'smtp_host', 'smtp.example.com', 'string', 'SMTP 服务器', 0],
    ['notification', 'smtp_port', '587', 'number', 'SMTP 端口', 0],
    ['notification', 'smtp_sender', 'noreply@example.com', 'string', '发件人邮箱', 0],
    ['backup', 'backup_frequency', 'weekly', 'string', '备份频率', 0],
    ['backup', 'backup_time', '02:00', 'string', '备份时间', 0],
    ['backup', 'backup_retention_days', '30', 'number', '备份保存天数', 0]
  ];
  
  for (const s of settings) {
    await db.run(`
      INSERT INTO system_settings (category, key, value, value_type, description, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, s);
  }
  console.log(`    ✅ 插入 ${settings.length} 条系统设置`);
  
  // 6. 插入车辆位置测试数据
  console.log('  - 插入车辆位置...');
  const positions = [
    [1, '辽 A12345', 1, 41.8057, 123.4315, 0, null, 'idle', '沈阳站', 10],
    [2, '辽 A23456', 2, 41.8002, 123.4292, 0, null, 'idle', '桃仙机场', 10],
    [3, '辽 A34567', 3, 41.7988, 123.4231, 0, null, 'maintenance', '中街', 10],
    [4, '辽 A45678', 1, 41.8102, 123.4389, 0, null, 'idle', '北站', 10],
    [5, '辽 A56789', 2, 41.7923, 123.4512, 0, null, 'transporting', '五爱市场', 10],
    [6, '辽 A67890', 3, 41.7856, 123.4623, 0, null, 'idle', '奥体中心', 10]
  ];
  
  for (const p of positions) {
    await db.run(`
      INSERT INTO vehicle_positions (vehicle_id, plate_number, tenant_id, latitude, longitude, speed, direction, status, address, accuracy, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, p);
  }
  console.log(`    ✅ 插入 ${positions.length} 条车辆位置记录`);
  
  console.log('\n✅ 测试数据插入完成！\n');
}

async function main() {
  try {
    await runMigration();
    await insertTestData();
    console.log('🎉 初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

main();
