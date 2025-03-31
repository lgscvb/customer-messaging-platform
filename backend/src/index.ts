import dotenv from 'dotenv';
import { server } from './app';
import { initializeConnectors } from './init/connectors';
import logger from './utils/logger';
import databaseShardingService from './services/database-sharding-service';

// 加載環境變量
dotenv.config();

// 獲取端口
const PORT = process.env.PORT || 3000;

// 初始化資料庫分片和連接器
const initializeServices = async () => {
  // 初始化資料庫分片
  try {
    const shardingEnabled = await databaseShardingService.initialize();
    if (shardingEnabled) {
      logger.info('資料庫分片初始化成功');
      logger.info(`讀寫分離已${databaseShardingService.isReadWriteSeparationEnabled() ? '啟用' : '禁用'}`);
    } else {
      logger.info('資料庫分片未啟用，使用默認資料庫連接');
    }
  } catch (error) {
    logger.error('資料庫分片初始化失敗:', error);
    // 不終止進程，繼續使用默認資料庫連接
    logger.info('使用默認資料庫連接繼續運行');
  }

  // 初始化連接器
  try {
    initializeConnectors();
    logger.info('連接器初始化成功');
  } catch (error) {
    logger.error('連接器初始化失敗:', error);
    process.exit(1);
  }
};

// 執行初始化
initializeServices().catch(error => {
  logger.error('服務初始化失敗:', error);
  process.exit(1);
});

// 啟動服務器
server.listen(PORT, () => {
  logger.info(`服務器運行在端口 ${PORT}`);
  logger.info(`健康檢查: http://localhost:${PORT}/health`);
  logger.info(`API 文檔: http://localhost:${PORT}/api-docs`);
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.error('未捕獲的異常:', error);
  process.exit(1);
});

// 處理未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未處理的 Promise 拒絕:', reason);
});

// 處理進程終止信號
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信號，正在關閉服務器...');
  
  // 關閉資料庫連接
  databaseShardingService.close()
    .then(() => {
      logger.info('資料庫連接已關閉');
    })
    .catch(error => {
      logger.error('關閉資料庫連接時出錯:', error);
    })
    .finally(() => {
      server.close(() => {
        logger.info('服務器已關閉');
        process.exit(0);
      });
    });
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信號，正在關閉服務器...');
  
  // 關閉資料庫連接
  databaseShardingService.close()
    .then(() => {
      logger.info('資料庫連接已關閉');
    })
    .catch(error => {
      logger.error('關閉資料庫連接時出錯:', error);
    })
    .finally(() => {
      server.close(() => {
        logger.info('服務器已關閉');
        process.exit(0);
      });
    });
});