import KnowledgeItem, { KnowledgeItemAttributes, CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO, KnowledgeItemExtension } from '../models/KnowledgeItem';
import { Op, Sequelize, literal } from 'sequelize';
import logger from '../utils/logger';
import cache from '../utils/cache';

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
 * 優化的知識庫管理服務
 * 處理知識項目的 CRUD 操作、知識分類和標籤功能、知識搜索和檢索功能
 * 使用索引和緩存優化查詢性能
 */
class KnowledgeServiceOptimized {
  // 緩存鍵前綴
  private readonly CACHE_PREFIX = 'knowledge:';
  // 緩存過期時間（毫秒）
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 分鐘

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
      
      // 清除相關緩存
      this.clearKnowledgeCache();
      
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getKnowledgeItem', { id });
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
        // 獲取知識項目
        const knowledgeItem = await KnowledgeItemExtension.findById(id);
        
        return knowledgeItem;
      }, this.CACHE_TTL);
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
      
      // 清除相關緩存
      this.clearKnowledgeCache();
      cache.delete(this.buildCacheKey('getKnowledgeItem', { id }));
      
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
        
        // 清除相關緩存
        this.clearKnowledgeCache();
        cache.delete(this.buildCacheKey('getKnowledgeItem', { id }));
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
      
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('searchKnowledgeItems', options);
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
        // 構建查詢條件
        const where: any = {};
        let useFullTextSearch = false;
        
        // 如果有查詢關鍵字，使用全文搜索
        if (query) {
          useFullTextSearch = true;
        } else {
          // 沒有查詢關鍵字，使用普通條件查詢
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
        }
        
        // 根據查詢條件選擇最佳查詢方式
        if (useFullTextSearch) {
          // 使用全文搜索
          return this.performFullTextSearch(query!, category, tags, source, createdBy, isPublished, limit, offset);
        } else {
          // 使用普通查詢
          // 優化查詢：根據條件選擇最佳索引
          const queryOptions: any = {
            where,
            limit,
            offset,
            order: [['updatedAt', 'DESC']],
          };
          
          // 如果有分類和發布狀態條件，使用複合索引
          if (category && isPublished !== undefined) {
            queryOptions.order = [['category', 'ASC'], ['isPublished', 'DESC'], ['updatedAt', 'DESC']];
          }
          
          // 執行查詢
          const knowledgeItems = await KnowledgeItem.findAll(queryOptions);
          
          return knowledgeItems;
        }
      }, this.CACHE_TTL);
    } catch (error) {
      logger.error('搜索知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 執行全文搜索
   * @param query 搜索關鍵字
   * @param category 分類
   * @param tags 標籤
   * @param source 來源
   * @param createdBy 創建者
   * @param isPublished 是否發布
   * @param limit 限制數量
   * @param offset 偏移量
   */
  private async performFullTextSearch(
    query: string,
    category?: string,
    tags?: string[],
    source?: string,
    createdBy?: string,
    isPublished?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<KnowledgeItem[]> {
    // 構建全文搜索條件
    const searchConditions: any[] = [];
    
    // 添加全文搜索條件
    searchConditions.push(literal(`to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')`));
    
    // 添加其他條件
    if (category) {
      searchConditions.push({ category });
    }
    
    if (tags && tags.length > 0) {
      searchConditions.push({ tags: { [Op.overlap]: tags } });
    }
    
    if (source) {
      searchConditions.push({ source });
    }
    
    if (createdBy) {
      searchConditions.push({ createdBy });
    }
    
    if (isPublished !== undefined) {
      searchConditions.push({ isPublished });
    }
    
    // 執行全文搜索查詢
    const knowledgeItems = await KnowledgeItem.findAll({
      where: {
        [Op.and]: searchConditions,
      },
      // 添加全文搜索排序
      order: [
        [
          literal(`ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', '${query.replace(/'/g, "''")}')), "updated_at" DESC`),
          'DESC',
        ],
      ],
      limit,
      offset,
    });
    
    return knowledgeItems;
  }
  
  /**
   * 獲取知識項目分類列表
   */
  async getCategories(): Promise<string[]> {
    try {
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getCategories', {});
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
        // 查詢所有分類
        const categories = await KnowledgeItem.findAll({
          attributes: ['category'],
          group: ['category'],
          raw: true,
        });
        
        return categories.map((item: any) => item.category);
      }, this.CACHE_TTL);
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getTags', {});
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
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
      }, this.CACHE_TTL);
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getSources', {});
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
        // 查詢所有來源
        const sources = await KnowledgeItem.findAll({
          attributes: ['source'],
          group: ['source'],
          raw: true,
        });
        
        return sources.map((item: any) => item.source);
      }, this.CACHE_TTL);
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
      
      // 清除相關緩存
      this.clearKnowledgeCache();
      
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
      
      // 清除相關緩存
      this.clearKnowledgeCache();
      
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
      
      // 清除相關緩存
      this.clearKnowledgeCache();
      
      // 清除每個項目的緩存
      ids.forEach(id => {
        cache.delete(this.buildCacheKey('getKnowledgeItem', { id }));
      });
      
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
      // 構建緩存鍵
      const cacheKey = this.buildCacheKey('getStatistics', {});
      
      // 嘗試從緩存獲取
      return await cache.getOrSet(cacheKey, async () => {
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
      }, this.CACHE_TTL);
    } catch (error) {
      logger.error('獲取知識項目統計信息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 構建緩存鍵
   * @param method 方法名
   * @param params 參數
   */
  private buildCacheKey(method: string, params: any): string {
    return `${this.CACHE_PREFIX}${method}:${JSON.stringify(params)}`;
  }
  
  /**
   * 清除知識庫相關緩存
   */
  private clearKnowledgeCache(): void {
    // 清除所有知識庫相關緩存
    cache.deleteByPrefix(this.CACHE_PREFIX);
  }
}

export default new KnowledgeServiceOptimized();