import { VertexAI } from '@google-cloud/vertexai';
import axios from 'axios';
import KnowledgeItem from '../models/KnowledgeItem';
import { Message } from '../models/Message';
import { MessageDirection } from '../types/platform';
import logger from '../utils/logger';
import apiConfigService from './api-config-service';
import embeddingService from './embedding-service';

/**
 * 擴展 KnowledgeItem 類型，添加相關性分數
 */
interface KnowledgeItemWithRelevance {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance: number;
  [key: string]: any;
}

/**
 * AI 提供者類型
 */
export enum AIProvider {
  GOOGLE = 'google',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  LLAMA = 'llama',
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
  private shouldAutoSelectModel: boolean;
  private vertexAI: VertexAI | null = null;
  private openAIApiKey: string = '';
  private claudeApiKey: string = '';
  private llamaApiKey: string = '';
  private openAIModel: string;
  private googleModel: string;
  private claudeModel: string;
  private llamaModel: string;
  
  /**
   * 構造函數
   */
  constructor() {
    // 從環境變量獲取 AI 提供者
    this.provider = (process.env.AI_PROVIDER as AIProvider) || AIProvider.GOOGLE;
    
    // 設置是否自動選擇模型
    this.shouldAutoSelectModel = process.env.AUTO_SELECT_MODEL === 'true';
    
    // 設置模型名稱
    this.openAIModel = process.env.OPENAI_MODEL || 'gpt-4';
    this.googleModel = process.env.GOOGLE_MODEL || 'gemini-pro';
    this.claudeModel = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229';
    this.llamaModel = process.env.LLAMA_MODEL || 'llama-3-70b-instruct';
    
    logger.info(`AI 服務初始化，使用提供者: ${this.provider}，自動選擇模型: ${this.shouldAutoSelectModel}`);
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
      } else if (this.provider === AIProvider.CLAUDE) {
        // 獲取 Claude API 配置
        this.claudeApiKey = await apiConfigService.getApiConfigValue('CLAUDE_API_KEY');
        
        logger.info('已獲取 Claude API 金鑰');
      } else if (this.provider === AIProvider.LLAMA) {
        // 獲取 Llama API 配置
        this.llamaApiKey = await apiConfigService.getApiConfigValue('LLAMA_API_KEY');
        
        logger.info('已獲取 Llama API 金鑰');
      }
    } catch (error) {
      logger.error('初始化 AI 模型錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據查詢和知識項目選擇最合適的 AI 模型
   * @param query 查詢
   * @param knowledgeItems 知識項目
   * @returns 選擇的 AI 提供者
   */
  private selectBestModel(query: string, knowledgeItems: KnowledgeItemWithRelevance[]): AIProvider {
    // 計算查詢的複雜性分數
    const queryComplexity = this.calculateQueryComplexity(query);
    
    // 計算知識項目的數量和平均相關性
    const knowledgeCount = knowledgeItems.length;
    const avgRelevance = knowledgeItems.length > 0
      ? knowledgeItems.reduce((sum, item) => sum + item.relevance, 0) / knowledgeItems.length
      : 0;
    
    // 根據複雜性和知識項目選擇模型
    if (queryComplexity > 0.8 || (knowledgeCount > 3 && avgRelevance < 0.5)) {
      // 高複雜性查詢或大量低相關性知識項目，使用最強大的模型
      return AIProvider.CLAUDE;
    } else if (queryComplexity > 0.5 || knowledgeCount > 5) {
      // 中等複雜性查詢或較多知識項目，使用較強大的模型
      return AIProvider.OPENAI;
    } else if (queryComplexity > 0.3 || (knowledgeCount > 0 && avgRelevance > 0.7)) {
      // 低複雜性查詢或少量高相關性知識項目，使用中等模型
      return AIProvider.GOOGLE;
    } else {
      // 簡單查詢或無知識項目，使用最基本的模型
      return AIProvider.LLAMA;
    }
  }
  
  /**
   * 計算查詢的複雜性分數
   * @param query 查詢
   * @returns 複雜性分數 (0-1)
   */
  private calculateQueryComplexity(query: string): number {
    // 計算查詢長度的複雜性
    const lengthComplexity = Math.min(query.length / 200, 0.5);
    
    // 計算查詢中特殊字符和數字的複雜性
    const specialCharsCount = (query.match(/[^\w\s]/g) || []).length;
    const specialCharsComplexity = Math.min(specialCharsCount / 10, 0.2);
    
    // 計算查詢中句子數量的複雜性
    const sentenceCount = (query.match(/[.!?。！？]/g) || []).length + 1;
    const sentenceComplexity = Math.min(sentenceCount / 5, 0.3);
    
    // 計算總複雜性分數
    const totalComplexity = lengthComplexity + specialCharsComplexity + sentenceComplexity;
    
    return Math.min(totalComplexity, 1);
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
      
      // 將 KnowledgeItem 轉換為 KnowledgeItemWithRelevance
      const knowledgeItems: KnowledgeItemWithRelevance[] = searchResults.map(result => {
        const item = result.knowledgeItem;
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          tags: item.tags || [],
          relevance: result.similarity,
          source: item.source,
          sourceUrl: item.sourceUrl,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
      
      // 初始化 AI 模型
      await this.initAIModel();
      
      // 選擇最佳模型或使用預設模型
      const selectedProvider = this.shouldAutoSelectModel
        ? this.selectBestModel(query, knowledgeItems)
        : this.provider;
      
      logger.info(`使用 AI 提供者: ${selectedProvider}${this.shouldAutoSelectModel ? ' (自動選擇)' : ''}`);
      
      // 根據提供者生成回覆
      let reply: AIReplyResult;
      
      if (selectedProvider === AIProvider.GOOGLE && this.vertexAI) {
        reply = await this.generateReplyWithGoogle(query, history, knowledgeItems, temperature, maxTokens);
      } else if (selectedProvider === AIProvider.OPENAI) {
        reply = await this.generateReplyWithOpenAI(query, history, knowledgeItems, temperature, maxTokens);
      } else if (selectedProvider === AIProvider.CLAUDE) {
        reply = await this.generateReplyWithClaude(query, history, knowledgeItems, temperature, maxTokens);
      } else if (selectedProvider === AIProvider.LLAMA) {
        reply = await this.generateReplyWithLlama(query, history, knowledgeItems, temperature, maxTokens);
      } else {
        throw new Error('AI 模型未初始化');
      }
      
      // 後處理回覆，提高質量
      reply.reply = this.postProcessReply(reply.reply, query);
      
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
    knowledgeItems: KnowledgeItemWithRelevance[],
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
          relevance: item.relevance,
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
    knowledgeItems: KnowledgeItemWithRelevance[],
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
          relevance: item.relevance,
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
   * 使用 Claude 生成回覆
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   * @param temperature 溫度
   * @param maxTokens 最大令牌數
   */
  private async generateReplyWithClaude(
    query: string,
    history: Message[],
    knowledgeItems: KnowledgeItemWithRelevance[],
    temperature: number,
    maxTokens: number
  ): Promise<AIReplyResult> {
    try {
      if (!this.claudeApiKey) {
        throw new Error('Claude API 金鑰未設置');
      }
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 使用 Claude API 生成回覆
      logger.info('調用 Claude API');
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.claudeModel,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      const generatedText = response.data.content?.[0]?.text || '';
      
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
          relevance: item.relevance,
        })),
        metadata: {
          provider: AIProvider.CLAUDE,
          model: this.claudeModel,
          temperature,
          maxTokens,
        },
      };
      
      return reply;
    } catch (error) {
      logger.error('使用 Claude 生成回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 使用 Llama 生成回覆
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   * @param temperature 溫度
   * @param maxTokens 最大令牌數
   */
  private async generateReplyWithLlama(
    query: string,
    history: Message[],
    knowledgeItems: KnowledgeItemWithRelevance[],
    temperature: number,
    maxTokens: number
  ): Promise<AIReplyResult> {
    try {
      if (!this.llamaApiKey) {
        throw new Error('Llama API 金鑰未設置');
      }
      
      // 構建提示
      const prompt = this.buildPrompt(query, history, knowledgeItems);
      
      // 使用 Llama API 生成回覆
      logger.info('調用 Llama API');
      
      // 假設 Llama API 使用類似 OpenAI 的接口
      const response = await axios.post(
        'https://api.llama-api.com/v1/chat/completions',
        {
          model: this.llamaModel,
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
            'Authorization': `Bearer ${this.llamaApiKey}`
          }
        }
      );
      
      const generatedText = response.data.choices?.[0]?.message?.content || '';
      
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
          relevance: item.relevance,
        })),
        metadata: {
          provider: AIProvider.LLAMA,
          model: this.llamaModel,
          temperature,
          maxTokens,
        },
      };
      
      return reply;
    } catch (error) {
      logger.error('使用 Llama 生成回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 後處理回覆，提高質量
   * @param reply 原始回覆
   * @param query 原始查詢
   */
  private postProcessReply(reply: string, query: string): string {
    if (!reply) return '很抱歉，我無法生成回覆。請稍後再試。';
    
    let processedReply = reply;
    
    // 1. 修復常見格式問題
    
    // 移除多餘的空行
    processedReply = processedReply.replace(/\n{3,}/g, '\n\n');
    
    // 確保段落之間有適當的空行
    processedReply = processedReply.replace(/([。！？」』）])\n([^#\d\-*•])/g, '$1\n\n$2');
    
    // 修復缺少的標點符號
    processedReply = processedReply.replace(/([^。！？」』）])\n\n/g, '$1。\n\n');
    
    // 2. 改進列表格式
    
    // 確保數字列表格式一致
    processedReply = processedReply.replace(/^\s*(\d+)[.、]\s*/gm, '$1. ');
    
    // 確保項目符號列表格式一致
    processedReply = processedReply.replace(/^\s*[•·]\s*/gm, '• ');
    
    // 3. 添加適當的結束語（如果沒有）
    
    const commonEndings = [
      '希望以上信息對您有所幫助',
      '如果您有任何其他問題',
      '還有其他問題嗎',
      '祝您',
      '感謝您的詢問'
    ];
    
    const hasEnding = commonEndings.some(ending => 
      processedReply.toLowerCase().includes(ending.toLowerCase())
    );
    
    if (!hasEnding) {
      processedReply += '\n\n希望以上信息對您有所幫助。如果您有任何其他問題，請隨時詢問。';
    }
    
    // 4. 確保回覆與問題相關
    
    // 檢查回覆是否包含查詢中的關鍵詞
    const queryKeywords = query
      .replace(/[，。？！、：；""''（）]/g, ' ')
      .split(' ')
      .filter(word => word.length > 1);
    
    const containsKeywords = queryKeywords.some(keyword => 
      processedReply.includes(keyword)
    );
    
    // 如果回覆似乎與問題無關，添加一個過渡語句
    if (queryKeywords.length > 0 && !containsKeywords) {
      const transitionPhrase = `關於您詢問的「${query}」，`;
      processedReply = transitionPhrase + processedReply;
    }
    
    return processedReply;
  }
  
  /**
   * 構建提示
   * @param query 查詢
   * @param history 歷史消息
   * @param knowledgeItems 知識項目
   */
  private buildPrompt(query: string, history: Message[], knowledgeItems: KnowledgeItemWithRelevance[]): string {
    // 構建系統提示
    let systemPrompt = `你是一個專業的客服助手，負責回答客戶的問題。你的目標是提供準確、有幫助且專業的回覆。
請遵循以下指導原則：
1. 始終基於提供的知識庫內容回答問題，不要編造信息
2. 如果知識庫中沒有相關信息，請誠實地表示你無法提供具體答案，並建議客戶聯繫人工客服
3. 保持禮貌、專業和同理心
4. 回覆應簡潔明了，避免不必要的冗長
5. 優先使用相關性較高的知識來回答問題
6. 考慮對話歷史和上下文，保持連貫性
7. 使用正式但友好的語氣
8. 如果客戶問題涉及多個方面，請有條理地分點回答`;
    
    // 添加知識庫（帶相關性分數）
    let knowledgePrompt = '以下是與客戶問題相關的知識（按相關性排序）：\n\n';
    
    // 假設知識項目已經按相關性排序
    knowledgeItems.forEach((item, index) => {
      // 使用項目的相關性分數
      const relevance = item.relevance.toFixed(2);
      knowledgePrompt += `知識 ${index + 1} [相關性: ${relevance}]：\n標題: ${item.title}\n內容: ${item.content}\n分類: ${item.category || '未分類'}\n標籤: ${item.tags?.join(', ') || '無標籤'}\n\n`;
    });
    
    // 添加歷史對話（限制最近的對話，避免提示過長）
    let historyPrompt = '以下是與客戶的最近對話歷史（按時間順序）：\n\n';
    
    // 只取最近的 5 條消息
    const recentHistory = history.slice(-5);
    recentHistory.forEach((message) => {
      const role = message.direction === MessageDirection.INBOUND ? '客戶' : '客服';
      const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '未知時間';
      historyPrompt += `[${time}] ${role}：${message.content}\n`;
    });
    
    // 添加當前問題
    const questionPrompt = `當前問題 [${new Date().toLocaleTimeString()}]：\n客戶：${query}\n\n請根據以上信息生成專業的回覆：\n`;
    
    // 添加回覆格式指導
    const formatPrompt = `
回覆格式指導：
1. 如果需要引用知識庫中的具體信息，請明確指出
2. 如果客戶問題涉及多個方面，請使用編號列表回答
3. 如果回覆包含步驟或流程，請使用有序列表
4. 適當使用段落分隔不同主題
5. 回覆結尾可以詢問客戶是否還有其他問題或需要進一步說明`;
    
    // 組合提示
    const prompt = `${systemPrompt}\n\n${formatPrompt}\n\n${knowledgePrompt}\n${historyPrompt}\n${questionPrompt}`;
    
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