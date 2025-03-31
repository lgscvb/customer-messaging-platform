import request from 'supertest';
import { app } from '../../app';
import { AIProvider } from '../../services/ai-service';
import * as dotenv from 'dotenv';
import { createTestUser, getAuthToken } from '../helpers/auth-helper';
import { createTestCustomer } from '../helpers/customer-helper';
import { createTestMessage } from '../helpers/message-helper';
import { createTestKnowledgeItem } from '../helpers/knowledge-helper';

// 載入測試環境變數
dotenv.config({ path: '.env.test' });

describe('AI 模型自動選擇功能端到端測試', () => {
  let authToken: string;
  let customerId: string;
  let messageId: string;

  beforeAll(async () => {
    // 創建測試用戶並獲取認證令牌
    const user = await createTestUser();
    authToken = await getAuthToken(user.username, 'password123');

    // 創建測試客戶
    const customer = await createTestCustomer();
    customerId = customer.id;

    // 創建測試消息
    const message = await createTestMessage(customerId);
    messageId = message.id;

    // 創建測試知識項目
    await createTestKnowledgeItem('測試知識項目 1', '這是測試知識項目 1 的內容', '測試分類');
    await createTestKnowledgeItem('測試知識項目 2', '這是測試知識項目 2 的內容', '測試分類');
    await createTestKnowledgeItem('測試知識項目 3', '這是測試知識項目 3 的內容', '測試分類');
  });

  describe('簡單查詢測試', () => {
    it('應該為簡單查詢選擇 Llama 模型', async () => {
      // 設置環境變數
      process.env.AUTO_SELECT_MODEL = 'true';
      
      const response = await request(app)
        .post('/api/ai/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          messageId,
          query: '你好',
          maxResults: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.selectedModel).toBe(AIProvider.LLAMA);
    });
  });

  describe('中等複雜性查詢測試', () => {
    it('應該為中等複雜性查詢選擇 Google 模型', async () => {
      // 設置環境變數
      process.env.AUTO_SELECT_MODEL = 'true';
      
      const response = await request(app)
        .post('/api/ai/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          messageId,
          query: '請問你們的產品有哪些特色？我想了解一下產品的優勢和適用場景。',
          maxResults: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.selectedModel).toBe(AIProvider.GOOGLE);
    });
  });

  describe('高複雜性查詢測試', () => {
    it('應該為高複雜性查詢選擇 OpenAI 模型', async () => {
      // 設置環境變數
      process.env.AUTO_SELECT_MODEL = 'true';
      
      const response = await request(app)
        .post('/api/ai/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          messageId,
          query: '我想了解一下你們的產品如何解決企業在多平台客戶服務中遇到的挑戰？特別是在處理大量訊息、保持一致性回覆和提高客戶滿意度方面，有哪些具體的功能和案例可以分享？另外，與市場上其他類似解決方案相比，你們的產品有什麼獨特的優勢？',
          maxResults: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.selectedModel).toBe(AIProvider.OPENAI);
    });
  });

  describe('極高複雜性查詢測試', () => {
    it('應該為極高複雜性查詢選擇 Claude 模型', async () => {
      // 設置環境變數
      process.env.AUTO_SELECT_MODEL = 'true';
      
      const response = await request(app)
        .post('/api/ai/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          messageId,
          query: '我們公司是一家跨國企業，目前在亞太地區有超過 50 個分支機構，每天處理約 10,000 條客戶訊息，橫跨 LINE、Facebook、Instagram、官網和電子郵件等多個平台。我們面臨的主要挑戰是如何統一管理這些訊息，確保回覆的一致性和專業性，同時提高客服團隊的效率。我們特別關注的是如何利用 AI 技術來輔助客服人員，而不是完全取代他們。請詳細說明你們的解決方案如何幫助我們解決這些問題，包括系統架構、AI 模型選擇、知識庫管理、多語言支援、數據分析和 ROI 評估等方面。另外，我們也很關注系統的可擴展性和安全性，特別是在處理客戶敏感資訊方面的合規措施。',
          maxResults: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.selectedModel).toBe(AIProvider.CLAUDE);
    });
  });

  describe('自動選擇模型功能開關測試', () => {
    it('當自動選擇模型功能關閉時，應該使用預設模型', async () => {
      // 設置環境變數
      process.env.AUTO_SELECT_MODEL = 'false';
      process.env.AI_PROVIDER = AIProvider.GOOGLE;
      
      const response = await request(app)
        .post('/api/ai/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          messageId,
          query: '我想了解一下你們的產品如何解決企業在多平台客戶服務中遇到的挑戰？',
          maxResults: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.selectedModel).toBe(AIProvider.GOOGLE);
    });
  });
});