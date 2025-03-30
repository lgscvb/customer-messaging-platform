import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

// 數據庫配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'customer_messaging',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// 創建 Sequelize 實例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
      charset: 'utf8'
    }
  }
);

// 測試數據庫連接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('數據庫連接成功');
  } catch (error) {
    console.error('無法連接到數據庫:', error);
  }
};

// 在非測試環境下測試連接
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

export default sequelize;