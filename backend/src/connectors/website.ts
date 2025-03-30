import MessageModel, { MessagePlatform, MessageDirection, CreateMessageDTO } from '../models/Message';
import CustomerModel from '../models/Customer';
import CustomerPlatformModel from '../models/CustomerPlatform';

/**
 * 官網平台連接器
 * 處理官網客服系統的訊息收發
 */
class WebsiteConnector {
  /**
   * 處理來自官網的訊息
   */
  async handleIncomingMessage(data: {
    sessionId: string;
    visitorId: string;
    name: string;
    email?: string;
    message: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { sessionId, visitorId, name, email, message, timestamp, metadata } = data;
      
      // 查找或創建客戶
      const customer = await this.findOrCreateCustomer(visitorId, name, email);
      
      // 創建訊息記錄
      const messageData: CreateMessageDTO = {
        customerId: customer.id,
        platform: MessagePlatform.WEBSITE,
        direction: MessageDirection.INBOUND,
        content: message,
        contentType: 'text',
        metadata: {
          sessionId,
          timestamp,
          ...metadata,
        },
      };
      
      const newMessage = await MessageModel.create(messageData);
      
      // 更新客戶最後互動時間
      await CustomerModel.updateLastInteraction(customer.id);
      
      return {
        success: true,
        messageId: newMessage.id,
      };
    } catch (error) {
      console.error('處理官網訊息錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }
  
  /**
   * 發送訊息到官網客服系統
   */
  async sendMessage(data: {
    sessionId: string;
    visitorId: string;
    customerId: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { sessionId, visitorId, customerId, message, metadata } = data;
      
      // 創建訊息記錄
      const messageData: CreateMessageDTO = {
        customerId,
        platform: MessagePlatform.WEBSITE,
        direction: MessageDirection.OUTBOUND,
        content: message,
        contentType: 'text',
        metadata: {
          sessionId,
          visitorId,
          timestamp: Date.now(),
          ...metadata,
        },
      };
      
      const newMessage = await MessageModel.create(messageData);
      
      // 這裡可以添加實際發送訊息到官網客服系統的邏輯
      // 例如，使用 WebSocket 或 API 調用
      
      // 模擬發送成功
      console.log(`訊息已發送到官網客服系統: ${message}`);
      
      return {
        success: true,
        messageId: newMessage.id,
      };
    } catch (error) {
      console.error('發送官網訊息錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }
  
  /**
   * 查找或創建客戶
   * 使用新的 CustomerPlatformModel 實現，確保操作的原子性
   */
  private async findOrCreateCustomer(
    visitorId: string,
    name: string,
    email?: string
  ): Promise<{ id: string }> {
    try {
      // 查詢客戶平台關聯
      const platformInfo = await CustomerPlatformModel.findByPlatformId('website', visitorId);
      
      // 如果已存在關聯，直接返回客戶ID
      if (platformInfo) {
        return { id: platformInfo.customerId };
      }
      
      // 創建新客戶
      const newCustomer = await CustomerModel.create({
        name,
        email,
      });
      
      // 創建客戶平台關聯
      await CustomerPlatformModel.create({
        customerId: newCustomer.id,
        platform: 'website',
        platformId: visitorId,
        displayName: name,
        metadata: {
          source: 'website',
        },
      });
      
      return { id: newCustomer.id };
    } catch (error) {
      console.error('查找或創建客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 結束對話
   */
  async endConversation(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 這裡可以添加結束對話的邏輯
      // 例如，更新對話狀態、發送結束通知等
      
      console.log(`對話已結束: ${sessionId}`);
      
      return { success: true };
    } catch (error) {
      console.error('結束對話錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }
}

export default new WebsiteConnector();