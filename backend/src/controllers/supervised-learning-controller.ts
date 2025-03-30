import { Request, Response } from 'express';
import supervisedLearningService from '../services/supervised-learning-service';
import logger from '../utils/logger';

/**
 * 監督式學習控制器
 * 處理監督式學習相關的 API 請求
 */
class SupervisedLearningController {
  /**
   * 從人工修改的回覆中學習
   * @route POST /api/supervised-learning/learn
   */
  async learnFromHumanCorrection(req: Request, res: Response): Promise<void> {
    try {
      const { aiMessageId, humanMessageId } = req.body;
      
      // 驗證參數
      if (!aiMessageId || !humanMessageId) {
        res.status(400).json({ 
          success: false, 
          message: 'AI 回覆消息 ID 和人工修改的回覆消息 ID 為必填項' 
        });
        return;
      }
      
      // 從人工修改的回覆中學習
      const result = await supervisedLearningService.learnFromHumanCorrection(
        aiMessageId,
        humanMessageId
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('從人工修改的回覆中學習錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: '從人工修改的回覆中學習時發生錯誤' 
        });
      }
    }
  }
  
  /**
   * 批量處理學習樣本
   * @route POST /api/supervised-learning/batch-learn
   */
  async batchLearn(req: Request, res: Response): Promise<void> {
    try {
      const { samples } = req.body;
      
      // 驗證參數
      if (!samples || !Array.isArray(samples) || samples.length === 0) {
        res.status(400).json({ 
          success: false, 
          message: '樣本數組為必填項且不能為空' 
        });
        return;
      }
      
      // 驗證每個樣本
      for (const sample of samples) {
        if (!sample.aiMessageId || !sample.humanMessageId) {
          res.status(400).json({ 
            success: false, 
            message: '每個樣本必須包含 aiMessageId 和 humanMessageId' 
          });
          return;
        }
      }
      
      // 批量處理學習樣本
      const result = await supervisedLearningService.batchLearn(samples);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('批量處理學習樣本錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: '批量處理學習樣本時發生錯誤' 
        });
      }
    }
  }
  
  /**
   * 獲取學習統計信息
   * @route GET /api/supervised-learning/stats
   */
  async getLearningStats(req: Request, res: Response): Promise<void> {
    try {
      // 獲取學習統計信息
      const stats = await supervisedLearningService.getLearningStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('獲取學習統計信息錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: '獲取學習統計信息時發生錯誤' 
        });
      }
    }
  }
}

export default new SupervisedLearningController();