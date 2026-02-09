const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');

// 解析YAML
const spec = yaml.load(content);

// 添加价格API端点到paths
spec.paths['/api/admin/pricing-rules'] = {
  get: {
    tags: ['admin-pricing'],
    summary: '获取平台定价规则列表',
    operationId: 'listPlatformPricingRules',
    security: [
      { AdminSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: {
          type: 'integer',
          default: 1
        },
        description: '页码'
      },
      {
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          default: 10
        },
        description: '每页数量'
      },
      {
        name: 'active',
        in: 'query',
        schema: {
          type: 'boolean'
        },
        description: '是否只返回激活的规则'
      }
    ],
    responses: {
      '200': {
        description: '定价规则列表',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true
                },
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/PricingRule'
                  }
                },
                pagination: {
                  $ref: '#/components/schemas/Pagination'
                }
              }
            }
          }
        }
      },
      '401': {
        $ref: '#/components/responses/UnauthorizedError'
      }
    }
  },
  post: {
    tags: ['admin-pricing'],
    summary: '创建平台定价规则',
    operationId: 'createPlatformPricingRule',
    security: [
      { AdminSessionAuth: [] }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/CreatePricingRuleRequest'
          }
        }
      }
    },
    responses: {
      '201': {
        description: '定价规则创建成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true
                },
                message: {
                  type: 'string',
                  example: '平台定价规则创建成功'
                },
                data: {
                  $ref: '#/components/schemas/PricingRule'
                }
              }
            }
          }
        }
      },
      '400': {
        $ref: '#/components/responses/BadRequestError'
      },
      '401': {
        $ref: '#/components/responses/UnauthorizedError'
      },
      '500': {
        $ref: '#/components/responses/InternalServerError'
      }
    }
  }
};

spec.paths['/api/admin/pricing-rules/{id}'] = {
  get: {
    tags: ['admin-pricing'],
    summary: '获取单个平台定价规则',
    operationId: 'getPlatformPricingRule',
    security: [
      { AdminSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: '定价规则ID'
      }
    ],
    responses: {
      '200': {
        description: '定价规则详情',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true
                },
                data: {
                  $ref: '#/components/schemas/PricingRule'
                }
              }
            }
          }
        }
      },
      '401': {
        $ref: '#/components/responses/UnauthorizedError'
      },
      '404': {
        $ref: '#/components/responses/NotFoundError'
      }
    }
  },
  put: {
    tags: ['admin-pricing'],
    summary: '更新平台定价规则',
    operationId: 'updatePlatformPricingRule',
    security: [
      { AdminSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: '定价规则ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UpdatePricingRuleRequest'
          }
        }
      }
    },
    responses: {
      '200': {
        description: '定价规则更新成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true
                },
                message: {
                  type: 'string',
                  example: '平台定价规则更新成功'
                },
                data: {
                  $ref: '#/components/schemas/PricingRule'
                }
              }
            }
          }
        }
      },
      '400': {
        $ref: '#/components/responses/BadRequestError'
      },
      '401': {
        $ref: '#/components/responses/UnauthorizedError'
      },
      '404': {
        $ref: '#/components/responses/NotFoundError'
      },
      '500': {
        $ref: '#/components/responses/InternalServerError'
      }
    }
  },
  delete: {
    tags: ['admin-pricing'],
    summary: '删除平台定价规则',
    operationId: 'deletePlatformPricingRule',
    security: [
      { AdminSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: '定价规则ID'
      }
    ],
    responses: {
      '200': {
        description: '定价规则删除成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true
                },
                message: {
                  type: 'string',
                  example: '平台定价规则删除成功'
                }
              }
            }
          }
        }
      },
      '401': {
        $ref: '#/components/responses/UnauthorizedError'
      },
      '404': {
        $ref: '#/components/responses/NotFoundError'
      },
      '500': {
        $ref: '#/components/responses/InternalServerError'
      }
    }
  }
};

// 添加所需的schema定义
spec.components.schemas.PricingRule = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      example: 1
    },
    rule_name: {
      type: 'string',
      example: '标准定价规则'
    },
    base_price: {
      type: 'number',
      example: 10.0
    },
    price_per_km: {
      type: 'number',
      example: 2.5
    },
    price_per_hour: {
      type: 'number',
      example: 5.0
    },
    price_per_kg: {
      type: 'number',
      example: 1.0
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.5
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.5
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.8
    },
    weather_multiplier: {
      type: 'number',
      example: 1.2
    },
    min_price: {
      type: 'number',
      example: 5.0
    },
    max_price: {
      type: 'number',
      example: 1000.0
    },
    time_slot_rules: {
      type: 'object',
      example: {}
    },
    region_rules: {
      type: 'object',
      example: {}
    },
    vehicle_type_rules: {
      type: 'object',
      example: {}
    },
    active: {
      type: 'boolean',
      example: true
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-01-25T15:30:00Z'
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-01-25T15:30:00Z'
    }
  }
};

spec.components.schemas.CreatePricingRuleRequest = {
  type: 'object',
  required: ['rule_name'],
  properties: {
    rule_name: {
      type: 'string',
      example: '标准定价规则',
      description: '定价规则名称'
    },
    base_price: {
      type: 'number',
      example: 10.0,
      description: '基础价格'
    },
    price_per_km: {
      type: 'number',
      example: 2.5,
      description: '每公里价格'
    },
    price_per_hour: {
      type: 'number',
      example: 5.0,
      description: '每小时价格'
    },
    price_per_kg: {
      type: 'number',
      example: 1.0,
      description: '每公斤价格'
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.5,
      description: '冷藏附加费'
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.5,
      description: '高峰时段倍率'
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.8,
      description: '非高峰时段倍率'
    },
    weather_multiplier: {
      type: 'number',
      example: 1.2,
      description: '天气倍率'
    },
    min_price: {
      type: 'number',
      example: 5.0,
      description: '最低价格'
    },
    max_price: {
      type: 'number',
      example: 1000.0,
      description: '最高价格'
    },
    time_slot_rules: {
      type: 'object',
      description: '时段规则'
    },
    region_rules: {
      type: 'object',
      description: '地区规则'
    },
    vehicle_type_rules: {
      type: 'object',
      description: '车型规则'
    },
    active: {
      type: 'boolean',
      example: true,
      description: '是否激活'
    }
  }
};

spec.components.schemas.UpdatePricingRuleRequest = {
  type: 'object',
  properties: {
    rule_name: {
      type: 'string',
      example: '标准定价规则',
      description: '定价规则名称'
    },
    base_price: {
      type: 'number',
      example: 10.0,
      description: '基础价格'
    },
    price_per_km: {
      type: 'number',
      example: 2.5,
      description: '每公里价格'
    },
    price_per_hour: {
      type: 'number',
      example: 5.0,
      description: '每小时价格'
    },
    price_per_kg: {
      type: 'number',
      example: 1.0,
      description: '每公斤价格'
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.5,
      description: '冷藏附加费'
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.5,
      description: '高峰时段倍率'
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.8,
      description: '非高峰时段倍率'
    },
    weather_multiplier: {
      type: 'number',
      example: 1.2,
      description: '天气倍率'
    },
    min_price: {
      type: 'number',
      example: 5.0,
      description: '最低价格'
    },
    max_price: {
      type: 'number',
      example: 1000.0,
      description: '最高价格'
    },
    time_slot_rules: {
      type: 'object',
      description: '时段规则'
    },
    region_rules: {
      type: 'object',
      description: '地区规则'
    },
    vehicle_type_rules: {
      type: 'object',
      description: '车型规则'
    },
    active: {
      type: 'boolean',
      description: '是否激活'
    }
  }
};

// 将更新后的规范写回文件
const newYaml = yaml.dump(spec, { lineWidth: -1, noRefs: true });
fs.writeFileSync(openapiPath, newYaml);

console.log('✅ 价格API端点已使用YAML解析器安全添加到OpenAPI规范中');
console.log('- listPlatformPricingRules (GET /api/admin/pricing-rules)');
console.log('- createPlatformPricingRule (POST /api/admin/pricing-rules)');
console.log('- getPlatformPricingRule (GET /api/admin/pricing-rules/{id})');
console.log('- updatePlatformPricingRule (PUT /api/admin/pricing-rules/{id})');
console.log('- deletePlatformPricingRule (DELETE /api/admin/pricing-rules/{id})');