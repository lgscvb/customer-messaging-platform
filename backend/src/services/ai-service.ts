import KnowledgeItem from '../models/KnowledgeItem';
import { Message } from '../models/Message';
import { MessageDirection } from '../types/platform';
import logger from '../utils/logger';

/**
 * AI 提供者類型
 */
export enum AIProvider {
  GOOGLE = 'google',
  OPENAI = 'openai',
}

/**
 * AI 回覆選項
 */
export interface AIReplyOptions {
  customerId: string;
  messageId: string;
  query: string;
  maxResults?: number;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI 回覆結果
 */
export interface AIReplyResult {
  reply: string;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    relevance: number;
  }>;
  metadata: Record<string, any>;
}

/**
 * 知識庫搜索選項
 */
export interface KnowledgeSearchOptions {
  query: string;
  maxResults?: number;
  categories?: string[];
  tags?: string[];
}

/**
 * AI 服務
 * 處理 AI 回覆生成和知識庫搜索
 */
class AIService {
  private provider: AIProvider;
  
  /**
   * 構造函數
   */
  constructor() {
    // 從環境變量獲取 AI 提供者
    this.provider = (process.env.AI_PROVIDER as AIProvider) || AIProvider.GOOGLE;
    
    logger.info(`AI 服務初始化，使用提供者: ${this.provider}`);
  }
  
  /**
   * 生成 AI 回覆
   * @param options 回覆選項
   */
  async generateReply(options: AIReplyOptions): Promise<AIReplyResult> {
    try {
      const {
        customerId,
        messageId,
        query,
        maxResults = 5,
        temperature = 0.7,
        maxTokens = 1024,
      } = options;
      
      // 獲取客戶歷史消息
      const history = await this.getCustomerMessageHistory(customerId);
      
      // 搜索相關知識
      const knowledgeItems = await this.searchKnowledge({
        query,
        maxResults,
      });
      
      // 根據提供者生成回覆
      let reply: AIReplyResult;
      
      if (this.provider === AIProvider.GOOGLE) {
        reply = await this.generateReplyWithGoogle(query, history, knowledgeItems, temperature, maxTokens);
      } else {
        reply = await this.generateReplyWithOpenAI(query, history, knowledgeItems, temperature, maxTokens);
      }
      
      logger.info(`已生成 AI 回覆，置信度: ${reply.confidence}`);
      
      return reply;
    } catch (error) {
      logger.error('生成 AI 回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 使用 Google Vertex AI 生成回覆
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   * @param temperature 溫度
   * @param maxTokens 最大令牌數
   */
  private async generateReplyWithGoogle(
    query: string,
    history: Message[],
    knowledgeItems: KnowledgeItem[],
    temperature: number,
    maxTokens: number
  ): Promise<AIReplyResult> {
    try {
      // 這裡是 Google Vertex AI 的實現
      // 在實際實現中，我們需要使用 Google Vertex AI SDK
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 模擬 API 調用
      logger.info('調用 Google Vertex AI API');
      
      // 模擬回覆
      const reply: AIReplyResult = {
        reply: `這是一個使用 Google Vertex AI 生成的回覆，基於您的問題: "${query}"。我們找到了 ${knowledgeItems.length} 個相關知識項目。`,
        confidence: 0.85,
        sources: knowledgeItems.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          relevance: 0.9,
        })),
        metadata: {
          provider: AIProvider.GOOGLE,
          model: 'text-bison',
          temperature,
          maxTokens,
        },
      };
      
      return reply;
    } catch (error) {
      logger.error('使用 Google Vertex AI 生成回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 使用 OpenAI 生成回覆
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   * @param temperature 溫度
   * @param maxTokens 最大令牌數
   */
  private async generateReplyWithOpenAI(
    query: string,
    history: Message[],
    knowledgeItems: KnowledgeItem[],
    temperature: number,
    maxTokens: number
  ): Promise<AIReplyResult> {
    try {
      // 這裡是 OpenAI 的實現
      // 在實際實現中，我們需要使用 OpenAI SDK
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 模擬 API 調用
      logger.info('調用 OpenAI API');
      
      // 模擬回覆
      const reply: AIReplyResult = {
        reply: `這是一個使用 OpenAI 生成的回覆，基於您的問題: "${query}"。我們找到了 ${knowledgeItems.length} 個相關知識項目。`,
        confidence: 0.9,
        sources: knowledgeItems.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          relevance: 0.85,
        })),
        metadata: {
          provider: AIProvider.OPENAI,
          model: 'gpt-4',
          temperature,
          maxTokens,
        },
      };
      
      return reply;
    } catch (error) {
      logger.error('使用 OpenAI 生成回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 構建提示
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   */
  private buildPrompt(query: string, history: Message[], knowledgeItems: KnowledgeItem[]): string {
    // 構建系統提示
    let systemPrompt = '你是一個專業的客服助手，負責回答客戶的問題。請根據提供的知識庫和歷史對話，生成準確、有幫助的回覆。';
    
    // 添加知識庫
    let knowledgePrompt = '以下是與客戶問題相關的知識：\n\n';
    
    knowledgeItems.forEach((item, index) => {
      knowledgePrompt += `知識 ${index + 1}：${item.title}\n${item.content}\n\n`;
    });
    
    // 添加歷史對話
    let historyPrompt = '以下是與客戶的歷史對話：\n\n';
    
    history.forEach((message) => {
      const role = message.direction === MessageDirection.INBOUND ? '客戶' : '客服';
      historyPrompt += `${role}：${message.content}\n`;
    });
    
    // 添加當前問題
    const questionPrompt = `客戶：${query}\n客服：`;
    
    // 組合提示
    const prompt = `${systemPrompt}\n\n${knowledgePrompt}\n${historyPrompt}\n${questionPrompt}`;
    
    return prompt;
  }
  
  /**
   * 獲取客戶消息歷史
   * @param customerId 客戶 ID
   * @param limit 限制數量
   */
  private async getCustomerMessageHistory(customerId: string, limit = 10): Promise<Message[]> {
    try {
      // 查詢客戶消息
      const messages = await Message.findAll({
        where: {
          customerId,
        },
        limit,
        order: [['createdAt', 'DESC']],
      });
      
      // 按時間順序排序
      return messages.reverse();
    } catch (error) {
      logger.error('獲取客戶消息歷史錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 搜索知識庫
   * @param options 搜索選項
   */
  async searchKnowledge(options: KnowledgeSearchOptions): Promise<KnowledgeItem[]> {
    try {
      const {
        query,
        maxResults = 5,
        categories,
        tags,
      } = options;
      
      // 構建查詢條件
      const where: any = {};
      
      if (categories && categories.length > 0) {
        where.category = categories;
      }
      
      if (tags && tags.length > 0) {
        where.tags = { $overlap: tags };
      }
      
      // 在實際實現中，我們需要使用向量數據庫進行相似度搜索
      // 這裡簡化為使用關鍵字搜索
      
      // 查詢知識項目
      const knowledgeItems = await KnowledgeItem.findAll({
        where,
        limit: maxResults,
      });
      
      // 模擬相關性排序
      // 在實際實現中，我們需要根據向量相似度進行排序
      const sortedItems = knowledgeItems.sort((a: KnowledgeItem, b: KnowledgeItem) => {
        const aRelevance = this.calculateRelevance(a, query);
        const bRelevance = this.calculateRelevance(b, query);
        return bRelevance - aRelevance;
      });
      
      logger.info(`已搜索知識庫，找到 ${sortedItems.length} 個相關項目`);
      
      return sortedItems;
    } catch (error) {
      logger.error('搜索知識庫錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 計算相關性
   * @param item 知識項目
   * @param query 查詢
   */
  private calculateRelevance(item: KnowledgeItem, query: string): number {
    // 在實際實現中，我們需要使用向量相似度計算
    // 這裡簡化為使用關鍵字匹配
    
    const keywords = query.toLowerCase().split(/\s+/);
    const title = item.title.toLowerCase();
    const content = item.content.toLowerCase();
    
    let relevance = 0;
    
    keywords.forEach(keyword => {
      if (title.includes(keyword)) {
        relevance += 0.5;
      }
      
      if (content.includes(keyword)) {
        relevance += 0.3;
      }
    });
    
    return Math.min(relevance, 1);
  }
  
  /**
   * 評估回覆品質
   * @param reply AI 回覆
   * @param humanReply 人工回覆
   */
  async evaluateReply(reply: string, humanReply: string): Promise<number> {
    try {
      // 在實際實現中，我們需要使用 AI 模型評估回覆品質
      // 這裡簡化為使用字符串相似度
      
      // 計算相似度
      const similarity = this.calculateSimilarity(reply, humanReply);
      
      logger.info(`已評估回覆品質，相似度: ${similarity}`);
      
      return similarity;
    } catch (error) {
      logger.error('評估回覆品質錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 計算字符串相似度
   * @param a 字符串 A
   * @param b 字符串 B
   */
  private calculateSimilarity(a: string, b: string): number {
    // 在實際實現中，我們需要使用更複雜的相似度算法
    // 這裡簡化為使用 Levenshtein 距離
    
    const aLength = a.length;
    const bLength = b.length;
    
    // 如果其中一個字符串為空，則相似度為 0
    if (aLength === 0 || bLength === 0) {
      return 0;
    }
    
    // 如果兩個字符串相同，則相似度為 1
    if (a === b) {
      return 1;
    }
    
    // 計算 Levenshtein 距離
    const distance = this.levenshteinDistance(a, b);
    
    // 計算相似度
    const similarity = 1 - distance / Math.max(aLength, bLength);
    
    return similarity;
  }
  
  /**
   * 計算 Levenshtein 距離
   * @param a 字符串 A
   * @param b 字符串 B
   */
  private levenshteinDistance(a: string, b: string): number {
    const aLength = a.length;
    const bLength = b.length;
    
    // 創建距離矩陣
    const matrix: number[][] = [];
    
    // 初始化第一行
    for (let i = 0; i <= bLength; i++) {
      matrix[0] = matrix[0] || [];
      matrix[0][i] = i;
    }
    
    // 初始化第一列
    for (let i = 0; i <= aLength; i++) {
      matrix[i] = matrix[i] || [];
      matrix[i][0] = i;
    }
    
    // 填充矩陣
    for (let i = 1; i <= aLength; i++) {
      for (let j = 1; j <= bLength; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替換
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 刪除
          );
        }
      }
    }
    
    return matrix[aLength][bLength];
  }
}

export default new AIService();