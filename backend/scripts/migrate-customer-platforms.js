/**
 * 客戶平台關聯遷移腳本
 * 
 * 這個腳本用於執行 migrate-customer-platforms.sql 文件中的 SQL 命令，
 * 將 customers 表中的 platforms JSONB 數組規範化為單獨的 customer_platforms 表。
 * 
 * 使用方法：
 * node scripts/migrate-customer-platforms.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 創建資料庫連接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 讀取 SQL 文件
const sqlFilePath = path.join(__dirname, 'migrate-customer-platforms.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('開始遷移客戶平台關聯數據...');
    
    // 開始事務
    await client.query('BEGIN');
    
    // 執行 SQL 命令
    await client.query(sqlContent);
    
    // 提交事務
    await client.query('COMMIT');
    
    console.log('遷移成功完成！');
    
    // 驗證遷移結果
    const customerPlatformsCount = await client.query('SELECT COUNT(*) FROM customer_platforms');
    console.log(`已創建 ${customerPlatformsCount.rows[0].count} 條客戶平台關聯記錄`);
    
  } catch (error) {
    // 回滾事務
    await client.query('ROLLBACK');
    console.error('遷移失敗:', error);
    process.exit(1);
  } finally {
    // 釋放客戶端
    client.release();
    
    // 關閉連接池
    await pool.end();
  }
}

// 執行遷移
migrate().catch(err => {
  console.error('遷移過程中發生錯誤:', err);
  process.exit(1);
});