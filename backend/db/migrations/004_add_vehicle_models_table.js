/**
 * 车型库表 - 用于存储标准化的车型信息
 */
exports.up = async function(db) {
  // 创建车型库表
  await db.run(`
    CREATE TABLE IF NOT EXISTS vehicle_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,           -- 车辆品牌
      manufacturer TEXT NOT NULL,    -- 生产厂家
      model_name TEXT NOT NULL,      -- 车辆型号
      production_year TEXT,          -- 生产年份
      vehicle_type TEXT NOT NULL,    -- 车辆类型 (如：厢式货车、平板车、冷藏车等)
      autonomous_level TEXT,         -- 自动驾驶级别 (L0-L5)
      max_load_capacity REAL,        -- 最大载重(kg)
      max_volume REAL,               -- 最大容量(m³)
      fuel_type TEXT,                -- 燃料类型 (汽油、柴油、电动等)
      engine_displacement REAL,      -- 发动机排量(L)
      dimensions_length REAL,        -- 长度(m)
      dimensions_width REAL,         -- 宽度(m)
      dimensions_height REAL,        -- 高度(m)
      wheelbase REAL,                -- 轴距(m)
      max_speed INTEGER,             -- 最高速度(km/h)
      fuel_efficiency REAL,          -- 燃油效率(L/100km)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引以提高查询性能
  await db.run(`CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand ON vehicle_models(brand)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_vehicle_models_model_name ON vehicle_models(model_name)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_vehicle_models_vehicle_type ON vehicle_models(vehicle_type)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_vehicle_models_autonomous_level ON vehicle_models(autonomous_level)`);
  
  console.log('车辆型号表创建成功');
};

exports.down = async function(db) {
  await db.run(`DROP TABLE IF EXISTS vehicle_models`);
  console.log('车辆型号表删除成功');
};