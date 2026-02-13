// backend/db/schema.js
const bcrypt = require('bcryptjs');

// 核心表定义
const CORE_TABLES = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      roles TEXT,
      type TEXT NOT NULL,
      organization_id TEXT,
      organization_name TEXT,
      organization_type TEXT,
      password_hash TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK (user_type IN ('tenant_user', 'user', 'admin_user')),
      tenant_id INTEGER,
      customer_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
    );
  `,
  tenants: `
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      roles TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      service_radius_km INTEGER,
      capacity_kg REAL,
      capacity_m3 REAL,
      base_price_per_km REAL,
      avg_rating REAL DEFAULT 0.0,
      approved_at DATETIME,
      rejected_at DATETIME,
      rejection_notes TEXT
    );
  `,
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  customer_applications: `
    CREATE TABLE IF NOT EXISTS customer_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  orders: `
      CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_tenant_id INTEGER NOT NULL, -- 添加此行，引用 tenants.id
      carrier_id TEXT,
      tenant_id INTEGER,
      tracking_number TEXT UNIQUE NOT NULL,
      sender_info TEXT NOT NULL,
      receiver_info TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','pending_claim', 'claimed', 'quoted', 'awarded', 'dispatched', 'in_transit', 'delivered', 'cancelled')),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      quote_price REAL,
      quote_delivery_time TEXT,
      quote_remarks TEXT,
      quote_deadline TEXT,
      customer_phone TEXT,
      weight_kg REAL,
      volume_m3 REAL,
      required_delivery_time TEXT,
      description TEXT,
      cargo_type TEXT,
      type_user INTEGER DEFAULT NULL,
      FOREIGN KEY (customer_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );
  `,
  platform_pricing_rules: `
    CREATE TABLE IF NOT EXISTS platform_pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT NOT NULL,
      base_price REAL NOT NULL DEFAULT 0.0,
      price_per_km REAL NOT NULL DEFAULT 0.0,
      price_per_hour REAL NOT NULL DEFAULT 0.0,
      price_per_kg REAL NOT NULL DEFAULT 0.0,
      cold_storage_surcharge REAL NOT NULL DEFAULT 0.0,
      peak_hour_multiplier REAL NOT NULL DEFAULT 1.0,
      off_peak_hour_multiplier REAL NOT NULL DEFAULT 1.0,
      weather_multiplier REAL NOT NULL DEFAULT 1.0,
      min_price REAL NOT NULL DEFAULT 0.0,
      max_price REAL NOT NULL DEFAULT 999999.0,
      time_slot_rules TEXT, -- JSON格式的时间段规则
      region_rules TEXT, -- JSON格式的区域规则
      vehicle_type_rules TEXT, -- JSON格式的车型规则
      active BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  tenant_vehicles: `
    CREATE TABLE IF NOT EXISTS tenant_vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL, -- 引用 tenants 表
      vehicle_model_id INTEGER, -- 引用车型库中的车型ID
      plate_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      length REAL,
      width REAL,
      height REAL,
      max_weight REAL,
      volume REAL,
      status TEXT DEFAULT 'active',
      driver_name TEXT,
      driver_phone TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, -- 正确的外键约束
      FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models (id) ON DELETE SET NULL -- 车型ID外键约束
    );
  `,
  carrier_pricing_configs: `
    CREATE TABLE IF NOT EXISTS carrier_pricing_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier_tenant_id INTEGER NOT NULL, -- 承运商租户ID
      config_name TEXT NOT NULL,
      base_price REAL NOT NULL DEFAULT 0.0,
      price_per_km REAL NOT NULL DEFAULT 0.0,
      price_per_hour REAL NOT NULL DEFAULT 0.0,
      price_per_kg REAL NOT NULL DEFAULT 0.0,
      cold_storage_surcharge REAL NOT NULL DEFAULT 0.0,
      peak_hour_multiplier REAL NOT NULL DEFAULT 1.0,
      off_peak_hour_multiplier REAL NOT NULL DEFAULT 1.0,
      weather_multiplier REAL NOT NULL DEFAULT 1.0,
      min_price REAL NOT NULL DEFAULT 0.0,
      max_price REAL NOT NULL DEFAULT 999999.0,
      time_slot_rules TEXT, -- JSON格式的时间段规则
      region_rules TEXT, -- JSON格式的区域规则
      vehicle_type_rules TEXT, -- JSON格式的车型规则
      pricing_strategy TEXT DEFAULT 'distance_based', -- 定价策略：distance_based, weight_based, time_based, mixed
      service_addons TEXT, -- JSON格式的增值服务选项
      active BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (carrier_tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );
  `,
};

// 扩展表定义
const EXTENDED_TABLES = {
user_sessions: `CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  // --- NEW TABLE: quotes ---
  quotes: `CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,           -- 关联订单ID
    carrier_id INTEGER NOT NULL,         -- 关联承运商ID (来自 users 表)
    quote_price REAL NOT NULL,           -- 报价金额
    quote_delivery_time TEXT NOT NULL,   -- 预计送达时间
    quote_remarks TEXT,                  -- 报价备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (carrier_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(order_id, carrier_id)         -- 一个承运商对一个订单只能报价一次
  )`,
  organizations: `
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('tenant', 'admin')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')) DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  vehicle_models: `
    CREATE TABLE IF NOT EXISTS vehicle_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,                    -- 车辆品牌 (如：解放、东风、福田等)
      manufacturer TEXT NOT NULL,             -- 生产厂家 (如：一汽解放、东风汽车等)
      model_name TEXT NOT NULL,               -- 车辆型号 (如：J6P、天龙等)
      production_year TEXT,                   -- 生产年份 (如：2023)
      vehicle_type TEXT NOT NULL,             -- 车辆类型 (如：厢式货车、平板车、冷藏车等)
      battery_manufacturer TEXT,              -- 电池厂家 (如：宁德时代、比亚迪等)
      battery_model TEXT,                     -- 电池型号 (如：NCM811、LFP等)
      autonomous_level TEXT DEFAULT 'L0',     -- 自动驾驶级别 (L0-L5)
      max_load_capacity REAL,                 -- 最大载重(kg)
      max_volume REAL,                        -- 最大容量(m³)
      fuel_type TEXT,                         -- 燃料类型 (汽油、柴油、电动等)
      engine_displacement REAL,               -- 发动机排量(L)
      dimensions_length REAL,                 -- 长度(m)
      dimensions_width REAL,                  -- 宽度(m)
      dimensions_height REAL,                 -- 高度(m)
      wheelbase REAL,                         -- 轴距(m)
      max_speed INTEGER,                      -- 最高速度(km/h)
      fuel_efficiency REAL,                   -- 燃油效率(L/100km)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
};

class DatabaseSchema {
  constructor() {
    this.tables = { ...CORE_TABLES, ...EXTENDED_TABLES };
  }

  async initialize(db) {
    console.log('🔨 开始初始化数据库表结构...');
    try {
      await db.run('PRAGMA foreign_keys = ON;');
      console.log('✅ 外键约束已启用');

      for (const [tableName, sql] of Object.entries(this.tables)) {
        try {
          await db.exec(sql);
          console.log(`✅ 表 ${tableName} 已初始化`);
        } catch (error) {
          console.error(`❌ 创建表 ${tableName} 失败:`, error.message);
          throw error;
        }
      }

      // 检查并添加缺失的列
      await this.ensureColumnsExist(db);

      await this.createDefaultAdmin(db);
      console.log('🎉 数据库表结构初始化完成');
      return true;
    } catch (error) {
      console.error('💥 数据库初始化失败:', error);
      throw error;
    }
  }

async ensureColumnsExist(db) {
    // Check for users.roles column
    const userRolesCheck = await db.all("PRAGMA table_info(users);");
    if (!userRolesCheck.some(col => col.name === 'roles')) {
        await db.exec("ALTER TABLE users ADD COLUMN roles TEXT;");
    }

    // Check for orders.type_user column
    const orderTypeUserCheck = await db.all("PRAGMA table_info(orders);");
    if (!orderTypeUserCheck.some(col => col.name === 'type_user')) {
        await db.exec("ALTER TABLE orders ADD COLUMN type_user INTEGER DEFAULT NULL;");
    }
    
    // Check for orders.cargo_type column
    const orderCargoTypeCheck = await db.all("PRAGMA table_info(orders);");
    if (!orderCargoTypeCheck.some(col => col.name === 'cargo_type')) {
        await db.exec("ALTER TABLE orders ADD COLUMN cargo_type TEXT;");
    }
    
    // Add checks for other missing columns here as needed
}

  async createDefaultAdmin(db) {
    const defaultOrgId = 'admin_org_id_001';
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);

    const orgExists = await db.get('SELECT id FROM organizations WHERE id = ?', [defaultOrgId]);
    if (!orgExists) {
      await db.run(
        `INSERT INTO organizations (id, name, type, status) VALUES (?, 'Logistics Admin', 'admin', 'active')`,
        [defaultOrgId]
      );
      console.log('✅ 默认组织已创建');
    }

    const adminExists = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      await db.run(
        `INSERT INTO users (
          username, email, phone, name, role, roles, type, organization_id, organization_name,
          organization_type, password_hash, user_type, is_active, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'admin',
          'admin@example.com',
          '13800138000',  // 添加默认电话号码
          'Administrator',
          'super_admin',
          JSON.stringify(['super_admin']),
          'admin',
          defaultOrgId,
          'Logistics Admin',
          'admin',
          defaultPasswordHash,
          'admin_user',
          1,
          'active'
        ]
      );
      console.log('✅ 默认管理员已创建 (账号: admin / 密码: admin123)');
    }

    // 检查车型库中是否已有数据，如果没有则添加默认车型
    const vehicleModelCount = await db.get('SELECT COUNT(*) as total FROM vehicle_models');
    if (vehicleModelCount.total === 0) {
      // 添加默认车型数据
      const defaultVehicleModels = [
        {
          brand: '解放',
          manufacturer: '一汽解放',
          model_name: 'J6P',
          production_year: '2023',
          vehicle_type: '厢式货车',
          battery_manufacturer: null,
          battery_model: null,
          autonomous_level: 'L2',
          max_load_capacity: 5000,
          max_volume: 30,
          fuel_type: '柴油',
          engine_displacement: 6.0,
          dimensions_length: 6.2,
          dimensions_width: 2.4,
          dimensions_height: 2.5,
          wheelbase: 3.8,
          max_speed: 120,
          fuel_efficiency: 8.5
        },
        {
          brand: '东风',
          manufacturer: '东风汽车',
          model_name: '天龙',
          production_year: '2023',
          vehicle_type: '厢式货车',
          battery_manufacturer: null,
          battery_model: null,
          autonomous_level: 'L2',
          max_load_capacity: 6000,
          max_volume: 35,
          fuel_type: '柴油',
          engine_displacement: 8.0,
          dimensions_length: 7.2,
          dimensions_width: 2.5,
          dimensions_height: 2.8,
          wheelbase: 4.2,
          max_speed: 110,
          fuel_efficiency: 9.2
        },
        {
          brand: '福田',
          manufacturer: '北汽福田',
          model_name: '欧马可',
          production_year: '2023',
          vehicle_type: '厢式货车',
          battery_manufacturer: null,
          battery_model: null,
          autonomous_level: 'L1',
          max_load_capacity: 3500,
          max_volume: 20,
          fuel_type: '柴油',
          engine_displacement: 4.0,
          dimensions_length: 5.2,
          dimensions_width: 2.1,
          dimensions_height: 2.2,
          wheelbase: 3.3,
          max_speed: 120,
          fuel_efficiency: 7.8
        },
        {
          brand: '比亚迪',
          manufacturer: '比亚迪',
          model_name: 'T3',
          production_year: '2023',
          vehicle_type: '电动厢式货车',
          battery_manufacturer: '比亚迪',
          battery_model: 'LFP',
          autonomous_level: 'L3',
          max_load_capacity: 1500,
          max_volume: 12,
          fuel_type: '电动',
          engine_displacement: null,
          dimensions_length: 4.4,
          dimensions_width: 1.9,
          dimensions_height: 2.0,
          wheelbase: 3.0,
          max_speed: 95,
          fuel_efficiency: 20 // kWh/100km
        },
        {
          brand: '江淮',
          manufacturer: '江淮汽车',
          model_name: '帅铃',
          production_year: '2023',
          vehicle_type: '冷藏车',
          battery_manufacturer: null,
          battery_model: null,
          autonomous_level: 'L2',
          max_load_capacity: 4000,
          max_volume: 25,
          fuel_type: '柴油',
          engine_displacement: 5.0,
          dimensions_length: 5.8,
          dimensions_width: 2.3,
          dimensions_height: 2.4,
          wheelbase: 3.6,
          max_speed: 110,
          fuel_efficiency: 8.8
        },
        {
          brand: '新石器',
          manufacturer: '新石器慧通（北京）科技有限公司',
          model_name: '无人配送车',
          production_year: '2023',
          vehicle_type: '无人车',
          battery_manufacturer: '宁德时代',
          battery_model: 'NCM811',
          autonomous_level: 'L4',
          max_load_capacity: 300,
          max_volume: 2.5,
          fuel_type: '电动',
          engine_displacement: null,
          dimensions_length: 2.5,
          dimensions_width: 1.5,
          dimensions_height: 1.8,
          wheelbase: 1.8,
          max_speed: 45,
          fuel_efficiency: 15 // kWh/100km
        },
        {
          brand: '九识',
          manufacturer: '九识智能科技有限公司',
          model_name: 'Z5-100',
          production_year: '2023',
          vehicle_type: '无人配送车',
          battery_manufacturer: '比亚迪',
          battery_model: 'LFP',
          autonomous_level: 'L4',
          max_load_capacity: 200,
          max_volume: 1.8,
          fuel_type: '电动',
          engine_displacement: null,
          dimensions_length: 2.0,
          dimensions_width: 1.3,
          dimensions_height: 1.7,
          wheelbase: 1.5,
          max_speed: 40,
          fuel_efficiency: 12 // kWh/100km
        },
        {
          brand: '五菱',
          manufacturer: '上汽通用五菱',
          model_name: '五菱之光',
          production_year: '2023',
          vehicle_type: '微面',
          battery_manufacturer: null,
          battery_model: null,
          autonomous_level: 'L1',
          max_load_capacity: 800,
          max_volume: 5,
          fuel_type: '汽油',
          engine_displacement: 1.2,
          dimensions_length: 3.7,
          dimensions_width: 1.5,
          dimensions_height: 1.9,
          wheelbase: 2.4,
          max_speed: 100,
          fuel_efficiency: 7.5
        }
      ];

      for (const model of defaultVehicleModels) {
        await db.run(`
          INSERT INTO vehicle_models (
            brand, manufacturer, model_name, production_year, vehicle_type,
            battery_manufacturer, battery_model, autonomous_level,
            max_load_capacity, max_volume, fuel_type, engine_displacement,
            dimensions_length, dimensions_width, dimensions_height, wheelbase,
            max_speed, fuel_efficiency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          model.brand, model.manufacturer, model.model_name, model.production_year, model.vehicle_type,
          model.battery_manufacturer, model.battery_model, model.autonomous_level,
          model.max_load_capacity, model.max_volume, model.fuel_type, model.engine_displacement,
          model.dimensions_length, model.dimensions_width, model.dimensions_height, model.wheelbase,
          model.max_speed, model.fuel_efficiency
        ]);
      }

      console.log('✅ 默认车型库数据已创建');
    }
  }

  getTableDefinition(tableName) {
    return this.tables[tableName];
  }

  getTableNames() {
    return Object.keys(this.tables);
  }
}

module.exports = DatabaseSchema;