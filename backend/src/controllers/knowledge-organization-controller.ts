import { Request, Response } from 'express';
import knowledgeOrganizationService from '../services/knowledge-organization-service';
import logger from '../utils/logger';

/**
 * 知識組織控制器
 * 處理知識組織相關的請求
 */
class KnowledgeOrganizationController {
  /**
   * 組織知識項目
   * @param req 請求對象
   * @param res 響應對象
   */
  async organizeKnowledgeItem(req: Request, res: Response): Promise<void> {
    try {
      const { knowledgeItemId } = req.params;
      
      if (!knowledgeItemId) {
        res.status(400).json({
          success: false,
          message: '缺少知識項目 ID',
        });
        return;
      }
      
      // 組織知識項目
      const organizationResult = await knowledgeOrganizationService.organizeKnowledgeItem(knowledgeItemId);
      
      if (!organizationResult) {
        res.status(404).json({
          success: false,
          message: '找不到知識項目',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: organizationResult,
      });
    } catch (error: any) {
      logger.error('組織知識項目錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '組織知識項目時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 應用組織結果
   * @param req 請求對象
   * @param res 響應對象
   */
  async applyOrganizationResult(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權',
        });
        return;
      }
      
      const { organizationResult, applyCategories, applyTags, applyRelations } = req.body;
      
      if (!organizationResult) {
        res.status(400).json({
          success: false,
          message: '缺少組織結果數據',
        });
        return;
      }
      
      // 應用組織結果
      const success = await knowledgeOrganizationService.applyOrganizationResult(
        organizationResult,
        userId,
        applyCategories,
        applyTags,
        applyRelations
      );
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: '找不到知識項目',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: '成功應用組織結果',
      });
    } catch (error: any) {
      logger.error('應用組織結果錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '應用組織結果時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 批量組織知識項目
   * @param req 請求對象
   * @param res 響應對象
   */
  async batchOrganizeKnowledgeItems(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權',
        });
        return;
      }
      
      const { knowledgeItemIds, autoApply } = req.body;
      
      if (!knowledgeItemIds || !Array.isArray(knowledgeItemIds) || knowledgeItemIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '缺少知識項目 ID 或數據格式不正確',
        });
        return;
      }
      
      // 批量組織知識項目
      const result = await knowledgeOrganizationService.batchOrganizeKnowledgeItems(
        knowledgeItemIds,
        userId,
        autoApply
      );
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('批量組織知識項目錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '批量組織知識項目時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 生成知識圖譜
   * @param req 請求對象
   * @param res 響應對象
   */
  async generateKnowledgeGraph(req: Request, res: Response): Promise<void> {
    try {
      // 生成知識圖譜
      const graph = await knowledgeOrganizationService.generateKnowledgeGraph();
      
      res.status(200).json({
        success: true,
        data: graph,
      });
    } catch (error: any) {
      logger.error('生成知識圖譜錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '生成知識圖譜時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
  
  /**
   * 分析知識庫結構
   * @param req 請求對象
   * @param res 響應對象
   */
  async analyzeKnowledgeStructure(req: Request, res: Response): Promise<void> {
    try {
      // 分析知識庫結構
      const analysis = await knowledgeOrganizationService.analyzeKnowledgeStructure();
      
      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      logger.error('分析知識庫結構錯誤:', error);
      
      res.status(500).json({
        success: false,
        message: '分析知識庫結構時發生錯誤',
        error: error.message || '未知錯誤',
      });
    }
  }
}

export default new KnowledgeOrganizationController();