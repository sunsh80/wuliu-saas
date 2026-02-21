// backend/api/handlers/admin/adminBatchImportStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const body = c.request.body;
    const { stopPoints } = body || {};
    if (!Array.isArray(stopPoints) || stopPoints.length === 0) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: 'stopPoints 必须是非空数组' } };
    }
    const db = getDb();
    const inserted = [], errors = [];
    for (let i = 0; i < stopPoints.length; i++) {
      const sp = stopPoints[i];
      try {
        if (!sp.name || !sp.address || sp.lat === undefined || sp.lng === undefined) {
          errors.push({ index: i, error: '缺少必填字段' }); continue;
        }
        const result = await db.run(
          `INSERT INTO stop_points (name, address, lat, lng, type, region, capacity, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [sp.name, sp.address, parseFloat(sp.lat), parseFloat(sp.lng), sp.type || 'other', sp.region || '', sp.capacity || 1, sp.description || '']
        );
        const newStopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [result.lastID]);
        inserted.push(newStopPoint);
      } catch (err) { errors.push({ index: i, error: err.message }); }
    }
    return { status: 200, body: { success: true, message: `导入完成：成功 ${inserted.length} 条，失败 ${errors.length} 条`, data: { inserted, errors } } };
  } catch (error) {
    console.error('❌ [Admin] Batch import error:', error);
    return { status: 500, body: { success: false, error: 'IMPORT_FAILED', message: error.message } };
  }
};
