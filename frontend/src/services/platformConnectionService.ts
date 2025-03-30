import api from './api';
import { PlatformConfig, PlatformStatus, PlatformType } from '../types/platform';

/**
 * 平台連接狀態接口
 */
export interface ConnectionStatus {
  success: boolean;
  message: string;
  status: PlatformStatus;
  details?: Record<string, any>;
}

/**
 * 平台同步結果接口
 */
export interface SyncResult {
  success: boolean;
  message: string;
  syncedItems: number;
  failedItems: number;
  details?: Record<string, any>;
}

/**
 * 平台連接服務
 */
const platformConnectionService = {
  /**
   * 連接平台
   */
  connectPlatform: async (platformId: string): Promise<ConnectionStatus> => {
    try {
      const response = await api.post(`/platforms/${platformId}/connect`);
      return response.data;
    } catch (error: any) {
      console.error('連接平台錯誤:', error);
      return {
        success: false,
        message: error.response?.data?.message || '連接平台失敗',
        status: PlatformStatus.ERROR
      };
    }
  },
  
  /**
   * 斷開平台連接
   */
  disconnectPlatform: async (platformId: string): Promise<ConnectionStatus> => {
    try {
      const response = await api.post(`/platforms/${platformId}/disconnect`);
      return response.data;
    } catch (error: any) {
      console.error('斷開平台連接錯誤:', error);
      return {
        success: false,
        message: error.response?.data?.message || '斷開平台連接失敗',
        status: PlatformStatus.ERROR
      };
    }
  },
  
  /**
   * 同步平台數據
   */
  syncPlatform: async (platformId: string): Promise<SyncResult> => {
    try {
      const response = await api.post(`/platforms/${platformId}/sync`);
      return response.data;
    } catch (error: any) {
      console.error('同步平台數據錯誤:', error);
      return {
        success: false,
        message: error.response?.data?.message || '同步平台數據失敗',
        syncedItems: 0,
        failedItems: 0
      };
    }
  },
  
  /**
   * 測試平台連接
   */
  testConnection: async (platformId: string): Promise<ConnectionStatus> => {
    try {
      const response = await api.post(`/platforms/${platformId}/test`);
      return response.data;
    } catch (error: any) {
      console.error('測試平台連接錯誤:', error);
      return {
        success: false,
        message: error.response?.data?.message || '測試平台連接失敗',
        status: PlatformStatus.ERROR
      };
    }
  },
  
  /**
   * 獲取平台連接狀態
   */
  getConnectionStatus: async (platformId: string): Promise<ConnectionStatus> => {
    try {
      const response = await api.get(`/platforms/${platformId}/status`);
      return {
        success: true,
        message: '獲取平台連接狀態成功',
        status: response.data.status,
        details: response.data
      };
    } catch (error: any) {
      console.error('獲取平台連接狀態錯誤:', error);
      return {
        success: false,
        message: error.response?.data?.message || '獲取平台連接狀態失敗',
        status: PlatformStatus.ERROR
      };
    }
  },
  
  /**
   * 獲取平台同步歷史
   */
  getSyncHistory: async (platformId: string): Promise<any[]> => {
    try {
      const response = await api.get(`/platforms/${platformId}/sync-history`);
      return response.data;
    } catch (error) {
      console.error('獲取平台同步歷史錯誤:', error);
      return [];
    }
  },
  
  /**
   * 獲取模擬連接狀態（用於開發）
   */
  getMockConnectionStatus: (platformId: string, platformType: PlatformType): ConnectionStatus => {
    // 根據平台類型返回不同的模擬狀態
    switch (platformType) {
      case PlatformType.LINE:
        return {
          success: true,
          message: '平台已連接',
          status: PlatformStatus.ACTIVE,
          details: {
            lastSyncTime: '2025-03-30T05:15:00Z',
            messageCount: 1876,
            followers: 1250
          }
        };
      case PlatformType.FACEBOOK:
        return {
          success: true,
          message: '平台已連接',
          status: PlatformStatus.ACTIVE,
          details: {
            lastSyncTime: '2025-03-30T06:20:00Z',
            messageCount: 2543,
            followers: 3500
          }
        };
      case PlatformType.INSTAGRAM:
        return {
          success: false,
          message: '等待授權完成',
          status: PlatformStatus.PENDING,
          details: {
            lastSyncTime: null,
            messageCount: 0,
            followers: 0
          }
        };
      case PlatformType.WEBSITE:
        return {
          success: true,
          message: '平台已連接',
          status: PlatformStatus.ACTIVE,
          details: {
            lastSyncTime: '2025-03-30T07:10:00Z',
            messageCount: 1254,
            visitors: 12500
          }
        };
      default:
        return {
          success: false,
          message: '未知平台類型',
          status: PlatformStatus.ERROR
        };
    }
  },
  
  /**
   * 獲取模擬同步結果（用於開發）
   */
  getMockSyncResult: (platformType: PlatformType): SyncResult => {
    // 根據平台類型返回不同的模擬同步結果
    switch (platformType) {
      case PlatformType.LINE:
        return {
          success: true,
          message: '同步成功',
          syncedItems: 45,
          failedItems: 0,
          details: {
            messages: 32,
            customers: 13
          }
        };
      case PlatformType.FACEBOOK:
        return {
          success: true,
          message: '同步成功',
          syncedItems: 78,
          failedItems: 2,
          details: {
            messages: 65,
            customers: 13,
            errors: ['無法同步部分訊息']
          }
        };
      case PlatformType.INSTAGRAM:
        return {
          success: false,
          message: '平台未連接',
          syncedItems: 0,
          failedItems: 0
        };
      case PlatformType.WEBSITE:
        return {
          success: true,
          message: '同步成功',
          syncedItems: 56,
          failedItems: 0,
          details: {
            messages: 42,
            customers: 14
          }
        };
      default:
        return {
          success: false,
          message: '未知平台類型',
          syncedItems: 0,
          failedItems: 0
        };
    }
  },
  
  /**
   * 獲取模擬同步歷史（用於開發）
   */
  getMockSyncHistory: (platformType: PlatformType): any[] => {
    // 根據平台類型返回不同的模擬同步歷史
    const baseHistory = [
      {
        id: '1',
        timestamp: '2025-03-30T07:10:00Z',
        success: true,
        syncedItems: 56,
        failedItems: 0,
        duration: 12.5
      },
      {
        id: '2',
        timestamp: '2025-03-29T07:15:00Z',
        success: true,
        syncedItems: 48,
        failedItems: 0,
        duration: 10.2
      },
      {
        id: '3',
        timestamp: '2025-03-28T07:05:00Z',
        success: true,
        syncedItems: 62,
        failedItems: 3,
        duration: 15.7
      },
      {
        id: '4',
        timestamp: '2025-03-27T07:20:00Z',
        success: true,
        syncedItems: 41,
        failedItems: 0,
        duration: 9.8
      },
      {
        id: '5',
        timestamp: '2025-03-26T07:12:00Z',
        success: false,
        syncedItems: 0,
        failedItems: 0,
        duration: 5.3,
        error: '連接超時'
      }
    ];
    
    // 根據平台類型調整數據
    switch (platformType) {
      case PlatformType.LINE:
        return baseHistory.map(item => ({
          ...item,
          platform: 'LINE'
        }));
      case PlatformType.FACEBOOK:
        return baseHistory.map(item => ({
          ...item,
          platform: 'Facebook',
          syncedItems: Math.floor(item.syncedItems * 1.2),
          duration: item.duration * 1.1
        }));
      case PlatformType.INSTAGRAM:
        return [];
      case PlatformType.WEBSITE:
        return baseHistory.map(item => ({
          ...item,
          platform: '網站',
          syncedItems: Math.floor(item.syncedItems * 0.9),
          duration: item.duration * 0.9
        }));
      default:
        return [];
    }
  }
};

export default platformConnectionService;