import { Request, Response } from 'express';
import platformController from '../platform-controller';
import { CustomerPlatform } from '../../models/CustomerPlatform';
import { Customer } from '../../models/Customer';
import platformSyncService from '../../services/platform-sync-service';
import { PlatformType, PlatformStatus, SyncStatus } from '../../types/platform';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../models/CustomerPlatform');
jest.mock('../../models/Customer');
jest.mock('../../services/platform-sync-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('PlatformController', () => {
  // 模擬 Request 和 Response 對象
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();

    // 設置 Response 模擬
    jsonMock = jest.fn().mockReturnThis();
    sendMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  describe('getAllPlatforms', () => {
    it('應該獲取所有平台', async () => {
      // 模擬平台數據
      const mockPlatforms = [
        {
          id: 'platform-1',
          customerId: 'customer-1',
          platformId: 'line-platform-1',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
          platformData: {},
          customer: {
            id: 'customer-1',
            name: '測試客戶 1',
          },
        },
        {
          id: 'platform-2',
          customerId: 'customer-2',
          platformId: 'facebook-platform-1',
          platformType: PlatformType.FACEBOOK,
          platformCustomerId: 'fb-user-1',
          platformData: {},
          customer: {
            id: 'customer-2',
            name: '測試客戶 2',
          },
        },
      ];

      // 設置模擬函數的返回值
      (CustomerPlatform.findAll as jest.Mock).mockResolvedValue(mockPlatforms);

      // 執行測試
      await platformController.getAllPlatforms(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findAll 被調用
      expect(CustomerPlatform.findAll).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockPlatforms);
    });

    it('應該處理獲取平台列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (CustomerPlatform.findAll as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await platformController.getAllPlatforms(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findAll 被調用
      expect(CustomerPlatform.findAll).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取平台列表失敗' });
    });
  });

  describe('getPlatformById', () => {
    it('應該獲取平台詳情', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
        },
      };

      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-1',
        customerId: 'customer-1',
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
        platformCustomerId: 'line-user-1',
        platformData: {},
        customer: {
          id: 'customer-1',
          name: '測試客戶 1',
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(mockPlatform);

      // 執行測試
      await platformController.getPlatformById(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findByPk).toHaveBeenCalledWith('platform-1', {
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockPlatform);
    });

    it('應該處理找不到平台的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-platform',
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await platformController.getPlatformById(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到平台' });
    });

    it('應該處理獲取平台詳情時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (CustomerPlatform.findByPk as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await platformController.getPlatformById(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取平台詳情失敗' });
    });
  });

  describe('createPlatform', () => {
    it('應該創建平台', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-1',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
          platformData: {
            accessToken: 'mock-token',
          },
        },
      };

      // 模擬客戶數據
      const mockCustomer = {
        id: 'customer-1',
        name: '測試客戶 1',
      };

      // 模擬創建的平台
      const mockPlatform = {
        id: 'mock-uuid',
        customerId: 'customer-1',
        platformId: 'mock-uuid',
        platformType: PlatformType.LINE,
        platformCustomerId: 'line-user-1',
        platformData: {
          accessToken: 'mock-token',
        },
      };

      // 設置模擬函數的返回值
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(null);
      (CustomerPlatform.create as jest.Mock).mockResolvedValue(mockPlatform);

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 被調用
      expect(Customer.findByPk).toHaveBeenCalledTimes(1);
      expect(Customer.findByPk).toHaveBeenCalledWith('customer-1');

      // 驗證 CustomerPlatform.findOne 被調用
      expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-1',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
        },
      });

      // 驗證 CustomerPlatform.create 被調用
      expect(CustomerPlatform.create).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.create).toHaveBeenCalledWith({
        id: 'mock-uuid',
        customerId: 'customer-1',
        platformId: 'mock-uuid',
        platformType: PlatformType.LINE,
        platformCustomerId: 'line-user-1',
        platformData: {
          accessToken: 'mock-token',
        },
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockPlatform);
    });

    it('應該處理缺少必要參數的情況', async () => {
      // 模擬請求參數 (缺少 platformType)
      mockRequest = {
        body: {
          customerId: 'customer-1',
          platformCustomerId: 'line-user-1',
        },
      };

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 沒有被調用
      expect(Customer.findByPk).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '缺少必要參數' });
    });

    it('應該處理無效的平台類型', async () => {
      // 模擬請求參數 (無效的平台類型)
      mockRequest = {
        body: {
          customerId: 'customer-1',
          platformType: 'INVALID_TYPE',
          platformCustomerId: 'line-user-1',
        },
      };

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 沒有被調用
      expect(Customer.findByPk).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '無效的平台類型' });
    });

    it('應該處理找不到客戶的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'non-existent-customer',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
        },
      };

      // 設置模擬函數的返回值
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 被調用
      expect(Customer.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 CustomerPlatform.findOne 沒有被調用
      expect(CustomerPlatform.findOne).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到客戶' });
    });

    it('應該處理平台已存在的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-1',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
        },
      };

      // 模擬客戶數據
      const mockCustomer = {
        id: 'customer-1',
        name: '測試客戶 1',
      };

      // 模擬已存在的平台
      const mockExistingPlatform = {
        id: 'platform-1',
        customerId: 'customer-1',
        platformType: PlatformType.LINE,
        platformCustomerId: 'line-user-1',
      };

      // 設置模擬函數的返回值
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(mockExistingPlatform);

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 被調用
      expect(Customer.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 CustomerPlatform.findOne 被調用
      expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);

      // 驗證 CustomerPlatform.create 沒有被調用
      expect(CustomerPlatform.create).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: '平台已存在' });
    });

    it('應該處理創建平台時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-1',
          platformType: PlatformType.LINE,
          platformCustomerId: 'line-user-1',
        },
      };

      // 模擬客戶數據
      const mockCustomer = {
        id: 'customer-1',
        name: '測試客戶 1',
      };

      // 模擬錯誤
      const mockError = new Error('創建平台失敗');
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(null);
      (CustomerPlatform.create as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await platformController.createPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 Customer.findByPk 被調用
      expect(Customer.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 CustomerPlatform.findOne 被調用
      expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);

      // 驗證 CustomerPlatform.create 被調用
      expect(CustomerPlatform.create).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: '創建平台失敗' });
    });
  });

  describe('syncPlatform', () => {
    it('應該同步平台數據', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
        },
      };

      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-1',
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
      };

      // 模擬同步 ID
      const mockSyncId = 'sync-123';

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(mockPlatform);
      (platformSyncService.startSync as jest.Mock).mockResolvedValue(mockSyncId);

      // 執行測試
      await platformController.syncPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findByPk).toHaveBeenCalledWith('platform-1');

      // 驗證 platformSyncService.startSync 被調用
      expect(platformSyncService.startSync).toHaveBeenCalledTimes(1);
      expect(platformSyncService.startSync).toHaveBeenCalledWith({
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: '同步任務已啟動',
        syncId: 'sync-123',
      });
    });

    it('應該處理找不到平台的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-platform',
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await platformController.syncPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 platformSyncService.startSync 沒有被調用
      expect(platformSyncService.startSync).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到平台' });
    });

    it('應該處理同步平台數據時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
        },
      };

      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-1',
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
      };

      // 模擬錯誤
      const mockError = new Error('同步平台數據失敗');
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(mockPlatform);
      (platformSyncService.startSync as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await platformController.syncPlatform(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 platformSyncService.startSync 被調用
      expect(platformSyncService.startSync).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '同步平台數據失敗',
        syncedItems: 0,
        failedItems: 0,
      });
    });
  });

  describe('getSyncStatus', () => {
    it('應該獲取同步狀態', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
          syncId: 'sync-123',
        },
      };

      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-1',
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
      };

      // 模擬同步狀態
      const mockSyncStatus = {
        id: 'sync-123',
        platformId: 'line-platform-1',
        status: SyncStatus.SUCCESS,
        startTime: new Date(),
        endTime: new Date(),
        messageCount: 10,
        customerCount: 5,
        details: {
          newMessages: 8,
          updatedMessages: 2,
          newCustomers: 3,
          updatedCustomers: 2,
          errors: [],
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(mockPlatform);
      (platformSyncService.getSyncStatus as jest.Mock).mockResolvedValue(mockSyncStatus);

      // 執行測試
      await platformController.getSyncStatus(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findByPk).toHaveBeenCalledWith('platform-1');

      // 驗證 platformSyncService.getSyncStatus 被調用
      expect(platformSyncService.getSyncStatus).toHaveBeenCalledTimes(1);
      expect(platformSyncService.getSyncStatus).toHaveBeenCalledWith('sync-123');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockSyncStatus);
    });

    it('應該處理找不到平台的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-platform',
          syncId: 'sync-123',
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await platformController.getSyncStatus(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 platformSyncService.getSyncStatus 沒有被調用
      expect(platformSyncService.getSyncStatus).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到平台' });
    });

    it('應該處理獲取同步狀態時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'platform-1',
          syncId: 'sync-123',
        },
      };

      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-1',
        platformId: 'line-platform-1',
        platformType: PlatformType.LINE,
      };

      // 模擬錯誤
      const mockError = new Error('獲取同步狀態失敗');
      (CustomerPlatform.findByPk as jest.Mock).mockResolvedValue(mockPlatform);
      (platformSyncService.getSyncStatus as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await platformController.getSyncStatus(mockRequest as Request, mockResponse as Response);

      // 驗證 CustomerPlatform.findByPk 被調用
      expect(CustomerPlatform.findByPk).toHaveBeenCalledTimes(1);

      // 驗證 platformSyncService.getSyncStatus 被調用
      expect(platformSyncService.getSyncStatus).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取同步狀態失敗' });
    });
  });
});