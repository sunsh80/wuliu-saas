// backend/scripts/merge-openapi.js
/**
 * 将新的 API 定义合并到 openapi.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openapiPath = path.join(__dirname, '..', 'openapi.yaml');

// 读取现有 openapi.yaml
console.log('📖 读取 openapi.yaml...');
const openapiContent = fs.readFileSync(openapiPath, 'utf8');
const openapi = yaml.load(openapiContent);

// 添加新的 tags
const newTags = [
  { name: 'admin-violation', description: '平台管理员 - 违规管理' },
  { name: 'admin-commission', description: '平台管理员 - 抽佣管理' },
  { name: 'admin-setting', description: '平台管理员 - 系统设置' },
  { name: 'admin-vehicle-tracking', description: '平台管理员 - 车辆追踪' }
];

console.log('📝 添加新的 tags...');
newTags.forEach(tag => {
  const exists = openapi.tags.some(t => t.name === tag.name);
  if (!exists) {
    openapi.tags.push(tag);
    console.log(`   ✅ 添加 tag: ${tag.name}`);
  }
});

// 添加新的 paths
console.log('📝 添加新的 API paths...');

// ========== 违规管理 ==========
openapi.paths['/api/admin/violations'] = {
  get: {
    operationId: 'listViolations',
    summary: '获取违规记录列表',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processed', 'cancelled'] } },
      { name: 'severity', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
      { name: 'violation_type', in: 'query', schema: { type: 'string' } },
      { name: 'tenant_id', in: 'query', schema: { type: 'integer' } }
    ],
    responses: {
      '200': {
        description: '成功返回违规记录列表',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    violations: { type: 'array', items: { $ref: '#/components/schemas/Violation' } },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      '401': { $ref: '#/components/responses/UnauthorizedError' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  },
  post: {
    operationId: 'createViolation',
    summary: '创建违规记录',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateViolationRequest' }
        }
      }
    },
    responses: {
      '201': {
        description: '创建成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { $ref: '#/components/schemas/Violation' }
              }
            }
          }
        }
      },
      '400': { description: '请求参数错误' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/violations/stats'] = {
  get: {
    operationId: 'getViolationStats',
    summary: '获取违规统计数据',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    responses: {
      '200': {
        description: '成功返回统计数据',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    pending_count: { type: 'integer' },
                    processed_count: { type: 'integer' },
                    high_severity_count: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/violations/{id}'] = {
  get: {
    operationId: 'getViolationById',
    summary: '获取违规记录详情',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      '200': {
        description: '成功返回违规记录详情',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { $ref: '#/components/schemas/Violation' }
              }
            }
          }
        }
      },
      '404': { description: '未找到违规记录' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  },
  put: {
    operationId: 'updateViolation',
    summary: '更新违规记录',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateViolationRequest' }
        }
      }
    },
    responses: {
      '200': { description: '更新成功' },
      '400': { description: '请求参数错误' },
      '404': { description: '未找到违规记录' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  },
  delete: {
    operationId: 'deleteViolation',
    summary: '删除违规记录',
    tags: ['admin-violation'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      '200': { description: '删除成功' },
      '404': { description: '未找到违规记录' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

// ========== 抽佣管理 ==========
openapi.paths['/api/admin/commissions/config'] = {
  get: {
    operationId: 'getCommissionConfig',
    summary: '获取抽佣配置',
    tags: ['admin-commission'],
    security: [{ AdminSessionAuth: [] }],
    responses: {
      '200': {
        description: '成功返回抽佣配置',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { $ref: '#/components/schemas/CommissionConfig' }
              }
            }
          }
        }
      },
      '404': { description: '未找到配置' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  },
  put: {
    operationId: 'updateCommissionConfig',
    summary: '更新抽佣配置',
    tags: ['admin-commission'],
    security: [{ AdminSessionAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateCommissionConfigRequest' }
        }
      }
    },
    responses: {
      '200': { description: '更新成功' },
      '400': { description: '请求参数错误' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/commissions/records'] = {
  get: {
    operationId: 'listCommissionRecords',
    summary: '获取抽佣记录列表',
    tags: ['admin-commission'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'order_id', in: 'query', schema: { type: 'integer' } },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'completed', 'cancelled'] } }
    ],
    responses: {
      '200': {
        description: '成功返回抽佣记录列表',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    records: { type: 'array', items: { $ref: '#/components/schemas/CommissionRecord' } },
                    total: { type: 'integer' },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/commissions/records/{id}/status'] = {
  put: {
    operationId: 'updateCommissionRecordStatus',
    summary: '更新抽佣记录状态',
    tags: ['admin-commission'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] }
            }
          }
        }
      }
    },
    responses: {
      '200': { description: '更新成功' },
      '400': { description: '请求参数错误' },
      '404': { description: '未找到记录' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

// ========== 系统设置 ==========
openapi.paths['/api/admin/settings'] = {
  get: {
    operationId: 'listSettings',
    summary: '获取系统设置列表',
    tags: ['admin-setting'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'category', in: 'query', schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: '成功返回系统设置',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { type: 'object' }
              }
            }
          }
        }
      },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/settings/{id}'] = {
  put: {
    operationId: 'updateSetting',
    summary: '更新系统设置',
    tags: ['admin-setting'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              description: { type: 'string' },
              is_public: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      '200': { description: '更新成功' },
      '400': { description: '请求参数错误' },
      '404': { description: '未找到设置项' },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

// ========== 车辆追踪 ==========
openapi.paths['/api/admin/vehicle-tracking/positions'] = {
  get: {
    operationId: 'getVehiclePositions',
    summary: '获取车辆位置列表',
    tags: ['admin-vehicle-tracking'],
    security: [{ AdminSessionAuth: [] }],
    parameters: [
      { name: 'vehicle_id', in: 'query', schema: { type: 'integer' } },
      { name: 'plate_number', in: 'query', schema: { type: 'string' } },
      { name: 'tenant_id', in: 'query', schema: { type: 'integer' } },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['idle', 'transporting', 'maintenance', 'offline'] } }
    ],
    responses: {
      '200': {
        description: '成功返回车辆位置列表',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    positions: { type: 'array', items: { $ref: '#/components/schemas/VehiclePosition' } },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

openapi.paths['/api/admin/vehicle-tracking/latest-positions'] = {
  get: {
    operationId: 'getLatestPositions',
    summary: '获取所有车辆最新位置',
    tags: ['admin-vehicle-tracking'],
    security: [{ AdminSessionAuth: [] }],
    responses: {
      '200': {
        description: '成功返回最新位置',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    positions: { type: 'array' },
                    onlineVehicles: { type: 'array' },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      '500': { $ref: '#/components/responses/InternalServerError' }
    }
  }
};

// ========== 添加新的 Schemas ==========
console.log('📝 添加新的 Schemas...');

openapi.components.schemas.Violation = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    tenant_id: { type: 'integer' },
    tenant_name: { type: 'string' },
    violation_type: { type: 'string' },
    description: { type: 'string' },
    violation_date: { type: 'string', format: 'date' },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    status: { type: 'string', enum: ['pending', 'processed', 'cancelled'] },
    handler_id: { type: 'integer' },
    handle_notes: { type: 'string' },
    handle_date: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' }
  }
};

openapi.components.schemas.CreateViolationRequest = {
  type: 'object',
  required: ['tenant_id', 'tenant_name', 'violation_type', 'description', 'violation_date', 'severity'],
  properties: {
    tenant_id: { type: 'integer' },
    tenant_name: { type: 'string' },
    violation_type: { type: 'string' },
    description: { type: 'string' },
    violation_date: { type: 'string', format: 'date' },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    handler_id: { type: 'integer' }
  }
};

openapi.components.schemas.UpdateViolationRequest = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['pending', 'processed', 'cancelled'] },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    description: { type: 'string' },
    handler_id: { type: 'integer' },
    handle_notes: { type: 'string' },
    handle_date: { type: 'string' }
  }
};

openapi.components.schemas.CommissionConfig = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    platform_rate: { type: 'number' },
    carrier_rate: { type: 'number' },
    min_amount: { type: 'number' },
    max_amount: { type: 'number' },
    effective_date: { type: 'string' },
    notes: { type: 'string' },
    tiers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          min_amount: { type: 'number' },
          max_amount: { type: 'number' },
          platform_rate: { type: 'number' },
          carrier_rate: { type: 'number' }
        }
      }
    }
  }
};

openapi.components.schemas.UpdateCommissionConfigRequest = {
  type: 'object',
  properties: {
    platform_rate: { type: 'number' },
    carrier_rate: { type: 'number' },
    min_amount: { type: 'number' },
    max_amount: { type: 'number' },
    notes: { type: 'string' },
    tiers: { type: 'array', items: { type: 'object' } }
  }
};

openapi.components.schemas.CommissionRecord = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    order_id: { type: 'integer' },
    order_amount: { type: 'number' },
    platform_commission: { type: 'number' },
    carrier_commission: { type: 'number' },
    status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
    paid_date: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' }
  }
};

openapi.components.schemas.VehiclePosition = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    vehicle_id: { type: 'integer' },
    plate_number: { type: 'string' },
    tenant_id: { type: 'integer' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    speed: { type: 'number' },
    direction: { type: 'number' },
    status: { type: 'string', enum: ['idle', 'transporting', 'maintenance', 'offline'] },
    address: { type: 'string' },
    accuracy: { type: 'number' },
    created_at: { type: 'string' }
  }
};

// 写回文件
console.log('💾 保存 openapi.yaml...');
const yamlStr = yaml.dump(openapi, {
  lineWidth: -1,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false
});

fs.writeFileSync(openapiPath, yamlStr, 'utf8');

console.log('✅ OpenAPI 定义更新完成！');
console.log(`   - 新增 tags: ${newTags.length}`);
console.log(`   - 新增 paths: 10`);
console.log(`   - 新增 schemas: 7`);
