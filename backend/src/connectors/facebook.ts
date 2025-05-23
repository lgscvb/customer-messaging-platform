import axios from 'axios';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { Message } from '../models/Message';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import logger from '../utils/logger';

/**
 * Facebook Webhook 事件負載介面
 */
export interface FacebookWebhookPayload {
  object: string;
  entry: FacebookEntry[];
}

/**
 * Facebook 事件條目介面
 */
export interface FacebookEntry {
  id: string;
  time: number;
  messaging?: FacebookMessaging[];
}

/**
 * Facebook 消息事件介面
 */
export interface FacebookMessaging {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: FacebookMessage;
  postback?: FacebookPostback;
}

/**
 * Facebook 消息介面
 */
export interface FacebookMessage {
  mid: string;
  text?: string;
  attachments?: FacebookAttachment[];
  quick_reply?: FacebookQuickReply;
}

/**
 * Facebook 附件介面
 */
export interface FacebookAttachment {
  type: string;
  payload: {
    url?: string;
    title?: string;
    coordinates?: {
      lat: number;
      long: number;
    };
    [key: string]: any;
  };
}

/**
 * Facebook 快速回覆介面
 */
export interface FacebookQuickReply {
  payload: string;
  [key: string]: any;
}

/**
 * Facebook 回調介面
 */
export interface FacebookPostback {
  title: string;
  payload: string;
  mid?: string;
}

/**
 * Facebook 用戶資料介面
 */
export interface FacebookUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
  locale?: string;
  timezone?: number;
  gender?: string;
  [key: string]: any;
}

/**
 * Facebook API 回應介面
 */
export interface FacebookApiResponse {
  recipient_id: string;
  message_id: string;
  [key: string]: any;
}

/**
 * Facebook 平台配置
 */
export interface FacebookConfig {
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  apiVersion?: string;
}

/**
 * Facebook 消息類型
 */
enum FacebookMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  TEMPLATE = 'template',
  QUICK_REPLY = 'quick_reply',
}

/**
 * Facebook 連接器
 * 處理與 Facebook Messenger 平台的通信
 */
class FacebookConnector {
  private config: FacebookConfig;
  private apiUrl: string;
  
  /**
   * 構造函數
   * @param config Facebook 平台配置
   */
  constructor(config: FacebookConfig) {
    this.config = config;
    const apiVersion = config.apiVersion || 'v18.0';
    this.apiUrl = `https://graph.facebook.com/${apiVersion}`;
  }
  
  /**
   * 處理 Facebook Webhook 事件
   * @param payload Webhook 事件負載
   */
  async handleWebhook(payload: FacebookWebhookPayload): Promise<void> {
    try {
      // 檢查是否為頁面事件
      if (payload.object !== 'page') {
        logger.info('非頁面事件，忽略');
        return;
      }
      
      // 處理每個事件
      for (const entry of payload.entry) {
        // 處理每個消息
        for (const messaging of entry.messaging || []) {
          await this.processMessage(messaging);
        }
      }
    } catch (error) {
      logger.error('處理 Facebook Webhook 事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 驗證 Webhook 請求
   * @param mode 模式
   * @param token 令牌
   * @param challenge 挑戰
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.verifyToken) {
      logger.info('Facebook Webhook 驗證成功');
      return challenge;
    }
    
    logger.error('Facebook Webhook 驗證失敗');
    return null;
  }
  
  /**
   * 處理單個消息
   * @param messaging 消息事件
   */
  private async processMessage(messaging: FacebookMessaging): Promise<void> {
    try {
      const senderId = messaging.sender.id;
      
      // 獲取或創建客戶
      const customer = await this.getOrCreateCustomer(senderId);
      
      // 處理消息
      if (messaging.message) {
        await this.handleIncomingMessage(customer, messaging);
      }
      // 處理回調
      else if (messaging.postback) {
        await this.handlePostback(customer, messaging);
      }
      // 處理其他事件
      else {
        logger.info(`未處理的 Facebook 事件類型: ${JSON.stringify(messaging)}`);
      }
    } catch (error) {
      logger.error('處理 Facebook 消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理傳入消息
   * @param customer 客戶
   * @param messaging 消息事件
   */
  private async handleIncomingMessage(customer: Customer, messaging: FacebookMessaging): Promise<void> {
    try {
      const message = messaging.message;
      
      // 確保 message 存在
      if (!message) {
        logger.warn(`收到沒有消息內容的 Facebook 事件: ${JSON.stringify(messaging)}`);
        return;
      }
      
      // 處理文本消息
      if (message.text) {
        await this.handleTextMessage(customer, message.text, messaging.sender.id);
      }
      // 處理附件
      else if (message.attachments && message.attachments.length > 0) {
        await this.handleAttachmentMessage(customer, message.attachments, messaging.sender.id);
      }
      // 處理快速回覆
      else if (message.quick_reply) {
        await this.handleQuickReply(customer, message.quick_reply, messaging.sender.id);
      }
      // 處理其他消息
      else {
        logger.info(`未處理的 Facebook 消息類型: ${JSON.stringify(message)}`);
      }
      
      // 保存消息到數據庫
      await this.saveMessage(customer.id, message, MessageDirection.INBOUND);
    } catch (error) {
      logger.error('處理傳入消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理文本消息
   * @param customer 客戶
   * @param text 文本內容
   * @param recipientId 接收者 ID
   */
  private async handleTextMessage(customer: Customer, text: string, recipientId: string): Promise<void> {
    try {
      // 創建回覆消息
      const response = `收到您的消息: ${text}`;
      
      // 發送回覆
      await this.sendTextMessage(recipientId, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的文本消息`);
    } catch (error) {
      logger.error('處理文本消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理附件消息
   * @param customer 客戶
   * @param attachments 附件
   * @param recipientId 接收者 ID
   */
  private async handleAttachmentMessage(customer: Customer, attachments: FacebookAttachment[], recipientId: string): Promise<void> {
    try {
      // 獲取第一個附件的類型
      const attachmentType = attachments[0].type;
      
      // 創建回覆消息
      let response = '';
      
      switch (attachmentType) {
        case 'image':
          response = '收到您的圖片';
          break;
        case 'video':
          response = '收到您的視頻';
          break;
        case 'audio':
          response = '收到您的語音';
          break;
        case 'file':
          response = '收到您的文件';
          break;
        case 'location':
          response = '收到您的位置';
          break;
        default:
          response = '收到您的附件';
          break;
      }
      
      // 發送回覆
      await this.sendTextMessage(recipientId, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的附件消息`);
    } catch (error) {
      logger.error('處理附件消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理快速回覆
   * @param customer 客戶
   * @param quickReply 快速回覆
   * @param recipientId 接收者 ID
   */
  private async handleQuickReply(customer: Customer, quickReply: FacebookQuickReply, recipientId: string): Promise<void> {
    try {
      // 創建回覆消息
      const response = `收到您的快速回覆: ${quickReply.payload}`;
      
      // 發送回覆
      await this.sendTextMessage(recipientId, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的快速回覆`);
    } catch (error) {
      logger.error('處理快速回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理回調
   * @param customer 客戶
   * @param messaging 消息事件
   */
  private async handlePostback(customer: Customer, messaging: FacebookMessaging): Promise<void> {
    try {
      const postback = messaging.postback;
      
      // 確保 postback 存在
      if (!postback) {
        logger.warn(`收到沒有回調內容的 Facebook 事件: ${JSON.stringify(messaging)}`);
        return;
      }
      
      // 創建回覆消息
      const response = `收到您的回調: ${postback.payload}`;
      
      // 發送回覆
      await this.sendTextMessage(messaging.sender.id, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的回調`);
      
      // 保存消息到數據庫
      await this.saveMessage(customer.id, postback, MessageDirection.INBOUND);
    } catch (error) {
      logger.error('處理回調錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送文本消息
   * @param recipientId 接收者 ID
   * @param text 文本內容
   */
  async sendTextMessage(recipientId: string, text: string): Promise<FacebookApiResponse> {
    try {
      const url = `${this.apiUrl}/me/messages`;
      
      const data = {
        recipient: {
          id: recipientId,
        },
        message: {
          text,
        },
      };
      
      const response = await axios.post(url, data, {
        params: {
          access_token: this.config.pageAccessToken,
        },
      });
      
      // 保存消息到數據庫
      const customer = await this.getCustomerByPlatformId(recipientId);
      if (customer) {
        await this.saveMessage(customer.id, { text }, MessageDirection.OUTBOUND);
      }
      
      logger.info(`已發送消息給客戶 ${recipientId}`);
      
      return response.data;
    } catch (error) {
      logger.error('發送文本消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送模板消息
   * @param recipientId 接收者 ID
   * @param template 模板
   */
  async sendTemplateMessage(recipientId: string, template: Record<string, any>): Promise<FacebookApiResponse> {
    try {
      const url = `${this.apiUrl}/me/messages`;
      
      const data = {
        recipient: {
          id: recipientId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: template,
          },
        },
      };
      
      const response = await axios.post(url, data, {
        params: {
          access_token: this.config.pageAccessToken,
        },
      });
      
      // 保存消息到數據庫
      const customer = await this.getCustomerByPlatformId(recipientId);
      if (customer) {
        await this.saveMessage(customer.id, { template }, MessageDirection.OUTBOUND);
      }
      
      logger.info(`已發送模板消息給客戶 ${recipientId}`);
      
      return response.data;
    } catch (error) {
      logger.error('發送模板消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取用戶資料
   * @param userId 用戶 ID
   */
  async getUserProfile(userId: string): Promise<FacebookUserProfile> {
    try {
      const url = `${this.apiUrl}/${userId}`;
      
      const response = await axios.get(url, {
        params: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.config.pageAccessToken,
        },
      });
      
      logger.info(`已獲取客戶 ${userId} 的資料`);
      
      return response.data;
    } catch (error) {
      logger.error('獲取用戶資料錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取或創建客戶
   * @param userId Facebook 用戶 ID
   */
  private async getOrCreateCustomer(userId: string): Promise<Customer> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          platformId: userId,
          platformType: PlatformType.FACEBOOK,
        },
      });
      
      // 如果客戶平台存在，返回客戶
      if (customerPlatform) {
        const customer = await Customer.findByPk(customerPlatform.customerId);
        if (customer) {
          return customer;
        }
      }
      
      // 獲取用戶資料
      const profile = await this.getUserProfile(userId);
      
      // 創建客戶
      const customer = await Customer.create({
        name: `${profile.first_name} ${profile.last_name}`,
        email: null,
        phone: null,
        status: 'active',
        metadata: {
          facebookProfile: profile,
        },
      });
      
      // 創建客戶平台
      await CustomerPlatform.create({
        customerId: customer.id,
        platformId: userId,
        platformType: PlatformType.FACEBOOK,
        platformCustomerId: userId, // 添加 platformCustomerId 屬性
        platformData: {
          profile,
        },
      });
      
      logger.info(`已創建客戶 ${customer.id} 的 Facebook 平台關聯`);
      
      return customer;
    } catch (error) {
      logger.error('獲取或創建客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據平台 ID 獲取客戶
   * @param platformId 平台 ID
   */
  private async getCustomerByPlatformId(platformId: string): Promise<Customer | null> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          platformId,
          platformType: PlatformType.FACEBOOK,
        },
      });
      
      // 如果客戶平台存在，返回客戶
      if (customerPlatform) {
        const customer = await Customer.findByPk(customerPlatform.customerId);
        return customer;
      }
      
      return null;
    } catch (error) {
      logger.error('根據平台 ID 獲取客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 保存消息
   * @param customerId 客戶 ID
   * @param message Facebook 消息
   * @param direction 消息方向
   */
  private async saveMessage(customerId: string, message: FacebookMessage | FacebookPostback | { text: string } | { template: any }, direction: MessageDirection): Promise<void> {
    try {
      // 確定消息類型
      let messageType = MessageType.OTHER;
      let content = null;
      
      // 處理 FacebookMessage 類型
      if ('text' in message && message.text) {
        messageType = MessageType.TEXT;
        content = message.text;
      }
      // 處理 FacebookMessage 中的附件
      else if ('attachments' in message && message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        switch (attachment.type) {
          case 'image':
            messageType = MessageType.IMAGE;
            break;
          case 'video':
            messageType = MessageType.VIDEO;
            break;
          case 'audio':
            messageType = MessageType.AUDIO;
            break;
          case 'file':
            messageType = MessageType.FILE;
            break;
          default:
            messageType = MessageType.OTHER;
            break;
        }
      }
      // 處理 FacebookPostback 類型
      else if ('payload' in message && 'title' in message) {
        messageType = MessageType.TEXT;
        content = message.payload;
      }
      // 處理模板消息
      else if ('template' in message) {
        messageType = MessageType.TEMPLATE;
      }
      
      // 創建消息
      await Message.create({
        customerId,
        direction,
        platformType: PlatformType.FACEBOOK,
        messageType,
        content,
        metadata: {
          facebookMessage: message,
        },
      });
      
      logger.info(`已保存客戶 ${customerId} 的 Facebook 消息`);
    } catch (error) {
      logger.error('保存消息錯誤:', error);
      throw error;
    }
  }
}

export default FacebookConnector;