const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'backend', 'data', 'mydatabase.db');
const db = new sqlite3.Database(dbPath);

console.log('正在连接到数据库:', dbPath);

// 检查并确保管理员账户存在
async function ensureAdminAccount() {
  return new Promise((resolve, reject) => {
    // 检查是否存在管理员账户
    db.get("SELECT * FROM users WHERE username = 'admin' AND user_type = 'admin_user'", async (err, row) => {
      if (err) {
        console.error('查询管理员账户时出错:', err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log('✅ 管理员账户已存在:', row.username);
        resolve(row);
      } else {
        console.log('⚠️ 管理员账户不存在，正在创建...');
        
        // 创建默认密码哈希
        const defaultPassword = 'admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        // 插入管理员账户
        const defaultOrgId = 'admin_org_id_001';
        
        // 检查组织是否存在，如果不存在则创建
        db.get("SELECT id FROM organizations WHERE id = ?", [defaultOrgId], (err, orgRow) => {
          if (!orgRow) {
            db.run(
              `INSERT INTO organizations (id, name, type, status) VALUES (?, 'Logistics Admin', 'admin', 'active')`,
              [defaultOrgId],
              (err) => {
                if (err) {
                  console.error('创建默认组织失败:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ 默认组织已创建');
                insertAdminUser();
              }
            );
          } else {
            insertAdminUser();
          }
          
          function insertAdminUser() {
            db.run(
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
                passwordHash,
                'admin_user',
                1,
                'active'
              ],
              function(err) {
                if (err) {
                  console.error('创建管理员账户失败:', err.message);
                  reject(err);
                } else {
                  console.log('✅ 管理员账户已创建 (账号: admin / 密码: admin123)');
                  resolve({
                    id: this.lastID,
                    username: 'admin',
                    email: 'admin@example.com',
                    name: 'Administrator',
                    role: 'super_admin',
                    type: 'admin',
                    user_type: 'admin_user'
                  });
                }
              }
            );
          }
        });
      }
    });
  });
}

// 检查并确保至少有一个活跃的租户账户
async function ensureTenantAccount() {
  return new Promise((resolve, reject) => {
    // 检查是否存在活跃的租户账户
    db.get("SELECT * FROM users WHERE user_type = 'tenant_user' AND is_active = 1 LIMIT 1", (err, row) => {
      if (err) {
        console.error('查询租户账户时出错:', err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log('✅ 活跃租户账户已存在:', row.username);
        resolve(row);
      } else {
        console.log('⚠️ 没有活跃的租户账户，正在创建...');
        
        // 创建一个示例租户账户
        createSampleTenantAccount();
      }
    });
  });
}

async function createSampleTenantAccount() {
  return new Promise(async (resolve, reject) => {
    const bcrypt = require('bcryptjs');
    
    // 创建默认密码哈希
    const defaultPassword = 'tenant123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    // 插入租户账户
    db.run(
      `INSERT INTO users (
        username, email, phone, name, role, roles, type, password_hash, user_type, is_active, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'tenant',
        'tenant@example.com',
        '13900139000',
        'Tenant User',
        'tenant',
        JSON.stringify(['tenant']),
        'tenant',
        passwordHash,
        'tenant_user',
        1,
        'active'
      ],
      function(err) {
        if (err) {
          console.error('创建租户账户失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 租户账户已创建 (账号: tenant / 密码: tenant123)');
          resolve({
            id: this.lastID,
            username: 'tenant',
            email: 'tenant@example.com',
            name: 'Tenant User',
            role: 'tenant',
            type: 'tenant',
            user_type: 'tenant_user'
          });
        }
      }
    );
  });
}

// 主函数
async function main() {
  try {
    console.log('\n🔍 检查并修复数据库中的登录项...\n');
    
    // 确保管理员账户存在
    await ensureAdminAccount();
    
    // 确保租户账户存在
    await ensureTenantAccount();
    
    console.log('\n✅ 所有必需的登录账户都已就位！');
    
    // 显示所有活跃用户
    console.log('\n📋 当前活跃用户列表:');
    db.each("SELECT id, username, email, role, user_type, is_active FROM users WHERE is_active = 1", (err, row) => {
      if (err) {
        console.error('查询活跃用户时出错:', err.message);
      } else {
        console.log(`  - ID: ${row.id}, 用户名: ${row.username}, 角色: ${row.role}, 类型: ${row.user_type}`);
      }
    });
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
    });
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
    });
  }
}

main();