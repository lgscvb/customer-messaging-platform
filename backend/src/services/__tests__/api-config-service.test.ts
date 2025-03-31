import apiConfigService from '../api-config-service';
import { ApiConfigExtension, ApiConfigType } from '../../models/ApiConfig';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../models/ApiConfig', () => {
  const originalModule = jest.requireActual('../../models/ApiConfig');
  return {
    ...originalModule,
    ApiConfigExtension: {
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      findByType: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getValue: jest.fn(),
      setValue: jest.fn(),
    },
  };
});

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('ApiConfigService', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
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
      (ApiConfigExtension.findAll as jest.Mock).mockResolvedValue(mockApiConfigs);

      // 執行測試
      const result = await apiConfigService.getAllApiConfigs();

      // 驗證 ApiConfigExtension.findAll 被調用
      expect(ApiConfigExtension.findAll).toHaveBeenCalledTimes(1);

      // 驗證返回值
      expect(result).toEqual(mockApiConfigs);
    });

    it('應該處理獲取 API 設定時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.findAll as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getAllApiConfigs()).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.findAll 被調用
      expect(ApiConfigExtension.findAll).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取所有 API 設定錯誤:', mockError);
    });
  });

  describe('getAllActiveApiConfigs', () => {
    it('應該獲取所有啟用的 API 設定', async () => {
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
      ];

      // 設置模擬函數的返回值
      (ApiConfigExtension.findAllActive as jest.Mock).mockResolvedValue(mockApiConfigs);

      // 執行測試
      const result = await apiConfigService.getAllActiveApiConfigs();

      // 驗證 ApiConfigExtension.findAllActive 被調用
      expect(ApiConfigExtension.findAllActive).toHaveBeenCalledTimes(1);

      // 驗證返回值
      expect(result).toEqual(mockApiConfigs);
    });

    it('應該處理獲取啟用的 API 設定時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.findAllActive as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getAllActiveApiConfigs()).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.findAllActive 被調用
      expect(ApiConfigExtension.findAllActive).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取所有啟用的 API 設定錯誤:', mockError);
    });
  });

  describe('getApiConfigById', () => {
    it('應該根據 ID 獲取 API 設定', async () => {
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
      (ApiConfigExtension.findById as jest.Mock).mockResolvedValue(mockApiConfig);

      // 執行測試
      const result = await apiConfigService.getApiConfigById('config-1');

      // 驗證 ApiConfigExtension.findById 被調用
      expect(ApiConfigExtension.findById).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.findById).toHaveBeenCalledWith('config-1');

      // 驗證返回值
      expect(result).toEqual(mockApiConfig);
    });

    it('應該處理獲取 API 設定時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.findById as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getApiConfigById('config-1')).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.findById 被調用
      expect(ApiConfigExtension.findById).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 API 設定 (ID: config-1) 錯誤:', mockError);
    });
  });

  describe('getApiConfigByKey', () => {
    it('應該根據鍵獲取 API 設定', async () => {
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
      (ApiConfigExtension.findByKey as jest.Mock).mockResolvedValue(mockApiConfig);

      // 執行測試
      const result = await apiConfigService.getApiConfigByKey('api.key1');

      // 驗證 ApiConfigExtension.findByKey 被調用
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledWith('api.key1');

      // 驗證返回值
      expect(result).toEqual(mockApiConfig);
    });

    it('應該處理獲取 API 設定時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.findByKey as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getApiConfigByKey('api.key1')).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.findByKey 被調用
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 API 設定 (Key: api.key1) 錯誤:', mockError);
    });
  });

  describe('createApiConfig', () => {
    it('應該創建 API 設定', async () => {
      // 模擬創建數據
      const mockCreateData = {
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
      };

      // 模擬創建的 API 設定
      const mockApiConfig = {
        id: 'config-1',
        ...mockCreateData,
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (ApiConfigExtension.findByKey as jest.Mock).mockResolvedValue(null);
      (ApiConfigExtension.create as jest.Mock).mockResolvedValue(mockApiConfig);

      // 執行測試
      const result = await apiConfigService.createApiConfig(mockCreateData);

      // 驗證 ApiConfigExtension.findByKey 被調用
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledWith('api.key1');

      // 驗證 ApiConfigExtension.create 被調用
      expect(ApiConfigExtension.create).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.create).toHaveBeenCalledWith(mockCreateData);

      // 驗證返回值
      expect(result).toEqual(mockApiConfig);
    });

    it('應該處理鍵已存在的情況', async () => {
      // 模擬創建數據
      const mockCreateData = {
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
      };

      // 模擬已存在的 API 設定
      const mockExistingApiConfig = {
        id: 'config-1',
        name: 'Existing API Key',
        key: 'api.key1',
        value: 'existing-value',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'Existing API Key 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (ApiConfigExtension.findByKey as jest.Mock).mockResolvedValue(mockExistingApiConfig);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.createApiConfig(mockCreateData)).rejects.toThrow('API 設定鍵 api.key1 已存在');

      // 驗證 ApiConfigExtension.findByKey 被調用
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledTimes(1);

      // 驗證 ApiConfigExtension.create 沒有被調用
      expect(ApiConfigExtension.create).not.toHaveBeenCalled();
    });

    it('應該處理創建 API 設定時的錯誤', async () => {
      // 模擬創建數據
      const mockCreateData = {
        name: 'API Key 1',
        key: 'api.key1',
        value: 'value1',
        type: ApiConfigType.AI,
        isEncrypted: true,
        description: 'API Key 1 描述',
        isActive: true,
        metadata: {},
        createdBy: 'user-1',
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.findByKey as jest.Mock).mockResolvedValue(null);
      (ApiConfigExtension.create as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.createApiConfig(mockCreateData)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.findByKey 被調用
      expect(ApiConfigExtension.findByKey).toHaveBeenCalledTimes(1);

      // 驗證 ApiConfigExtension.create 被調用
      expect(ApiConfigExtension.create).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('創建 API 設定錯誤:', mockError);
    });
  });

  describe('updateApiConfig', () => {
    it('應該更新 API 設定', async () => {
      // 模擬更新數據
      const mockUpdateData = {
        name: 'Updated API Key',
        value: 'updated-value',
        updatedBy: 'user-1',
      };

      // 模擬更新後的 API 設定
      const mockUpdatedApiConfig = {
        id: 'config-1',
        name: 'Updated API Key',
        key: 'api.key1',
        value: 'updated-value',
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
      (ApiConfigExtension.update as jest.Mock).mockResolvedValue(mockUpdatedApiConfig);

      // 執行測試
      const result = await apiConfigService.updateApiConfig('config-1', mockUpdateData);

      // 驗證 ApiConfigExtension.update 被調用
      expect(ApiConfigExtension.update).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.update).toHaveBeenCalledWith('config-1', mockUpdateData);

      // 驗證返回值
      expect(result).toEqual(mockUpdatedApiConfig);
    });

    it('應該處理 API 設定不存在的情況', async () => {
      // 模擬更新數據
      const mockUpdateData = {
        name: 'Updated API Key',
        value: 'updated-value',
        updatedBy: 'user-1',
      };

      // 設置模擬函數的返回值
      (ApiConfigExtension.update as jest.Mock).mockResolvedValue(null);

      // 執行測試
      const result = await apiConfigService.updateApiConfig('non-existent-config', mockUpdateData);

      // 驗證 ApiConfigExtension.update 被調用
      expect(ApiConfigExtension.update).toHaveBeenCalledTimes(1);

      // 驗證返回值
      expect(result).toBeNull();
    });

    it('應該處理更新 API 設定時的錯誤', async () => {
      // 模擬更新數據
      const mockUpdateData = {
        name: 'Updated API Key',
        value: 'updated-value',
        updatedBy: 'user-1',
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.update as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.updateApiConfig('config-1', mockUpdateData)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.update 被調用
      expect(ApiConfigExtension.update).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('更新 API 設定 (ID: config-1) 錯誤:', mockError);
    });
  });

  describe('getApiConfigValue', () => {
    it('應該獲取 API 設定值', async () => {
      // 設置模擬函數的返回值
      (ApiConfigExtension.getValue as jest.Mock).mockResolvedValue('api-key-value');

      // 執行測試
      const result = await apiConfigService.getApiConfigValue('api.key1', 'default-value');

      // 驗證 ApiConfigExtension.getValue 被調用
      expect(ApiConfigExtension.getValue).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.getValue).toHaveBeenCalledWith('api.key1', 'default-value');

      // 驗證返回值
      expect(result).toBe('api-key-value');
    });

    it('應該使用默認值', async () => {
      // 執行測試
      await apiConfigService.getApiConfigValue('api.key1');

      // 驗證 ApiConfigExtension.getValue 被調用
      expect(ApiConfigExtension.getValue).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.getValue).toHaveBeenCalledWith('api.key1', '');
    });

    it('應該處理獲取 API 設定值時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.getValue as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getApiConfigValue('api.key1')).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.getValue 被調用
      expect(ApiConfigExtension.getValue).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 API 設定值 (Key: api.key1) 錯誤:', mockError);
    });
  });

  describe('getAiApiKey', () => {
    it('應該獲取 AI 服務的 API 金鑰', async () => {
      // 設置模擬函數的返回值
      (ApiConfigExtension.getValue as jest.Mock).mockResolvedValue('ai-api-key-value');

      // 執行測試
      const result = await apiConfigService.getAiApiKey('openai', 'default-value');

      // 驗證 ApiConfigExtension.getValue 被調用
      expect(ApiConfigExtension.getValue).toHaveBeenCalledTimes(1);
      expect(ApiConfigExtension.getValue).toHaveBeenCalledWith('ai.openai.api_key', 'default-value');

      // 驗證返回值
      expect(result).toBe('ai-api-key-value');
    });

    it('應該處理獲取 AI API 金鑰時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (ApiConfigExtension.getValue as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證拋出的錯誤
      await expect(apiConfigService.getAiApiKey('openai')).rejects.toThrow('資料庫連接錯誤');

      // 驗證 ApiConfigExtension.getValue 被調用
      expect(ApiConfigExtension.getValue).toHaveBeenCalledTimes(1);

      // 驗證錯誤被記錄
      expect(logger.error).toHaveBeenCalledWith('獲取 AI API 金鑰 (Provider: openai) 錯誤:', mockError);
    });
  });
});