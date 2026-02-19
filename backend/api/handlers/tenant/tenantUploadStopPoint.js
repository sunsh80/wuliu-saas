// backend/api/handlers/tenant/tenantUploadStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const userId = c.context?.id;
    if (!tenantId || !userId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const body = await c.request.json();
    const { name, address, lat, lng, type = 'other', region, capacity, description } = body;
    if (!name || !address || lat === undefined || lng === undefined) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '缺少必填字段' } }; }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '坐标超出范围' } }; }
    const db = getDb();
    const result = await db.run(
      `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, tenant_id, uploaded_by, upload_source, approval_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tenant', 'pending', 'inactive')`,
      [name, address, parseFloat(lat), parseFloat(lng), type || 'other', region || '', capacity || 1, description || '', tenantId, userId]
    );
    const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);
    return { status: 201, body: { success: true, message: '上传成功，等待审批', data: newStopPoint } };
  } catch (error) {
    console.error('❌ [Tenant] Upload error:', error);
    return { status: 500, body: { success: false, error: 'UPLOAD_FAILED', message: error.message } };
  }
};
