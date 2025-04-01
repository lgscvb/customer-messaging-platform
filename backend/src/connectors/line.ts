import axios from 'axios';
import { Client, ClientConfig, MessageAPIResponseBase, TextMessage, WebhookEvent } from '@line/bot-sdk';
import { Message } from '../models/Message';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import logger from '../utils/logger';

/**
 * LINE 事件類型
 */
export type LineEventType =
  | 'message'
  | 'follow'
  | 'unfollow'
  | 'join'
  | 'leave'
  | 'postback'
  | 'beacon'
  | 'accountLink'
  | 'memberJoined'
  | 'memberLeft';

/**
 * LINE 消息事件
 */
export interface LineMessageEvent {
  type: 'message';
  replyToken: string;
  source: {
    userId: string;
    type: string;
    groupId?: string;
    roomId?: string;
  };
  message: {
    id: string;
    type: string;
    text?: string;
    contentProvider?: {
      type: string;
      originalContentUrl?: string;
    };
    [key: string]: any;
  };
  timestamp: number;
  mode: string;
}

/**
 * LINE 關注事件
 */
export interface LineFollowEvent {
  type: 'follow';
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
  timestamp: number;
  mode: string;
}

/**
 * LINE 加入群組事件
 */
export interface LineJoinEvent {
  type: 'join';
  replyToken: string;
  source: {
    type: string;
    groupId: string;
  };
  timestamp: number;
  mode: string;
}

/**
 * LINE 用戶資料
 */
export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
  [key: string]: any;
}

/**
 * LINE 平台配置
 */
export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  apiEndpoint?: string;
}

/**
 * LINE 消息類型
 */
enum LineMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  STICKER = 'sticker',
  TEMPLATE = 'template',
  FLEX = 'flex',
}

/**
 * LINE 連接器
 * 處理與 LINE 平台的通信
 */
class LineConnector {
  private client: Client;
  private config: LineConfig;
  
  /**
   * 構造函數
   * @param config LINE 平台配置
   */
  constructor(config: LineConfig) {
    this.config = config;
    const clientConfig: ClientConfig = {
      channelAccessToken: config.channelAccessToken,
      channelSecret: config.channelSecret,
    };
    
    if (config.apiEndpoint) {
      (clientConfig as any).apiEndpoint = config.apiEndpoint;
    }
    
    this.client = new Client(clientConfig);
  }
  
  /**
   * 處理 LINE Webhook 事件
   * @param events LINE Webhook 事件
   */
  async handleWebhook(events: WebhookEvent[]): Promise<void> {
    try {
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      logger.error('處理 LINE Webhook 事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理單個 LINE 事件
   * @param event LINE 事件
   */
  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      // 處理消息事件
      if (event.type === 'message') {
        const { replyToken, source, message } = event as LineMessageEvent;
        
        // 獲取或創建客戶
        const customer = await this.getOrCreateCustomer(source.userId as string);
        
        // 處理不同類型的消息
        switch (message.type) {
          case LineMessageType.TEXT:
            await this.handleTextMessage(replyToken, customer, message.text || '');
            break;
          case LineMessageType.IMAGE:
            await this.handleImageMessage(replyToken, customer);
            break;
          case LineMessageType.VIDEO:
            await this.handleVideoMessage(replyToken, customer);
            break;
          case LineMessageType.AUDIO:
            await this.handleAudioMessage(replyToken, customer);
            break;
          case LineMessageType.LOCATION:
            await this.handleLocationMessage(replyToken, customer);
            break;
          case LineMessageType.STICKER:
            await this.handleStickerMessage(replyToken, customer);
            break;
          default:
            await this.handleUnsupportedMessage(replyToken, customer);
            break;
        }
        
        // 保存消息到數據庫
        await this.saveMessage(customer.id, message);
      }
      // 處理關注事件
      else if (event.type === 'follow') {
        await this.handleFollowEvent(event as LineFollowEvent);
      }
      // 處理取消關注事件
      else if (event.type === 'unfollow') {
        await this.handleUnfollowEvent(event);
      }
      // 處理加入群組事件
      else if (event.type === 'join') {
        await this.handleJoinEvent(event as LineJoinEvent);
      }
      // 處理離開群組事件
      else if (event.type === 'leave') {
        await this.handleLeaveEvent(event);
      }
      // 處理其他事件
      else {
        logger.info(`未處理的 LINE 事件類型: ${event.type}`);
      }
    } catch (error) {
      logger.error('處理 LINE 事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理文本消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   * @param text 文本內容
   */
  private async handleTextMessage(replyToken: string, customer: Customer, text: string): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: `收到您的消息: ${text}`,
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的文本消息`);
    } catch (error) {
      logger.error('處理文本消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理圖片消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleImageMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '收到您的圖片',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的圖片消息`);
    } catch (error) {
      logger.error('處理圖片消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理視頻消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleVideoMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '收到您的視頻',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的視頻消息`);
    } catch (error) {
      logger.error('處理視頻消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理音頻消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleAudioMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '收到您的語音',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的音頻消息`);
    } catch (error) {
      logger.error('處理音頻消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理位置消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleLocationMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '收到您的位置',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的位置消息`);
    } catch (error) {
      logger.error('處理位置消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理貼圖消息
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleStickerMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '收到您的貼圖',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的貼圖消息`);
    } catch (error) {
      logger.error('處理貼圖消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理不支持的消息類型
   * @param replyToken 回覆令牌
   * @param customer 客戶
   */
  private async handleUnsupportedMessage(replyToken: string, customer: Customer): Promise<void> {
    try {
      // 創建回覆消息
      const replyMessage: TextMessage = {
        type: 'text',
        text: '抱歉，我們暫時無法處理這種類型的消息',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, replyMessage);
      
      logger.info(`已回覆客戶 ${customer.id} 的不支持消息類型`);
    } catch (error) {
      logger.error('處理不支持消息類型錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理關注事件
   * @param event 關注事件
   */
  private async handleFollowEvent(event: LineFollowEvent): Promise<void> {
    try {
      const { replyToken, source } = event;
      
      // 獲取或創建客戶
      const customer = await this.getOrCreateCustomer(source.userId as string);
      
      // 創建歡迎消息
      const welcomeMessage: TextMessage = {
        type: 'text',
        text: '感謝您關注我們！我們將為您提供最優質的服務。',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, welcomeMessage);
      
      logger.info(`已處理客戶 ${customer.id} 的關注事件`);
    } catch (error) {
      logger.error('處理關注事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理取消關注事件
   * @param event 取消關注事件
   */
  private async handleUnfollowEvent(event: WebhookEvent): Promise<void> {
    try {
      const { source } = event;
      
      // 更新客戶狀態
      await this.updateCustomerStatus(source.userId as string, 'inactive');
      
      logger.info(`已處理客戶 ${source.userId} 的取消關注事件`);
    } catch (error) {
      logger.error('處理取消關注事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理加入群組事件
   * @param event 加入群組事件
   */
  private async handleJoinEvent(event: LineJoinEvent): Promise<void> {
    try {
      const { replyToken, source } = event;
      
      // 創建歡迎消息
      const welcomeMessage: TextMessage = {
        type: 'text',
        text: '感謝您邀請我加入群組！我將為大家提供最優質的服務。',
      };
      
      // 回覆消息
      await this.client.replyMessage(replyToken, welcomeMessage);
      
      logger.info(`已處理加入群組事件: ${source.type === 'group' ? source.groupId : 'unknown'}`);
    } catch (error) {
      logger.error('處理加入群組事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理離開群組事件
   * @param event 離開群組事件
   */
  private async handleLeaveEvent(event: WebhookEvent): Promise<void> {
    try {
      const { source } = event;
      logger.info(`已處理離開群組事件: ${source.type === 'group' ? (source as { groupId: string }).groupId : 'unknown'}`);
    } catch (error) {
      logger.error('處理離開群組事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送消息
   * @param to 接收者 ID
   * @param text 消息文本
   */
  async sendMessage(to: string, text: string): Promise<MessageAPIResponseBase> {
    try {
      // 創建消息
      const message: TextMessage = {
        type: 'text',
        text,
      };
      
      // 發送消息
      const response = await this.client.pushMessage(to, message);
      
      logger.info(`已發送消息給客戶 ${to}`);
      
      return response;
    } catch (error) {
      logger.error('發送消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取用戶資料
   * @param userId 用戶 ID
   */
  async getUserProfile(userId: string): Promise<LineUserProfile> {
    try {
      // 獲取用戶資料
      const profile = await this.client.getProfile(userId);
      
      logger.info(`已獲取客戶 ${userId} 的資料`);
      
      return profile;
    } catch (error) {
      logger.error('獲取用戶資料錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取或創建客戶
   * @param userId LINE 用戶 ID
   */
  private async getOrCreateCustomer(userId: string): Promise<Customer> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          platformId: userId,
          platformType: PlatformType.LINE,
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
        name: profile.displayName,
        email: null,
        phone: null,
        status: 'active',
        metadata: {
          lineProfile: profile,
        },
      });
      
      // 創建客戶平台
      await CustomerPlatform.create({
        customerId: customer.id,
        platformId: userId,
        platformType: PlatformType.LINE,
        platformCustomerId: userId,
        platformData: {
          profile,
        },
      });
      
      logger.info(`已創建客戶 ${customer.id} 的 LINE 平台關聯`);
      
      return customer;
    } catch (error) {
      logger.error('獲取或創建客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更新客戶狀態
   * @param userId LINE 用戶 ID
   * @param status 狀態
   */
  private async updateCustomerStatus(userId: string, status: string): Promise<void> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          platformId: userId,
          platformType: PlatformType.LINE,
        },
      });
      
      // 如果客戶平台存在，更新客戶狀態
      if (customerPlatform) {
        await Customer.update(
          { status },
          { where: { id: customerPlatform.customerId } }
        );
        
        logger.info(`已更新客戶 ${customerPlatform.customerId} 的狀態為 ${status}`);
      }
    } catch (error) {
      logger.error('更新客戶狀態錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 保存消息
   * @param customerId 客戶 ID
   * @param message LINE 消息
   */
  private async saveMessage(customerId: string, message: LineMessageEvent['message']): Promise<void> {
    try {
      // 創建消息
      await Message.create({
        customerId,
        direction: MessageDirection.INBOUND,
        platformType: PlatformType.LINE,
        messageType: message.type === LineMessageType.TEXT ? MessageType.TEXT : MessageType.OTHER,
        content: message.type === LineMessageType.TEXT ? message.text : null,
        metadata: {
          lineMessage: message,
        },
      });
      
      logger.info(`已保存客戶 ${customerId} 的 LINE 消息`);
    } catch (error) {
      logger.error('保存消息錯誤:', error);
      throw error;
    }
  }
}

export default LineConnector;