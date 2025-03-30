// 測試設置文件
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.test' });

// 全局測試超時設置
jest.setTimeout(30000);

// 模擬控制台輸出，減少測試時的噪音
global.console = {
  ...console,
  // 保留錯誤輸出，但禁用其他輸出
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: console.error,
};

// 在所有測試完成後清理模擬
afterAll(() => {
  jest.clearAllMocks();
});