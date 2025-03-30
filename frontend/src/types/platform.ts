/**
 * 平台類型枚舉
 */
export enum PlatformType {
  LINE = 'line',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  WEBSITE = 'website',
  OTHER = 'other'
}

/**
 * 平台狀態枚舉
 */
export enum PlatformStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error'
}

/**
 * 同步狀態枚舉
 */
export enum SyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  PENDING = 'pending'
}

/**
 * 平台設定接口
 */
export interface PlatformConfig {
  id: string;
  type: PlatformType;
  name: string;
  status: PlatformStatus;
  createdAt: string;
  updatedAt: string;
  credentials: Record<string, string>;
  webhookUrl: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * LINE 平台設定接口
 */
export interface LinePlatformConfig extends PlatformConfig {
  type: PlatformType.LINE;
  credentials: {
    channelId: string;
    channelSecret: string;
    accessToken: string;
  };
  settings: {
    defaultReplyMessage: string;
    autoReply: boolean;
    useAi: boolean;
  };
}

/**
 * Facebook 平台設定接口
 */
export interface FacebookPlatformConfig extends PlatformConfig {
  type: PlatformType.FACEBOOK;
  credentials: {
    pageId: string;
    appId: string;
    appSecret: string;
    pageAccessToken: string;
    verifyToken: string;
  };
  settings: {
    defaultReplyMessage: string;
    autoReply: boolean;
    useAi: boolean;
  };
}

/**
 * Instagram 平台設定接口
 */
export interface InstagramPlatformConfig extends PlatformConfig {
  type: PlatformType.INSTAGRAM;
  credentials: {
    pageId: string;
    appId: string;
    appSecret: string;
    pageAccessToken: string;
  };
  settings: {
    defaultReplyMessage: string;
    autoReply: boolean;
    useAi: boolean;
  };
}

/**
 * 網站平台設定接口
 */
export interface WebsitePlatformConfig extends PlatformConfig {
  type: PlatformType.WEBSITE;
  credentials: {
    apiKey: string;
  };
  settings: {
    defaultReplyMessage: string;
    autoReply: boolean;
    useAi: boolean;
    widgetColor: string;
    widgetPosition: 'left' | 'right';
    widgetTitle: string;
    widgetSubtitle: string;
  };
}

/**
 * 平台連接狀態接口
 */
export interface PlatformConnectionStatus {
  id: string;
  type: PlatformType;
  status: PlatformStatus;
  lastSyncTime: string;
  messageCount: number;
  errorMessage?: string;
}

/**
 * 平台統計接口
 */
export interface PlatformStats {
  id: string;
  type: PlatformType;
  messageCount: number;
  customerCount: number;
  responseRate: number;
  averageResponseTime: number;
  aiReplyPercentage: number;
}

/**
 * 平台設定表單接口
 */
export interface PlatformConfigFormData {
  name: string;
  credentials: Record<string, string>;
  settings: Record<string, any>;
}

/**
 * 同步歷史記錄接口
 */
export interface SyncHistory {
  id: string;
  platformId: string;
  status: SyncStatus;
  startTime: string;
  endTime: string;
  messageCount: number;
  customerCount: number;
  errorMessage?: string;
  details?: SyncDetails;
}

/**
 * 同步詳細信息接口
 */
export interface SyncDetails {
  newMessages: number;
  updatedMessages: number;
  newCustomers: number;
  updatedCustomers: number;
  errors: SyncError[];
}

/**
 * 同步錯誤接口
 */
export interface SyncError {
  code: string;
  message: string;
  timestamp: string;
  data?: any;
}