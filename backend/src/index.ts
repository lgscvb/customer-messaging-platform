import { server } from './app';
import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

// 獲取端口
const PORT = process.env.PORT || 3001;

// 啟動服務器
server.listen(PORT, () => {
  console.log(`
  ======================================================
   全通路客戶訊息管理平台 - 後端服務
  ======================================================
   服務器運行於: http://localhost:${PORT}
   環境: ${process.env.NODE_ENV || 'development'}
   健康檢查: http://localhost:${PORT}/health
   API 文檔: http://localhost:${PORT}/api-docs
  ======================================================
  `);
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
  // 在生產環境中，可能需要通知管理員或重啟服務器
  if (process.env.NODE_ENV === 'production') {
    // 記錄錯誤並通知管理員
    console.error('嚴重錯誤，服務器將關閉');
    process.exit(1);
  }
});

// 處理未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  // 在生產環境中，可能需要通知管理員
  // 但不需要關閉服務器，因為這不一定是致命錯誤
});

// 處理 SIGTERM 信號
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，優雅關閉服務器');
  server.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
  
  // 如果在 10 秒內沒有關閉，強制退出
  setTimeout(() => {
    console.error('無法優雅關閉服務器，強制退出');
    process.exit(1);
  }, 10000);
});

// 處理 SIGINT 信號 (Ctrl+C)
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，優雅關閉服務器');
  server.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
  
  // 如果在 10 秒內沒有關閉，強制退出
  setTimeout(() => {
    console.error('無法優雅關閉服務器，強制退出');
    process.exit(1);
  }, 10000);
});