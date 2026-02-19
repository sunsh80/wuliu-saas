// backend/api/handlers/admin/adminDeleteStopPoint.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  try {
    const { id } = c.request.params;
    const db = getDb();
    const existing = await db.get('SELECT * FROM stop_points WHERE id = ?', [id]);
    if (!existing) {
      return { status: 404, body: { success: false, error: 'NOT_FOUND', message: '停靠点不存在' } };
    }
    await db.run('DELETE FROM stop_points WHERE id = ?', [id]);
    return { status: 200, body: { success: true, message: '删除成功' } };
  } catch (error) {
    console.error('❌ [Admin] Delete stop point error:', error);
    return { status: 500, body: { success: false, error: 'DELETE_FAILED', message: error.message } };
  }
};
