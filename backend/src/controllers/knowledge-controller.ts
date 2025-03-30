import { Request, Response } from 'express';
import knowledgeService, { KnowledgeSearchOptions } from '../services/knowledge-service';
import { CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO } from '../models/KnowledgeItem';
import logger from '../utils/logger';

/**
 * 知識庫控制器
 * 處理知識庫相關的 API 請求
 */
class KnowledgeController {
  /**
   * 創建知識項目
   * @route POST /api/knowledge
   */
  async createKnowledgeItem(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateKnowledgeItemDTO = req.body;
      const userId = req.user?.id;
      
      // 驗證參數
      if (!data.title || !data.content || !data.category || !data.source) {
        res.status(400).json({ message: '標題、內容、分類和來源為必填項' });
        return;
      }
      
      if (!userId) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 創建知識項目
      const knowledgeItem = await knowledgeService.createKnowledgeItem(data, userId);
      
      res.status(201).json(knowledgeItem);
    } catch (error) {
      logger.error('創建知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '創建知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取知識項目
   * @route GET /api/knowledge/:id
   */
  async getKnowledgeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 驗證參數
      if (!id) {
        res.status(400).json({ message: '知識項目 ID 為必填項' });
        return;
      }
      
      // 獲取知識項目
      const knowledgeItem = await knowledgeService.getKnowledgeItem(id);
      
      if (!knowledgeItem) {
        res.status(404).json({ message: '找不到知識項目' });
        return;
      }
      
      res.status(200).json(knowledgeItem);
    } catch (error) {
      logger.error('獲取知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 更新知識項目
   * @route PUT /api/knowledge/:id
   */
  async updateKnowledgeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateKnowledgeItemDTO = req.body;
      const userId = req.user?.id;
      
      // 驗證參數
      if (!id) {
        res.status(400).json({ message: '知識項目 ID 為必填項' });
        return;
      }
      
      if (!userId) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 更新知識項目
      const knowledgeItem = await knowledgeService.updateKnowledgeItem(id, data, userId);
      
      if (!knowledgeItem) {
        res.status(404).json({ message: '找不到知識項目' });
        return;
      }
      
      res.status(200).json(knowledgeItem);
    } catch (error) {
      logger.error('更新知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '更新知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 刪除知識項目
   * @route DELETE /api/knowledge/:id
   */
  async deleteKnowledgeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 驗證參數
      if (!id) {
        res.status(400).json({ message: '知識項目 ID 為必填項' });
        return;
      }
      
      // 刪除知識項目
      const success = await knowledgeService.deleteKnowledgeItem(id);
      
      if (!success) {
        res.status(404).json({ message: '找不到知識項目' });
        return;
      }
      
      res.status(200).json({ message: '知識項目已刪除' });
    } catch (error) {
      logger.error('刪除知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '刪除知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 搜索知識項目
   * @route GET /api/knowledge/search
   */
  async searchKnowledgeItems(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        category,
        tags,
        source,
        createdBy,
        isPublished,
        limit,
        offset,
      } = req.query;
      
      // 構建搜索選項
      const options: KnowledgeSearchOptions = {};
      
      if (query) {
        options.query = query as string;
      }
      
      if (category) {
        options.category = category as string;
      }
      
      if (tags) {
        options.tags = Array.isArray(tags)
          ? tags as string[]
          : [tags as string];
      }
      
      if (source) {
        options.source = source as string;
      }
      
      if (createdBy) {
        options.createdBy = createdBy as string;
      }
      
      if (isPublished !== undefined) {
        options.isPublished = isPublished === 'true';
      }
      
      if (limit) {
        options.limit = parseInt(limit as string, 10);
      }
      
      if (offset) {
        options.offset = parseInt(offset as string, 10);
      }
      
      // 搜索知識項目
      const knowledgeItems = await knowledgeService.searchKnowledgeItems(options);
      
      res.status(200).json(knowledgeItems);
    } catch (error) {
      logger.error('搜索知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '搜索知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取知識項目分類列表
   * @route GET /api/knowledge/categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // 獲取分類列表
      const categories = await knowledgeService.getCategories();
      
      res.status(200).json(categories);
    } catch (error) {
      logger.error('獲取知識項目分類列表錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取知識項目分類列表時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取知識項目標籤列表
   * @route GET /api/knowledge/tags
   */
  async getTags(req: Request, res: Response): Promise<void> {
    try {
      // 獲取標籤列表
      const tags = await knowledgeService.getTags();
      
      res.status(200).json(tags);
    } catch (error) {
      logger.error('獲取知識項目標籤列表錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取知識項目標籤列表時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取知識項目來源列表
   * @route GET /api/knowledge/sources
   */
  async getSources(req: Request, res: Response): Promise<void> {
    try {
      // 獲取來源列表
      const sources = await knowledgeService.getSources();
      
      res.status(200).json(sources);
    } catch (error) {
      logger.error('獲取知識項目來源列表錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取知識項目來源列表時發生錯誤' });
      }
    }
  }
  
  /**
   * 批量導入知識項目
   * @route POST /api/knowledge/bulk-import
   */
  async bulkImport(req: Request, res: Response): Promise<void> {
    try {
      const items: CreateKnowledgeItemDTO[] = req.body.items;
      const userId = req.user?.id;
      
      // 驗證參數
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: '知識項目列表為必填項' });
        return;
      }
      
      if (!userId) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 批量導入知識項目
      const knowledgeItems = await knowledgeService.bulkImport(items, userId);
      
      res.status(201).json({
        message: `已導入 ${knowledgeItems.length} 個知識項目`,
        items: knowledgeItems,
      });
    } catch (error) {
      logger.error('批量導入知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '批量導入知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 批量更新知識項目
   * @route PUT /api/knowledge/bulk-update
   */
  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const items: { id: string; data: UpdateKnowledgeItemDTO }[] = req.body.items;
      const userId = req.user?.id;
      
      // 驗證參數
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: '知識項目列表為必填項' });
        return;
      }
      
      if (!userId) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 批量更新知識項目
      const updatedCount = await knowledgeService.bulkUpdate(items, userId);
      
      res.status(200).json({
        message: `已更新 ${updatedCount} 個知識項目`,
        count: updatedCount,
      });
    } catch (error) {
      logger.error('批量更新知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '批量更新知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 批量刪除知識項目
   * @route DELETE /api/knowledge/bulk-delete
   */
  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const ids: string[] = req.body.ids;
      
      // 驗證參數
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: '知識項目 ID 列表為必填項' });
        return;
      }
      
      // 批量刪除知識項目
      const deletedCount = await knowledgeService.bulkDelete(ids);
      
      res.status(200).json({
        message: `已刪除 ${deletedCount} 個知識項目`,
        count: deletedCount,
      });
    } catch (error) {
      logger.error('批量刪除知識項目錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '批量刪除知識項目時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取知識項目統計信息
   * @route GET /api/knowledge/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      // 獲取統計信息
      const statistics = await knowledgeService.getStatistics();
      
      res.status(200).json(statistics);
    } catch (error) {
      logger.error('獲取知識項目統計信息錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取知識項目統計信息時發生錯誤' });
      }
    }
  }
}

export default new KnowledgeController();