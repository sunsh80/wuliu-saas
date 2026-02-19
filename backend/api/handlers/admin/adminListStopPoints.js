// backend/api/handlers/admin/adminListStopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { page = 1, limit = 20, region, type, status, search } = c.request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM stop_points WHERE 1=1';
    const countQuery = 'SELECT COUNT(*) as total FROM stop_points WHERE 1=1';
    const params = [];
    const countParams = [];

    if (region) { params.push(region); query += ' AND region = ?'; countParams.push(region); }
    if (type) { params.push(type); query += ' AND type = ?'; countParams.push(type); }
    if (status) { params.push(status); query += ' AND status = ?'; countParams.push(status); }
    if (search) { params.push(`%${search}%`, `%${search}%`); query += ' AND (name LIKE ? OR address LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const db = getDb();
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    const stopPoints = await db.all(query, params);

    return {
      status: 200,
      body: {
        success: true,
        data: {
          list: stopPoints,
          pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
        }
      }
    };
  } catch (error) {
    console.error('❌ [Admin] List stop points error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
