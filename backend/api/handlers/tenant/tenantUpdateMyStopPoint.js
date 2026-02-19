// backend/api/handlers/tenant/tenantUpdateMyStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const { id } = c.request.params;
    const body = await c.request.json();
    const { name, address, lat, lng, type, region, capacity, description } = body;
    if (!tenantId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!stopPoint) { return { status: 404, body: { success: false, error: 'NOT_FOUND' } }; }
    if (stopPoint.approval_status !== 'pending') { return { status: 403, body: { success: false, error: 'UPDATE_FORBIDDEN', message: '只能更新待审批状态' } }; }
    const updates = [], params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (lat !== undefined) { updates.push('lat = ?'); params.push(parseFloat(lat)); }
    if (lng !== undefined) { updates.push('lng = ?'); params.push(parseFloat(lng)); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (region !== undefined) { updates.push('region = ?'); params.push(region); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (updates.length === 0) { return { status: 400, body: { success: false, error: 'VALIDATION_ERROR' } }; }
    params.push(id, tenantId);
    await db.run(`UPDATE stop_points SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const updated = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    return { status: 200, body: { success: true, message: '更新成功，需重新审批', data: updated } };
  } catch (error) {
    console.error('❌ [Tenant] Update error:', error);
    return { status: 500, body: { success: false, error: 'UPDATE_FAILED', message: error.message } };
  }
};
