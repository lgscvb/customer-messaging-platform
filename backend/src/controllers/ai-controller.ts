import { Request, Response } from 'express';
import aiService, { AIReplyOptions, KnowledgeSearchOptions } from '../services/ai-service';
import messageService from '../services/message-service';
import { MessageDirection, MessageType, PlatformType } from '../types/platform';
import logger from '../utils/logger';

/**
 * AI 控制器
 * 處理 AI 相關的 API 請求
 */
class AIController {
  /**
   * 生成 AI 回覆
   * @route POST /api/ai/reply
   */
  async generateReply(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        messageId,
        query,
        maxResults,
        temperature,
        maxTokens,
      } = req.body;
      
      // 驗證參數
      if (!customerId || !messageId || !query) {
        res.status(400).json({ message: '客戶 ID、消息 ID 和查詢為必填項' });
        return;
      }
      
      // 生成 AI 回覆
      const options: AIReplyOptions = {
        customerId,
        messageId,
        query,
        maxResults,
        temperature,
        maxTokens,
      };
      
      const reply = await aiService.generateReply(options);
      
      res.status(200).json(reply);
    } catch (error) {
      logger.error('生成 AI 回覆錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '生成 AI 回覆時發生錯誤' });
      }
    }
  }
  
  /**
   * 發送 AI 回覆
   * @route POST /api/ai/send-reply
   */
  async sendReply(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        platformType,
        query,
        reply,
        sources,
      } = req.body;
      
      // 驗證參數
      if (!customerId || !platformType || !query || !reply) {
        res.status(400).json({ message: '客戶 ID、平台類型、查詢和回覆為必填項' });
        return;
      }
      
      // 獲取客戶平台 ID
      const platformId = await messageService.getCustomerPlatformId(customerId, platformType);
      
      if (!platformId) {
        res.status(404).json({ message: '找不到客戶的平台 ID' });
        return;
      }
      
      // 發送消息
      const message = await messageService.sendMessage({
        customerId,
        platformType,
        platformId,
        messageType: MessageType.TEXT,
        content: reply,
        metadata: {
          aiGenerated: true,
          query,
          sources,
        },
      });
      
      res.status(201).json(message);
    } catch (error) {
      logger.error('發送 AI 回覆錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '發送 AI 回覆時發生錯誤' });
      }
    }
  }
  
  /**
   * 搜索知識庫
   * @route GET /api/ai/knowledge-search
   */
  async searchKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        maxResults,
        categories,
        tags,
      } = req.query;
      
      // 驗證參數
      if (!query) {
        res.status(400).json({ message: '查詢為必填項' });
        return;
      }
      
      // 構建搜索選項
      const options: KnowledgeSearchOptions = {
        query: query as string,
      };
      
      if (maxResults) {
        options.maxResults = parseInt(maxResults as string, 10);
      }
      
      if (categories) {
        options.categories = Array.isArray(categories)
          ? categories as string[]
          : [categories as string];
      }
      
      if (tags) {
        options.tags = Array.isArray(tags)
          ? tags as string[]
          : [tags as string];
      }
      
      // 搜索知識庫
      const knowledgeItems = await aiService.searchKnowledge(options);
      
      res.status(200).json(knowledgeItems);
    } catch (error) {
      logger.error('搜索知識庫錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '搜索知識庫時發生錯誤' });
      }
    }
  }
  
  /**
   * 評估回覆品質
   * @route POST /api/ai/evaluate-reply
   */
  async evaluateReply(req: Request, res: Response): Promise<void> {
    try {
      const {
        aiReply,
        humanReply,
      } = req.body;
      
      // 驗證參數
      if (!aiReply || !humanReply) {
        res.status(400).json({ message: 'AI 回覆和人工回覆為必填項' });
        return;
      }
      
      // 評估回覆品質
      const similarity = await aiService.evaluateReply(aiReply, humanReply);
      
      res.status(200).json({ similarity });
    } catch (error) {
      logger.error('評估回覆品質錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '評估回覆品質時發生錯誤' });
      }
    }
  }
}

export default new AIController();