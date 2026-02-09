const fs = require('fs');
const yaml = require('js-yaml');

// 读取当前的openapi.yaml文件
const openapiPath = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
const content = fs.readFileSync(openapiPath, 'utf8');

// 解析YAML
const spec = yaml.load(content);

// 添加新的API端点
spec.paths['/api/order/quote'] = {
  post: {
    tags: ['public'],
    summary: '获取订单报价 - 客户下单时获取多家承运商报价',
    operationId: 'getOrderQuote',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['distance_km', 'duration_hours'],
            properties: {
              distance_km: {
                type: 'number',
                example: 15.5,
                description: '运输距离（公里）'
              },
              duration_hours: {
                type: 'number',
                example: 2.5,
                description: '预计运输时长（小时）'
              },
              weight_kg: {
                type: 'number',
                example: 100.0,
                description: '货物重量（公斤）'
              },
              is_cold_storage: {
                type: 'boolean',
                example: false,
                description: '是否需要冷链运输'
              },
              time_slot: {
                type: 'string',
                example: 'morning',
                description: '时间段（morning, afternoon, evening, night）'
              },
              weather_condition: {
                type: 'string',
                example: 'normal',
                enum: ['normal', 'rain', 'snow', 'storm'],
                description: '天气状况'
              },
              region: {
                type: 'string',
                example: 'beijing_haidian',
                description: '运输区域'
              },
              vehicle_type: {
                type: 'string',
                example: 'van',
                enum: ['van', 'truck', 'refrigerated_truck', 'container_truck'],
                description: '所需车型'
              },
              pickup_address: {
                type: 'string',
                example: '北京市海淀区中关村大街1号',
                description: '提货地址'
              },
              delivery_address: {
                type: 'string',
                example: '北京市朝阳区国贸大厦',
                description: '送货地址'
              },
              cargo_type: {
                type: 'string',
                example: 'electronics',
                enum: ['electronics', 'clothing', 'food', 'medicine', 'documents', 'other'],
                description: '货物类型'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: '报价计算成功',
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
                  example: '报价计算成功'
                },
                data: {
                  type: 'object',
                  properties: {
                    order_details: {
                      $ref: '#/components/schemas/OrderDetails'
                    },
                    quotes: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CarrierQuote'
                      }
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
      '500': {
        $ref: '#/components/responses/InternalServerError'
      }
    }
  }
};

// 添加所需的schema定义
spec.components.schemas.OrderDetails = {
  type: 'object',
  properties: {
    distance_km: {
      type: 'number',
      example: 15.5
    },
    duration_hours: {
      type: 'number',
      example: 2.5
    },
    weight_kg: {
      type: 'number',
      example: 100.0
    },
    is_cold_storage: {
      type: 'boolean',
      example: false
    },
    time_slot: {
      type: 'string',
      example: 'morning'
    },
    weather_condition: {
      type: 'string',
      example: 'normal'
    },
    region: {
      type: 'string',
      example: 'beijing_haidian'
    },
    vehicle_type: {
      type: 'string',
      example: 'van'
    },
    pickup_address: {
      type: 'string',
      example: '北京市海淀区中关村大街1号'
    },
    delivery_address: {
      type: 'string',
      example: '北京市朝阳区国贸大厦'
    },
    cargo_type: {
      type: 'string',
      example: 'electronics'
    }
  }
};

spec.components.schemas.CarrierQuote = {
  type: 'object',
  properties: {
    carrier_id: {
      type: 'integer',
      example: 1
    },
    carrier_name: {
      type: 'string',
      example: '顺丰速运'
    },
    avg_rating: {
      type: 'number',
      example: 4.8
    },
    price: {
      type: 'number',
      example: 150.00
    },
    base_price: {
      type: 'number',
      example: 10.00
    },
    distance_cost: {
      type: 'number',
      example: 37.50
    },
    duration_cost: {
      type: 'number',
      example: 12.50
    },
    weight_cost: {
      type: 'number',
      example: 100.00
    },
    cold_storage_surcharge: {
      type: 'number',
      example: 0.00
    },
    time_slot_multiplier: {
      type: 'number',
      example: 1.0
    },
    region_multiplier: {
      type: 'number',
      example: 1.0
    },
    vehicle_type_multiplier: {
      type: 'number',
      example: 1.0
    },
    weather_multiplier: {
      type: 'number',
      example: 1.0
    },
    peak_hour_multiplier: {
      type: 'number',
      example: 1.0
    },
    off_peak_multiplier: {
      type: 'number',
      example: 1.0
    }
  }
};

// 将更新后的规范写回文件
const newYaml = yaml.dump(spec, { lineWidth: -1, noRefs: true });
fs.writeFileSync(openapiPath, newYaml);

console.log('✅ 新增API端点 getOrderQuote 已添加到OpenAPI规范中');
console.log('- POST /api/order/quote (getOrderQuote)');