// backend/routes/auth.js

const express = require('express');
const router = express.Router();

/**
 * 健康检查接口：验证当前 Session 是否有效
 */
router.get('/ping', (req, res) => {
  // 👇 将日志记录放在路由处理函数内部
  console.log(`[PING] Request from IP: ${req.ip}, Session ID: ${req.sessionID}`);

  if (req.session && req.session.userId) {
    return res.json({
      success: true,
      message: 'Session is valid',
      user: {
        id: req.session.userId,
        name: req.session.userName || 'Unknown User'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Session is invalid or not logged in'
  });
});

module.exports = router;