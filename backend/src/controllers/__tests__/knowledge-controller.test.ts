import { Request, Response } from 'express';
import knowledgeController from '../knowledge-controller';
import knowledgeService, { KnowledgeSearchOptions } from '../../services/knowledge-service';
import { CreateKnowledgeItemDTO, UpdateKnowledgeItemDTO } from '../../models/KnowledgeItem';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../services/knowledge-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('KnowledgeController', () => {
  // 模擬 Request 和 Response 對象
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();

    // 設置 Response 模擬
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('createKnowledgeItem', () => {
    it('應該創建知識項目', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
          tags: ['智能家居', '基礎版', '價格'],
          isPublished: true,
        },
        user: {
          id: 'user-123',
        },
      };

      // 模擬創建的知識項目
      const mockKnowledgeItem = {
        id: 'knowledge-1',
        ...mockRequest.body,
        createdBy: 'user-123',
        updatedBy: 'user-123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (knowledgeService.createKnowledgeItem as jest.Mock).mockResolvedValue(mockKnowledgeItem);

      // 執行測試
      await knowledgeController.createKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.createKnowledgeItem 被調用
      expect(knowledgeService.createKnowledgeItem).toHaveBeenCalledTimes(1);
      expect(knowledgeService.createKnowledgeItem).toHaveBeenCalledWith(mockRequest.body, 'user-123');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItem);
    });

    it('應該處理缺少必填參數的情況', async () => {
      // 模擬請求參數 (缺少 title)
      mockRequest = {
        body: {
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
        },
        user: {
          id: 'user-123',
        },
      };

      // 執行測試
      await knowledgeController.createKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.createKnowledgeItem 沒有被調用
      expect(knowledgeService.createKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '標題、內容、分類和來源為必填項' });
    });

    it('應該處理未授權的情況', async () => {
      // 模擬請求參數 (缺少 user)
      mockRequest = {
        body: {
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
        },
        user: undefined,
      };

      // 執行測試
      await knowledgeController.createKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.createKnowledgeItem 沒有被調用
      expect(knowledgeService.createKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: '未授權' });
    });

    it('應該處理創建知識項目時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          source: '官方文檔',
        },
        user: {
          id: 'user-123',
        },
      };

      // 模擬錯誤
      const mockError = new Error('創建知識項目失敗');
      (knowledgeService.createKnowledgeItem as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.createKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.createKnowledgeItem 被調用
      expect(knowledgeService.createKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '創建知識項目失敗' });
    });
  });

  describe('getKnowledgeItem', () => {
    it('應該獲取知識項目', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
      };

      // 模擬知識項目
      const mockKnowledgeItem = {
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
      };

      // 設置模擬函數的返回值
      (knowledgeService.getKnowledgeItem as jest.Mock).mockResolvedValue(mockKnowledgeItem);

      // 執行測試
      await knowledgeController.getKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getKnowledgeItem 被調用
      expect(knowledgeService.getKnowledgeItem).toHaveBeenCalledTimes(1);
      expect(knowledgeService.getKnowledgeItem).toHaveBeenCalledWith('knowledge-1');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItem);
    });

    it('應該處理缺少知識項目 ID 的情況', async () => {
      // 模擬請求參數 (缺少 id)
      mockRequest = {
        params: {},
      };

      // 執行測試
      await knowledgeController.getKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getKnowledgeItem 沒有被調用
      expect(knowledgeService.getKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '知識項目 ID 為必填項' });
    });

    it('應該處理找不到知識項目的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-knowledge',
        },
      };

      // 設置模擬函數的返回值
      (knowledgeService.getKnowledgeItem as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await knowledgeController.getKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getKnowledgeItem 被調用
      expect(knowledgeService.getKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到知識項目' });
    });

    it('應該處理獲取知識項目時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('獲取知識項目失敗');
      (knowledgeService.getKnowledgeItem as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.getKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getKnowledgeItem 被調用
      expect(knowledgeService.getKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取知識項目失敗' });
    });
  });

  describe('updateKnowledgeItem', () => {
    it('應該更新知識項目', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
        body: {
          title: '智能家居系統基礎版介紹（更新）',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
        },
        user: {
          id: 'user-123',
        },
      };

      // 模擬更新後的知識項目
      const mockKnowledgeItem = {
        id: 'knowledge-1',
        title: '智能家居系統基礎版介紹（更新）',
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
      (knowledgeService.updateKnowledgeItem as jest.Mock).mockResolvedValue(mockKnowledgeItem);

      // 執行測試
      await knowledgeController.updateKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.updateKnowledgeItem 被調用
      expect(knowledgeService.updateKnowledgeItem).toHaveBeenCalledTimes(1);
      expect(knowledgeService.updateKnowledgeItem).toHaveBeenCalledWith('knowledge-1', mockRequest.body, 'user-123');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItem);
    });

    it('應該處理缺少知識項目 ID 的情況', async () => {
      // 模擬請求參數 (缺少 id)
      mockRequest = {
        params: {},
        body: {
          title: '智能家居系統基礎版介紹（更新）',
        },
        user: {
          id: 'user-123',
        },
      };

      // 執行測試
      await knowledgeController.updateKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.updateKnowledgeItem 沒有被調用
      expect(knowledgeService.updateKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '知識項目 ID 為必填項' });
    });

    it('應該處理未授權的情況', async () => {
      // 模擬請求參數 (缺少 user)
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
        body: {
          title: '智能家居系統基礎版介紹（更新）',
        },
        user: undefined,
      };

      // 執行測試
      await knowledgeController.updateKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.updateKnowledgeItem 沒有被調用
      expect(knowledgeService.updateKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: '未授權' });
    });

    it('應該處理找不到知識項目的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-knowledge',
        },
        body: {
          title: '智能家居系統基礎版介紹（更新）',
        },
        user: {
          id: 'user-123',
        },
      };

      // 設置模擬函數的返回值
      (knowledgeService.updateKnowledgeItem as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await knowledgeController.updateKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.updateKnowledgeItem 被調用
      expect(knowledgeService.updateKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到知識項目' });
    });

    it('應該處理更新知識項目時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
        body: {
          title: '智能家居系統基礎版介紹（更新）',
        },
        user: {
          id: 'user-123',
        },
      };

      // 模擬錯誤
      const mockError = new Error('更新知識項目失敗');
      (knowledgeService.updateKnowledgeItem as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.updateKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.updateKnowledgeItem 被調用
      expect(knowledgeService.updateKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '更新知識項目失敗' });
    });
  });

  describe('deleteKnowledgeItem', () => {
    it('應該刪除知識項目', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
      };

      // 設置模擬函數的返回值
      (knowledgeService.deleteKnowledgeItem as jest.Mock).mockResolvedValue(true);

      // 執行測試
      await knowledgeController.deleteKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.deleteKnowledgeItem 被調用
      expect(knowledgeService.deleteKnowledgeItem).toHaveBeenCalledTimes(1);
      expect(knowledgeService.deleteKnowledgeItem).toHaveBeenCalledWith('knowledge-1');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: '知識項目已刪除' });
    });

    it('應該處理缺少知識項目 ID 的情況', async () => {
      // 模擬請求參數 (缺少 id)
      mockRequest = {
        params: {},
      };

      // 執行測試
      await knowledgeController.deleteKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.deleteKnowledgeItem 沒有被調用
      expect(knowledgeService.deleteKnowledgeItem).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '知識項目 ID 為必填項' });
    });

    it('應該處理找不到知識項目的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'non-existent-knowledge',
        },
      };

      // 設置模擬函數的返回值
      (knowledgeService.deleteKnowledgeItem as jest.Mock).mockResolvedValue(false);

      // 執行測試
      await knowledgeController.deleteKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.deleteKnowledgeItem 被調用
      expect(knowledgeService.deleteKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到知識項目' });
    });

    it('應該處理刪除知識項目時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          id: 'knowledge-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('刪除知識項目失敗');
      (knowledgeService.deleteKnowledgeItem as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.deleteKnowledgeItem(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.deleteKnowledgeItem 被調用
      expect(knowledgeService.deleteKnowledgeItem).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '刪除知識項目失敗' });
    });
  });

  describe('searchKnowledgeItems', () => {
    it('應該搜索知識項目', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          query: '智能家居',
          category: '產品資訊',
          tags: ['價格'],
          source: '官方文檔',
          createdBy: 'user-123',
          isPublished: 'true',
          limit: '10',
          offset: '0',
        },
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
      (knowledgeService.searchKnowledgeItems as jest.Mock).mockResolvedValue(mockKnowledgeItems);

      // 執行測試
      await knowledgeController.searchKnowledgeItems(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.searchKnowledgeItems 被調用
      expect(knowledgeService.searchKnowledgeItems).toHaveBeenCalledTimes(1);
      expect(knowledgeService.searchKnowledgeItems).toHaveBeenCalledWith({
        query: '智能家居',
        category: '產品資訊',
        tags: ['價格'],
        source: '官方文檔',
        createdBy: 'user-123',
        isPublished: true,
        limit: 10,
        offset: 0,
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItems);
    });

    it('應該處理搜索知識項目時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          query: '智能家居',
        },
      };

      // 模擬錯誤
      const mockError = new Error('搜索知識項目失敗');
      (knowledgeService.searchKnowledgeItems as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.searchKnowledgeItems(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.searchKnowledgeItems 被調用
      expect(knowledgeService.searchKnowledgeItems).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '搜索知識項目失敗' });
    });
  });

  describe('getCategories', () => {
    it('應該獲取知識項目分類列表', async () => {
      // 模擬分類列表
      const mockCategories = ['產品資訊', '常見問題', '使用指南'];

      // 設置模擬函數的返回值
      (knowledgeService.getCategories as jest.Mock).mockResolvedValue(mockCategories);

      // 執行測試
      await knowledgeController.getCategories(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getCategories 被調用
      expect(knowledgeService.getCategories).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCategories);
    });

    it('應該處理獲取知識項目分類列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('獲取知識項目分類列表失敗');
      (knowledgeService.getCategories as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.getCategories(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getCategories 被調用
      expect(knowledgeService.getCategories).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取知識項目分類列表失敗' });
    });
  });

  describe('getTags', () => {
    it('應該獲取知識項目標籤列表', async () => {
      // 模擬標籤列表
      const mockTags = ['智能家居', '基礎版', '價格', '進階版', '常見問題', '安裝'];

      // 設置模擬函數的返回值
      (knowledgeService.getTags as jest.Mock).mockResolvedValue(mockTags);

      // 執行測試
      await knowledgeController.getTags(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getTags 被調用
      expect(knowledgeService.getTags).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTags);
    });

    it('應該處理獲取知識項目標籤列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('獲取知識項目標籤列表失敗');
      (knowledgeService.getTags as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await knowledgeController.getTags(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getTags 被調用
      expect(knowledgeService.getTags).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取知識項目標籤列表失敗' });
    });
  });

  describe('getSources', () => {
    it('應該獲取知識項目來源列表', async () => {
      // 模擬來源列表
      const mockSources = ['官方文檔', '客戶反饋', '內部知識庫'];

      // 設置模擬函數的返回值
      (knowledgeService.getSources as jest.Mock).mockResolvedValue(mockSources);

      // 執行測試
      await knowledgeController.getSources(mockRequest as Request, mockResponse as Response);

      // 驗證 knowledgeService.getSources 被調用
      expect(knowledgeService.getSources).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockSources);
    });

    it('應該處理獲取知識項目來源列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('獲取知識項目來源列表失敗');
