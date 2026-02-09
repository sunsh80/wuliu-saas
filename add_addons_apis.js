const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');
const spec = yaml.load(content);

// 添加新的API端点
// 1. POST /api/order/{id}/add-ons - 承运商提交附加费
spec.paths['/api/order/{id}/add-ons'] = {
  post: {
    tags: ['carrier-order'],
    summary: '为订单添加附加费 - 承运商提交附加服务费用',
    operationId: 'addOrderAddons',
    security: [
      { TenantSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: '订单ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['addons_config', 'addons_total'],
            properties: {
              addons_config: {
                type: 'object',
                description: '附加服务配置',
                properties: {
                  loading_fee: {
                    type: 'number',
                    example: 50.0,
                    description: '装卸费'
                  },
                  waiting_fee: {
                    type: 'number',
                    example: 30.0,
                    description: '等待费'
                  },
                  overtime_fee: {
                    type: 'number',
                    example: 100.0,
                    description: '超时费'
                  },
                  special_handling_fee: {
                    type: 'number',
                    example: 80.0,
                    description: '特殊处理费'
                  },
                  cold_storage_fee: {
                    type: 'number',
                    example: 40.0,
                    description: '冷藏附加费'
                  },
                  insurance_fee: {
                    type: 'number',
                    example: 20.0,
                    description: '保险费'
                  },
                  other_fees: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          example: '夜间配送费'
                        },
                        amount: {
                          type: 'number',
                          example: 60.0
                        },
                        description: {
                          type: 'string',
                          example: '夜间配送额外费用'
                        }
                      }
                    }
                  }
                }
              },
              addons_total: {
                type: 'number',
                example: 230.0,
                description: '附加费总计'
              },
              description: {
                type: 'string',
                example: '因客户要求夜间配送和特殊包装产生的附加费用',
                description: '附加费说明'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: '附加费添加成功',
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
                  example: '订单附加费添加成功'
                },
                data: {
                  type: 'object',
                  properties: {
                    order_id: {
                      type: 'integer',
                      example: 1
                    },
                    tracking_number: {
                      type: 'string',
                      example: 'ORD-20260209-001'
                    },
                    addons_config: {
                      $ref: '#/components/schemas/AddonsConfig'
                    },
                    addons_total: {
                      type: 'number',
                      example: 230.0
                    },
                    addons_status: {
                      type: 'string',
                      example: 'pending',
                      enum: ['pending', 'confirmed', 'rejected']
                    },
                    updated_at: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-02-09T12:00:00Z'
                    }
                  }
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
      '403': {
        $ref: '#/components/responses/ForbiddenError'
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

// 2. PATCH /api/order/{id}/add-ons/confirm - 客户确认附加费
spec.paths['/api/order/{id}/add-ons/confirm'] = {
  patch: {
    tags: ['customer-order'],
    summary: '确认订单附加费 - 客户确认或拒绝承运商提交的附加费',
    operationId: 'confirmOrderAddons',
    security: [
      { TenantSessionAuth: [] }
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: '订单ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['confirm'],
            properties: {
              confirm: {
                type: 'boolean',
                example: true,
                description: '是否确认附加费 (true=确认, false=拒绝)'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: '附加费确认状态更新成功',
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
                  example: '订单附加费已确认'
                },
                data: {
                  type: 'object',
                  properties: {
                    order_id: {
                      type: 'integer',
                      example: 1
                    },
                    tracking_number: {
                      type: 'string',
                      example: 'ORD-20260209-001'
                    },
                    addons_total: {
                      type: 'number',
                      example: 230.0
                    },
                    addons_status: {
                      type: 'string',
                      example: 'confirmed',
                      enum: ['pending', 'confirmed', 'rejected']
                    },
                    addons_confirmation_time: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-02-09T12:00:00Z'
                    },
                    total_price_with_addons: {
                      type: 'number',
                      example: 530.0
                    },
                    updated_at: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-02-09T12:00:00Z'
                    }
                  }
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
      '403': {
        $ref: '#/components/responses/ForbiddenError'
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

// 添加AddonsConfig schema定义
spec.components.schemas.AddonsConfig = {
  type: 'object',
  properties: {
    loading_fee: {
      type: 'number',
      example: 50.0,
      description: '装卸费'
    },
    waiting_fee: {
      type: 'number',
      example: 30.0,
      description: '等待费'
    },
    overtime_fee: {
      type: 'number',
      example: 100.0,
      description: '超时费'
    },
    special_handling_fee: {
      type: 'number',
      example: 80.0,
      description: '特殊处理费'
    },
    cold_storage_fee: {
      type: 'number',
      example: 40.0,
      description: '冷藏附加费'
    },
    insurance_fee: {
      type: 'number',
      example: 20.0,
      description: '保险费'
    },
    other_fees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: '夜间配送费'
          },
          amount: {
            type: 'number',
            example: 60.0
          },
          description: {
            type: 'string',
            example: '夜间配送额外费用'
          }
        }
      }
    }
  }
};

// 将更新后的规范写回文件
const newYaml = yaml.dump(spec, { lineWidth: -1, noRefs: true });
fs.writeFileSync(openapiPath, newYaml);

console.log('✅ 附加费相关API端点已添加到OpenAPI规范中');
console.log('- POST /api/order/{id}/add-ons (addOrderAddons)');
console.log('- PATCH /api/order/{id}/add-ons/confirm (confirmOrderAddons)');
console.log('- 新增 AddonsConfig schema 定义');