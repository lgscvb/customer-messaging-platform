import knowledgeService, { KnowledgeSearchOptions } from '../knowledge-service';
import KnowledgeItem, { KnowledgeItemExtension, CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO } from '../../models/KnowledgeItem';
import { Op } from 'sequelize';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../models/KnowledgeItem', () => {
  const mockUpdate = jest.fn();
  
  const mockKnowledgeItem = function() {
    return {
      update: mockUpdate,
    };
  };
  
  mockKnowledgeItem.create = jest.fn();
  mockKnowledgeItem.findAll = jest.fn();
  mockKnowledgeItem.destroy = jest.fn();
  mockKnowledgeItem.bulkCreate = jest.fn();
  mockKnowledgeItem.sequelize = {
    fn: jest.fn().mockReturnValue('fn'),
    col: jest.fn().mockReturnValue('col'),
  };
  
  return {
    __esModule: true,
    default: mockKnowledgeItem,
    KnowledgeItemExtension: {
      findById: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
    },
  };
});

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('KnowledgeService', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createKnowledgeItem', () => {
    it('應該創建知識項目', async () => {
      // 模擬數據
      const data: CreateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        source: '官方文檔',
        tags: ['智能家居', '基礎版', '價格'],
        isPublished: true,
      };
      
      const userId = 'user-123';
      
      // 模擬創建的知識項目
      const mockKnowledgeItem = {
        id: 'knowledge-1',
        ...data,
        createdBy: userId,
        updatedBy: userId,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 設置模擬函數的返回值
      (KnowledgeItem.create as jest.Mock).mockResolvedValue(mockKnowledgeItem);
      
      // 執行測試
      const result = await knowledgeService.createKnowledgeItem(data, userId);
      
      // 驗證結果
      expect(result).toEqual(mockKnowledgeItem);
      
      // 驗證 KnowledgeItem.create 被調用
      expect(KnowledgeItem.create).toHaveBeenCalledTimes(1);
      expect(KnowledgeItem.create).toHaveBeenCalledWith({
        ...data,
        createdBy: userId,
        updatedBy: userId,
        isPublished: true,
        tags: ['智能家居', '基礎版', '價格'],
        metadata: {},
      });
      
      // 驗證 logger.info 被調用
      expect(logger.info).toHaveBeenCalledWith(`已創建知識項目 ${mockKnowledgeItem.id}`);
    });
    
    it('應該處理創建知識項目時的錯誤', async () => {
      // 模擬數據
      const data: CreateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        source: '官方文檔',
      };
      
      const userId = 'user-123';
      
      // 模擬錯誤
      const mockError = new Error('創建知識項目失敗');
      (KnowledgeItem.create as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.createKnowledgeItem(data, userId)).rejects.toThrow('創建知識項目失敗');
      
      // 驗證 KnowledgeItem.create 被調用
      expect(KnowledgeItem.create).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('創建知識項目錯誤:', mockError);
    });
  });
  
  describe('getKnowledgeItem', () => {
    it('應該獲取知識項目', async () => {
      // 模擬數據
      const id = 'knowledge-1';
      
      // 模擬知識項目
      const mockKnowledgeItem = {
        id,
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        source: '官方文檔',
        tags: ['智能家居', '基礎版', '價格'],
        isPublished: true,
        createdBy: 'user-123',
        updatedBy: 'user-123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.findById as jest.Mock).mockResolvedValue(mockKnowledgeItem);
      
      // 執行測試
      const result = await knowledgeService.getKnowledgeItem(id);
      
      // 驗證結果
      expect(result).toEqual(mockKnowledgeItem);
      
      // 驗證 KnowledgeItemExtension.findById 被調用
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledWith(id);
    });
    
    it('應該處理找不到知識項目的情況', async () => {
      // 模擬數據
      const id = 'non-existent-knowledge';
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.findById as jest.Mock).mockResolvedValue(null);
      
      // 執行測試
      const result = await knowledgeService.getKnowledgeItem(id);
      
      // 驗證結果
      expect(result).toBeNull();
      
      // 驗證 KnowledgeItemExtension.findById 被調用
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledWith(id);
    });
  });
  
  describe('updateKnowledgeItem', () => {
    it('應該更新知識項目', async () => {
      // 獲取模擬的 update 函數
      const mockUpdate = require('../../models/KnowledgeItem').default().update;
      
      // 模擬數據
      const id = 'knowledge-1';
      const data: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新）',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
      };
      const userId = 'user-123';
      
      // 模擬知識項目
      const mockKnowledgeItem = {
        id,
        title: '智能家居系統基礎版介紹',
        content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        category: '產品資訊',
        source: '官方文檔',
        tags: ['智能家居', '基礎版', '價格'],
        isPublished: true,
        createdBy: 'user-123',
        updatedBy: 'user-123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        update: mockUpdate,
      };
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.findById as jest.Mock).mockResolvedValue(mockKnowledgeItem);
      mockUpdate.mockResolvedValue(mockKnowledgeItem);
      
      // 執行測試
      const result = await knowledgeService.updateKnowledgeItem(id, data, userId);
      
      // 驗證結果
      expect(result).toEqual(mockKnowledgeItem);
      
      // 驗證 KnowledgeItemExtension.findById 被調用
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledWith(id);
      
      // 驗證 knowledgeItem.update 被調用
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        ...data,
        updatedBy: userId,
      });
      
      // 驗證 logger.info 被調用
      expect(logger.info).toHaveBeenCalledWith(`已更新知識項目 ${id}`);
    });
    
    it('應該處理找不到知識項目的情況', async () => {
      // 模擬數據
      const id = 'non-existent-knowledge';
      const data: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新）',
      };
      const userId = 'user-123';
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.findById as jest.Mock).mockResolvedValue(null);
      
      // 執行測試
      const result = await knowledgeService.updateKnowledgeItem(id, data, userId);
      
      // 驗證結果
      expect(result).toBeNull();
      
      // 驗證 KnowledgeItemExtension.findById 被調用
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledWith(id);
    });
    
    it('應該處理更新知識項目時的錯誤', async () => {
      // 模擬數據
      const id = 'knowledge-1';
      const data: UpdateKnowledgeItemDTO = {
        title: '智能家居系統基礎版介紹（更新）',
      };
      const userId = 'user-123';
      
      // 模擬錯誤
      const mockError = new Error('更新知識項目失敗');
      (KnowledgeItemExtension.findById as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.updateKnowledgeItem(id, data, userId)).rejects.toThrow('更新知識項目失敗');
      
      // 驗證 KnowledgeItemExtension.findById 被調用
      expect(KnowledgeItemExtension.findById).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('更新知識項目錯誤:', mockError);
    });
  });
  
  describe('deleteKnowledgeItem', () => {
    it('應該刪除知識項目', async () => {
      // 模擬數據
      const id = 'knowledge-1';
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.delete as jest.Mock).mockResolvedValue(true);
      
      // 執行測試
      const result = await knowledgeService.deleteKnowledgeItem(id);
      
      // 驗證結果
      expect(result).toBe(true);
      
      // 驗證 KnowledgeItemExtension.delete 被調用
      expect(KnowledgeItemExtension.delete).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.delete).toHaveBeenCalledWith(id);
      
      // 驗證 logger.info 被調用
      expect(logger.info).toHaveBeenCalledWith(`已刪除知識項目 ${id}`);
    });
    
    it('應該處理找不到知識項目的情況', async () => {
      // 模擬數據
      const id = 'non-existent-knowledge';
      
      // 設置模擬函數的返回值
      (KnowledgeItemExtension.delete as jest.Mock).mockResolvedValue(false);
      
      // 執行測試
      const result = await knowledgeService.deleteKnowledgeItem(id);
      
      // 驗證結果
      expect(result).toBe(false);
      
      // 驗證 KnowledgeItemExtension.delete 被調用
      expect(KnowledgeItemExtension.delete).toHaveBeenCalledTimes(1);
      expect(KnowledgeItemExtension.delete).toHaveBeenCalledWith(id);
    });
    
    it('應該處理刪除知識項目時的錯誤', async () => {
      // 模擬數據
      const id = 'knowledge-1';
      
      // 模擬錯誤
      const mockError = new Error('刪除知識項目失敗');
      (KnowledgeItemExtension.delete as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.deleteKnowledgeItem(id)).rejects.toThrow('刪除知識項目失敗');
      
      // 驗證 KnowledgeItemExtension.delete 被調用
      expect(KnowledgeItemExtension.delete).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('刪除知識項目錯誤:', mockError);
    });
  });
  
  describe('searchKnowledgeItems', () => {
    it('應該搜索知識項目', async () => {
      // 模擬搜索選項
      const options: KnowledgeSearchOptions = {
        query: '智能家居',
        category: '產品資訊',
        tags: ['價格'],
        source: '官方文檔',
        createdBy: 'user-123',
        isPublished: true,
        limit: 10,
        offset: 0,
      };
      
      // 模擬知識項目列表
      const mockKnowledgeItems = [
        {
          id: 'knowledge-1',
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
          tags: ['智能家居', '基礎版', '價格'],
          isPublished: true,
          createdBy: 'user-123',
          updatedBy: 'user-123',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // 設置模擬函數的返回值
      (KnowledgeItem.findAll as jest.Mock).mockResolvedValue(mockKnowledgeItems);
      
      // 執行測試
      const result = await knowledgeService.searchKnowledgeItems(options);
      
      // 驗證結果
      expect(result).toEqual(mockKnowledgeItems);
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      expect(KnowledgeItem.findAll).toHaveBeenCalledWith({
        where: expect.any(Object),
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']],
      });
    });
    
    it('應該處理搜索知識項目時的錯誤', async () => {
      // 模擬搜索選項
      const options: KnowledgeSearchOptions = {
        query: '智能家居',
      };
      
      // 模擬錯誤
      const mockError = new Error('搜索知識項目失敗');
      (KnowledgeItem.findAll as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.searchKnowledgeItems(options)).rejects.toThrow('搜索知識項目失敗');
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('搜索知識項目錯誤:', mockError);
    });
  });
  
  describe('getCategories', () => {
    it('應該獲取知識項目分類列表', async () => {
      // 模擬分類列表
      const mockCategories = [
        { category: '產品資訊' },
        { category: '常見問題' },
        { category: '使用指南' },
      ];
      
      // 設置模擬函數的返回值
      (KnowledgeItem.findAll as jest.Mock).mockResolvedValue(mockCategories);
      
      // 執行測試
      const result = await knowledgeService.getCategories();
      
      // 驗證結果
      expect(result).toEqual(['產品資訊', '常見問題', '使用指南']);
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      expect(KnowledgeItem.findAll).toHaveBeenCalledWith({
        attributes: ['category'],
        group: ['category'],
        raw: true,
      });
    });
    
    it('應該處理獲取知識項目分類列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('獲取知識項目分類列表失敗');
      (KnowledgeItem.findAll as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.getCategories()).rejects.toThrow('獲取知識項目分類列表失敗');
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('獲取知識項目分類列表錯誤:', mockError);
    });
  });
  
  describe('getTags', () => {
    it('應該獲取知識項目標籤列表', async () => {
      // 模擬標籤列表
      const mockTags = [
        { tags: ['智能家居', '基礎版', '價格'] },
        { tags: ['智能家居', '進階版', '價格'] },
        { tags: ['常見問題', '安裝'] },
      ];
      
      // 設置模擬函數的返回值
      (KnowledgeItem.findAll as jest.Mock).mockResolvedValue(mockTags);
      
      // 執行測試
      const result = await knowledgeService.getTags();
      
      // 驗證結果
      expect(result).toEqual(['智能家居', '基礎版', '價格', '進階版', '常見問題', '安裝']);
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      expect(KnowledgeItem.findAll).toHaveBeenCalledWith({
        attributes: ['tags'],
        raw: true,
      });
    });
    
    it('應該處理獲取知識項目標籤列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('獲取知識項目標籤列表失敗');
      (KnowledgeItem.findAll as jest.Mock).mockRejectedValue(mockError);
      
      // 執行測試並驗證錯誤被拋出
      await expect(knowledgeService.getTags()).rejects.toThrow('獲取知識項目標籤列表失敗');
      
      // 驗證 KnowledgeItem.findAll 被調用
      expect(KnowledgeItem.findAll).toHaveBeenCalledTimes(1);
      
      // 驗證 logger.error 被調用
      expect(logger.error).toHaveBeenCalledWith('獲取知識項目標籤列表錯誤:', mockError);
    });
  });
  
  describe('bulkImport', () => {
    it('應該批量導入知識項目', async () => {
      // 模擬數據
      const items: CreateKnowledgeItemDTO[] = [
        {
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
          tags: ['智能家居', '基礎版', '價格'],
          isPublished: true,
        },
        {
          title: '智能家居系統進階版介紹',
          content: '進階版智能家居系統適合中型住宅，除了基礎版的功能外，還包含智能窗簾、語音控制和進階安全監控。價格從NT$25,000起，包含安裝和兩年保固。',
          category: '產品資訊',
          source: '官方文檔',
          tags: ['智能家居', '進階版', '價格'],
          isPublished: true,
        },
      ];
      
      const userId = 'user-123';
      
      // 模擬創建的知識項目
      const mockKnowledgeItems = items.map((item, index) => ({
        id: `knowledge-${index + 1}`,
        ...item,
        createdBy: userId,
        updatedBy: userId,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // 設置模擬函數的返回值
      (KnowledgeItem.bulkCreate as jest.Mock).mockResolvedValue(mockKnowledgeItems);
      
      // 執行測試
      const result = await knowledgeService.bulkImport(items, userId);
      
      // 驗證結果
      expect(result).toEqual(mockKnowledgeItems);
      
      // 驗證 KnowledgeItem.bulkCreate 被調用
      expect(KnowledgeItem.bulkCreate).toHaveBeenCalledTimes(1);
      expect(KnowledgeItem.bulkCreate).toHaveBeenCalledWith(items.map(item => ({
        ...item,
        createdBy: userId,
        updatedBy: userId,
        isPublished: item.isPublished !== undefined ? item.isPublished : false,
        tags: item.tags || [],
        metadata: item.metadata || {},
      })));
      
      // 驗證 logger.info 被調用
      expect(logger.info).toHaveBeenCalledWith(`已批量導入 ${mockKnowledgeItems.length} 個知識項目`);
    });
  });
});
