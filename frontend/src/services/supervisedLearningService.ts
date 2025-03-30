import api from './api';

/**
 * 學習結果接口
 */
export interface LearningResult {
  success: boolean;
  message: string;
  newKnowledgeItems?: string[];
  improvementSuggestions?: string[];
}

/**
 * 學習統計信息接口
 */
export interface LearningStats {
  totalSamples: number;
  successfulSamples: number;
  averageSimilarity: number;
  knowledgeItemsGenerated: number;
  topLearningPoints: string[];
}

/**
 * 監督式學習服務
 * 提供與監督式學習 API 交互的方法
 */
class SupervisedLearningService {
  /**
   * 從人工修改的回覆中學習
   * @param aiMessageId AI 回覆消息 ID
   * @param humanMessageId 人工修改的回覆消息 ID
   */
  async learnFromHumanCorrection(
    aiMessageId: string,
    humanMessageId: string
  ): Promise<LearningResult> {
    try {
      const response = await api.post('/supervised-learning/learn', {
        aiMessageId,
        humanMessageId,
      });
      
      return response.data;
    } catch (error) {
      console.error('從人工修改的回覆中學習錯誤:', error);
      
      return {
        success: false,
        message: '從人工修改的回覆中學習時發生錯誤',
      };
    }
  }
  
  /**
   * 批量處理學習樣本
   * @param samples 樣本數組，每個樣本包含 aiMessageId 和 humanMessageId
   */
  async batchLearn(
    samples: Array<{ aiMessageId: string; humanMessageId: string }>
  ): Promise<{
    success: boolean;
    message: string;
    results: LearningResult[];
  }> {
    try {
      const response = await api.post('/supervised-learning/batch-learn', {
        samples,
      });
      
      return response.data;
    } catch (error) {
      console.error('批量處理學習樣本錯誤:', error);
      
      return {
        success: false,
        message: '批量處理學習樣本時發生錯誤',
        results: [],
      };
    }
  }
  
  /**
   * 獲取學習統計信息
   */
  async getLearningStats(): Promise<{
    success: boolean;
    data?: LearningStats;
    message?: string;
  }> {
    try {
      const response = await api.get('/supervised-learning/stats');
      
      return response.data;
    } catch (error) {
      console.error('獲取學習統計信息錯誤:', error);
      
      return {
        success: false,
        message: '獲取學習統計信息時發生錯誤',
      };
    }
  }
  
  /**
   * 檢查消息是否已經被學習
   * @param aiMessageId AI 回覆消息 ID
   * @param humanMessageId 人工修改的回覆消息 ID
   */
  async checkIfLearned(
    aiMessageId: string,
    humanMessageId: string
  ): Promise<{
    success: boolean;
    isLearned: boolean;
    message?: string;
  }> {
    try {
      const response = await api.get(
        `/supervised-learning/check?aiMessageId=${aiMessageId}&humanMessageId=${humanMessageId}`
      );
      
      return response.data;
    } catch (error) {
      console.error('檢查消息是否已經被學習錯誤:', error);
      
      return {
        success: false,
        isLearned: false,
        message: '檢查消息是否已經被學習時發生錯誤',
      };
    }
  }
  
  /**
   * 獲取學習歷史
   * @param page 頁碼
   * @param limit 每頁數量
   */
  async getLearningHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data?: {
      items: Array<{
        id: string;
        aiMessageId: string;
        humanMessageId: string;
        customerId: string;
        similarity: number;
        learningPoints: string[];
        createdAt: string;
      }>;
      total: number;
      page: number;
      limit: number;
    };
    message?: string;
  }> {
    try {
      const response = await api.get(
        `/supervised-learning/history?page=${page}&limit=${limit}`
      );
      
      return response.data;
    } catch (error) {
      console.error('獲取學習歷史錯誤:', error);
      
      return {
        success: false,
        message: '獲取學習歷史時發生錯誤',
      };
    }
  }
}

export default new SupervisedLearningService();