import api from './api';

/**
 * 知識項目接口
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  isPublished: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * 創建知識項目 DTO
 */
export interface CreateKnowledgeItemDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 更新知識項目 DTO
 */
export interface UpdateKnowledgeItemDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

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
 * 知識庫統計信息
 */
export interface KnowledgeStatistics {
  totalCount: number;
  publishedCount: number;
  unpublishedCount: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
  sources: Array<{
    name: string;
    count: number;
  }>;
}

/**
 * 知識服務
 * 提供知識項目的 CRUD 操作、搜索和統計功能
 */
const knowledgeService = {
  /**
   * 創建知識項目
   * @param data 知識項目數據
   */
  async createKnowledgeItem(data: CreateKnowledgeItemDTO): Promise<KnowledgeItem> {
    try {
      const response = await api.post('/knowledge', data);
      return response.data.data;
    } catch (error) {
      console.error('創建知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 獲取知識項目
   * @param id 知識項目 ID
   */
  async getKnowledgeItem(id: string): Promise<KnowledgeItem> {
    try {
      const response = await api.get(`/knowledge/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('獲取知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 更新知識項目
   * @param id 知識項目 ID
   * @param data 更新數據
   */
  async updateKnowledgeItem(id: string, data: UpdateKnowledgeItemDTO): Promise<KnowledgeItem> {
    try {
      const response = await api.put(`/knowledge/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('更新知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 刪除知識項目
   * @param id 知識項目 ID
   */
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/knowledge/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('刪除知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 搜索知識項目
   * @param options 搜索選項
   */
  async searchKnowledgeItems(options: KnowledgeSearchOptions = {}): Promise<KnowledgeItem[]> {
    try {
      const response = await api.get('/knowledge/search', { params: options });
      return response.data.data;
    } catch (error) {
      console.error('搜索知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 獲取知識項目分類列表
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get('/knowledge/categories');
      return response.data.data;
    } catch (error) {
      console.error('獲取知識項目分類列表錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 獲取知識項目標籤列表
   */
  async getTags(): Promise<string[]> {
    try {
      const response = await api.get('/knowledge/tags');
      return response.data.data;
    } catch (error) {
      console.error('獲取知識項目標籤列表錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 獲取知識項目來源列表
   */
  async getSources(): Promise<string[]> {
    try {
      const response = await api.get('/knowledge/sources');
      return response.data.data;
    } catch (error) {
      console.error('獲取知識項目來源列表錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 批量導入知識項目
   * @param items 知識項目列表
   */
  async bulkImport(items: CreateKnowledgeItemDTO[]): Promise<KnowledgeItem[]> {
    try {
      const response = await api.post('/knowledge/bulk-import', { items });
      return response.data.data;
    } catch (error) {
      console.error('批量導入知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 批量更新知識項目
   * @param items 知識項目列表
   */
  async bulkUpdate(items: { id: string; data: UpdateKnowledgeItemDTO }[]): Promise<number> {
    try {
      const response = await api.put('/knowledge/bulk-update', { items });
      return response.data.data;
    } catch (error) {
      console.error('批量更新知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 批量刪除知識項目
   * @param ids 知識項目 ID 列表
   */
  async bulkDelete(ids: string[]): Promise<number> {
    try {
      const response = await api.delete('/knowledge/bulk-delete', { data: { ids } });
      return response.data.data;
    } catch (error) {
      console.error('批量刪除知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 獲取知識項目統計信息
   */
  async getStatistics(): Promise<KnowledgeStatistics> {
    try {
      const response = await api.get('/knowledge/statistics');
      return response.data.data;
    } catch (error) {
      console.error('獲取知識項目統計信息錯誤:', error);
      throw error;
    }
  },
};

export default knowledgeService;