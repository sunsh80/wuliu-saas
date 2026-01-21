// backend/middleware/error.js
module.exports = {
  // 全局错误处理
  globalErrorHandler: (err, req, res, next) => {
    console.error('🌍 全局错误:', err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  },

  // API错误处理
  apiErrorHandler: (err, req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.error('💥 [API 处理异常]:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
      }
    } else {
      next(err);
    }
  }
};