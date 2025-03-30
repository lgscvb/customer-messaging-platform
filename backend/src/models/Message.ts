import pool from '../config/database';
import { QueryResult } from 'pg';

export enum MessagePlatform {
  LINE = 'line',
  WEBSITE = 'website',
  META = 'meta',
  SHOPEE = 'shopee',
}

export enum MessageDirection {
  INBOUND = 'inbound',   // 客戶發送的訊息
  OUTBOUND = 'outbound', // 客服發送的訊息
}

export enum MessageStatus {
  PENDING = 'pending',   // 等待處理
  READ = 'read',         // 已讀
  REPLIED = 'replied',   // 已回覆
  ARCHIVED = 'archived', // 已歸檔
}

export interface Message {
  id: string;
  customerId: string;
  platform: MessagePlatform;
  direction: MessageDirection;
  content: string;
  contentType: string;
  status: MessageStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  customerId: string;
  platform: MessagePlatform;
  direction: MessageDirection;
  content: string;
  contentType: string;
  status?: MessageStatus;
  metadata?: Record<string, any>;
}

class MessageModel {
  /**
   * 創建訊息
   */
  async create(message: CreateMessageDTO): Promise<Message> {
    const { customerId, platform, direction, content, contentType, status = MessageStatus.PENDING, metadata = {} } = message;
    
    const query = `
      INSERT INTO messages (
        customer_id, platform, direction, content, content_type, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [customerId, platform, direction, content, contentType, status, metadata];
    
    try {
      const result: QueryResult = await pool.query(query, values);
      return this.mapToMessage(result.rows[0]);
    } catch (error) {
      console.error('創建訊息錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據ID查詢訊息
   */
  async findById(id: string): Promise<Message | null> {
    const query = 'SELECT * FROM messages WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToMessage(result.rows[0]);
    } catch (error) {
      console.error('查詢訊息錯誤:', error);
      throw error;
    }
  }

  /**
   * 查詢客戶的訊息
   */
  async findByCustomerId(customerId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [customerId, limit, offset]);
      return result.rows.map(row => this.mapToMessage(row));
    } catch (error) {
      console.error('查詢客戶訊息錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新訊息狀態
   */
  async updateStatus(id: string, status: MessageStatus): Promise<Message | null> {
    const query = `
      UPDATE messages 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToMessage(result.rows[0]);
    } catch (error) {
      console.error('更新訊息狀態錯誤:', error);
      throw error;
    }
  }

  /**
   * 將資料庫行映射到訊息對象
   */
  private mapToMessage(row: any): Message {
    return {
      id: row.id,
      customerId: row.customer_id,
      platform: row.platform,
      direction: row.direction,
      content: row.content,
      contentType: row.content_type,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new MessageModel();