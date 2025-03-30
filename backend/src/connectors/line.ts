import axios from 'axios';
import { Client, ClientConfig, MessageAPIResponseBase, TextMessage } from '@line/bot-sdk';
import MessageModel, { MessagePlatform, MessageDirection, CreateMessageDTO } from '../models/Message';
import CustomerModel from '../models/Customer';
import CustomerPlatformModel from '../models/CustomerPlatform';

/**
 * LINE 平台連接器
 * 處理 LINE 平台的訊息收發
 */
class LineConnector {
  private client: Client;
  
  constructor() {
    const config: ClientConfig = {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    
    this.client = new Client(config);
  }
  
  /**
   * 處理 LINE Webhook 事件
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      const events = body.events;
      
      if (!events || events.length === 0) {
        return;
      }
      
      // 處理每個事件
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          await this.handleTextMessage(event);
        }
      }
    } catch (error) {
      console.error('處理 LINE Webhook 錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 處理文字訊息
   */
  private async handleTextMessage(event: any): Promise<void> {
    try {
      const { replyToken, source, message } = event;
      const userId = source.userId;
      const text = message.text;
      
      // 查找或創建客戶
      const customer = await this.findOrCreateCustomer(userId);
      
      // 創建訊息記錄
      const messageData: CreateMessageDTO = {
        customerId: customer.id,
        platform: MessagePlatform.LINE,
        direction: MessageDirection.INBOUND,
        content: text,
        contentType: 'text',
      };
      
      await MessageModel.create(messageData);
      
      // 更新客戶最後互動時間
      await CustomerModel.updateLastInteraction(customer.id);
      
      // 這裡可以添加自動回覆邏輯
      // 例如，使用 AI 服務生成回覆
      
      // 暫時使用簡單的回覆
      await this.replyMessage(replyToken, `收到您的訊息：${text}`);
    } catch (error) {
      console.error('處理文字訊息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 查找或創建客戶
   * 使用新的 CustomerPlatformModel 實現，確保操作的原子性
   */
  private async findOrCreateCustomer(lineUserId: string): Promise<{ id: string }> {
    try {
      // 查詢客戶平台關聯
      const platformInfo = await CustomerPlatformModel.findByPlatformId('line', lineUserId);
      
      // 如果已存在關聯，直接返回客戶ID
      if (platformInfo) {
        return { id: platformInfo.customerId };
      }
      
      // 獲取 LINE 用戶資料
      const lineProfile = await this.client.getProfile(lineUserId);
      
      // 創建新客戶
      const newCustomer = await CustomerModel.create({
        name: lineProfile.displayName,
      });
      
      // 創建客戶平台關聯
      await CustomerPlatformModel.create({
        customerId: newCustomer.id,
        platform: 'line',
        platformId: lineUserId,
        displayName: lineProfile.displayName,
        profileImage: lineProfile.pictureUrl,
      });
      
      return { id: newCustomer.id };
    } catch (error) {
      console.error('查找或創建客戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 回覆訊息
   */
  async replyMessage(replyToken: string, text: string): Promise<MessageAPIResponseBase> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: text,
      };
      
      return await this.client.replyMessage(replyToken, message);
    } catch (error) {
      console.error('回覆訊息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 發送訊息
   */
  async sendMessage(lineUserId: string, text: string): Promise<MessageAPIResponseBase> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: text,
      };
      
      return await this.client.pushMessage(lineUserId, message);
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      throw error;
    }
  }
}

export default new LineConnector();