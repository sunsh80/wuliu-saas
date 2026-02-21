// backend/api/handlers/admin/adminListPendingStopPoints.js
const { getDb, DB_PATH } = require('../../../db/index');

module.exports = async (c) => {
  console.log('\n========== [Admin] 待审批列表请求开始 ==========');
  console.log('[Admin] 请求参数:', c.request.query);
  console.log('[Admin] 数据库路径:', DB_PATH);
  
  try {
    const { page = 1, limit = 20, search, tenantName } = c.request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const db = getDb();
    console.log('[Admin] 数据库实例:', !!db);

    // 调试：先查询所有待审批数据（不带条件）
    const allPending = await db.all(`SELECT id, name, tenant_id, upload_source, approval_status FROM stop_points WHERE approval_status = 'pending' ORDER BY id DESC`);
    console.log('[Admin] 待审批总数:', allPending.length);
    console.log('[Admin] 待审批数据详情:', JSON.stringify(allPending, null, 2));
    
    let query = `SELECT sp.*, t.name as tenant_name, t.contact_person, u.name as uploaded_by_name FROM stop_points sp LEFT JOIN tenants t ON sp.tenant_id = t.id LEFT JOIN users u ON sp.uploaded_by = u.id WHERE sp.approval_status = 'pending'`;
    const countQuery = `SELECT COUNT(*) as total FROM stop_points sp WHERE sp.approval_status = 'pending'`;
    const params = [], countParams = [];
    if (search) { params.push(`%${search}%`, `%${search}%`); query += ' AND (sp.name LIKE ? OR sp.address LIKE ?)'; }
    if (tenantName) { params.push(`%${tenantName}%`); query += ' AND t.name LIKE ?'; }
    query += ' ORDER BY sp.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    console.log('[Admin] 查询 SQL:', query);
    console.log('[Admin] 查询参数:', params);
    
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    const stopPoints = await db.all(query, params);
    
    console.log('[Admin] 查询结果数量:', stopPoints.length);
    console.log('[Admin] 查询结果详情:', JSON.stringify(stopPoints, null, 2));
    console.log('========== [Admin] 待审批列表请求结束 ==========\\n');
    
    return { status: 200, body: { success: true, data: { list: stopPoints, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } } } };
  } catch (error) {
    console.error('❌ [Admin] List pending error:', error);
    console.error('========== [Admin] 错误详情 ==========\\n');
    return { status: 500, body: { success: false, error: 'FETCH_FAILED', message: error.message } };
  }
};
