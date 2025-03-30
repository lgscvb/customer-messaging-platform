import { PlatformType, SyncStatus } from '../types/platform';
import { Message } from '../models/Message';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import sequelize from '../config/database';
import { Model, DataTypes, Optional } from 'sequelize';
import ConnectorFactory from '../connectors';
import LineConnector from '../connectors/line';
import FacebookConnector from '../connectors/facebook';
import WebsiteConnector from '../connectors/website';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 同步歷史記錄屬性接口
 */
interface SyncHistoryAttributes {
  id: string;
  platformId: string;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  customerCount: number;
  errorMessage?: string;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 同步歷史記錄創建屬性接口
 */
type SyncHistoryCreationAttributes = Optional<SyncHistoryAttributes, 'endTime' | 'errorMessage' | 'details' | 'createdAt' | 'updatedAt'>;

/**
 * 同步歷史記錄模型
 */
class SyncHistory extends Model<SyncHistoryAttributes, SyncHistoryCreationAttributes> implements SyncHistoryAttributes {
  public id!: string;
  public platformId!: string;
  public status!: SyncStatus;
  public startTime!: Date;
  public endTime?: Date;
  public messageCount!: number;
  public customerCount!: number;
  public errorMessage?: string;
  public details?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SyncHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    platformId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SyncStatus)),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    customerCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sync_histories',
    modelName: 'SyncHistory',
  }
);

/**
 * 同步選項接口
 */
export interface SyncOptions {
  platformId: string;
  platformType: PlatformType;
  startTime?: Date;
  endTime?: Date;
  fullSync?: boolean;
}

/**
 * 同步結果接口
 */
export interface SyncResult {
  syncId: string;
  platformId: string;
  status: SyncStatus;
  messageCount: number;
  customerCount: number;
  newMessages: number;
  updatedMessages: number;
  newCustomers: number;
  updatedCustomers: number;
  errors: Array<{
    code: string;
    message: string;
    timestamp: string;
    data?: any;
  }>;
}

/**
 * 平台同步服務
 * 負責同步各平台的訊息和客戶資料
 */
class PlatformSyncService {
  // 存儲進行中的同步任務
  private activeSyncs: Map<string, { 
    platformId: string, 
    platformType: PlatformType, 
    startTime: Date,
    cancel: boolean 
  }> = new Map();

  /**
   * 開始同步平台數據
   * @param options 同步選項
   */
  async startSync(options: SyncOptions): Promise<string> {
    const { platformId, platformType, fullSync = false } = options;
    const syncId = uuidv4();
    const startTime = new Date();
    
    // 檢查平台是否存在
    const platform = await CustomerPlatform.findOne({
      where: { id: platformId, platformType }
    });
    
    if (!platform) {
      throw new Error(`找不到平台: ${platformId}`);
    }
    
    // 創建同步歷史記錄
    const syncHistory = await SyncHistory.create({
      id: syncId,
      platformId,
      status: SyncStatus.PENDING,
      startTime,
      messageCount: 0,
      customerCount: 0,
      details: {
        newMessages: 0,
        updatedMessages: 0,
        newCustomers: 0,
        updatedCustomers: 0,
        errors: []
      }
    });
    
    // 將同步任務添加到活動同步列表
    this.activeSyncs.set(syncId, {
      platformId,
      platformType,
      startTime,
      cancel: false
    });
    
    // 異步執行同步任務
    this.executeSyncTask(syncId, options).catch(error => {
      logger.error(`同步任務 ${syncId} 執行錯誤:`, error);
    });
    
    return syncId;
  }
  
  /**
   * 取消同步任務
   * @param syncId 同步 ID
   */
  async cancelSync(syncId: string): Promise<boolean> {
    const activeSync = this.activeSyncs.get(syncId);
    
    if (!activeSync) {
      return false;
    }
    
    // 標記為取消
    activeSync.cancel = true;
    
    // 更新同步歷史記錄
    await SyncHistory.update(
      {
        status: SyncStatus.FAILED,
        endTime: new Date(),
        errorMessage: '同步任務已取消'
      },
      { where: { id: syncId } }
    );
    
    logger.info(`同步任務 ${syncId} 已取消`);
    
    return true;
  }
  
  /**
   * 獲取同步狀態
   * @param syncId 同步 ID
   */
  async getSyncStatus(syncId: string): Promise<any> {
    const syncHistory = await SyncHistory.findByPk(syncId);
    
    if (!syncHistory) {
      throw new Error(`找不到同步任務: ${syncId}`);
    }
    
    return syncHistory;
  }
  
  /**
   * 獲取平台同步歷史
   * @param platformId 平台 ID
   * @param limit 限制數量
   * @param offset 偏移量
   */
  async getSyncHistory(platformId: string, limit = 10, offset = 0): Promise<any[]> {
    const syncHistory = await SyncHistory.findAll({
      where: { platformId },
      order: [['startTime', 'DESC']],
      limit,
      offset
    });
    
    return syncHistory;
  }
  
  /**
   * 執行同步任務
   * @param syncId 同步 ID
   * @param options 同步選項
   */
  private async executeSyncTask(syncId: string, options: SyncOptions): Promise<void> {
    const { platformId, platformType, startTime: syncStartTime, endTime: syncEndTime, fullSync } = options;
    const activeSync = this.activeSyncs.get(syncId);
    
    if (!activeSync) {
      logger.error(`找不到活動同步任務: ${syncId}`);
      return;
    }
    
    try {
      logger.info(`開始執行同步任務 ${syncId} (平台: ${platformType}, ID: ${platformId})`);
      
      // 獲取平台連接器
      const connectorFactory = ConnectorFactory.getInstance();
      let messages: any[] = [];
      let customers: any[] = [];
      
      // 模擬從平台獲取數據
      // 在實際實現中，這裡應該調用各平台的 API 獲取數據
      // 這裡僅作為示例，使用模擬數據
      switch (platformType) {
        case PlatformType.LINE: {
          // 模擬 LINE 平台數據
          messages = [
            {
              id: `line-msg-${Date.now()}-1`,
              customerId: `line-user-1`,
              direction: 'inbound',
              type: 'text',
              content: '您好，我想詢問產品資訊',
              timestamp: new Date().toISOString(),
              metadata: {}
            },
            {
              id: `line-msg-${Date.now()}-2`,
              customerId: `line-user-2`,
              direction: 'inbound',
              type: 'text',
              content: '請問有優惠活動嗎？',
              timestamp: new Date().toISOString(),
              metadata: {}
            }
          ];
          
          customers = [
            {
              id: 'line-user-1',
              name: 'LINE 用戶 1',
              metadata: {
                profilePicture: 'https://example.com/profile1.jpg'
              }
            },
            {
              id: 'line-user-2',
              name: 'LINE 用戶 2',
              metadata: {
                profilePicture: 'https://example.com/profile2.jpg'
              }
            }
          ];
          break;
        }
        case PlatformType.FACEBOOK: {
          // 模擬 Facebook 平台數據
          messages = [
            {
              id: `fb-msg-${Date.now()}-1`,
              customerId: `fb-user-1`,
              direction: 'inbound',
              type: 'text',
              content: '請問營業時間？',
              timestamp: new Date().toISOString(),
              metadata: {}
            }
          ];
          
          customers = [
            {
              id: 'fb-user-1',
              name: 'Facebook 用戶 1',
              email: 'user1@example.com',
              metadata: {
                profilePicture: 'https://example.com/fb-profile1.jpg'
              }
            }
          ];
          break;
        }
        case PlatformType.WEBSITE: {
          // 模擬網站平台數據
          messages = [
            {
              id: `web-msg-${Date.now()}-1`,
              customerId: `web-user-1`,
              direction: 'inbound',
              type: 'text',
              content: '我需要技術支援',
              timestamp: new Date().toISOString(),
              metadata: {}
            }
          ];
          
          customers = [
            {
              id: 'web-user-1',
              name: '網站訪客 1',
              email: 'visitor1@example.com',
              metadata: {
                browser: 'Chrome',
                os: 'Windows'
              }
            }
          ];
          break;
        }
        default:
          throw new Error(`不支持的平台類型: ${platformType}`);
      }
      
      // 檢查是否已取消
      if (activeSync.cancel) {
        logger.info(`同步任務 ${syncId} 已取消，停止執行`);
        return;
      }
      
      // 處理客戶數據
      const customerResult = await this.processCustomers(customers, platformId, platformType);
      
      // 檢查是否已取消
      if (activeSync.cancel) {
        logger.info(`同步任務 ${syncId} 已取消，停止執行`);
        return;
      }
      
      // 處理消息數據
      const messageResult = await this.processMessages(messages, platformId, platformType);
      
      // 更新同步歷史記錄
      const endTime = new Date();
      const syncResult: SyncResult = {
        syncId,
        platformId,
        status: SyncStatus.SUCCESS,
        messageCount: messageResult.total,
        customerCount: customerResult.total,
        newMessages: messageResult.new,
        updatedMessages: messageResult.updated,
        newCustomers: customerResult.new,
        updatedCustomers: customerResult.updated,
        errors: []
      };
      
      await SyncHistory.update(
        {
          status: SyncStatus.SUCCESS,
          endTime,
          messageCount: syncResult.messageCount,
          customerCount: syncResult.customerCount,
          details: {
            newMessages: syncResult.newMessages,
            updatedMessages: syncResult.updatedMessages,
            newCustomers: syncResult.newCustomers,
            updatedCustomers: syncResult.updatedCustomers,
            errors: syncResult.errors
          }
        },
        { where: { id: syncId } }
      );
      
      // 更新平台最後同步時間
      await CustomerPlatform.update(
        { lastSyncTime: endTime },
        { where: { id: platformId } }
      );
      
      logger.info(`同步任務 ${syncId} 完成，處理了 ${syncResult.messageCount} 條消息和 ${syncResult.customerCount} 個客戶`);
    } catch (error: any) {
      logger.error(`同步任務 ${syncId} 執行錯誤:`, error);
      
      // 更新同步歷史記錄
      await SyncHistory.update(
        {
          status: SyncStatus.FAILED,
          endTime: new Date(),
          errorMessage: error.message,
          details: {
            errors: [{
              code: 'SYNC_ERROR',
              message: error.message,
              timestamp: new Date().toISOString(),
              data: error.stack
            }]
          }
        },
        { where: { id: syncId } }
      );
    } finally {
      // 從活動同步列表中移除
      this.activeSyncs.delete(syncId);
    }
  }
  
  /**
   * 處理客戶數據
   * @param customers 客戶數據
   * @param platformId 平台 ID
   * @param platformType 平台類型
   */
  private async processCustomers(customers: any[], platformId: string, platformType: PlatformType): Promise<{ total: number, new: number, updated: number }> {
    let newCount = 0;
    let updatedCount = 0;
    
    for (const customerData of customers) {
      try {
        // 查找現有客戶
        const platformCustomerId = customerData.id || customerData.userId || customerData.customerId;
        let customerPlatform = await CustomerPlatform.findOne({
          where: {
            platformId,
            platformType,
            platformCustomerId
          },
          include: [{ model: Customer, as: 'customer' }]
        });
        
        if (customerPlatform) {
          // 更新現有客戶
          const customer = customerPlatform.customer;
          
          if (customer) {
            await customer.update({
              name: customerData.name || customer.name,
              email: customerData.email || customer.email,
              phone: customerData.phone || customer.phone,
              metadata: {
                ...customer.metadata,
                ...customerData.metadata
              }
            });
          }
          
          updatedCount++;
        } else {
          // 創建新客戶
          const customer = await Customer.create({
            name: customerData.name || '未知客戶',
            email: customerData.email,
            phone: customerData.phone,
            status: 'active',
            metadata: customerData.metadata || {}
          });
          
          await CustomerPlatform.create({
            customerId: customer.id,
            platformId,
            platformType,
            platformCustomerId,
            platformData: customerData.metadata || {}
          });
          
          newCount++;
        }
      } catch (error) {
        logger.error(`處理客戶數據錯誤:`, error);
        // 繼續處理下一個客戶
      }
    }
    
    return {
      total: customers.length,
      new: newCount,
      updated: updatedCount
    };
  }
  
  /**
   * 處理消息數據
   * @param messages 消息數據
   * @param platformId 平台 ID
   * @param platformType 平台類型
   */
  private async processMessages(messages: any[], platformId: string, platformType: PlatformType): Promise<{ total: number, new: number, updated: number }> {
    let newCount = 0;
    let updatedCount = 0;
    
    for (const messageData of messages) {
      try {
        // 獲取客戶
        const platformCustomerId = messageData.customerId || messageData.userId || messageData.from;
        const customerPlatform = await CustomerPlatform.findOne({
          where: {
            platformId,
            platformType,
            platformCustomerId
          }
        });
        
        if (!customerPlatform) {
          logger.warn(`找不到客戶平台記錄: ${platformCustomerId}`);
          continue;
        }
        
        // 查找現有消息
        const platformMessageId = messageData.id || messageData.messageId;
        let message = await Message.findOne({
          where: {
            platformType,
            platformMessageId
          }
        });
        
        if (message) {
          // 更新現有消息
          await message.update({
            content: messageData.content || message.content,
            metadata: {
              ...message.metadata,
              ...messageData.metadata
            }
          });
          
          updatedCount++;
        } else {
          // 創建新消息
          await Message.create({
            customerId: customerPlatform.customerId,
            platformType,
            platformMessageId,
            direction: messageData.direction,
            messageType: messageData.type,
            content: messageData.content,
            metadata: messageData.metadata || {},
            isRead: messageData.isRead || false,
            readAt: messageData.readAt || null,
            createdAt: messageData.timestamp ? new Date(messageData.timestamp) : new Date()
          });
          
          newCount++;
        }
      } catch (error) {
        logger.error(`處理消息數據錯誤:`, error);
        // 繼續處理下一條消息
      }
    }
    
    return {
      total: messages.length,
      new: newCount,
      updated: updatedCount
    };
  }
}

export default new PlatformSyncService();