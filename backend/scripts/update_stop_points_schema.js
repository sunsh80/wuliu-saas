// backend/scripts/update_stop_points_schema.js
// 更新 stop_points 表结构，添加 carrier_tenant_id 字段

const { getDb } = require('../db/index');

async function updateStopPointsSchema() {
  try {
    const db = getDb();

    console.log('Checking stop_points table schema...');

    // 检查 carrier_tenant_id 字段是否已存在
    const tableInfo = await db.all('PRAGMA table_info(stop_points)');
    const hasCarrierTenantId = tableInfo.some(col => col.name === 'carrier_tenant_id');

    if (!hasCarrierTenantId) {
      console.log('Adding carrier_tenant_id column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN carrier_tenant_id INTEGER');
      console.log('✓ carrier_tenant_id column added');
    } else {
      console.log('✓ carrier_tenant_id column already exists');
    }

    // 检查 uploaded_by 字段是否已存在
    const hasUploadedBy = tableInfo.some(col => col.name === 'uploaded_by');
    if (!hasUploadedBy) {
      console.log('Adding uploaded_by column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN uploaded_by INTEGER');
      console.log('✓ uploaded_by column added');
    } else {
      console.log('✓ uploaded_by column already exists');
    }

    // 检查 upload_source 字段是否已存在
    const hasUploadSource = tableInfo.some(col => col.name === 'upload_source');
    if (!hasUploadSource) {
      console.log('Adding upload_source column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN upload_source TEXT DEFAULT \'manual\'');
      console.log('✓ upload_source column added');
    } else {
      console.log('✓ upload_source column already exists');
    }

    // 检查 approval_status 字段是否已存在
    const hasApprovalStatus = tableInfo.some(col => col.name === 'approval_status');
    if (!hasApprovalStatus) {
      console.log('Adding approval_status column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN approval_status TEXT DEFAULT \'approved\'');
      console.log('✓ approval_status column added');
    } else {
      console.log('✓ approval_status column already exists');
    }

    // 检查 approved_by 字段是否已存在
    const hasApprovedBy = tableInfo.some(col => col.name === 'approved_by');
    if (!hasApprovedBy) {
      console.log('Adding approved_by column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN approved_by INTEGER');
      console.log('✓ approved_by column added');
    } else {
      console.log('✓ approved_by column already exists');
    }

    // 检查 approved_at 字段是否已存在
    const hasApprovedAt = tableInfo.some(col => col.name === 'approved_at');
    if (!hasApprovedAt) {
      console.log('Adding approved_at column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN approved_at DATETIME');
      console.log('✓ approved_at column added');
    } else {
      console.log('✓ approved_at column already exists');
    }

    // 检查 rejection_reason 字段是否已存在
    const hasRejectionReason = tableInfo.some(col => col.name === 'rejection_reason');
    if (!hasRejectionReason) {
      console.log('Adding rejection_reason column to stop_points table...');
      await db.run('ALTER TABLE stop_points ADD COLUMN rejection_reason TEXT');
      console.log('✓ rejection_reason column added');
    } else {
      console.log('✓ rejection_reason column already exists');
    }

    console.log('\n✓ stop_points table schema update completed!');
  } catch (error) {
    console.error('❌ Error updating stop_points schema:', error);
  }
}

updateStopPointsSchema().then(() => {
  console.log('Script completed.');
}).catch(err => {
  console.error('Script failed:', err);
});
