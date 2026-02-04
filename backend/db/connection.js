// backend/db/connection.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..','data', 'mydatabase.db');

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

// 懒初始化：首次调用时创建连接
function getDb() {
  if (!dbInstance) {
    console.log('🔗 首次初始化数据库连接:', DB_PATH);
    
    // 创建新连接
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 数据库初始化失败:', err.message);
        throw err; // 初始化失败应中断
      } else {
        console.log('✅ 数据库连接成功!');
        
        // 启用外键约束
        dbInstance.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) {
            console.warn('⚠️ 启用外键约束失败:', err.message);
          }
        });
      }
    });
  }
  
  return dbInstance;
}

// 封装为 Promise 的数据库方法（保持兼容性）
function getWrappedDb() {
  const db = getDb(); // 确保已初始化
  return {
    get: (sql, params = []) => 
      new Promise((resolve, reject) => 
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
      ),
    all: (sql, params = []) => 
      new Promise((resolve, reject) => 
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
      ),
    run: (sql, params = []) => 
      new Promise((resolve, reject) => 
        db.run(sql, params, function(err) { err ? reject(err) : resolve(this); })
      ),
    exec: (sql) => 
      new Promise((resolve, reject) => 
        db.exec(sql, (err) => err ? reject(err) : resolve())
      ),
    close: () => 
      new Promise((resolve, reject) => 
        db.close((err) => err ? reject(err) : resolve())
      ),
    raw: db
  };
}

// 兼容旧接口（可选）
class DatabaseConnection {
  async connect() {
    getDb(); // 触发初始化
    return getWrappedDb();
  }
  
  async close() {
    if (dbInstance) {
      await new Promise((resolve, reject) => {
        dbInstance.close((err) => {
          if (err) reject(err);
          else {
            console.log('✅ 数据库连接已关闭');
            dbInstance = null;
            resolve();
          }
        });
      });
    }
  }
}

module.exports = {
  DatabaseConnection,
  getDb: getWrappedDb, // 注意：现在导出的是封装后的版本
  DB_PATH
};