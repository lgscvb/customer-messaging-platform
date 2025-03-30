const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// 載入環境變數
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 創建資料庫連接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'customer_messaging',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// 讀取 SQL 腳本
const sqlScript = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('開始初始化資料庫...');
    
    // 開始事務
    await client.query('BEGIN');
    
    // 執行 SQL 腳本
    await client.query(sqlScript);
    
    // 提交事務
    await client.query('COMMIT');
    
    console.log('資料庫初始化成功！');
  } catch (error) {
    // 回滾事務
    await client.query('ROLLBACK');
    console.error('資料庫初始化失敗:', error);
    throw error;
  } finally {
    // 釋放客戶端
    client.release();
    
    // 關閉連接池
    await pool.end();
  }
}

// 執行初始化
initializeDatabase()
  .then(() => {
    console.log('資料庫初始化腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('資料庫初始化腳本執行失敗:', error);
    process.exit(1);
  });