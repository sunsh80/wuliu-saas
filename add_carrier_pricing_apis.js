const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');

// 解析YAML
const spec = yaml.load(content);

// 添加承运商定价API端点到paths
spec.paths['/api/carrier/pricing-configs'] = {
  get: {
    tags: ['carrier-pricing'],
    summary: '获取承运商定价配置列表',
    operationId: 'listCarrierPricingConfigs',
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
        name: 'carrier_id',
        in: 'query',
        schema: {
          type: 'integer'
        },
        description: '承运商ID过滤'
      }
    ],
    responses: {
      '200': {
        description: '承运商定价配置列表',
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
                    $ref: '#/components/schemas/CarrierPricingConfig'
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
    tags: ['carrier-pricing'],
    summary: '创建承运商定价配置',
    operationId: 'createCarrierPricingConfig',
    security: [
      { AdminSessionAuth: [] }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/CreateCarrierPricingConfigRequest'
          }
        }
      }
    },
    responses: {
      '201': {
        description: '承运商定价配置创建成功',
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
                  example: '承运商定价配置创建成功'
                },
                data: {
                  $ref: '#/components/schemas/CarrierPricingConfig'
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

spec.paths['/api/carrier/pricing-configs/{id}'] = {
  get: {
    tags: ['carrier-pricing'],
    summary: '获取单个承运商定价配置',
    operationId: 'getCarrierPricingConfig',
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
        description: '定价配置ID'
      }
    ],
    responses: {
      '200': {
        description: '承运商定价配置详情',
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
                  $ref: '#/components/schemas/CarrierPricingConfig'
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
    tags: ['carrier-pricing'],
    summary: '更新承运商定价配置',
    operationId: 'updateCarrierPricingConfig',
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
        description: '定价配置ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/UpdateCarrierPricingConfigRequest'
          }
        }
      }
    },
    responses: {
      '200': {
        description: '承运商定价配置更新成功',
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
                  example: '承运商定价配置更新成功'
                },
                data: {
                  $ref: '#/components/schemas/CarrierPricingConfig'
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
    tags: ['carrier-pricing'],
    summary: '删除承运商定价配置',
    operationId: 'deleteCarrierPricingConfig',
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
        description: '定价配置ID'
      }
    ],
    responses: {
      '200': {
        description: '承运商定价配置删除成功',
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
                  example: '承运商定价配置删除成功'
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

// 添加承运商定价相关的schema定义
spec.components.schemas.CarrierPricingConfig = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      example: 1
    },
    carrier_id: {
      type: 'integer',
      example: 1
    },
    config_name: {
      type: 'string',
      example: '标准配送定价'
    },
    base_price: {
      type: 'number',
      example: 15.0
    },
    price_per_km: {
      type: 'number',
      example: 3.0
    },
    price_per_hour: {
      type: 'number',
      example: 6.0
    },
    price_per_kg: {
      type: 'number',
      example: 1.5
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.8
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.8
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.7
    },
    weather_multiplier: {
      type: 'number',
      example: 1.3
    },
    min_price: {
      type: 'number',
      example: 8.0
    },
    max_price: {
      type: 'number',
      example: 200.0
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

spec.components.schemas.CreateCarrierPricingConfigRequest = {
  type: 'object',
  required: ['carrier_id', 'config_name'],
  properties: {
    carrier_id: {
      type: 'integer',
      example: 1,
      description: '承运商ID'
    },
    config_name: {
      type: 'string',
      example: '标准配送定价',
      description: '配置名称'
    },
    base_price: {
      type: 'number',
      example: 15.0,
      description: '基础价格'
    },
    price_per_km: {
      type: 'number',
      example: 3.0,
      description: '每公里价格'
    },
    price_per_hour: {
      type: 'number',
      example: 6.0,
      description: '每小时价格'
    },
    price_per_kg: {
      type: 'number',
      example: 1.5,
      description: '每公斤价格'
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.8,
      description: '冷藏附加费'
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.8,
      description: '高峰时段倍率'
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.7,
      description: '非高峰时段倍率'
    },
    weather_multiplier: {
      type: 'number',
      example: 1.3,
      description: '天气倍率'
    },
    min_price: {
      type: 'number',
      example: 8.0,
      description: '最低价格'
    },
    max_price: {
      type: 'number',
      example: 200.0,
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

spec.components.schemas.UpdateCarrierPricingConfigRequest = {
  type: 'object',
  properties: {
    config_name: {
      type: 'string',
      example: '标准配送定价',
      description: '配置名称'
    },
    base_price: {
      type: 'number',
      example: 15.0,
      description: '基础价格'
    },
    price_per_km: {
      type: 'number',
      example: 3.0,
      description: '每公里价格'
    },
    price_per_hour: {
      type: 'number',
      example: 6.0,
      description: '每小时价格'
    },
    price_per_kg: {
      type: 'number',
      example: 1.5,
      description: '每公斤价格'
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.8,
      description: '冷藏附加费'
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.8,
      description: '高峰时段倍率'
    },
    off_peak_hour_multiplier: {
      type: 'number',
      example: 0.7,
      description: '非高峰时段倍率'
    },
    weather_multiplier: {
      type: 'number',
      example: 1.3,
      description: '天气倍率'
    },
    min_price: {
      type: 'number',
      example: 8.0,
      description: '最低价格'
    },
    max_price: {
      type: 'number',
      example: 200.0,
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

console.log('✅ 承运商定价相关的API端点已添加到OpenAPI规范中');
console.log('- listCarrierPricingConfigs (GET /api/carrier/pricing-configs)');
console.log('- createCarrierPricingConfig (POST /api/carrier/pricing-configs)');
console.log('- getCarrierPricingConfig (GET /api/carrier/pricing-configs/{id})');
console.log('- updateCarrierPricingConfig (PUT /api/carrier/pricing-configs/{id})');
console.log('- deleteCarrierPricingConfig (DELETE /api/carrier/pricing-configs/{id})');