import KnowledgeItem, { KnowledgeItemAttributes, CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO, KnowledgeItemExtension } from '../models/KnowledgeItem';
import { Op } from 'sequelize';
import logger from '../utils/logger';

/**
 * 知識項目搜索選項
 */
export interface KnowledgeSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  source?: string;
  createdBy?: string;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 知識庫管理服務
 * 處理知識項目的 CRUD 操作、知識分類和標籤功能、知識搜索和檢索功能
 */
class KnowledgeService {
  /**
   * 創建知識項目
   * @param data 知識項目數據
   * @param userId 用戶 ID
   */
  async createKnowledgeItem(data: CreateKnowledgeItemDTO, userId: string): Promise<KnowledgeItem> {
    try {
      // 創建知識項目
      const knowledgeItem = await KnowledgeItem.create({
        ...data,
        createdBy: userId,
        updatedBy: userId,
        isPublished: data.isPublished !== undefined ? data.isPublished : false,
        tags: data.tags || [],
        metadata: data.metadata || {},
      });
      
      logger.info(`已創建知識項目 ${knowledgeItem.id}`);
      
      return knowledgeItem;
    } catch (error) {
      logger.error('創建知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取知識項目
   * @param id 知識項目 ID
   */
  async getKnowledgeItem(id: string): Promise<KnowledgeItem | null> {
    try {
      // 獲取知識項目
      const knowledgeItem = await KnowledgeItemExtension.findById(id);
      
      return knowledgeItem;
    } catch (error) {
      logger.error('獲取知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更新知識項目
   * @param id 知識項目 ID
   * @param data 更新數據
   * @param userId 用戶 ID
   */
  async updateKnowledgeItem(id: string, data: UpdateKnowledgeItemDTO, userId: string): Promise<KnowledgeItem | null> {
    try {
      // 獲取知識項目
      const knowledgeItem = await this.getKnowledgeItem(id);
      
      if (!knowledgeItem) {
        return null;
      }
      
      // 更新知識項目
      const updatedData = {
        ...data,
        updatedBy: userId,
      };
      
      await knowledgeItem.update(updatedData);
      
      logger.info(`已更新知識項目 ${id}`);
      
      return knowledgeItem;
    } catch (error) {
      logger.error('更新知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 刪除知識項目
   * @param id 知識項目 ID
   */
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    try {
      // 刪除知識項目
      const result = await KnowledgeItemExtension.delete(id);
      
      if (result) {
        logger.info(`已刪除知識項目 ${id}`);
      }
      
      return result;
    } catch (error) {
      logger.error('刪除知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 搜索知識項目
   * @param options 搜索選項
   */
  async searchKnowledgeItems(options: KnowledgeSearchOptions = {}): Promise<KnowledgeItem[]> {
    try {
      const {
        query,
        category,
        tags,
        source,
        createdBy,
        isPublished,
        limit = 50,
        offset = 0,
      } = options;
      
      // 構建查詢條件
      const where: any = {};
      
      if (query) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
        ];
      }
      
      if (category) {
        where.category = category;
      }
      
      if (tags && tags.length > 0) {
        where.tags = { [Op.overlap]: tags };
      }
      
      if (source) {
        where.source = source;
      }
      
      if (createdBy) {
        where.createdBy = createdBy;
      }
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      // 查詢知識項目
      const knowledgeItems = await KnowledgeItem.findAll({
        where,
        limit,
        offset,
        order: [['updatedAt', 'DESC']],
      });
      
      return knowledgeItems;
    } catch (error) {
      logger.error('搜索知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取知識項目分類列表
   */
  async getCategories(): Promise<string[]> {
    try {
      // 查詢所有分類
      const categories = await KnowledgeItem.findAll({
        attributes: ['category'],
        group: ['category'],
        raw: true,
      });
      
      return categories.map((item: any) => item.category);
    } catch (error) {
      logger.error('獲取知識項目分類列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取知識項目標籤列表
   */
  async getTags(): Promise<string[]> {
    try {
      // 查詢所有標籤
      const items = await KnowledgeItem.findAll({
        attributes: ['tags'],
        raw: true,
      });
      
      // 提取所有標籤
      const tagsSet = new Set<string>();
      
      items.forEach((item: any) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            tagsSet.add(tag);
          });
        }
      });
      
      return Array.from(tagsSet);
    } catch (error) {
      logger.error('獲取知識項目標籤列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取知識項目來源列表
   */
  async getSources(): Promise<string[]> {
    try {
      // 查詢所有來源
      const sources = await KnowledgeItem.findAll({
        attributes: ['source'],
        group: ['source'],
        raw: true,
      });
      
      return sources.map((item: any) => item.source);
    } catch (error) {
      logger.error('獲取知識項目來源列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量導入知識項目
   * @param items 知識項目列表
   * @param userId 用戶 ID
   */
  async bulkImport(items: CreateKnowledgeItemDTO[], userId: string): Promise<KnowledgeItem[]> {
    try {
      // 準備導入數據
      const importData = items.map(item => ({
        ...item,
        createdBy: userId,
        updatedBy: userId,
        isPublished: item.isPublished !== undefined ? item.isPublished : false,
        tags: item.tags || [],
        metadata: item.metadata || {},
      }));
      
      // 批量創建知識項目
      const knowledgeItems = await KnowledgeItem.bulkCreate(importData);
      
      logger.info(`已批量導入 ${knowledgeItems.length} 個知識項目`);
      
      return knowledgeItems;
    } catch (error) {
      logger.error('批量導入知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量更新知識項目
   * @param items 知識項目列表
   * @param userId 用戶 ID
   */
  async bulkUpdate(items: { id: string; data: UpdateKnowledgeItemDTO }[], userId: string): Promise<number> {
    try {
      let updatedCount = 0;
      
      // 逐個更新知識項目
      for (const item of items) {
        const updated = await this.updateKnowledgeItem(item.id, item.data, userId);
        
        if (updated) {
          updatedCount++;
        }
      }
      
      logger.info(`已批量更新 ${updatedCount} 個知識項目`);
      
      return updatedCount;
    } catch (error) {
      logger.error('批量更新知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量刪除知識項目
   * @param ids 知識項目 ID 列表
   */
  async bulkDelete(ids: string[]): Promise<number> {
    try {
      // 批量刪除知識項目
      const deletedCount = await KnowledgeItem.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
      
      logger.info(`已批量刪除 ${deletedCount} 個知識項目`);
      
      return deletedCount;
    } catch (error) {
      logger.error('批量刪除知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取知識項目統計信息
   */
  async getStatistics(): Promise<any> {
    try {
      // 獲取總數
      const totalCount = await KnowledgeItem.count();
      
      // 獲取已發布數量
      const publishedCount = await KnowledgeItem.count({
        where: {
          isPublished: true,
        },
      });
      
      // 獲取分類統計
      const categories = await KnowledgeItem.findAll({
        attributes: ['category', [KnowledgeItem.sequelize!.fn('COUNT', KnowledgeItem.sequelize!.col('id')), 'count']],
        group: ['category'],
        raw: true,
      });
      
      // 獲取來源統計
      const sources = await KnowledgeItem.findAll({
        attributes: ['source', [KnowledgeItem.sequelize!.fn('COUNT', KnowledgeItem.sequelize!.col('id')), 'count']],
        group: ['source'],
        raw: true,
      });
      
      // 構建統計信息
      const statistics = {
        totalCount,
        publishedCount,
        unpublishedCount: Number(totalCount) - Number(publishedCount),
        categories: categories.map((item: any) => ({
          name: item.category,
          count: parseInt(item.count, 10),
        })),
        sources: sources.map((item: any) => ({
          name: item.source,
          count: parseInt(item.count, 10),
        })),
      };
      
      return statistics;
    } catch (error) {
      logger.error('獲取知識項目統計信息錯誤:', error);
      throw error;
    }
  }
}

export default new KnowledgeService();