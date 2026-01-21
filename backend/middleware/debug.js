// backend/middleware/debug.js
module.exports = {
  // 调试登录端点
  debugLogin: (req, res) => {
    const { userId, tenantId } = req.body;
    req.session.userId = userId || 24;
    req.session.tenantId = tenantId || 3;
    res.json({ 
      success: true, 
      message: 'Session set', 
      session: req.session 
    });
  },

  // 调试session查看端点
  debugSession: (req, res) => {
    res.json({
      authenticated: !!req.session?.userId,
      userId: req.session?.userId,
      tenantId: req.session?.tenantId,
      sessionId: req.sessionID
    });
  }
};