// backend/api/handlers/admin/adminUpdateStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { id } = c.request.params;
    const body = c.request.body;
    const { name, address, lat, lng, type, region, capacity, description, status } = body || {};
    const db = getDb();
    const existing = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    if (!existing) {
      return { status: 404, body: { success: false, error: 'NOT_FOUND', message: '停靠点不存在' } };
    }

    const updates = [], params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (lat !== undefined) { updates.push('lat = ?'); params.push(parseFloat(lat)); }
    if (lng !== undefined) { updates.push('lng = ?'); params.push(parseFloat(lng)); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (region !== undefined) { updates.push('region = ?'); params.push(region); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return { status: 400, body: { success: false, error: 'VALIDATION_ERROR', message: '没有要更新的字段' } };
    }
    params.push(id);
    await db.run(`UPDATE stop_points SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);

    return { status: 200, body: { success: true, message: '更新成功', data: updated } };
  } catch (error) {
    console.error('❌ [Admin] Update stop point error:', error);
    return { status: 500, body: { success: false, error: 'UPDATE_FAILED', message: error.message } };
  }
};
