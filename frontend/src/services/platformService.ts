import api from './api';
import { 
  PlatformType, 
  PlatformStatus, 
  PlatformConfig, 
  LinePlatformConfig, 
  FacebookPlatformConfig, 
  InstagramPlatformConfig, 
  WebsitePlatformConfig,
  PlatformConnectionStatus,
  PlatformStats,
  PlatformConfigFormData,
  SyncHistory,
  SyncStatus,
  SyncDetails
} from '../types/platform';

/**
 * 平台服務
 */
const platformService = {
  /**
   * 獲取所有平台設定
   */
  getAllPlatforms: async (): Promise<PlatformConfig[]> => {
    const response = await api.get('/platforms');
    return response.data;
  },
  
  /**
   * 獲取平台設定
   */
  getPlatform: async (id: string): Promise<PlatformConfig> => {
    const response = await api.get(`/platforms/${id}`);
    return response.data;
  },
  
  /**
   * 創建平台設定
   */
  createPlatform: async (type: PlatformType, data: PlatformConfigFormData): Promise<PlatformConfig> => {
    const response = await api.post('/platforms', { type, ...data });
    return response.data;
  },
  
  /**
   * 更新平台設定
   */
  updatePlatform: async (id: string, data: Partial<PlatformConfigFormData>): Promise<PlatformConfig> => {
    const response = await api.put(`/platforms/${id}`, data);
    return response.data;
  },
  
  /**
   * 刪除平台設定
   */
  deletePlatform: async (id: string): Promise<void> => {
    await api.delete(`/platforms/${id}`);
  },
  
  /**
   * 獲取平台連接狀態
   */
  getPlatformStatus: async (id: string): Promise<PlatformConnectionStatus> => {
    const response = await api.get(`/platforms/${id}/status`);
    return response.data;
  },
  
  /**
   * 獲取平台統計
   */
  getPlatformStats: async (id: string): Promise<PlatformStats> => {
    const response = await api.get(`/platforms/${id}/stats`);
    return response.data;
  },
  
  /**
   * 測試平台連接
   */
  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/platforms/${id}/test`);
    return response.data;
  },
  
  /**
   * 同步平台數據
   */
  syncPlatform: async (id: string): Promise<{ success: boolean; message: string; syncId?: string }> => {
    const response = await api.post(`/platforms/${id}/sync`);
    return response.data;
  },

  /**
   * 獲取平台同步歷史記錄
   */
  getSyncHistory: async (platformId: string, limit: number = 10): Promise<SyncHistory[]> => {
    const response = await api.get(`/platforms/${platformId}/sync-history?limit=${limit}`);
    return response.data;
  },

  /**
   * 獲取同步詳細信息
   */
  getSyncDetails: async (syncId: string): Promise<SyncDetails> => {
    const response = await api.get(`/sync/${syncId}/details`);
    return response.data;
  },

  /**
   * 取消同步
   */
  cancelSync: async (syncId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/sync/${syncId}/cancel`);
    return response.data;
  },
  
  /**
   * 獲取 LINE 平台設定表單初始值
   */
  getLineFormInitialValues: (): PlatformConfigFormData => {
    return {
      name: '',
      credentials: {
        channelId: '',
        channelSecret: '',
        accessToken: ''
      },
      settings: {
        defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
        autoReply: true,
        useAi: true
      }
    };
  },
  
  /**
   * 獲取 Facebook 平台設定表單初始值
   */
  getFacebookFormInitialValues: (): PlatformConfigFormData => {
    return {
      name: '',
      credentials: {
        pageId: '',
        appId: '',
        appSecret: '',
        pageAccessToken: '',
        verifyToken: ''
      },
      settings: {
        defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
        autoReply: true,
        useAi: true
      }
    };
  },
  
  /**
   * 獲取 Instagram 平台設定表單初始值
   */
  getInstagramFormInitialValues: (): PlatformConfigFormData => {
    return {
      name: '',
      credentials: {
        pageId: '',
        appId: '',
        appSecret: '',
        pageAccessToken: ''
      },
      settings: {
        defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
        autoReply: true,
        useAi: true
      }
    };
  },
  
  /**
   * 獲取網站平台設定表單初始值
   */
  getWebsiteFormInitialValues: (): PlatformConfigFormData => {
    return {
      name: '',
      credentials: {
        apiKey: ''
      },
      settings: {
        defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
        autoReply: true,
        useAi: true,
        widgetColor: '#4caf50',
        widgetPosition: 'right',
        widgetTitle: '客戶服務',
        widgetSubtitle: '有任何問題嗎？請隨時詢問我們！'
      }
    };
  },
  
  /**
   * 獲取模擬平台列表（用於開發）
   */
  getMockPlatforms: (): PlatformConfig[] => {
    return [
      {
        id: '1',
        type: PlatformType.LINE,
        name: 'LINE 官方帳號',
        status: PlatformStatus.ACTIVE,
        createdAt: '2025-01-15T08:30:00Z',
        updatedAt: '2025-03-20T14:45:00Z',
        credentials: {
          channelId: '1234567890',
          channelSecret: '******',
          accessToken: '******'
        },
        webhookUrl: 'https://api.example.com/webhook/line',
        settings: {
          defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
          autoReply: true,
          useAi: true
        },
        metadata: {
          followers: 1250,
          lastSyncTime: '2025-03-30T05:15:00Z'
        }
      },
      {
        id: '2',
        type: PlatformType.FACEBOOK,
        name: 'Facebook 粉絲專頁',
        status: PlatformStatus.ACTIVE,
        createdAt: '2025-02-10T10:20:00Z',
        updatedAt: '2025-03-25T16:30:00Z',
        credentials: {
          pageId: '123456789012345',
          appId: '987654321098765',
          appSecret: '******',
          pageAccessToken: '******',
          verifyToken: '******'
        },
        webhookUrl: 'https://api.example.com/webhook/facebook',
        settings: {
          defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
          autoReply: true,
          useAi: true
        },
        metadata: {
          followers: 3500,
          lastSyncTime: '2025-03-30T06:20:00Z'
        }
      },
      {
        id: '3',
        type: PlatformType.WEBSITE,
        name: '官方網站聊天小工具',
        status: PlatformStatus.ACTIVE,
        createdAt: '2025-01-05T09:15:00Z',
        updatedAt: '2025-03-28T11:40:00Z',
        credentials: {
          apiKey: '******'
        },
        webhookUrl: 'https://api.example.com/webhook/website',
        settings: {
          defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
          autoReply: true,
          useAi: true,
          widgetColor: '#4caf50',
          widgetPosition: 'right',
          widgetTitle: '客戶服務',
          widgetSubtitle: '有任何問題嗎？請隨時詢問我們！'
        },
        metadata: {
          visitors: 12500,
          lastSyncTime: '2025-03-30T07:10:00Z'
        }
      },
      {
        id: '4',
        type: PlatformType.INSTAGRAM,
        name: 'Instagram 商業帳號',
        status: PlatformStatus.PENDING,
        createdAt: '2025-03-01T13:45:00Z',
        updatedAt: '2025-03-01T13:45:00Z',
        credentials: {
          pageId: '123456789012345',
          appId: '987654321098765',
          appSecret: '******',
          pageAccessToken: '******'
        },
        webhookUrl: 'https://api.example.com/webhook/instagram',
        settings: {
          defaultReplyMessage: '感謝您的訊息，我們將盡快回覆您。',
          autoReply: true,
          useAi: true
        },
        metadata: {
          followers: 2800,
          lastSyncTime: null
        }
      }
    ];
  },
  
  /**
   * 獲取模擬平台連接狀態（用於開發）
   */
  getMockPlatformStatus: (id: string): PlatformConnectionStatus => {
    const statuses: Record<string, PlatformConnectionStatus> = {
      '1': {
        id: '1',
        type: PlatformType.LINE,
        status: PlatformStatus.ACTIVE,
        lastSyncTime: '2025-03-30T05:15:00Z',
        messageCount: 1876
      },
      '2': {
        id: '2',
        type: PlatformType.FACEBOOK,
        status: PlatformStatus.ACTIVE,
        lastSyncTime: '2025-03-30T06:20:00Z',
        messageCount: 2543
      },
      '3': {
        id: '3',
        type: PlatformType.WEBSITE,
        status: PlatformStatus.ACTIVE,
        lastSyncTime: '2025-03-30T07:10:00Z',
        messageCount: 1254
      },
      '4': {
        id: '4',
        type: PlatformType.INSTAGRAM,
        status: PlatformStatus.PENDING,
        lastSyncTime: '',
        messageCount: 0,
        errorMessage: '等待授權完成'
      }
    };
    
    return statuses[id] || {
      id,
      type: PlatformType.OTHER,
      status: PlatformStatus.ERROR,
      lastSyncTime: '',
      messageCount: 0,
      errorMessage: '找不到平台'
    };
  },
  
  /**
   * 獲取模擬平台統計（用於開發）
   */
  getMockPlatformStats: (id: string): PlatformStats => {
    const stats: Record<string, PlatformStats> = {
      '1': {
        id: '1',
        type: PlatformType.LINE,
        messageCount: 1876,
        customerCount: 523,
        responseRate: 92.5,
        averageResponseTime: 5.2,
        aiReplyPercentage: 68.3
      },
      '2': {
        id: '2',
        type: PlatformType.FACEBOOK,
        messageCount: 2543,
        customerCount: 876,
        responseRate: 88.7,
        averageResponseTime: 6.8,
        aiReplyPercentage: 72.1
      },
      '3': {
        id: '3',
        type: PlatformType.WEBSITE,
        messageCount: 1254,
        customerCount: 412,
        responseRate: 95.3,
        averageResponseTime: 3.5,
        aiReplyPercentage: 81.5
      },
      '4': {
        id: '4',
        type: PlatformType.INSTAGRAM,
        messageCount: 0,
        customerCount: 0,
        responseRate: 0,
        averageResponseTime: 0,
        aiReplyPercentage: 0
      }
    };
    
    return stats[id] || {
      id,
      type: PlatformType.OTHER,
      messageCount: 0,
      customerCount: 0,
      responseRate: 0,
      averageResponseTime: 0,
      aiReplyPercentage: 0
    };
  },

  /**
   * 獲取模擬同步歷史記錄（用於開發）
   */
  getMockSyncHistory: (platformId: string): SyncHistory[] => {
    const now = new Date();
    const histories: Record<string, SyncHistory[]> = {
      '1': [
        {
          id: '1-1',
          platformId: '1',
          status: SyncStatus.SUCCESS,
          startTime: new Date(now.getTime() - 3600000).toISOString(), // 1小時前
          endTime: new Date(now.getTime() - 3550000).toISOString(),   // 1小時前 + 10分鐘
          messageCount: 120,
          customerCount: 45,
          details: {
            newMessages: 85,
            updatedMessages: 35,
            newCustomers: 12,
            updatedCustomers: 33,
            errors: []
          }
        },
        {
          id: '1-2',
          platformId: '1',
          status: SyncStatus.SUCCESS,
          startTime: new Date(now.getTime() - 86400000).toISOString(), // 1天前
          endTime: new Date(now.getTime() - 86350000).toISOString(),   // 1天前 + 10分鐘
          messageCount: 230,
          customerCount: 78,
          details: {
            newMessages: 180,
            updatedMessages: 50,
            newCustomers: 25,
            updatedCustomers: 53,
            errors: []
          }
        },
        {
          id: '1-3',
          platformId: '1',
          status: SyncStatus.PARTIAL,
          startTime: new Date(now.getTime() - 172800000).toISOString(), // 2天前
          endTime: new Date(now.getTime() - 172700000).toISOString(),   // 2天前 + 10分鐘
          messageCount: 95,
          customerCount: 32,
          errorMessage: '部分訊息同步失敗',
          details: {
            newMessages: 80,
            updatedMessages: 15,
            newCustomers: 10,
            updatedCustomers: 22,
            errors: [
              {
                code: 'API_RATE_LIMIT',
                message: 'LINE API 請求頻率超過限制',
                timestamp: new Date(now.getTime() - 172750000).toISOString()
              }
            ]
          }
        }
      ],
      '2': [
        {
          id: '2-1',
          platformId: '2',
          status: SyncStatus.SUCCESS,
          startTime: new Date(now.getTime() - 7200000).toISOString(), // 2小時前
          endTime: new Date(now.getTime() - 7150000).toISOString(),   // 2小時前 + 10分鐘
          messageCount: 185,
          customerCount: 62,
          details: {
            newMessages: 145,
            updatedMessages: 40,
            newCustomers: 18,
            updatedCustomers: 44,
            errors: []
          }
        },
        {
          id: '2-2',
          platformId: '2',
          status: SyncStatus.FAILED,
          startTime: new Date(now.getTime() - 93600000).toISOString(), // 1天 + 2小時前
          endTime: new Date(now.getTime() - 93590000).toISOString(),   // 1天 + 2小時前 + 10秒
          messageCount: 0,
          customerCount: 0,
          errorMessage: 'Facebook API 授權失敗',
          details: {
            newMessages: 0,
            updatedMessages: 0,
            newCustomers: 0,
            updatedCustomers: 0,
            errors: [
              {
                code: 'AUTH_ERROR',
                message: 'Facebook API 授權失敗，請重新授權',
                timestamp: new Date(now.getTime() - 93595000).toISOString()
              }
            ]
          }
        }
      ],
      '3': [
        {
          id: '3-1',
          platformId: '3',
          status: SyncStatus.SUCCESS,
          startTime: new Date(now.getTime() - 1800000).toISOString(), // 30分鐘前
          endTime: new Date(now.getTime() - 1790000).toISOString(),   // 30分鐘前 + 10秒
          messageCount: 45,
          customerCount: 22,
          details: {
            newMessages: 35,
            updatedMessages: 10,
            newCustomers: 8,
            updatedCustomers: 14,
            errors: []
          }
        }
      ],
      '4': []
    };
    
    return histories[platformId] || [];
  }
};

export default platformService;