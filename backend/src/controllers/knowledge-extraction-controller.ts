import { Request, Response } from 'express';
import knowledgeExtractionService from '../services/knowledge-extraction-service';
import logger from '../utils/logger';

/**
 * 知識提取控制器
 * 處理知識提取相關的請求
 */
class KnowledgeExtractionController {
  /**
   * 從對話中提取知識
   * @param req 請求對象
   * @param res 響應對象
   */
  async extractFromConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權',
        });
        return;
      }
      
      // 獲取對話
      const conversation = req.body.conversation;
      
      if (!conversation) {
        res.status(400).json({
          success: false,
          message: '缺少對話數據',
        });
        return;
      }
      
      // 從對話中提取知識
      const extractionResults = await knowledgeExtractionService.extractKnowledgeFromConversation(conversation);
      
      // 保存提取的知識
      const savedIds = await knowledgeExtractionService.saveExtractedKnowledge(extractionResults, userId);
      
      res.status(200).json({
        success: true,
        data: {
          extractedCount: extractionResults.length,
          savedCount: savedIds.length,
          extractionResults,
          savedIds,
        },
      });
    } catch (error: any) {
      logger.error('從對話中提取知識錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '從對話中提取知識時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 從修改的 AI 回覆中提取知識
   * @param req 請求對象
   * @param res 響應對象
   */
  async extractFromModifiedResponse(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權',
        });
        return;
      }
      
      const { originalResponse, modifiedResponse, messageContext, conversationId } = req.body;
      
      if (!originalResponse || !modifiedResponse || !conversationId) {
        res.status(400).json({
          success: false,
          message: '缺少必要的數據',
        });
        return;
      }
      
      // 從修改的回覆中提取知識
      const extractionResults = await knowledgeExtractionService.extractKnowledgeFromModifiedResponse(
        originalResponse,
        modifiedResponse,
        messageContext || [],
        conversationId
      );
      
      // 保存提取的知識
      const savedIds = await knowledgeExtractionService.saveExtractedKnowledge(extractionResults, userId);
      
      res.status(200).json({
        success: true,
        data: {
          extractedCount: extractionResults.length,
          savedCount: savedIds.length,
          extractionResults,
          savedIds,
        },
      });
    } catch (error: any) {
      logger.error('從修改的 AI 回覆中提取知識錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '從修改的 AI 回覆中提取知識時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 批量處理對話，提取知識
   * @param req 請求對象
   * @param res 響應對象
   */
  async batchProcess(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權',
        });
        return;
      }
      
      const { conversations } = req.body;
      
      if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
        res.status(400).json({
          success: false,
          message: '缺少對話數據或數據格式不正確',
        });
        return;
      }
      
      // 批量處理對話，提取知識
      const result = await knowledgeExtractionService.batchProcessConversations(conversations, userId);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('批量處理對話提取知識錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '批量處理對話提取知識時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
}

export default new KnowledgeExtractionController();