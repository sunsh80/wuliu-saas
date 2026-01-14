// backend/api/handlers/healthCheck.js

/**
 * Handler for operationId: healthCheck
 * @param {import('openapi-backend').Context} c - OpenAPI context
 * @returns {{ status: number, body: object }}
 */
module.exports = async (c) => {
 return {
 statusCode: 200, // 👈 必须是 statusCode，不是 status！
 body: {
 status: 'OK',
 time: new Date().toISOString(),
 uptime: process.uptime(),
  },
 };
};