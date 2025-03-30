import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { Message } from '../models/Message';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import logger from '../utils/logger';

/**
 * 網站平台配置
 */
export interface WebsiteConfig {
  apiKey: string;
  webhookSecret: string;
}

/**
 * 網站消息類型
 */
enum WebsiteMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

/**
 * 網站連接器
 * 處理與官方網站的通信
 */
class WebsiteConnector {
  private config: WebsiteConfig;
  
  /**
   * 構造函數
   * @param config 網站平台配置
   */
  constructor(config: WebsiteConfig) {
    this.config = config;
  }
  
  /**
   * 處理網站 Webhook 事件
   * @param payload Webhook 事件負載
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      // 驗證 Webhook 請求
      if (!this.verifyWebhookSignature(payload)) {
        logger.error('網站 Webhook 簽名驗證失敗');
        throw new Error('無效的 Webhook 簽名');
      }
      
      // 處理不同類型的事件
      switch (payload.event) {
        case 'message':
          await this.handleMessageEvent(payload);
          break;
        case 'user_info':
          await this.handleUserInfoEvent(payload);
          break;
        case 'page_view':
          await this.handlePageViewEvent(payload);
          break;
        default:
          logger.info(`未處理的網站事件類型: ${payload.event}`);
          break;
      }
    } catch (error) {
      logger.error('處理網站 Webhook 事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 驗證 Webhook 簽名
   * @param payload Webhook 事件負載
   */
  private verifyWebhookSignature(payload: any): boolean {
    // 實際實現中，應該使用加密庫來驗證簽名
    // 這裡簡化為檢查 API 密鑰
    return payload.apiKey === this.config.apiKey;
  }
  
  /**
   * 處理消息事件
   * @param payload 事件負載
   */
  private async handleMessageEvent(payload: any): Promise<void> {
    try {
      const { userId, message } = payload;
      
      // 獲取或創建客戶
      const customer = await this.getOrCreateCustomer(userId, payload.userInfo);
      
      // 處理不同類型的消息
      switch (message.type) {
        case WebsiteMessageType.TEXT:
          await this.handleTextMessage(customer, message.content, userId);
          break;
        case WebsiteMessageType.IMAGE:
          await this.handleImageMessage(customer, message.url, userId);
          break;
        case WebsiteMessageType.FILE:
          await this.handleFileMessage(customer, message.url, message.fileName, userId);
          break;
        default:
          logger.info(`未處理的網站消息類型: ${message.type}`);
          break;
      }
      
      // 保存消息到數據庫
      await this.saveMessage(customer.id, message, MessageDirection.INBOUND);
    } catch (error) {
      logger.error('處理消息事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理用戶信息事件
   * @param payload 事件負載
   */
  private async handleUserInfoEvent(payload: any): Promise<void> {
    try {
      const { userId, userInfo } = payload;
      
      // 獲取或創建客戶
      const customer = await this.getOrCreateCustomer(userId, userInfo);
      
      logger.info(`已處理客戶 ${customer.id} 的用戶信息事件`);
    } catch (error) {
      logger.error('處理用戶信息事件錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理頁面瀏覽事件
   * @param payload 事件負載
   */
  private async handlePageViewEvent(payload: any): Promise<void> {
    try {
      const { userId, page } = payload;
      
      // 獲取客戶
      const customer = await this.getCustomerByPlatformId(userId);
      
      if (customer) {
        // 更新客戶元數據
        const metadata = customer.metadata || {};
        const pageViews = metadata.pageViews || [];
        
        pageViews.push({
          url: page.url,
          title: page.title,
          timestamp: new Date().toISOString(),
        });
        
        // 限制頁面瀏覽記錄數量
        if (pageViews.length > 100) {
          pageViews.shift();
        }
        
        metadata.pageViews = pageViews;
        
        await Customer.update(
          { metadata },
          { where: { id: customer.id } }
        );
        
        logger.info(`已處理客戶 ${customer.id} 的頁面瀏覽事件: ${page.url}`);
      }
    } catch (error) {
      logger.error('處理頁面瀏覽事件錯誤:', error);
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
   * 處理圖片消息
   * @param customer 客戶
   * @param imageUrl 圖片 URL
   * @param recipientId 接收者 ID
   */
  private async handleImageMessage(customer: Customer, imageUrl: string, recipientId: string): Promise<void> {
    try {
      // 創建回覆消息
      const response = '收到您的圖片';
      
      // 發送回覆
      await this.sendTextMessage(recipientId, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的圖片消息`);
    } catch (error) {
      logger.error('處理圖片消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理文件消息
   * @param customer 客戶
   * @param fileUrl 文件 URL
   * @param fileName 文件名
   * @param recipientId 接收者 ID
   */
  private async handleFileMessage(customer: Customer, fileUrl: string, fileName: string, recipientId: string): Promise<void> {
    try {
      // 創建回覆消息
      const response = `收到您的文件: ${fileName}`;
      
      // 發送回覆
      await this.sendTextMessage(recipientId, response);
      
      logger.info(`已回覆客戶 ${customer.id} 的文件消息`);
    } catch (error) {
      logger.error('處理文件消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送文本消息
   * @param recipientId 接收者 ID
   * @param text 文本內容
   */
  async sendTextMessage(recipientId: string, text: string): Promise<any> {
    try {
      // 在實際實現中，這裡應該調用網站的 API 發送消息
      // 這裡模擬發送成功
      
      // 保存消息到數據庫
      const customer = await this.getCustomerByPlatformId(recipientId);
      if (customer) {
        await this.saveMessage(customer.id, { type: WebsiteMessageType.TEXT, content: text }, MessageDirection.OUTBOUND);
      }
      
      logger.info(`已發送消息給客戶 ${recipientId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('發送文本消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送圖片消息
   * @param recipientId 接收者 ID
   * @param imageUrl 圖片 URL
   */
  async sendImageMessage(recipientId: string, imageUrl: string): Promise<any> {
    try {
      // 在實際實現中，這裡應該調用網站的 API 發送消息
      // 這裡模擬發送成功
      
      // 保存消息到數據庫
      const customer = await this.getCustomerByPlatformId(recipientId);
      if (customer) {
        await this.saveMessage(customer.id, { type: WebsiteMessageType.IMAGE, url: imageUrl }, MessageDirection.OUTBOUND);
      }
      
      logger.info(`已發送圖片消息給客戶 ${recipientId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('發送圖片消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取或創建客戶
   * @param userId 網站用戶 ID
   * @param userInfo 用戶信息
   */
  private async getOrCreateCustomer(userId: string, userInfo?: any): Promise<Customer> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          platformId: userId,
          platformType: PlatformType.WEBSITE,
        },
      });
      
      // 如果客戶平台存在，返回客戶
      if (customerPlatform) {
        const customer = await Customer.findByPk(customerPlatform.customerId);
        if (customer) {
          // 如果提供了用戶信息，更新客戶資料
          if (userInfo) {
            await this.updateCustomerInfo(customer, userInfo);
          }
          
          return customer;
        }
      }
      
      // 創建客戶
      const name = userInfo?.name || '網站訪客';
      const email = userInfo?.email || null;
      const phone = userInfo?.phone || null;
      
      const customer = await Customer.create({
        name,
        email,
        phone,
        status: 'active',
        metadata: {
          websiteUserInfo: userInfo || {},
        },
      });
      
      // 創建客戶平台
      await CustomerPlatform.create({
        customerId: customer.id,
        platformId: userId,
        platformType: PlatformType.WEBSITE,
        platformData: {
          userInfo: userInfo || {},
        },
      });
      
      logger.info(`已創建客戶 ${customer.id} 的網站平台關聯`);
      
      return customer;
    } catch (error) {
      logger.error('獲取或創建客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更新客戶信息
   * @param customer 客戶
   * @param userInfo 用戶信息
   */
  private async updateCustomerInfo(customer: Customer, userInfo: any): Promise<void> {
    try {
      const updates: any = {};
      
      // 更新名稱
      if (userInfo.name && userInfo.name !== customer.name) {
        updates.name = userInfo.name;
      }
      
      // 更新電子郵件
      if (userInfo.email && userInfo.email !== customer.email) {
        updates.email = userInfo.email;
      }
      
      // 更新電話
      if (userInfo.phone && userInfo.phone !== customer.phone) {
        updates.phone = userInfo.phone;
      }
      
      // 更新元數據
      const metadata = customer.metadata || {};
      metadata.websiteUserInfo = userInfo;
      updates.metadata = metadata;
      
      // 如果有更新，應用更新
      if (Object.keys(updates).length > 0) {
        await Customer.update(updates, { where: { id: customer.id } });
        
        logger.info(`已更新客戶 ${customer.id} 的信息`);
      }
    } catch (error) {
      logger.error('更新客戶信息錯誤:', error);
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
          platformType: PlatformType.WEBSITE,
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
   * @param message 網站消息
   * @param direction 消息方向
   */
  private async saveMessage(customerId: string, message: any, direction: MessageDirection): Promise<void> {
    try {
      // 確定消息類型
      let messageType = MessageType.OTHER;
      let content = null;
      
      if (message.type === WebsiteMessageType.TEXT) {
        messageType = MessageType.TEXT;
        content = message.content;
      } else if (message.type === WebsiteMessageType.IMAGE) {
        messageType = MessageType.IMAGE;
        content = message.url;
      } else if (message.type === WebsiteMessageType.FILE) {
        messageType = MessageType.FILE;
        content = message.url;
      }
      
      // 創建消息
      await Message.create({
        customerId,
        direction,
        platformType: PlatformType.WEBSITE,
        messageType,
        content,
        metadata: {
          websiteMessage: message,
        },
      });
      
      logger.info(`已保存客戶 ${customerId} 的網站消息`);
    } catch (error) {
      logger.error('保存消息錯誤:', error);
      throw error;
    }
  }
}

export default WebsiteConnector;