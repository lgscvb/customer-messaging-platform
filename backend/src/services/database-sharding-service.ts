/**
 * 資料庫分片服務
 * 
 * 此服務用於管理資料庫分片和讀寫分離，提供初始化分片、測試連接和關閉連接等功能
 */

import dbShardingManager from '../config/database-sharding';
import logger from '../utils/logger';

/**
 * 資料庫分片服務類
 */
class DatabaseShardingService {
  /**
   * 初始化資料庫分片
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('初始化資料庫分片...');
      
      // 測試資料庫連接
      const connected = await dbShardingManager.testConnections();
      
      if (connected) {
        logger.info('資料庫分片初始化成功');
      } else {
        logger.error('資料庫分片初始化失敗');
      }
      
      return connected;
    } catch (error) {
      logger.error('初始化資料庫分片時出錯:', error);
      return false;
    }
  }
  
  /**
   * 關閉資料庫連接
   */
  async close(): Promise<void> {
    try {
      logger.info('關閉資料庫連接...');
      await dbShardingManager.closeConnections();
      logger.info('資料庫連接已關閉');
    } catch (error) {
      logger.error('關閉資料庫連接時出錯:', error);
    }
  }
  
  /**
   * 獲取資料庫分片狀態
   */
  async getStatus(): Promise<any> {
    try {
      // 這裡可以添加更多狀態信息，如連接池使用情況、查詢統計等
      return {
        initialized: true,
        masterConnected: true,
        slavesConnected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('獲取資料庫分片狀態時出錯:', error);
      return {
        initialized: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 獲取資料庫分片配置
   */
  getConfig(): any {
    // 返回分片配置信息，但不包含敏感信息如密碼
    return {
      master: {
        host: process.env.DB_MASTER_HOST || 'localhost',
        port: parseInt(process.env.DB_MASTER_PORT || '3306', 10),
        database: process.env.DB_NAME || 'customer_messaging_platform'
      },
      slaves: [
        {
          host: process.env.DB_SLAVE_1_HOST || process.env.DB_MASTER_HOST || 'localhost',
          port: parseInt(process.env.DB_SLAVE_1_PORT || process.env.DB_MASTER_PORT || '3306', 10),
          database: process.env.DB_NAME || 'customer_messaging_platform'
        },
        process.env.DB_SLAVE_2_HOST ? {
          host: process.env.DB_SLAVE_2_HOST,
          port: parseInt(process.env.DB_SLAVE_2_PORT || '3306', 10),
          database: process.env.DB_NAME || 'customer_messaging_platform'
        } : null
      ].filter(Boolean)
    };
  }
  
  /**
   * 檢查是否啟用讀寫分離
   */
  isReadWriteSeparationEnabled(): boolean {
    // 如果有從庫配置，則啟用讀寫分離
    return process.env.DB_SLAVE_1_HOST !== undefined || 
           process.env.DB_SLAVE_2_HOST !== undefined;
  }
  
  /**
   * 檢查是否啟用分片
   */
  isShardingEnabled(): boolean {
    // 目前僅支持讀寫分離，未來可以擴展為真正的分片
    return this.isReadWriteSeparationEnabled();
  }
}

// 創建單例實例
const databaseShardingService = new DatabaseShardingService();

export default databaseShardingService;