import platformSyncService from '../platform-sync-service';
import { CustomerPlatform } from '../../models/CustomerPlatform';
import SyncHistory from '../../models/SyncHistory';
import { Customer } from '../../models/Customer';
import { Message } from '../../models/Message';
import { PlatformType, SyncStatus } from '../../types/platform';
import ConnectorFactory from '../../connectors';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../models/CustomerPlatform');
jest.mock('../../models/SyncHistory');
jest.mock('../../models/Customer');
jest.mock('../../models/Message');
jest.mock('../../connectors');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('PlatformSyncService', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startSync', () => {
    it('應該開始同步平台數據', async () => {
      // 模擬平台數據
      const mockPlatform = {
        id: 'platform-123',
        platformType: PlatformType.LINE,
      };

      // 模擬 SyncHistory 創建
      const mockSyncHistory = {
        id: 'mock-uuid',
        platformId: 'platform-123',
        status: SyncStatus.PENDING,
        startTime: new Date('2025-01-01T00:00:00Z'),
        messageCount: 0,
        customerCount: 0,
        details: {
          newMessages: 0,
          updatedMessages: 0,
          newCustomers: 0,
          updatedCustomers: 0,
          errors: [],
        },
      };

      // 設置模擬函數的返回值
      (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(mockPlatform);
      (SyncHistory.create as jest.Mock).mockResolvedValue(mockSyncHistory);

      // 執行測試
      const syncId = await platformSyncService.startSync({
        platformId: 'platform-123',
        platformType: PlatformType.LINE,
      });

      // 驗證 CustomerPlatform.findOne 被調用
      expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findOne).toHaveBeenCalledWith({
        where: { id: 'platform-123', platformType: PlatformType.LINE },
      });

      // 驗證 SyncHistory.create 被調用
      expect(SyncHistory.create).toHaveBeenCalledTimes(1);
      expect(SyncHistory.create).toHaveBeenCalledWith({
        id: 'mock-uuid',
        platformId: 'platform-123',
        status: SyncStatus.PENDING,
        startTime: new Date('2025-01-01T00:00:00Z'),
        messageCount: 0,
        customerCount: 0,
        details: {
          newMessages: 0,
          updatedMessages: 0,
          newCustomers: 0,
          updatedCustomers: 0,
          errors: [],
        },
      });

      // 驗證返回的同步 ID
      expect(syncId).toBe('mock-uuid');
    });

    it('應該在找不到平台時拋出錯誤', async () => {
      // 設置模擬函數的返回值
      (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(null);

      // 執行測試並驗證拋出的錯誤
      await expect(
        platformSyncService.startSync({
          platformId: 'non-existent-platform',
          platformType: PlatformType.LINE,
        })
      ).rejects.toThrow('找不到平台: non-existent-platform');

      // 驗證 CustomerPlatform.findOne 被調用
      expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
      expect(CustomerPlatform.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-platform', platformType: PlatformType.LINE },
      });

      // 驗證 SyncHistory.create 沒有被調用
      expect(SyncHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelSync', () => {
    it('應該取消同步任務', async () => {
      // 模擬活動同步任務
      const activeSync = {
        platformId: 'platform-123',
        platformType: PlatformType.LINE,
        startTime: new Date('2025-01-01T00:00:00Z'),
        cancel: false,
      };

      // 設置活動同步任務
      (platformSyncService as any).activeSyncs.set('sync-123', activeSync);

      // 執行測試
      const result = await platformSyncService.cancelSync('sync-123');

      // 驗證 SyncHistory.update 被調用
      expect(SyncHistory.update).toHaveBeenCalledTimes(1);
      expect(SyncHistory.update).toHaveBeenCalledWith(
        {
          status: SyncStatus.FAILED,
          endTime: new Date('2025-01-01T00:00:00Z'),
          errorMessage: '同步任務已取消',
        },
        { where: { id: 'sync-123' } }
      );

      // 驗證返回結果
      expect(result).toBe(true);

      // 驗證活動同步任務被標記為取消
      expect(activeSync.cancel).toBe(true);
    });

    it('應該在找不到同步任務時返回 false', async () => {
      // 執行測試
      const result = await platformSyncService.cancelSync('non-existent-sync');

      // 驗證 SyncHistory.update 沒有被調用
      expect(SyncHistory.update).not.toHaveBeenCalled();

      // 驗證返回結果
      expect(result).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('應該獲取同步狀態', async () => {
      // 模擬同步歷史記錄
      const mockSyncHistory = {
        id: 'sync-123',
        platformId: 'platform-123',
        status: SyncStatus.SUCCESS,
        startTime: new Date('2025-01-01T00:00:00Z'),
        endTime: new Date('2025-01-01T00:05:00Z'),
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
      (SyncHistory.findByPk as jest.Mock).mockResolvedValue(mockSyncHistory);

      // 執行測試
      const syncStatus = await platformSyncService.getSyncStatus('sync-123');

      // 驗證 SyncHistory.findByPk 被調用
      expect(SyncHistory.findByPk).toHaveBeenCalledTimes(1);
      expect(SyncHistory.findByPk).toHaveBeenCalledWith('sync-123');

      // 驗證返回的同步狀態
      expect(syncStatus).toEqual(mockSyncHistory);
    });

    it('應該在找不到同步任務時拋出錯誤', async () => {
      // 設置模擬函數的返回值
      (SyncHistory.findByPk as jest.Mock).mockResolvedValue(null);

      // 執行測試並驗證拋出的錯誤
      await expect(
        platformSyncService.getSyncStatus('non-existent-sync')
      ).rejects.toThrow('找不到同步任務: non-existent-sync');

      // 驗證 SyncHistory.findByPk 被調用
      expect(SyncHistory.findByPk).toHaveBeenCalledTimes(1);
      expect(SyncHistory.findByPk).toHaveBeenCalledWith('non-existent-sync');
    });
  });

  describe('getSyncHistory', () => {
    it('應該獲取平台同步歷史', async () => {
      // 模擬同步歷史記錄
      const mockSyncHistories = [
        {
          id: 'sync-123',
          platformId: 'platform-123',
          status: SyncStatus.SUCCESS,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:05:00Z'),
          messageCount: 10,
          customerCount: 5,
        },
        {
          id: 'sync-456',
          platformId: 'platform-123',
          status: SyncStatus.FAILED,
          startTime: new Date('2024-12-31T23:50:00Z'),
          endTime: new Date('2024-12-31T23:55:00Z'),
          messageCount: 0,
          customerCount: 0,
          errorMessage: '同步失敗',
        },
      ];

      // 設置模擬函數的返回值
      (SyncHistory.findAll as jest.Mock).mockResolvedValue(mockSyncHistories);

      // 執行測試
      const syncHistory = await platformSyncService.getSyncHistory('platform-123', 10, 0);

      // 驗證 SyncHistory.findAll 被調用
      expect(SyncHistory.findAll).toHaveBeenCalledTimes(1);
      expect(SyncHistory.findAll).toHaveBeenCalledWith({
        where: { platformId: 'platform-123' },
        order: [['startTime', 'DESC']],
        limit: 10,
        offset: 0,
      });

      // 驗證返回的同步歷史
      expect(syncHistory).toEqual(mockSyncHistories);
    });

    it('應該使用默認的限制和偏移量', async () => {
      // 設置模擬函數的返回值
      (SyncHistory.findAll as jest.Mock).mockResolvedValue([]);

      // 執行測試
      await platformSyncService.getSyncHistory('platform-123');

      // 驗證 SyncHistory.findAll 被調用
      expect(SyncHistory.findAll).toHaveBeenCalledTimes(1);
      expect(SyncHistory.findAll).toHaveBeenCalledWith({
        where: { platformId: 'platform-123' },
        order: [['startTime', 'DESC']],
        limit: 10,
        offset: 0,
      });
    });
  });

  // 測試私有方法 executeSyncTask 是比較困難的，因為它是私有的，而且它調用了很多其他方法
  // 這裡我們可以通過測試它的公共接口來間接測試它
  // 或者，我們可以使用一些技巧來測試私有方法，例如使用 (platformSyncService as any).executeSyncTask
  // 但這不是一個好的實踐，因為它破壞了封裝性
  // 所以我們這裡只測試公共方法
});