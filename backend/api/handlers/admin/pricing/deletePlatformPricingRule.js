// backend/api/handlers/admin/pricing/deletePlatformPricingRule.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
  const ruleId = c.request.params.id;
  const db = getDb();
  
  // 验證ID
  if (!ruleId || isNaN(ruleId)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_RULE_ID',
        message: '无效的定价规则ID'
      }
    };
  }

  try {
    // 检查规则是否存在
    const existingRule = await db.get('SELECT id FROM platform_pricing_rules WHERE id = ?', [ruleId]);
    if (!existingRule) {
      return {
        statusCode: 404,
        body: {
          success: false,
          error: 'RULE_NOT_FOUND',
          message: '未找到指定的定价规则'
        }
      };
    }

    // 删除规则
    await db.run('DELETE FROM platform_pricing_rules WHERE id = ?', [ruleId]);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '平台定价规则删除成功'
      }
    };
  } catch (error) {
    console.error('删除平台定价规则失败:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '删除平台定价规则失败'
      }
    };
  }
};