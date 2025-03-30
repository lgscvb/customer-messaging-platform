import { Message } from '../models/Message';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import ConnectorFactory from '../connectors';
import LineConnector from '../connectors/line';
import FacebookConnector from '../connectors/facebook';
import WebsiteConnector from '../connectors/website';
import logger from '../utils/logger';

/**
 * 消息過濾選項
 */
export interface MessageFilterOptions {
  customerId?: string;
  platformType?: PlatformType;
  direction?: MessageDirection;
  startDate?: Date;
  endDate?: Date;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 消息創建選項
 */
export interface MessageCreateOptions {
  customerId: string;
  platformType: PlatformType;
  direction: MessageDirection;
  messageType: MessageType;
  content?: string;
  metadata?: Record<string, any>;
}

/**
 * 消息發送選項
 */
export interface MessageSendOptions {
  customerId: string;
  platformType: PlatformType;
  platformId: string;
  messageType: MessageType;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * 消息服務
 * 處理消息的路由、過濾和儲存
 */
class MessageService {
  /**
   * 獲取消息列表
   * @param options 過濾選項
   */
  async getMessages(options: MessageFilterOptions = {}): Promise<Message[]> {
    try {
      const {
        customerId,
        platformType,
        direction,
        startDate,
        endDate,
        isRead,
        limit = 50,
        offset = 0,
      } = options;
      
      // 構建查詢條件
      const where: any = {};
      
      if (customerId) {
        where.customerId = customerId;
      }
      
      if (platformType) {
        where.platformType = platformType;
      }
      
      if (direction) {
        where.direction = direction;
      }
      
      if (isRead !== undefined) {
        where.isRead = isRead;
      }
      
      // 日期範圍查詢
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }
      
      // 查詢消息
      const messages = await Message.findAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });
      
      return messages;
    } catch (error) {
      logger.error('獲取消息列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取客戶對話
   * @param customerId 客戶 ID
   * @param limit 限制數量
   * @param offset 偏移量
   */
  async getCustomerConversation(customerId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      // 查詢客戶消息
      const messages = await Message.findAll({
        where: {
          customerId,
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return messages;
    } catch (error) {
      logger.error('獲取客戶對話錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 創建消息
   * @param options 創建選項
   */
  async createMessage(options: MessageCreateOptions): Promise<Message> {
    try {
      const {
        customerId,
        platformType,
        direction,
        messageType,
        content,
        metadata = {}, // 提供默認值
      } = options;
      
      // 創建消息
      const message = await Message.create({
        customerId,
        platformType,
        direction,
        messageType,
        content,
        metadata,
        isRead: direction === MessageDirection.OUTBOUND, // 發出的消息默認已讀
        readAt: direction === MessageDirection.OUTBOUND ? new Date() : null,
      });
      
      logger.info(`已創建消息 ${message.id}`);
      
      return message;
    } catch (error) {
      logger.error('創建消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送消息
   * @param options 發送選項
   */
  async sendMessage(options: MessageSendOptions): Promise<Message> {
    try {
      const {
        customerId,
        platformType,
        platformId,
        messageType,
        content,
        metadata,
      } = options;
      
      // 獲取平台連接器
      const connectorFactory = ConnectorFactory.getInstance();
      let response;
      
      // 根據平台類型和消息類型發送消息
      switch (platformType) {
        case PlatformType.LINE: {
          const connector = connectorFactory.getConnector<LineConnector>(PlatformType.LINE);
          response = await connector.sendMessage(platformId, content);
          break;
        }
        case PlatformType.FACEBOOK: {
          const connector = connectorFactory.getConnector<FacebookConnector>(PlatformType.FACEBOOK);
          if (messageType === MessageType.TEXT) {
            response = await connector.sendTextMessage(platformId, content);
          } else if (messageType === MessageType.TEMPLATE) {
            response = await connector.sendTemplateMessage(platformId, JSON.parse(content));
          } else {
            throw new Error(`Facebook 連接器不支持的消息類型: ${messageType}`);
          }
          break;
        }
        case PlatformType.WEBSITE: {
          const connector = connectorFactory.getConnector<WebsiteConnector>(PlatformType.WEBSITE);
          if (messageType === MessageType.TEXT) {
            response = await connector.sendTextMessage(platformId, content);
          } else if (messageType === MessageType.IMAGE) {
            response = await connector.sendImageMessage(platformId, content);
          } else {
            throw new Error(`網站連接器不支持的消息類型: ${messageType}`);
          }
          break;
        }
        default:
          throw new Error(`不支持的平台類型: ${platformType}`);
      }
      
      // 創建消息記錄
      const message = await this.createMessage({
        customerId,
        platformType,
        direction: MessageDirection.OUTBOUND,
        messageType,
        content,
        metadata: {
          ...(metadata || {}),
          response,
        },
      });
      
      logger.info(`已發送消息 ${message.id} 到 ${platformType} 平台`);
      
      return message;
    } catch (error) {
      logger.error('發送消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 標記消息為已讀
   * @param messageId 消息 ID
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      // 更新消息
      const [updated] = await Message.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            id: messageId,
            isRead: false,
          },
        }
      );
      
      if (updated > 0) {
        logger.info(`已標記消息 ${messageId} 為已讀`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('標記消息為已讀錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 標記客戶所有消息為已讀
   * @param customerId 客戶 ID
   */
  async markAllAsRead(customerId: string): Promise<number> {
    try {
      // 更新消息
      const [updated] = await Message.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            customerId,
            direction: MessageDirection.INBOUND,
            isRead: false,
          },
        }
      );
      
      logger.info(`已標記客戶 ${customerId} 的 ${updated} 條消息為已讀`);
      
      return updated;
    } catch (error) {
      logger.error('標記客戶所有消息為已讀錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取未讀消息數量
   * @param customerId 客戶 ID
   */
  async getUnreadCount(customerId?: string): Promise<number> {
    try {
      // 構建查詢條件
      const where: any = {
        direction: MessageDirection.INBOUND,
        isRead: false,
      };
      
      if (customerId) {
        where.customerId = customerId;
      }
      
      // 查詢未讀消息數量
      const count = await Message.count({
        where,
      });
      
      return count;
    } catch (error) {
      logger.error('獲取未讀消息數量錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 刪除消息
   * @param messageId 消息 ID
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      // 刪除消息
      const deleted = await Message.destroy({
        where: {
          id: messageId,
        },
      });
      
      if (deleted > 0) {
        logger.info(`已刪除消息 ${messageId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('刪除消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取客戶平台 ID
   * @param customerId 客戶 ID
   * @param platformType 平台類型
   */
  async getCustomerPlatformId(customerId: string, platformType: PlatformType): Promise<string | null> {
    try {
      // 查詢客戶平台
      const customerPlatform = await CustomerPlatform.findOne({
        where: {
          customerId,
          platformType,
        },
      });
      
      if (customerPlatform) {
        return customerPlatform.platformId;
      }
      
      return null;
    } catch (error) {
      logger.error('獲取客戶平台 ID 錯誤:', error);
      throw error;
    }
  }
}

export default new MessageService();