// swaggerDef.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // 您可以使用 3.0.0 或 3.1.0
    info: {
      title: '物流系统 API', // 替换为您项目的名称
      version: '1.0.0',     // 您项目的版本号
      description: '物流系统的 API 接口文档', // 您项目的描述
    },
    // Optional: 如果您的 API 需要认证，可以在此处定义
    // components: {
    //   securitySchemes: {
    //     BearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //     },
    //   },
    // },
  },
  // 指定 swagger-jsdoc 需要扫描哪些文件来查找 JSDoc 注释
  // 注意：路径是相对于执行 node 命令时的工作目录
  // 假设您的路由文件放在 backend/routes/ 目录下
  apis: ['./backend/routes/*.js', './backend/routes/**/*.js'], // 扫描所有 routes 目录及其子目录下的 .js 文件
};

const specs = swaggerJsdoc(options);

module.exports = specs;