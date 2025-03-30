import { Request, Response } from 'express';
import messageService, { MessageFilterOptions, MessageSendOptions } from '../services/message-service';
import { PlatformType, MessageType } from '../types/platform';
import logger from '../utils/logger';

/**
 * 消息控制器
 * 處理消息相關的 API 請求
 */
class MessageController {
  /**
   * 獲取消息列表
   * @route GET /api/messages
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        platformType,
        direction,
        startDate,
        endDate,
        isRead,
        limit,
        offset,
      } = req.query;
      
      // 構建過濾選項
      const options: MessageFilterOptions = {};
      
      if (customerId) {
        options.customerId = customerId as string;
      }
      
      if (platformType) {
        options.platformType = platformType as PlatformType;
      }
      
      if (direction) {
        options.direction = direction as any;
      }
      
      if (startDate) {
        options.startDate = new Date(startDate as string);
      }
      
      if (endDate) {
        options.endDate = new Date(endDate as string);
      }
      
      if (isRead !== undefined) {
        options.isRead = isRead === 'true';
      }
      
      if (limit) {
        options.limit = parseInt(limit as string, 10);
      }
      
      if (offset) {
        options.offset = parseInt(offset as string, 10);
      }
      
      // 獲取消息列表
      const messages = await messageService.getMessages(options);
      
      res.status(200).json(messages);
    } catch (error) {
      logger.error('獲取消息列表錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取消息列表時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取客戶對話
   * @route GET /api/messages/conversation/:customerId
   */
  async getCustomerConversation(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { limit, offset } = req.query;
      
      // 驗證參數
      if (!customerId) {
        res.status(400).json({ message: '客戶 ID 為必填項' });
        return;
      }
      
      // 獲取客戶對話
      const messages = await messageService.getCustomerConversation(
        customerId,
        limit ? parseInt(limit as string, 10) : undefined,
        offset ? parseInt(offset as string, 10) : undefined
      );
      
      res.status(200).json(messages);
    } catch (error) {
      logger.error('獲取客戶對話錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取客戶對話時發生錯誤' });
      }
    }
  }
  
  /**
   * 發送消息
   * @route POST /api/messages/send
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        platformType,
        messageType,
        content,
        metadata,
      } = req.body;
      
      // 驗證參數
      if (!customerId || !platformType || !messageType || !content) {
        res.status(400).json({ message: '客戶 ID、平台類型、消息類型和內容為必填項' });
        return;
      }
      
      // 獲取客戶平台 ID
      const platformId = await messageService.getCustomerPlatformId(customerId, platformType);
      
      if (!platformId) {
        res.status(404).json({ message: '找不到客戶的平台 ID' });
        return;
      }
      
      // 發送消息
      const options: MessageSendOptions = {
        customerId,
        platformType,
        platformId,
        messageType,
        content,
        metadata,
      };
      
      const message = await messageService.sendMessage(options);
      
      res.status(201).json(message);
    } catch (error) {
      logger.error('發送消息錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '發送消息時發生錯誤' });
      }
    }
  }
  
  /**
   * 標記消息為已讀
   * @route PUT /api/messages/:messageId/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      
      // 驗證參數
      if (!messageId) {
        res.status(400).json({ message: '消息 ID 為必填項' });
        return;
      }
      
      // 標記消息為已讀
      const success = await messageService.markAsRead(messageId);
      
      if (success) {
        res.status(200).json({ message: '消息已標記為已讀' });
      } else {
        res.status(404).json({ message: '找不到消息或消息已標記為已讀' });
      }
    } catch (error) {
      logger.error('標記消息為已讀錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '標記消息為已讀時發生錯誤' });
      }
    }
  }
  
  /**
   * 標記客戶所有消息為已讀
   * @route PUT /api/messages/customer/:customerId/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      
      // 驗證參數
      if (!customerId) {
        res.status(400).json({ message: '客戶 ID 為必填項' });
        return;
      }
      
      // 標記客戶所有消息為已讀
      const count = await messageService.markAllAsRead(customerId);
      
      res.status(200).json({ message: `已標記 ${count} 條消息為已讀` });
    } catch (error) {
      logger.error('標記客戶所有消息為已讀錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '標記客戶所有消息為已讀時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取未讀消息數量
   * @route GET /api/messages/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.query;
      
      // 獲取未讀消息數量
      const count = await messageService.getUnreadCount(customerId as string);
      
      res.status(200).json({ count });
    } catch (error) {
      logger.error('獲取未讀消息數量錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取未讀消息數量時發生錯誤' });
      }
    }
  }
  
  /**
   * 刪除消息
   * @route DELETE /api/messages/:messageId
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      
      // 驗證參數
      if (!messageId) {
        res.status(400).json({ message: '消息 ID 為必填項' });
        return;
      }
      
      // 刪除消息
      const success = await messageService.deleteMessage(messageId);
      
      if (success) {
        res.status(200).json({ message: '消息已刪除' });
      } else {
        res.status(404).json({ message: '找不到消息' });
      }
    } catch (error) {
      logger.error('刪除消息錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '刪除消息時發生錯誤' });
      }
    }
  }
}

export default new MessageController();