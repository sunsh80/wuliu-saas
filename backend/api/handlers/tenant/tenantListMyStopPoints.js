// backend/api/handlers/tenant/tenantListMyStopPoints.js
const { getDb } = require('../../../db/index');
const { requireAuth } = require('../../../utils/requireAuth');

module.exports = requireAuth(async (c) => {
  try {
    const tenantId = c.context?.tenantId;
    const { page = 1, limit = 20, approvalStatus, search } = c.request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    if (!tenantId) { return { status: 401, body: { success: false, error: 'UNAUTHORIZED' } }; }
    let query = 'SELECT * FROM stop_points WHERE tenant_id = ?';
    const countQuery = 'SELECT COUNT(*) as total FROM stop_points WHERE tenant_id = ?';
    const params = [tenantId], countParams = [tenantId];
    if (approvalStatus) { query += ' AND approval_status = ?'; params.push(approvalStatus); countParams.push(approvalStatus); }
    if (search) { query += ' AND (name LIKE ? OR address LIKE ?)'; params.push(`%${search}%`, `%${search}%`); countParams.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const db = getDb();
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    const stopPoints = await db.all(query, params);
    const now = new Date();
    const stopPointsWithDeletable = stopPoints.map(sp => {
      const createdAt = new Date(sp.created_at);
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      return { ...sp, deletable: daysDiff <= 3 && sp.approval_status !== 'rejected' };
    });
    return { status: 200, body: { success: true, data: { list: stopPointsWithDeletable, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } } } };
  } catch (error) {
    console.error('❌ [Tenant] List my stop points error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
});
