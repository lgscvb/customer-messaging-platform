import { VertexAI } from '@google-cloud/vertexai';
import axios from 'axios';
import KnowledgeItem from '../models/KnowledgeItem';
import { Message } from '../models/Message';
import { MessageDirection } from '../types/platform';
import logger from '../utils/logger';
import apiConfigService from './api-config-service';
import embeddingService from './embedding-service';

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
  private vertexAI: VertexAI | null = null;
  private openAIApiKey: string = '';
  private openAIModel: string;
  private googleModel: string;
  
  /**
   * 構造函數
   */
  constructor() {
    // 從環境變量獲取 AI 提供者
    this.provider = (process.env.AI_PROVIDER as AIProvider) || AIProvider.GOOGLE;
    
    // 設置模型名稱
    this.openAIModel = process.env.OPENAI_MODEL || 'gpt-4';
    this.googleModel = process.env.GOOGLE_MODEL || 'gemini-pro';
    
    logger.info(`AI 服務初始化，使用提供者: ${this.provider}`);
  }
  
  /**
   * 初始化 AI 模型
   */
  private async initAIModel(): Promise<void> {
    try {
      if (this.provider === AIProvider.GOOGLE && !this.vertexAI) {
        // 獲取 Google API 配置
        const projectId = await apiConfigService.getApiConfigValue('GOOGLE_PROJECT_ID');
        const location = await apiConfigService.getApiConfigValue('GOOGLE_LOCATION', 'us-central1');
        
        // 初始化 Google Vertex AI
        this.vertexAI = new VertexAI({
          project: projectId,
          location: location,
        });
        
        logger.info('已初始化 Google Vertex AI');
      } else if (this.provider === AIProvider.OPENAI) {
        // 獲取 OpenAI API 配置
        this.openAIApiKey = await apiConfigService.getApiConfigValue('OPENAI_API_KEY');
        
        logger.info('已獲取 OpenAI API 金鑰');
      }
    } catch (error) {
      logger.error('初始化 AI 模型錯誤:', error);
      throw error;
    }
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
      
      // 使用向量搜索相關知識
      const searchResults = await embeddingService.searchSimilarKnowledgeItems(query, maxResults);
      const knowledgeItems = searchResults.map(result => result.knowledgeItem);
      
      // 根據提供者生成回覆
      let reply: AIReplyResult;
      
      // 初始化 AI 模型
      await this.initAIModel();
      
      if (this.provider === AIProvider.GOOGLE && this.vertexAI) {
        reply = await this.generateReplyWithGoogle(query, history, knowledgeItems, temperature, maxTokens);
      } else if (this.provider === AIProvider.OPENAI) {
        reply = await this.generateReplyWithOpenAI(query, history, knowledgeItems, temperature, maxTokens);
      } else {
        throw new Error('AI 模型未初始化');
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
      if (!this.vertexAI) {
        throw new Error('Google Vertex AI 未初始化');
      }
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 使用 Google Vertex AI 生成回覆
      logger.info('調用 Google Vertex AI API');
      
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.googleModel,
      });
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        },
      });
      
      const response = result.response;
      let generatedText = '';
      
      if (response && response.candidates && response.candidates.length > 0 &&
          response.candidates[0].content && response.candidates[0].content.parts &&
          response.candidates[0].content.parts.length > 0) {
        generatedText = response.candidates[0].content.parts[0].text || '';
      }
      
      // 計算置信度（基於回覆長度和知識項目數量）
      const confidence = Math.min(
        0.95,
        0.7 + (generatedText.length / 1000) * 0.1 + (knowledgeItems.length / 10) * 0.1
      );
      
      // 構建回覆
      const reply: AIReplyResult = {
        reply: generatedText || `無法生成回覆，請稍後再試。`,
        confidence,
        sources: knowledgeItems.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          relevance: 0.9, // 這裡可以使用實際的相關性分數
        })),
        metadata: {
          provider: AIProvider.GOOGLE,
          model: this.googleModel,
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
      if (!this.openAIApiKey) {
        throw new Error('OpenAI API 金鑰未設置');
      }
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 使用 OpenAI API 生成回覆
      logger.info('調用 OpenAI API');
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.openAIModel,
          messages: [
            { role: 'system', content: '你是一個專業的客服助手，負責回答客戶的問題。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const chatCompletion = response.data;
      
      const generatedText = chatCompletion.choices[0]?.message?.content || '';
      
      // 計算置信度（基於回覆長度和知識項目數量）
      const confidence = Math.min(
        0.95,
        0.7 + (generatedText.length / 1000) * 0.1 + (knowledgeItems.length / 10) * 0.1
      );
      
      // 構建回覆
      const reply: AIReplyResult = {
        reply: generatedText,
        confidence,
        sources: knowledgeItems.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          relevance: 0.85, // 這裡可以使用實際的相關性分數
        })),
        metadata: {
          provider: AIProvider.OPENAI,
          model: this.openAIModel,
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
      
      // 使用向量搜索
      const searchResults = await embeddingService.searchSimilarKnowledgeItems(query, maxResults);
      
      // 過濾分類和標籤（如果指定）
      let filteredResults = searchResults;
      
      if (categories && categories.length > 0) {
        filteredResults = filteredResults.filter(result =>
          categories.includes(result.knowledgeItem.category)
        );
      }
      
      if (tags && tags.length > 0) {
        filteredResults = filteredResults.filter(result =>
          result.knowledgeItem.tags.some(tag => tags.includes(tag))
        );
      }
      
      // 提取知識項目
      const knowledgeItems = filteredResults.map(result => result.knowledgeItem);
      
      logger.info(`已搜索知識庫，找到 ${knowledgeItems.length} 個相關項目`);
      
      return knowledgeItems;
    } catch (error) {
      logger.error('搜索知識庫錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 計算相關性（已棄用，使用向量相似度代替）
   * @param item 知識項目
   * @param query 查詢
   * @deprecated
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