// backend/api/handlers/admin/adminGetStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { id } = c.request.params;
    const db = getDb();
    const stopPoint = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    if (!stopPoint) {
      return { status: 404, body: { success: false, error: 'NOT_FOUND', message: '停靠点不存在' } };
    }
    return { status: 200, body: { success: true, data: stopPoint } };
  } catch (error) {
    console.error('❌ [Admin] Get stop point error:', error);
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
