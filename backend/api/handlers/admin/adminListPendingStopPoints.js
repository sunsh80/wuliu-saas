// backend/api/handlers/admin/adminListPendingStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { page = 1, limit = 20, search, tenantName } = c.request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT sp.*, t.name as tenant_name, t.contact_person, u.name as uploaded_by_name FROM stop_points sp LEFT JOIN tenants t ON sp.tenant_id = t.id LEFT JOIN users u ON sp.uploaded_by = u.id WHERE sp.approval_status = 'pending'`;
    const countQuery = `SELECT COUNT(*) as total FROM stop_points sp WHERE sp.approval_status = 'pending'`;
    const params = [], countParams = [];
    if (search) { params.push(`%${search}%`, `%${search}%`); query += ' AND (sp.name LIKE ? OR sp.address LIKE ?)'; }
    if (tenantName) { params.push(`%${tenantName}%`); query += ' AND t.name LIKE ?'; }
    query += ' ORDER BY sp.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const db = getDb();
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    const stopPoints = await db.all(query, params);
    return { status: 200, body: { success: true, data: { list: stopPoints, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } } } };
  } catch (error) {
    console.error('❌ [Admin] List pending error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
