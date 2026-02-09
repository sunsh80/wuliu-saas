const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');

// 解析YAML
const spec = yaml.load(content);

// 添加缺失的BadRequestError响应定义
spec.components.responses.BadRequestError = {
  description: '请求参数错误',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'BAD_REQUEST'
          },
          message: {
            type: 'string',
            example: '请求参数错误'
          }
        }
      }
    }
  }
};

// 添加其他可能缺失的通用响应
spec.components.responses.InternalServerError = {
  description: '服务器内部错误',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'INTERNAL_SERVER_ERROR'
          },
          message: {
            type: 'string',
            example: '服务器内部错误'
          }
        }
      }
    }
  }
};

spec.components.responses.NotFoundError = {
  description: '资源未找到',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'NOT_FOUND'
          },
          message: {
            type: 'string',
            example: '资源未找到'
          }
        }
      }
    }
  }
};

// 将更新后的规范写回文件
const newYaml = yaml.dump(spec, { lineWidth: -1, noRefs: true });
fs.writeFileSync(openapiPath, newYaml);

console.log('✅ 缺失的响应定义已添加');
console.log('- BadRequestError');
console.log('- InternalServerError');
console.log('- NotFoundError');
console.log('现在价格API端点引用的响应定义都存在了');