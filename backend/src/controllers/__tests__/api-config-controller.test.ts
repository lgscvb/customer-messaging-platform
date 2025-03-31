import { Request, Response } from 'express';
import apiConfigController from '../api-config-controller';
import apiConfigService from '../../services/api-config-service';
import { ApiConfigType } from '../../models/ApiConfig';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../services/api-config-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('ApiConfigController', () => {
  // 模擬 Request 和 Response 對象
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();

    // 設置 Response 模擬
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getAllApiConfigs', () => {
    it('應該獲取所有 API 設定', async () => {
      // 模擬 API 設定數據
      const mockApiConfigs = [
        {
          id: 'config-1',
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: ApiConfigType.AI,
          isEncrypted: true,
          description: 'API Key 1 描述',
          isActive: true,
          metadata: {},
          createdBy: 'user-1',
          updatedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'config-2',
          name: 'API Key 2',
          key: 'api.key2',
          value: 'value2',
          type: ApiConfigType.PLATFORM,
          isEncrypted: true,
          description: 'API Key 2 描述',
          isActive: true,
          metadata: {},
          createdBy: 'user-1',
          updatedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 設置模擬函數的返回值
      (apiConfigService.getAllApiConfigs as jest.Mock).mockResolvedValue(mockApiConfigs);

      // 執行測試
      await apiConfigController.getAllApiConfigs(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getAllApiConfigs 被調用
      expect(apiConfigService.getAllApiConfigs).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApiConfigs,
      });
    });

    it('應該處理獲取 API 設定時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (apiConfigService.getAllApiConfigs as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await apiConfigController.getAllApiConfigs(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getAllApiConfigs 被調用
      expect(apiConfigService.getAllApiConfigs).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取所有 API 設定錯誤:', mockError);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '獲取 API 設定失敗',
        error: '資料庫連接錯誤',
      });
    });
  });

  describe('getApiConfigById', () => {
    it('應該根據 ID 獲取 API 設定', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'config-1',
        },
      };

      // 模擬 API 設定數據
      const mockApiConfig = {
        id: 'config-1',
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (apiConfigService.getApiConfigById as jest.Mock).mockResolvedValue(mockApiConfig);

      // 執行測試
      await apiConfigController.getApiConfigById(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getApiConfigById 被調用
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledTimes(1);
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledWith('config-1');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApiConfig,
      });
    });

    it('應該處理 API 設定不存在的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-config',
        },
      };

      // 設置模擬函數的返回值
      (apiConfigService.getApiConfigById as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await apiConfigController.getApiConfigById(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getApiConfigById 被調用
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledTimes(1);
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledWith('non-existent-config');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'API 設定 ID non-existent-config 不存在',
      });
    });

    it('應該處理獲取 API 設定時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'config-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (apiConfigService.getApiConfigById as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await apiConfigController.getApiConfigById(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getApiConfigById 被調用
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledTimes(1);
      expect(apiConfigService.getApiConfigById).toHaveBeenCalledWith('config-1');

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 API 設定 (ID: config-1) 錯誤:', mockError);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '獲取 API 設定失敗',
        error: '資料庫連接錯誤',
      });
    });
  });

  describe('createApiConfig', () => {
    it('應該創建 API 設定', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: ApiConfigType.AI,
          isEncrypted: true,
          description: 'API Key 1 描述',
          isActive: true,
          metadata: {},
        },
        user: {
          id: 'user-1',
        } as any,
      };

      // 模擬創建的 API 設定
      const mockApiConfig = {
        id: 'config-1',
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (apiConfigService.createApiConfig as jest.Mock).mockResolvedValue(mockApiConfig);

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 被調用
      expect(apiConfigService.createApiConfig).toHaveBeenCalledTimes(1);
      expect(apiConfigService.createApiConfig).toHaveBeenCalledWith({
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApiConfig,
      });
    });

    it('應該處理缺少必要字段的情況', async () => {
      // 模擬請求參數 (缺少 key)
      mockRequest = {
        body: {
          name: 'API Key 1',
          value: 'value1',
          type: ApiConfigType.AI,
        },
        user: {
          id: 'user-1',
        } as any,
      };

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 沒有被調用
      expect(apiConfigService.createApiConfig).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要字段: name, key, value, type',
      });
    });

    it('應該處理無效的 API 設定類型', async () => {
      // 模擬請求參數 (無效的類型)
      mockRequest = {
        body: {
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: 'INVALID_TYPE',
        },
        user: {
          id: 'user-1',
        } as any,
      };

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 沒有被調用
      expect(apiConfigService.createApiConfig).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '無效的 API 設定類型: INVALID_TYPE',
      });
    });

    it('應該處理未授權的請求', async () => {
      // 模擬請求參數 (沒有用戶)
      mockRequest = {
        body: {
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: ApiConfigType.AI,
        },
      };

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 沒有被調用
      expect(apiConfigService.createApiConfig).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求',
      });
    });

    it('應該處理鍵已存在的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: ApiConfigType.AI,
        },
        user: {
          id: 'user-1',
        } as any,
      };

      // 模擬錯誤
      const mockError = new Error('API 設定鍵 api.key1 已存在');
      (apiConfigService.createApiConfig as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 被調用
      expect(apiConfigService.createApiConfig).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('創建 API 設定錯誤:', mockError);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'API 設定鍵 api.key1 已存在',
      });
    });

    it('應該處理創建 API 設定時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          name: 'API Key 1',
          key: 'api.key1',
          value: 'value1',
          type: ApiConfigType.AI,
        },
        user: {
          id: 'user-1',
        } as any,
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (apiConfigService.createApiConfig as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await apiConfigController.createApiConfig(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.createApiConfig 被調用
      expect(apiConfigService.createApiConfig).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('創建 API 設定錯誤:', mockError);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '創建 API 設定失敗',
        error: '資料庫連接錯誤',
      });
    });
  });

  describe('getApiConfigValue', () => {
    it('應該獲取 API 設定值', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          key: 'api.key1',
        },
        query: {
          defaultValue: 'default-value',
        },
      };

      // 設置模擬函數的返回值
      (apiConfigService.getApiConfigValue as jest.Mock).mockResolvedValue('api-key-value');

      // 執行測試
      await apiConfigController.getApiConfigValue(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getApiConfigValue 被調用
      expect(apiConfigService.getApiConfigValue).toHaveBeenCalledTimes(1);
      expect(apiConfigService.getApiConfigValue).toHaveBeenCalledWith('api.key1', 'default-value');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          key: 'api.key1',
          value: 'api-key-value',
        },
      });
    });

    it('應該處理獲取 API 設定值時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          key: 'api.key1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (apiConfigService.getApiConfigValue as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await apiConfigController.getApiConfigValue(mockRequest as Request, mockResponse as Response);

      // 驗證 apiConfigService.getApiConfigValue 被調用
      expect(apiConfigService.getApiConfigValue).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 API 設定值 (Key: api.key1) 錯誤:', mockError);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '獲取 API 設定值失敗',
        error: '資料庫連接錯誤',
      });
    });
  });
});