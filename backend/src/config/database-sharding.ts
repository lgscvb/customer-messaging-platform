/**
 * 資料庫分片和讀寫分離配置
 *
 * 此配置文件提供資料庫分片和讀寫分離功能，用於提高系統性能和可擴展性
 */

import { Sequelize, Options, Dialect } from 'sequelize';

import logger from '../utils/logger';

// 資料庫連接池配置
const poolConfig = {
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000,
};

// 主資料庫配置（寫操作）
const masterConfig: Options = {
  host: process.env.DB_MASTER_HOST || 'localhost',
  port: parseInt(process.env.DB_MASTER_PORT || '3306', 10),
  dialect: 'mysql' as Dialect,
  pool: poolConfig,
  logging: (sql: string) => logger.debug(sql),
};

// 從資料庫配置（讀操作）
const slaveConfigs: Options[] = [
  {
    host: process.env.DB_SLAVE_1_HOST || process.env.DB_MASTER_HOST || 'localhost',
    port: parseInt(process.env.DB_SLAVE_1_PORT || process.env.DB_MASTER_PORT || '3306', 10),
    dialect: 'mysql' as Dialect,
    pool: poolConfig,
    logging: (sql: string) => logger.debug(sql),
  },
  {
    host: process.env.DB_SLAVE_2_HOST,
    port: parseInt(process.env.DB_SLAVE_2_PORT || '3306', 10),
    dialect: 'mysql' as Dialect,
    pool: poolConfig,
    logging: (sql: string) => logger.debug(sql),
  },
].filter(config => config.host); // 只保留有效的從庫配置

// 資料庫名稱
const database = process.env.DB_NAME || 'customer_messaging_platform';
// 資料庫用戶名
const username = process.env.DB_USERNAME || 'root';
// 資料庫密碼
const password = process.env.DB_PASSWORD || '';

// 創建主資料庫連接
const masterSequelize = new Sequelize(database, username, password, masterConfig);

// 創建從資料庫連接
const slaveSequelizes = slaveConfigs.map(config => 
  new Sequelize(database, username, password, config)
);

/**
 * 資料庫分片管理器
 * 提供資料庫分片和讀寫分離功能
 */
class DatabaseShardingManager {
  private master: Sequelize;
  private slaves: Sequelize[];
  private currentSlaveIndex: number = 0;

  constructor(master: Sequelize, slaves: Sequelize[]) {
    this.master = master;
    this.slaves = slaves.length > 0 ? slaves : [master]; // 如果沒有從庫，使用主庫
  }

  /**
   * 獲取主資料庫連接（用於寫操作）
   */
  getMaster(): Sequelize {
    return this.master;
  }

  /**
   * 獲取從資料庫連接（用於讀操作）
   * 使用輪詢策略選擇從庫
   */
  getSlave(): Sequelize {
    if (this.slaves.length === 1) {
      return this.slaves[0];
    }

    // 輪詢選擇從庫
    const slave = this.slaves[this.currentSlaveIndex];
    this.currentSlaveIndex = (this.currentSlaveIndex + 1) % this.slaves.length;
    return slave;
  }

  /**
   * 根據操作類型獲取資料庫連接
   * @param isWrite 是否為寫操作
   */
  getConnection(isWrite: boolean = false): Sequelize {
    return isWrite ? this.getMaster() : this.getSlave();
  }

  /**
   * 測試所有資料庫連接
   */
  async testConnections(): Promise<boolean> {
    try {
      // 測試主庫連接
      await this.master.authenticate();
      logger.info('主資料庫連接成功');

      // 測試從庫連接
      for (let i = 0; i < this.slaves.length; i++) {
        await this.slaves[i].authenticate();
        logger.info(`從資料庫 ${i + 1} 連接成功`);
      }

      return true;
    } catch (error) {
      logger.error('資料庫連接測試失敗:', error);
      return false;
    }
  }

  /**
   * 關閉所有資料庫連接
   */
  async closeConnections(): Promise<void> {
    await this.master.close();
    for (const slave of this.slaves) {
      await slave.close();
    }
  }
}

// 創建資料庫分片管理器實例
const dbShardingManager = new DatabaseShardingManager(masterSequelize, slaveSequelizes);

export default dbShardingManager;