/**
 * 平台類型枚舉
 */
export enum PlatformType {
  LINE = 'line',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  SHOPEE = 'shopee',
  WEBSITE = 'website',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  WECHAT = 'wechat',
  OTHER = 'other'
}

/**
 * 消息方向枚舉
 */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

/**
 * 消息類型枚舉
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  STICKER = 'sticker',
  CONTACT = 'contact',
  TEMPLATE = 'template',
  CAROUSEL = 'carousel',
  BUTTON = 'button',
  QUICK_REPLY = 'quick_reply',
  OTHER = 'other'
}

/**
 * 客戶狀態枚舉
 */
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  DELETED = 'deleted'
}

/**
 * 平台配置接口
 */
export interface PlatformConfig {
  platformType: PlatformType;
  enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
}

/**
 * 平台連接器接口
 */
export interface PlatformConnector {
  /**
   * 處理 Webhook 事件
   * @param payload Webhook 事件負載
   */
  handleWebhook(payload: any): Promise<void>;
  
  /**
   * 發送消息
   * @param to 接收者 ID
   * @param content 消息內容
   * @param options 發送選項
   */
  sendMessage(to: string, content: any, options?: any): Promise<any>;
  
  /**
   * 獲取用戶資料
   * @param userId 用戶 ID
   */
  getUserProfile(userId: string): Promise<any>;
}