import KnowledgeItemModel, { KnowledgeItem, CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO } from '../KnowledgeItem';
import pool from '../../config/database';

// 模擬數據庫連接池
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

describe('KnowledgeItemModel', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('應該創建知識條目', async () => {
      // 模擬創建知識條目的請求數據
      const createDTO: CreateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        tags: ['智能家居', '基礎版', '價格'],
        createdBy: 'user-123',
      };

      // 模擬數據庫返回的數據
      const mockDbResponse = {
        rows: [{
          id: 'knowledge-123',
          title: createDTO.title,
          content: createDTO.content,
          category: createDTO.category,
          tags: createDTO.tags,
          vector_embedding: null,
          metadata: {},
          created_by: createDTO.createdBy,
          updated_by: createDTO.createdBy,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.create(createDTO);

      // 驗證結果
      expect(result).toHaveProperty('id', 'knowledge-123');
      expect(result).toHaveProperty('title', createDTO.title);
      expect(result).toHaveProperty('content', createDTO.content);
      expect(result).toHaveProperty('category', createDTO.category);
      expect(result).toHaveProperty('tags');
      expect(result.tags).toEqual(createDTO.tags);
      expect(result).toHaveProperty('createdBy', createDTO.createdBy);
      expect(result).toHaveProperty('updatedBy', createDTO.createdBy);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO knowledge_items'),
        [
          createDTO.title,
          createDTO.content,
          createDTO.category,
          createDTO.tags,
          undefined, // vectorEmbedding
          {}, // metadata
          createDTO.createdBy,
        ]
      );
    });

    it('應該處理創建知識條目時的錯誤', async () => {
      // 模擬創建知識條目的請求數據
      const createDTO: CreateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        tags: ['智能家居', '基礎版', '價格'],
        createdBy: 'user-123',
      };

      // 模擬數據庫錯誤
      const mockError = new Error('資料庫連接錯誤');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(KnowledgeItemModel.create(createDTO)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('應該根據 ID 查詢知識條目', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬數據庫返回的數據
      const mockDbResponse = {
        rows: [{
          id: knowledgeId,
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          tags: ['智能家居', '基礎版', '價格'],
          vector_embedding: null,
          metadata: {},
          created_by: 'user-123',
          updated_by: 'user-123',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.findById(knowledgeId);

      // 驗證結果
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', knowledgeId);
      expect(result).toHaveProperty('title', '智能家居系統基礎版介紹');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('category', '產品資訊');
      expect(result).toHaveProperty('tags');
      expect(result.tags).toEqual(['智能家居', '基礎版', '價格']);

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM knowledge_items WHERE id = $1',
        [knowledgeId]
      );
    });

    it('應該處理找不到知識條目的情況', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'non-existent-id';

      // 模擬數據庫返回的數據（空結果）
      const mockDbResponse = {
        rows: [],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.findById(knowledgeId);

      // 驗證結果
      expect(result).toBeNull();

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM knowledge_items WHERE id = $1',
        [knowledgeId]
      );
    });

    it('應該處理查詢知識條目時的錯誤', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬數據庫錯誤
      const mockError = new Error('資料庫連接錯誤');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(KnowledgeItemModel.findById(knowledgeId)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('應該更新知識條目', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬更新知識條目的請求數據
      const updateDTO: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新版）',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$12,000起，包含安裝和一年保固。',
        updatedBy: 'user-456',
      };

      // 模擬數據庫返回的數據
      const mockDbResponse = {
        rows: [{
          id: knowledgeId,
          title: updateDTO.title,
          content: updateDTO.content,
          category: '產品資訊',
          tags: ['智能家居', '基礎版', '價格'],
          vector_embedding: null,
          metadata: {},
          created_by: 'user-123',
          updated_by: updateDTO.updatedBy,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.update(knowledgeId, updateDTO);

      // 驗證結果
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', knowledgeId);
      expect(result).toHaveProperty('title', updateDTO.title);
      expect(result).toHaveProperty('content', updateDTO.content);
      expect(result).toHaveProperty('updatedBy', updateDTO.updatedBy);

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE knowledge_items SET'),
        expect.arrayContaining([updateDTO.title, updateDTO.content, updateDTO.updatedBy, knowledgeId])
      );
    });

    it('應該處理找不到知識條目的情況', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'non-existent-id';

      // 模擬更新知識條目的請求數據
      const updateDTO: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新版）',
        updatedBy: 'user-456',
      };

      // 模擬數據庫返回的數據（空結果）
      const mockDbResponse = {
        rows: [],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.update(knowledgeId, updateDTO);

      // 驗證結果
      expect(result).toBeNull();

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('應該處理更新知識條目時的錯誤', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬更新知識條目的請求數據
      const updateDTO: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新版）',
        updatedBy: 'user-456',
      };

      // 模擬數據庫錯誤
      const mockError = new Error('資料庫連接錯誤');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(KnowledgeItemModel.update(knowledgeId, updateDTO)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('應該刪除知識條目', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬數據庫返回的數據
      const mockDbResponse = {
        rowCount: 1,
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.delete(knowledgeId);

      // 驗證結果
      expect(result).toBe(true);

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM knowledge_items WHERE id = $1',
        [knowledgeId]
      );
    });

    it('應該處理找不到知識條目的情況', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'non-existent-id';

      // 模擬數據庫返回的數據（沒有刪除任何行）
      const mockDbResponse = {
        rowCount: 0,
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.delete(knowledgeId);

      // 驗證結果
      expect(result).toBe(false);

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('應該處理刪除知識條目時的錯誤', async () => {
      // 模擬知識條目 ID
      const knowledgeId = 'knowledge-123';

      // 模擬數據庫錯誤
      const mockError = new Error('資料庫連接錯誤');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(KnowledgeItemModel.delete(knowledgeId)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    it('應該搜索知識條目', async () => {
      // 模擬搜索詞
      const searchTerm = '智能家居';

      // 模擬數據庫返回的數據
      const mockDbResponse = {
        rows: [
          {
            id: 'knowledge-123',
            title: '智能家居系統基礎版介紹',
            content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
            category: '產品資訊',
            tags: ['智能家居', '基礎版', '價格'],
            vector_embedding: null,
            metadata: {},
            created_by: 'user-123',
            updated_by: 'user-123',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 'knowledge-456',
            title: '智能家居系統進階版介紹',
            content: '進階版智能家居系統適合中型住宅，除了基礎版的功能外，還包含智能窗簾、語音控制和進階安全監控。價格從NT$25,000起，包含安裝和兩年保固。',
            category: '產品資訊',
            tags: ['智能家居', '進階版', '價格'],
            vector_embedding: null,
            metadata: {},
            created_by: 'user-123',
            updated_by: 'user-123',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.search(searchTerm);

      // 驗證結果
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'knowledge-123');
      expect(result[0]).toHaveProperty('title', '智能家居系統基礎版介紹');
      expect(result[1]).toHaveProperty('id', 'knowledge-456');
      expect(result[1]).toHaveProperty('title', '智能家居系統進階版介紹');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM knowledge_items'),
        expect.arrayContaining([`%${searchTerm}%`])
      );
    });

    it('應該處理搜索結果為空的情況', async () => {
      // 模擬搜索詞
      const searchTerm = '不存在的主題';

      // 模擬數據庫返回的數據（空結果）
      const mockDbResponse = {
        rows: [],
      };

      // 設置模擬函數的返回值
      (pool.query as jest.Mock).mockResolvedValue(mockDbResponse);

      // 執行測試
      const result = await KnowledgeItemModel.search(searchTerm);

      // 驗證結果
      expect(result).toHaveLength(0);

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('應該處理搜索知識條目時的錯誤', async () => {
      // 模擬搜索詞
      const searchTerm = '智能家居';

      // 模擬數據庫錯誤
      const mockError = new Error('資料庫連接錯誤');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(KnowledgeItemModel.search(searchTerm)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 pool.query 被調用
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
});