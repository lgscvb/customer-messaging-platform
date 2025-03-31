import { Request, Response } from 'express';
import aiController from '../ai-controller';
import aiService from '../../services/ai-service';
import messageService from '../../services/message-service';
import { MessageDirection, MessageType, PlatformType } from '../../types/platform';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../services/ai-service');
jest.mock('../../services/message-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('AIController', () => {
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

  describe('generateReply', () => {
    it('應該生成 AI 回覆', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          messageId: 'message-1',
          query: '智能家居系統的價格是多少？',
          maxResults: 5,
          temperature: 0.7,
          maxTokens: 1024,
        },
      };

      // 模擬 AI 回覆結果
      const mockReplyResult = {
        reply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        confidence: 0.85,
        sources: [
          {
            id: 'knowledge-1',
            title: '智能家居系統基礎版介紹',
            content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
            relevance: 0.9,
          },
          {
            id: 'knowledge-2',
            title: '智能家居系統進階版介紹',
            content: '進階版智能家居系統適合中型住宅，除了基礎版的功能外，還包含智能窗簾、語音控制和進階安全監控。價格從NT$25,000起，包含安裝和兩年保固。',
            relevance: 0.85,
          },
        ],
        metadata: {
          provider: 'google',
          model: 'text-bison',
          temperature: 0.7,
          maxTokens: 1024,
        },
      };

      // 設置模擬函數的返回值
      (aiService.generateReply as jest.Mock).mockResolvedValue(mockReplyResult);

      // 執行測試
      await aiController.generateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.generateReply 被調用
      expect(aiService.generateReply).toHaveBeenCalledTimes(1);
      expect(aiService.generateReply).toHaveBeenCalledWith({
        customerId: 'customer-123',
        messageId: 'message-1',
        query: '智能家居系統的價格是多少？',
        maxResults: 5,
        temperature: 0.7,
        maxTokens: 1024,
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReplyResult);
    });

    it('應該處理缺少必填參數的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          // 缺少 messageId 和 query
        },
      };

      // 執行測試
      await aiController.generateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.generateReply 沒有被調用
      expect(aiService.generateReply).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '客戶 ID、消息 ID 和查詢為必填項' });
    });

    it('應該處理生成 AI 回覆時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          messageId: 'message-1',
          query: '智能家居系統的價格是多少？',
        },
      };

      // 模擬錯誤
      const mockError = new Error('生成 AI 回覆失敗');
      (aiService.generateReply as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await aiController.generateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.generateReply 被調用
      expect(aiService.generateReply).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '生成 AI 回覆失敗' });
    });
  });

  describe('sendReply', () => {
    it('應該發送 AI 回覆', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          query: '智能家居系統的價格是多少？',
          reply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
          sources: [
            {
              id: 'knowledge-1',
              title: '智能家居系統基礎版介紹',
              content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
              relevance: 0.9,
            },
          ],
        },
      };

      // 模擬平台 ID
      const mockPlatformId = 'line-user-id';

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        metadata: {
          aiGenerated: true,
          query: '智能家居系統的價格是多少？',
          sources: [
            {
              id: 'knowledge-1',
              title: '智能家居系統基礎版介紹',
              content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
              relevance: 0.9,
            },
          ],
          response: { messageId: 'line-message-id' },
        },
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(mockPlatformId);
      (messageService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      await aiController.sendReply(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledWith('customer-123', PlatformType.LINE);

      // 驗證 messageService.sendMessage 被調用
      expect(messageService.sendMessage).toHaveBeenCalledTimes(1);
      expect(messageService.sendMessage).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        platformId: mockPlatformId,
        messageType: MessageType.TEXT,
        content: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        metadata: {
          aiGenerated: true,
          query: '智能家居系統的價格是多少？',
          sources: [
            {
              id: 'knowledge-1',
              title: '智能家居系統基礎版介紹',
              content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
              relevance: 0.9,
            },
          ],
        },
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockMessage);
    });

    it('應該處理缺少必填參數的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          // 缺少 platformType, query, reply
        },
      };

      // 執行測試
      await aiController.sendReply(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 沒有被調用
      expect(messageService.getCustomerPlatformId).not.toHaveBeenCalled();

      // 驗證 messageService.sendMessage 沒有被調用
      expect(messageService.sendMessage).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '客戶 ID、平台類型、查詢和回覆為必填項' });
    });

    it('應該處理找不到客戶平台 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          query: '智能家居系統的價格是多少？',
          reply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        },
      };

      // 設置模擬函數的返回值
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await aiController.sendReply(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);

      // 驗證 messageService.sendMessage 沒有被調用
      expect(messageService.sendMessage).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到客戶的平台 ID' });
    });

    it('應該處理發送 AI 回覆時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          query: '智能家居系統的價格是多少？',
          reply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        },
      };

      // 模擬平台 ID
      const mockPlatformId = 'line-user-id';

      // 模擬錯誤
      const mockError = new Error('發送消息失敗');
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(mockPlatformId);
      (messageService.sendMessage as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await aiController.sendReply(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);

      // 驗證 messageService.sendMessage 被調用
      expect(messageService.sendMessage).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '發送消息失敗' });
    });
  });

  describe('searchKnowledge', () => {
    it('應該搜索知識庫', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          query: '智能家居價格',
          maxResults: '5',
          categories: ['產品資訊'],
          tags: ['價格', '智能家居'],
        },
      };

      // 模擬知識庫搜索結果
      const mockKnowledgeItems = [
        {
          id: 'knowledge-1',
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          tags: ['智能家居', '基礎版', '價格'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'knowledge-2',
          title: '智能家居系統進階版介紹',
          content: '進階版智能家居系統適合中型住宅，除了基礎版的功能外，還包含智能窗簾、語音控制和進階安全監控。價格從NT$25,000起，包含安裝和兩年保固。',
          category: '產品資訊',
          tags: ['智能家居', '進階版', '價格'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 設置模擬函數的返回值
      (aiService.searchKnowledge as jest.Mock).mockResolvedValue(mockKnowledgeItems);

      // 執行測試
      await aiController.searchKnowledge(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.searchKnowledge 被調用
      expect(aiService.searchKnowledge).toHaveBeenCalledTimes(1);
      expect(aiService.searchKnowledge).toHaveBeenCalledWith({
        query: '智能家居價格',
        maxResults: 5,
        categories: ['產品資訊'],
        tags: ['價格', '智能家居'],
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItems);
    });

    it('應該處理單一類別和標籤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          query: '智能家居價格',
          categories: '產品資訊',
          tags: '價格',
        },
      };

      // 模擬知識庫搜索結果
      const mockKnowledgeItems = [
        {
          id: 'knowledge-1',
          title: '智能家居系統基礎版介紹',
          content: '基礎版智能家居系統適合小型公寓，包含智能照明、溫度控制和基本安全功能。價格從NT$15,000起，包含安裝和一年保固。',
          category: '產品資訊',
          tags: ['智能家居', '基礎版', '價格'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 設置模擬函數的返回值
      (aiService.searchKnowledge as jest.Mock).mockResolvedValue(mockKnowledgeItems);

      // 執行測試
      await aiController.searchKnowledge(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.searchKnowledge 被調用
      expect(aiService.searchKnowledge).toHaveBeenCalledTimes(1);
      expect(aiService.searchKnowledge).toHaveBeenCalledWith({
        query: '智能家居價格',
        categories: ['產品資訊'],
        tags: ['價格'],
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockKnowledgeItems);
    });

    it('應該處理缺少查詢的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          // 缺少 query
          maxResults: '5',
        },
      };

      // 執行測試
      await aiController.searchKnowledge(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.searchKnowledge 沒有被調用
      expect(aiService.searchKnowledge).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '查詢為必填項' });
    });

    it('應該處理搜索知識庫時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          query: '智能家居價格',
        },
      };

      // 模擬錯誤
      const mockError = new Error('搜索知識庫失敗');
      (aiService.searchKnowledge as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await aiController.searchKnowledge(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.searchKnowledge 被調用
      expect(aiService.searchKnowledge).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '搜索知識庫失敗' });
    });
  });

  describe('evaluateReply', () => {
    it('應該評估回覆品質', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          aiReply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
          humanReply: '我們有基礎版和進階版兩種智能家居系統，基礎版適合小公寓，價格NT$15,000起，進階版適合中型住宅，價格NT$25,000起，都包含安裝和保固。',
        },
      };

      // 模擬相似度結果
      const mockSimilarity = 0.85;

      // 設置模擬函數的返回值
      (aiService.evaluateReply as jest.Mock).mockResolvedValue(mockSimilarity);

      // 執行測試
      await aiController.evaluateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.evaluateReply 被調用
      expect(aiService.evaluateReply).toHaveBeenCalledTimes(1);
      expect(aiService.evaluateReply).toHaveBeenCalledWith(
        '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
        '我們有基礎版和進階版兩種智能家居系統，基礎版適合小公寓，價格NT$15,000起，進階版適合中型住宅，價格NT$25,000起，都包含安裝和保固。'
      );

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ similarity: 0.85 });
    });

    it('應該處理缺少必填參數的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          aiReply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
          // 缺少 humanReply
        },
      };

      // 執行測試
      await aiController.evaluateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.evaluateReply 沒有被調用
      expect(aiService.evaluateReply).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'AI 回覆和人工回覆為必填項' });
    });

    it('應該處理評估回覆品質時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          aiReply: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。',
          humanReply: '我們有基礎版和進階版兩種智能家居系統，基礎版適合小公寓，價格NT$15,000起，進階版適合中型住宅，價格NT$25,000起，都包含安裝和保固。',
        },
      };

      // 模擬錯誤
      const mockError = new Error('評估回覆品質失敗');
      (aiService.evaluateReply as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await aiController.evaluateReply(mockRequest as Request, mockResponse as Response);

      // 驗證 aiService.evaluateReply 被調用
      expect(aiService.evaluateReply).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '評估回覆品質失敗' });
    });
  });
});