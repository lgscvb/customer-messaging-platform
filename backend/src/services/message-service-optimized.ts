import { Message } from '../models/Message';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import ConnectorFactory from '../connectors';
import LineConnector from '../connectors/line';
import FacebookConnector from '../connectors/facebook';
import WebsiteConnector from '../connectors/website';
import logger from '../utils/logger';
import { Op, Sequelize } from 'sequelize';
import cache from '../utils/cache';

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
 * 優化的消息服務
 * 處理消息的路由、過濾和儲存，並使用索引和緩存優化查詢性能
 */
class MessageServiceOptimized {
  // 緩存鍵前綴
  private readonly CACHE_PREFIX = 'message:';
  // 緩存過期時間（毫秒）
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

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
      
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getMessages', options);
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
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
            where.createdAt[Op.gte] = startDate;
          }
          
          if (endDate) {
            where.createdAt[Op.lte] = endDate;
          }
        }
        
        // 優化查詢：使用適當的索引
        const query: any = {
          where,
          limit,
          offset,
          order: [['createdAt', 'DESC']],
        };
        
        // 根據查詢條件選擇最佳索引
        if (customerId) {
          // 使用 customer_id + created_at 複合索引
          query.order = [['createdAt', 'DESC']];
          
          // 如果有 isRead 條件，使用 customer_id + is_read 複合索引
          if (isRead !== undefined) {
            query.order = [['isRead', 'ASC'], ['createdAt', 'DESC']];
          }
        }
        
        // 只在需要時包含 Customer 關聯
        if (customerId) {
          // 如果已知 customerId，不需要加載 Customer 關聯
          return Message.findAll(query);
        } else {
          // 如果未知 customerId，需要加載 Customer 關聯
          query.include = [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'name', 'email', 'platformType', 'platformId'], // 只選擇需要的字段
            },
          ];
          return Message.findAll(query);
        }
      }, this.CACHE_TTL);
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getCustomerConversation', { customerId, limit, offset });
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
        // 優化查詢：使用 customer_id + created_at 複合索引
        const messages = await Message.findAll({
          where: {
            customerId,
          },
          limit,
          offset,
          order: [['createdAt', 'DESC']],
          // 使用查詢提示指定索引
          attributes: {
            include: [
              [
                Sequelize.literal('/*+ INDEX(messages messages_customer_id_created_at_idx) */'),
                'indexHint',
              ],
            ],
          },
        });
        
        return messages;
      }, this.CACHE_TTL);
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
        isFromCustomer: direction === MessageDirection.INBOUND, // 設置分析字段
        isRead: direction === MessageDirection.OUTBOUND, // 發出的消息默認已讀
        readAt: direction === MessageDirection.OUTBOUND ? new Date() : null,
      });
      
      logger.info(`已創建消息 ${message.id}`);
      
      // 清除相關緩存
      this.clearMessageCache(customerId);
      
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
      
      // 清除相關緩存
      this.clearMessageCache(customerId);
      
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
      // 獲取消息以獲取 customerId
      const message = await Message.findByPk(messageId);
      if (!message) {
        return false;
      }
      
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
        
        // 清除相關緩存
        this.clearMessageCache(message.customerId);
        
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
      
      // 清除相關緩存
      this.clearMessageCache(customerId);
      
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getUnreadCount', { customerId });
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
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
      }, this.CACHE_TTL);
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
      // 獲取消息以獲取 customerId
      const message = await Message.findByPk(messageId);
      if (!message) {
        return false;
      }
      
      // 刪除消息
      const deleted = await Message.destroy({
        where: {
          id: messageId,
        },
      });
      
      if (deleted > 0) {
        logger.info(`已刪除消息 ${messageId}`);
        
        // 清除相關緩存
        this.clearMessageCache(message.customerId);
        
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getCustomerPlatformId', { customerId, platformType });
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
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
      }, this.CACHE_TTL);
    } catch (error) {
      logger.error('獲取客戶平台 ID 錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 構建緩存鍵
   * @param method 方法名
   * @param params 參數
   */
  private buildCacheKey(method: string, params: any): string {
    return `${this.CACHE_PREFIX}${method}:${JSON.stringify(params)}`;
  }
  
  /**
   * 清除消息相關緩存
   * @param customerId 客戶 ID
   */
  private clearMessageCache(customerId: string): void {
    // 清除與特定客戶相關的緩存
    cache.deleteByPrefix(`${this.CACHE_PREFIX}getMessages:{"customerId":"${customerId}`);
    cache.deleteByPrefix(`${this.CACHE_PREFIX}getCustomerConversation:{"customerId":"${customerId}`);
    cache.deleteByPrefix(`${this.CACHE_PREFIX}getUnreadCount:{"customerId":"${customerId}`);
    
    // 清除所有消息列表緩存
    cache.deleteByPrefix(`${this.CACHE_PREFIX}getMessages:{}`);
    cache.deleteByPrefix(`${this.CACHE_PREFIX}getUnreadCount:{}`);
  }
}

export default new MessageServiceOptimized();