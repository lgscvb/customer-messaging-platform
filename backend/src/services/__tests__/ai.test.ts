import AIService, { GenerateResponseRequest, GenerateResponseResult } from '../ai';
import KnowledgeItemModel from '../../models/KnowledgeItem';
import { Document } from 'langchain/document';
import { OpenAI } from '@langchain/openai';
import { LLMChain } from 'langchain/chains';

// 模擬依賴
jest.mock('../../models/KnowledgeItem', () => {
  const originalModule = jest.requireActual('../../models/KnowledgeItem');
  return {
    __esModule: true,
    default: jest.fn(),
    KnowledgeItemExtension: {
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };
});
jest.mock('@langchain/openai');
jest.mock('langchain/chains');
jest.mock('langchain/document', () => ({
  Document: jest.fn().mockImplementation((params) => params),
}));

describe('AIService', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('應該生成 AI 回覆', async () => {
      // 模擬請求
      const request: GenerateResponseRequest = {
        customerId: 'customer-123',
        messageContent: '我想了解智能家居系統的價格',
        messageContext: ['客戶: 你們有智能家居系統嗎?', '客服: 是的，我們提供多種智能家居解決方案。'],
        customerInfo: {
          name: '張先生',
          email: 'zhang@example.com',
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

      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      (KnowledgeItemExtension.search as jest.Mock).mockResolvedValue(mockKnowledgeItems);

      // 模擬 LLM 鏈結果
      const mockLLMResult = {
        text: '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。您有興趣了解哪一種方案的詳細資訊呢？',
      };

      (LLMChain.prototype.call as jest.Mock).mockResolvedValue(mockLLMResult);

      // 執行測試
      const result = await AIService.generateResponse(request);

      // 驗證結果
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('knowledgeSources');
      expect(result.response).toBe(mockLLMResult.text);
      expect(result.knowledgeSources).toHaveLength(2);
      expect(result.knowledgeSources[0]).toHaveProperty('id', 'knowledge-1');
      expect(result.knowledgeSources[1]).toHaveProperty('id', 'knowledge-2');

      // 驗證 KnowledgeItemExtension.search 被調用
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      expect(KnowledgeItemExtension.search).toHaveBeenCalledWith('我想了解智能家居系統的價格');

      // 驗證 LLMChain.call 被調用
      expect(LLMChain.prototype.call).toHaveBeenCalled();
    });

    it('應該處理沒有相關知識的情況', async () => {
      // 模擬請求
      const request: GenerateResponseRequest = {
        customerId: 'customer-123',
        messageContent: '我想了解太空旅行的價格',
        messageContext: [],
      };

      // 模擬空的知識庫搜索結果
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      (KnowledgeItemExtension.search as jest.Mock).mockResolvedValue([]);

      // 模擬 LLM 鏈結果
      const mockLLMResult = {
        text: '很抱歉，我們目前沒有提供太空旅行服務。我們是一家專注於智能家居和家庭自動化解決方案的公司。請問您有關於智能家居系統的問題嗎？',
      };

      (LLMChain.prototype.call as jest.Mock).mockResolvedValue(mockLLMResult);

      // 執行測試
      const result = await AIService.generateResponse(request);

      // 驗證結果
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('knowledgeSources');
      expect(result.response).toBe(mockLLMResult.text);
      expect(result.knowledgeSources).toHaveLength(0);
      expect(result.confidenceScore).toBeLessThan(0.5); // 信心分數應該較低

      // 驗證 KnowledgeItemModel.search 被調用
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      expect(KnowledgeItemExtension.search).toHaveBeenCalledWith('我想了解太空旅行的價格');

      // 驗證 LLMChain.call 被調用
      expect(LLMChain.prototype.call).toHaveBeenCalled();
    });

    it('應該處理錯誤情況', async () => {
      // 模擬請求
      const request: GenerateResponseRequest = {
        customerId: 'customer-123',
        messageContent: '我想了解智能家居系統的價格',
        messageContext: [],
      };

      // 模擬知識庫搜索錯誤
      const mockError = new Error('資料庫連接錯誤');
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      (KnowledgeItemExtension.search as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(AIService.generateResponse(request)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 KnowledgeItemModel.search 被調用
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      expect(KnowledgeItemExtension.search).toHaveBeenCalledWith('我想了解智能家居系統的價格');
    });
  });

  describe('retrieveRelevantKnowledge', () => {
    it('應該檢索相關知識', async () => {
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

      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      (KnowledgeItemExtension.search as jest.Mock).mockResolvedValue(mockKnowledgeItems);

      // 使用 TypeScript 的類型斷言來訪問私有方法
      const result = await (AIService as any).retrieveRelevantKnowledge('智能家居價格');

      // 驗證結果
      expect(result).toHaveProperty('documents');
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toHaveProperty('pageContent');
      expect(result.documents[0].pageContent).toContain('智能家居系統基礎版介紹');
      expect(result.documents[0].metadata).toHaveProperty('id', 'knowledge-1');

      // 驗證 KnowledgeItemModel.search 被調用
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      expect(KnowledgeItemExtension.search).toHaveBeenCalledWith('智能家居價格');
    });

    it('應該處理空結果', async () => {
      // 模擬空的知識庫搜索結果
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      (KnowledgeItemExtension.search as jest.Mock).mockResolvedValue([]);

      // 使用 TypeScript 的類型斷言來訪問私有方法
      const result = await (AIService as any).retrieveRelevantKnowledge('不存在的主題');

      // 驗證結果
      expect(result).toHaveProperty('documents');
      expect(result.documents).toHaveLength(0);

      // 驗證 KnowledgeItemModel.search 被調用
      const { KnowledgeItemExtension } = require('../../models/KnowledgeItem');
      expect(KnowledgeItemExtension.search).toHaveBeenCalledWith('不存在的主題');
    });
  });

  describe('calculateConfidenceScore', () => {
    it('應該計算高信心分數', () => {
      // 創建測試文檔
      const documents = [
        {
          pageContent: '智能家居系統基礎版介紹',
          metadata: { id: 'knowledge-1', title: '智能家居系統基礎版介紹', score: 0.95 },
        },
        {
          pageContent: '智能家居系統進階版介紹',
          metadata: { id: 'knowledge-2', title: '智能家居系統進階版介紹', score: 0.9 },
        },
      ];

      // 創建測試回覆
      const response = '我們提供多種智能家居系統方案，基礎版適合小型公寓，價格從NT$15,000起；進階版適合中型住宅，價格從NT$25,000起。所有方案都包含安裝和保固服務。';

      // 使用 TypeScript 的類型斷言來訪問私有方法
      const score = (AIService as any).calculateConfidenceScore(documents, response);

      // 驗證結果
      expect(score).toBeGreaterThan(0.7); // 信心分數應該較高
    });

    it('應該計算低信心分數', () => {
      // 創建空文檔數組
      const documents: any[] = [];

      // 創建測試回覆
      const response = '很抱歉，我們目前沒有相關資訊。';

      // 使用 TypeScript 的類型斷言來訪問私有方法
      const score = (AIService as any).calculateConfidenceScore(documents, response);

      // 驗證結果
      expect(score).toBeLessThan(0.5); // 信心分數應該較低
    });
  });
});