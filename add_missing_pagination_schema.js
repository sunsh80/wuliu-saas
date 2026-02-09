const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');

// 解析YAML
const spec = yaml.load(content);

// 添加缺失的Pagination schema定义
spec.components.schemas.Pagination = {
  type: 'object',
  properties: {
    current_page: {
      type: 'integer',
      example: 1
    },
    per_page: {
      type: 'integer',
      example: 10
    },
    total: {
      type: 'integer',
      example: 100
    },
    total_pages: {
      type: 'integer',
      example: 10
    },
    has_next: {
      type: 'boolean',
      example: true
    },
    has_prev: {
      type: 'boolean',
      example: false
    }
  }
};

// 同时添加PaginationInfo schema（如果也需要的话）
spec.components.schemas.PaginationInfo = {
  type: 'object',
  properties: {
    current_page: {
      type: 'integer',
      example: 1
    },
    per_page: {
      type: 'integer',
      example: 10
    },
    total: {
      type: 'integer',
      example: 100
    },
    total_pages: {
      type: 'integer',
      example: 10
    },
    has_next: {
      type: 'boolean',
      example: true
    },
    has_prev: {
      type: 'boolean',
      example: false
    }
  }
};

// 将更新后的规范写回文件
const newYaml = yaml.dump(spec, { lineWidth: -1, noRefs: true });
fs.writeFileSync(openapiPath, newYaml);

console.log('✅ 缺失的Pagination schema定义已添加');
console.log('现在价格API端点引用的Pagination schema存在了');