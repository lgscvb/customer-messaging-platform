/**
 * 資料庫分片控制器
 * 
 * 此控制器提供 API 端點來管理和監控資料庫分片
 */

import { Request, Response } from 'express';
import databaseShardingService from '../services/database-sharding-service';
import logger from '../utils/logger';

/**
 * 資料庫分片控制器類
 */
class DatabaseShardingController {
  /**
   * 獲取資料庫分片狀態
   * @param req 請求對象
   * @param res 響應對象
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await databaseShardingService.getStatus();
      res.json(status);
    } catch (error) {
      logger.error('獲取資料庫分片狀態時出錯:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 獲取資料庫分片配置
   * @param req 請求對象
   * @param res 響應對象
   */
  getConfig(req: Request, res: Response): void {
    try {
      const config = databaseShardingService.getConfig();
      res.json(config);
    } catch (error) {
      logger.error('獲取資料庫分片配置時出錯:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 初始化資料庫分片
   * @param req 請求對象
   * @param res 響應對象
   */
  async initialize(req: Request, res: Response): Promise<void> {
    try {
      const result = await databaseShardingService.initialize();
      
      if (result) {
        res.json({ success: true, message: '資料庫分片初始化成功' });
      } else {
        res.status(500).json({ success: false, message: '資料庫分片初始化失敗' });
      }
    } catch (error) {
      logger.error('初始化資料庫分片時出錯:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 檢查資料庫分片功能是否啟用
   * @param req 請求對象
   * @param res 響應對象
   */
  checkShardingEnabled(req: Request, res: Response): void {
    try {
      const isEnabled = databaseShardingService.isShardingEnabled();
      const isReadWriteSeparationEnabled = databaseShardingService.isReadWriteSeparationEnabled();
      
      res.json({
        shardingEnabled: isEnabled,
        readWriteSeparationEnabled: isReadWriteSeparationEnabled
      });
    } catch (error) {
      logger.error('檢查資料庫分片功能是否啟用時出錯:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// 創建單例實例
const databaseShardingController = new DatabaseShardingController();

export default databaseShardingController;