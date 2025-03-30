import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 創建 PostgreSQL 連接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'customer_messaging',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // 最大連接數
  idleTimeoutMillis: 30000, // 連接最大閒置時間
  connectionTimeoutMillis: 2000, // 連接超時時間
});

// 測試資料庫連接
pool.connect((err, client, done) => {
  if (err) {
    console.error('資料庫連接錯誤:', err.message);
    return;
  }
  if (client) {
    client.query('SELECT NOW()', (err, result) => {
      done();
      if (err) {
        console.error('資料庫查詢錯誤:', err.message);
        return;
      }
      console.log('資料庫連接成功:', result.rows[0]);
    });
  }
});

// 處理連接池錯誤
pool.on('error', (err) => {
  console.error('資料庫連接池錯誤:', err.message);
});

export default pool;