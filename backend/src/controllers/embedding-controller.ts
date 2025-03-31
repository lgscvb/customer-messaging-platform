import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import KnowledgeItem from '../models/KnowledgeItem';
import { Message } from '../models/Message';
import embeddingService from '../services/embedding-service';
import logger from '../utils/logger';

/**
 * 嵌入向量控制器
 * 處理嵌入向量的生成和管理
 */
const embeddingController = {
  /**
   * 為知識項目生成嵌入向量
   * @param req 請求
   * @param res 響應
   */
  async generateEmbeddingForKnowledgeItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 獲取知識項目
      const knowledgeItem = await KnowledgeItem.findByPk(id);
      
      if (!knowledgeItem) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: `找不到知識項目 ${id}`,
        });
      }
      
      // 生成嵌入向量
      const embedding = await embeddingService.generateEmbeddingForKnowledgeItem(knowledgeItem);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          id: embedding.id,
          sourceId: embedding.sourceId,
          sourceType: embedding.sourceType,
          dimensions: embedding.dimensions,
          model: embedding.model,
          metadata: embedding.metadata,
        },
      });
    } catch (error) {
      logger.error('為知識項目生成嵌入向量錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '為知識項目生成嵌入向量時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 為消息生成嵌入向量
   * @param req 請求
   * @param res 響應
   */
  async generateEmbeddingForMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 獲取消息
      const message = await Message.findByPk(id);
      
      if (!message) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: `找不到消息 ${id}`,
        });
      }
      
      // 生成嵌入向量
      const embedding = await embeddingService.generateEmbeddingForMessage(message);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          id: embedding.id,
          sourceId: embedding.sourceId,
          sourceType: embedding.sourceType,
          dimensions: embedding.dimensions,
          model: embedding.model,
          metadata: embedding.metadata,
        },
      });
    } catch (error) {
      logger.error('為消息生成嵌入向量錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '為消息生成嵌入向量時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 為文本生成嵌入向量
   * @param req 請求
   * @param res 響應
   */
  async generateEmbeddingForText(req: Request, res: Response) {
    try {
      const { text, sourceId, metadata } = req.body;
      
      if (!text || !sourceId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '缺少必要參數',
        });
      }
      
      // 生成嵌入向量
      const embedding = await embeddingService.generateEmbeddingForText(text, sourceId, metadata || {});
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          id: embedding.id,
          sourceId: embedding.sourceId,
          sourceType: embedding.sourceType,
          dimensions: embedding.dimensions,
          model: embedding.model,
          metadata: embedding.metadata,
        },
      });
    } catch (error) {
      logger.error('為文本生成嵌入向量錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '為文本生成嵌入向量時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 搜索相似知識項目
   * @param req 請求
   * @param res 響應
   */
  async searchSimilarKnowledgeItems(req: Request, res: Response) {
    try {
      const { query, limit, threshold } = req.query;
      
      if (!query) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '缺少查詢參數',
        });
      }
      
      // 搜索相似知識項目
      const results = await embeddingService.searchSimilarKnowledgeItems(
        query as string,
        limit ? parseInt(limit as string, 10) : undefined,
        threshold ? parseFloat(threshold as string) : undefined
      );
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: results.map(result => ({
          knowledgeItem: {
            id: result.knowledgeItem.id,
            title: result.knowledgeItem.title,
            content: result.knowledgeItem.content,
            category: result.knowledgeItem.category,
            tags: result.knowledgeItem.tags,
          },
          similarity: result.similarity,
        })),
      });
    } catch (error) {
      logger.error('搜索相似知識項目錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '搜索相似知識項目時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 搜索相似消息
   * @param req 請求
   * @param res 響應
   */
  async searchSimilarMessages(req: Request, res: Response) {
    try {
      const { query, limit, threshold } = req.query;
      
      if (!query) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '缺少查詢參數',
        });
      }
      
      // 搜索相似消息
      const results = await embeddingService.searchSimilarMessages(
        query as string,
        limit ? parseInt(limit as string, 10) : undefined,
        threshold ? parseFloat(threshold as string) : undefined
      );
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: results.map(result => ({
          message: {
            id: result.message.id,
            content: result.message.content,
            customerId: result.message.customerId,
            direction: result.message.direction,
            platformType: result.message.platformType,
          },
          similarity: result.similarity,
        })),
      });
    } catch (error) {
      logger.error('搜索相似消息錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '搜索相似消息時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 批量處理知識項目，生成嵌入向量
   * @param req 請求
   * @param res 響應
   */
  async batchProcessKnowledgeItems(req: Request, res: Response) {
    try {
      const { knowledgeItemIds } = req.body;
      
      if (!knowledgeItemIds || !Array.isArray(knowledgeItemIds) || knowledgeItemIds.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '缺少知識項目 ID 列表',
        });
      }
      
      // 批量處理知識項目
      const result = await embeddingService.batchProcessKnowledgeItems(knowledgeItemIds);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('批量處理知識項目錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '批量處理知識項目時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
  
  /**
   * 重新生成所有知識項目的嵌入向量
   * @param req 請求
   * @param res 響應
   */
  async regenerateAllKnowledgeItemEmbeddings(req: Request, res: Response) {
    try {
      // 重新生成所有知識項目的嵌入向量
      const result = await embeddingService.regenerateAllKnowledgeItemEmbeddings();
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('重新生成所有知識項目的嵌入向量錯誤:', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '重新生成所有知識項目的嵌入向量時發生錯誤',
        error: (error as Error).message,
      });
    }
  },
};

export default embeddingController;