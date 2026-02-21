// backend/api/handlers/tenant/tenantBatchUploadStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const userId = c.context?.id;
    if (!tenantId || !userId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const body = c.request.body;
    const { stopPoints } = body || {};
    if (!Array.isArray(stopPoints) || stopPoints.length === 0) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR' } }; }
    if (stopPoints.length > 100) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '单次最多 100 条' } }; }
    const db = getDb();
    const inserted = [], errors = [];
    for (let i = 0; i < stopPoints.length; i++) {
      const sp = stopPoints[i];
      try {
        if (!sp.name || !sp.address || sp.lat === undefined || sp.lng === undefined) { errors.push({ index: i, error: '缺少必填字段' }); continue; }
        if (sp.lat < -90 || sp.lat > 90 || sp.lng < -180 || sp.lng > 180) { errors.push({ index: i, error: '坐标超出范围' }); continue; }
        const result = await db.run(
          `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, tenant_id, uploaded_by, upload_source, approval_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tenant', 'pending', 'inactive')`,
          [sp.name, sp.address, parseFloat(sp.lat), parseFloat(sp.lng), sp.type || 'other', sp.region || '', sp.capacity || 1, sp.description || '', tenantId, userId]
        );
        const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);
        inserted.push(newStopPoint);
      } catch (err) { errors.push({ index: i, error: err.message }); }
    }
    return { status: 200, body: { success: true, message: `上传完成：成功 ${inserted.length} 条，失败 ${errors.length} 条`, data: { inserted, errors } } };
  } catch (error) {
    console.error('❌ [Tenant] Batch upload error:', error);
    return { status: 500, body: { success: false, error: 'BATCH_UPLOAD_FAILED', message: error.message } };
  }
};
