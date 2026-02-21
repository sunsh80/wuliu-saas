// backend/api/handlers/admin/adminStopPointsStats.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('[Admin] 停靠点统计请求开始');
  
  try {
    const db = getDb();
    
    // 查询总数
    const totalResult = await db.get('SELECT COUNT(*) as total FROM stop_points');
    const total = totalResult ? totalResult.total : 0;
    
    // 查询待审批数量
    const pendingResult = await db.get('SELECT COUNT(*) as total FROM stop_points WHERE approval_status = ?', ['pending']);
    const pending = pendingResult ? pendingResult.total : 0;
    
    // 查询已通过数量
    const approvedResult = await db.get('SELECT COUNT(*) as total FROM stop_points WHERE approval_status = ?', ['approved']);
    const approved = approvedResult ? approvedResult.total : 0;
    
    // 查询已拒绝数量
    const rejectedResult = await db.get('SELECT COUNT(*) as total FROM stop_points WHERE approval_status = ?', ['rejected']);
    const rejected = rejectedResult ? rejectedResult.total : 0;
    
    console.log('[Admin] 停靠点统计结果:', { total, pending, approved, rejected });
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: { total, pending, approved, rejected } 
      } 
    };
  } catch (error) {
    console.error('❌ [Admin] 停靠点统计错误:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'FETCH_FAILED', 
        message: error.message 
      } 
    };
  }
};
