import axios from 'axios';
import { Message } from '../models/Message';
import { MessageDirection } from '../types/platform';
import logger from '../utils/logger';
import apiConfigService from './api-config-service';
import aiService, { AIProvider, AIReplyResult } from './ai-service';
import embeddingService from './embedding-service';

/**
 * 語言代碼
 */
export enum LanguageCode {
  ZH_TW = 'zh-TW', // 繁體中文
  ZH_CN = 'zh-CN', // 簡體中文
  EN = 'en',       // 英文
  JA = 'ja',       // 日文
  KO = 'ko',       // 韓文
  TH = 'th',       // 泰文
  VI = 'vi',       // 越南文
}

/**
 * 情感類型
 */
export enum SentimentType {
  POSITIVE = 'positive',   // 正面
  NEUTRAL = 'neutral',     // 中性
  NEGATIVE = 'negative',   // 負面
  VERY_NEGATIVE = 'very_negative', // 非常負面
}

/**
 * 意圖類型
 */
export enum IntentType {
  QUESTION = 'question',           // 問題
  COMPLAINT = 'complaint',         // 投訴
  PURCHASE = 'purchase',           // 購買
  RETURN = 'return',               // 退貨
  EXCHANGE = 'exchange',           // 換貨
  SHIPPING = 'shipping',           // 運送
  PRODUCT_INFO = 'product_info',   // 產品信息
  PRICE_INFO = 'price_info',       // 價格信息
  GREETING = 'greeting',           // 問候
  FAREWELL = 'farewell',           // 告別
  THANKS = 'thanks',               // 感謝
  OTHER = 'other',                 // 其他
}

/**
 * 情感分析結果
 */
export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number;
  explanation: string;
}

/**
 * 意圖識別結果
 */
export interface IntentRecognitionResult {
  intent: IntentType;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    position: [number, number];
  }>;
}

/**
 * 語言檢測結果
 */
export interface LanguageDetectionResult {
  language: LanguageCode;
  confidence: number;
}

/**
 * 對話摘要結果
 */
export interface ConversationSummaryResult {
  summary: string;
  keyPoints: string[];
  customerNeeds: string[];
  actionItems: string[];
}

/**
 * 主動學習結果
 */
export interface ActiveLearningResult {
  originalReply: string;
  improvedReply: string;
  learningPoints: string[];
  confidence: number;
}

/**
 * 進階 AI 服務
 * 提供多語言支持、情感分析、主動學習、對話摘要和意圖識別等功能
 */
class AdvancedAIService {
  private googleApiKey: string = '';
  private openAIApiKey: string = '';
  
  /**
   * 構造函數
   */
  constructor() {
    logger.info('進階 AI 服務初始化');
  }
  
  /**
   * 初始化 API 金鑰
   */
  private async initApiKeys(): Promise<void> {
    try {
      this.googleApiKey = await apiConfigService.getApiConfigValue('GOOGLE_API_KEY');
      this.openAIApiKey = await apiConfigService.getApiConfigValue('OPENAI_API_KEY');
      
      logger.info('已獲取 API 金鑰');
    } catch (error) {
      logger.error('初始化 API 金鑰錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 檢測語言
   * @param text 文本
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      await this.initApiKeys();
      
      logger.info('檢測語言');
      
      // 使用 Google Cloud Translation API 檢測語言
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${this.googleApiKey}`,
        {
          q: text
        }
      );
      
      const detections = response.data.data.detections[0];
      
      if (detections && detections.length > 0) {
        const detection = detections[0];
        
        // 將 Google 語言代碼轉換為我們的語言代碼
        let language: LanguageCode;
        
        switch (detection.language) {
          case 'zh-TW':
            language = LanguageCode.ZH_TW;
            break;
          case 'zh-CN':
            language = LanguageCode.ZH_CN;
            break;
          case 'en':
            language = LanguageCode.EN;
            break;
          case 'ja':
            language = LanguageCode.JA;
            break;
          case 'ko':
            language = LanguageCode.KO;
            break;
          case 'th':
            language = LanguageCode.TH;
            break;
          case 'vi':
            language = LanguageCode.VI;
            break;
          default:
            language = LanguageCode.EN; // 默認為英文
        }
        
        return {
          language,
          confidence: detection.confidence
        };
      }
      
      // 默認為繁體中文
      return {
        language: LanguageCode.ZH_TW,
        confidence: 0.5
      };
    } catch (error) {
      logger.error('檢測語言錯誤:', error);
      
      // 發生錯誤時，默認為繁體中文
      return {
        language: LanguageCode.ZH_TW,
        confidence: 0.5
      };
    }
  }
  
  /**
   * 翻譯文本
   * @param text 文本
   * @param targetLanguage 目標語言
   * @param sourceLanguage 源語言（可選）
   */
  async translateText(text: string, targetLanguage: LanguageCode, sourceLanguage?: LanguageCode): Promise<string> {
    try {
      await this.initApiKeys();
      
      logger.info(`翻譯文本，目標語言: ${targetLanguage}`);
      
      // 使用 Google Cloud Translation API 翻譯文本
      const requestBody: any = {
        q: text,
        target: targetLanguage
      };
      
      // 如果提供了源語言，則添加到請求中
      if (sourceLanguage) {
        requestBody.source = sourceLanguage;
      }
      
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${this.googleApiKey}`,
        requestBody
      );
      
      const translations = response.data.data.translations;
      
      if (translations && translations.length > 0) {
        return translations[0].translatedText;
      }
      
      // 如果翻譯失敗，則返回原文
      return text;
    } catch (error) {
      logger.error('翻譯文本錯誤:', error);
      
      // 發生錯誤時，返回原文
      return text;
    }
  }
  
  /**
   * 分析情感
   * @param text 文本
   * @param language 語言（可選）
   */
  async analyzeSentiment(text: string, language?: LanguageCode): Promise<SentimentAnalysisResult> {
    try {
      await this.initApiKeys();
      
      logger.info('分析情感');
      
      // 如果沒有提供語言，則檢測語言
      if (!language) {
        const languageResult = await this.detectLanguage(text);
        language = languageResult.language;
      }
      
      // 使用 OpenAI API 分析情感
      const prompt = `分析以下文本的情感，並給出情感類型（正面、中性、負面或非常負面）、分數（0-1）和解釋。
文本語言: ${language}
文本: "${text}"
回覆格式:
情感類型: [情感類型]
分數: [分數]
解釋: [解釋]`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的情感分析助手，負責分析文本的情感。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const content = response.data.choices[0]?.message?.content || '';
      
      // 解析回覆
      const sentimentTypeMatch = content.match(/情感類型:\s*(.+)/);
      const scoreMatch = content.match(/分數:\s*(.+)/);
      const explanationMatch = content.match(/解釋:\s*(.+)/);
      
      let sentiment: SentimentType;
      
      // 解析情感類型
      if (sentimentTypeMatch && sentimentTypeMatch[1]) {
        const sentimentText = sentimentTypeMatch[1].toLowerCase();
        
        if (sentimentText.includes('正面')) {
          sentiment = SentimentType.POSITIVE;
        } else if (sentimentText.includes('負面')) {
          if (sentimentText.includes('非常')) {
            sentiment = SentimentType.VERY_NEGATIVE;
          } else {
            sentiment = SentimentType.NEGATIVE;
          }
        } else {
          sentiment = SentimentType.NEUTRAL;
        }
      } else {
        sentiment = SentimentType.NEUTRAL;
      }
      
      // 解析分數
      let score = 0.5;
      if (scoreMatch && scoreMatch[1]) {
        const scoreText = scoreMatch[1];
        const scoreValue = parseFloat(scoreText);
        
        if (!isNaN(scoreValue)) {
          score = scoreValue;
        }
      }
      
      // 解析解釋
      const explanation = explanationMatch && explanationMatch[1] ? explanationMatch[1] : '無法解釋情感';
      
      return {
        sentiment,
        score,
        explanation
      };
    } catch (error) {
      logger.error('分析情感錯誤:', error);
      
      // 發生錯誤時，返回中性情感
      return {
        sentiment: SentimentType.NEUTRAL,
        score: 0.5,
        explanation: '無法分析情感'
      };
    }
  }
  
  /**
   * 識別意圖
   * @param text 文本
   * @param language 語言（可選）
   */
  async recognizeIntent(text: string, language?: LanguageCode): Promise<IntentRecognitionResult> {
    try {
      await this.initApiKeys();
      
      logger.info('識別意圖');
      
      // 如果沒有提供語言，則檢測語言
      if (!language) {
        const languageResult = await this.detectLanguage(text);
        language = languageResult.language;
      }
      
      // 使用 OpenAI API 識別意圖
      const prompt = `識別以下文本的意圖，並給出意圖類型、置信度（0-1）和實體。
可能的意圖類型: 問題、投訴、購買、退貨、換貨、運送、產品信息、價格信息、問候、告別、感謝、其他
文本語言: ${language}
文本: "${text}"
回覆格式:
意圖類型: [意圖類型]
置信度: [置信度]
實體: [實體列表，每個實體包括類型、值和位置]`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的意圖識別助手，負責識別文本的意圖。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const content = response.data.choices[0]?.message?.content || '';
      
      // 解析回覆
      const intentTypeMatch = content.match(/意圖類型:\s*(.+)/);
      const confidenceMatch = content.match(/置信度:\s*(.+)/);
      const entitiesMatch = content.match(/實體:\s*(.+)/);
      
      let intent: IntentType;
      
      // 解析意圖類型
      if (intentTypeMatch && intentTypeMatch[1]) {
        const intentText = intentTypeMatch[1].toLowerCase();
        
        if (intentText.includes('問題')) {
          intent = IntentType.QUESTION;
        } else if (intentText.includes('投訴')) {
          intent = IntentType.COMPLAINT;
        } else if (intentText.includes('購買')) {
          intent = IntentType.PURCHASE;
        } else if (intentText.includes('退貨')) {
          intent = IntentType.RETURN;
        } else if (intentText.includes('換貨')) {
          intent = IntentType.EXCHANGE;
        } else if (intentText.includes('運送')) {
          intent = IntentType.SHIPPING;
        } else if (intentText.includes('產品信息')) {
          intent = IntentType.PRODUCT_INFO;
        } else if (intentText.includes('價格信息')) {
          intent = IntentType.PRICE_INFO;
        } else if (intentText.includes('問候')) {
          intent = IntentType.GREETING;
        } else if (intentText.includes('告別')) {
          intent = IntentType.FAREWELL;
        } else if (intentText.includes('感謝')) {
          intent = IntentType.THANKS;
        } else {
          intent = IntentType.OTHER;
        }
      } else {
        intent = IntentType.OTHER;
      }
      
      // 解析置信度
      let confidence = 0.5;
      if (confidenceMatch && confidenceMatch[1]) {
        const confidenceText = confidenceMatch[1];
        const confidenceValue = parseFloat(confidenceText);
        
        if (!isNaN(confidenceValue)) {
          confidence = confidenceValue;
        }
      }
      
      // 解析實體
      const entities: Array<{
        type: string;
        value: string;
        position: [number, number];
      }> = [];
      
      if (entitiesMatch && entitiesMatch[1]) {
        const entitiesText = entitiesMatch[1];
        
        // 嘗試解析實體列表
        // 這裡簡化處理，實際情況可能需要更複雜的解析邏輯
        const entityMatches = entitiesText.match(/類型:([^,]+),\s*值:([^,]+),\s*位置:\[(\d+),\s*(\d+)\]/g);
        
        if (entityMatches) {
          entityMatches.forEach(entityMatch => {
            const typeMatch = entityMatch.match(/類型:([^,]+)/);
            const valueMatch = entityMatch.match(/值:([^,]+)/);
            const positionMatch = entityMatch.match(/位置:\[(\d+),\s*(\d+)\]/);
            
            if (typeMatch && valueMatch && positionMatch) {
              entities.push({
                type: typeMatch[1].trim(),
                value: valueMatch[1].trim(),
                position: [parseInt(positionMatch[1]), parseInt(positionMatch[2])]
              });
            }
          });
        }
      }
      
      return {
        intent,
        confidence,
        entities
      };
    } catch (error) {
      logger.error('識別意圖錯誤:', error);
      
      // 發生錯誤時，返回其他意圖
      return {
        intent: IntentType.OTHER,
        confidence: 0.5,
        entities: []
      };
    }
  }
  
  /**
   * 生成對話摘要
   * @param customerId 客戶 ID
   * @param limit 消息數量限制
   */
  async generateConversationSummary(customerId: string, limit = 20): Promise<ConversationSummaryResult> {
    try {
      await this.initApiKeys();
      
      logger.info('生成對話摘要');
      
      // 獲取客戶消息歷史
      const messages = await this.getCustomerMessageHistory(customerId, limit);
      
      if (messages.length === 0) {
        return {
          summary: '沒有對話歷史',
          keyPoints: [],
          customerNeeds: [],
          actionItems: []
        };
      }
      
      // 構建對話歷史文本
      let conversationText = '對話歷史：\n';
      
      messages.forEach((message, index) => {
        const role = message.direction === MessageDirection.INBOUND ? '客戶' : '客服';
        const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '未知時間';
        conversationText += `[${time}] ${role}：${message.content}\n`;
      });
      
      // 使用 OpenAI API 生成摘要
      const prompt = `根據以下對話歷史，生成一個簡潔的摘要，並提取關鍵點、客戶需求和行動項目。
${conversationText}
回覆格式:
摘要: [摘要]
關鍵點:
- [關鍵點1]
- [關鍵點2]
...
客戶需求:
- [需求1]
- [需求2]
...
行動項目:
- [行動項目1]
- [行動項目2]
...`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的對話摘要助手，負責生成對話摘要。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const content = response.data.choices[0]?.message?.content || '';
      
      // 解析回覆
      const summaryMatch = content.match(/摘要:\s*(.+?)(?=\n關鍵點:|$)/s);
      const keyPointsMatch = content.match(/關鍵點:\n((?:- .+\n)+)(?=客戶需求:|$)/s);
      const customerNeedsMatch = content.match(/客戶需求:\n((?:- .+\n)+)(?=行動項目:|$)/s);
      const actionItemsMatch = content.match(/行動項目:\n((?:- .+\n)+)(?=$)/s);
      
      // 解析摘要
      const summary = summaryMatch && summaryMatch[1] ? summaryMatch[1].trim() : '無法生成摘要';
      
      // 解析關鍵點
      const keyPoints: string[] = [];
      if (keyPointsMatch && keyPointsMatch[1]) {
        const keyPointsText = keyPointsMatch[1];
        const keyPointMatches = keyPointsText.match(/- (.+)/g);
        
        if (keyPointMatches) {
          keyPointMatches.forEach(keyPointMatch => {
            const keyPoint = keyPointMatch.replace(/^- /, '').trim();
            if (keyPoint) {
              keyPoints.push(keyPoint);
            }
          });
        }
      }
      
      // 解析客戶需求
      const customerNeeds: string[] = [];
      if (customerNeedsMatch && customerNeedsMatch[1]) {
        const customerNeedsText = customerNeedsMatch[1];
        const customerNeedMatches = customerNeedsText.match(/- (.+)/g);
        
        if (customerNeedMatches) {
          customerNeedMatches.forEach(customerNeedMatch => {
            const customerNeed = customerNeedMatch.replace(/^- /, '').trim();
            if (customerNeed) {
              customerNeeds.push(customerNeed);
            }
          });
        }
      }
      
      // 解析行動項目
      const actionItems: string[] = [];
      if (actionItemsMatch && actionItemsMatch[1]) {
        const actionItemsText = actionItemsMatch[1];
        const actionItemMatches = actionItemsText.match(/- (.+)/g);
        
        if (actionItemMatches) {
          actionItemMatches.forEach(actionItemMatch => {
            const actionItem = actionItemMatch.replace(/^- /, '').trim();
            if (actionItem) {
              actionItems.push(actionItem);
            }
          });
        }
      }
      
      return {
        summary,
        keyPoints,
        customerNeeds,
        actionItems
      };
    } catch (error) {
      logger.error('生成對話摘要錯誤:', error);
      
      // 發生錯誤時，返回空摘要
      return {
        summary: '無法生成摘要',
        keyPoints: [],
        customerNeeds: [],
        actionItems: []
      };
    }
  }
  
  /**
   * 主動學習
   * @param originalReply 原始回覆
   * @param humanReply 人工回覆
   * @param query 查詢
   */
  async activeLearning(originalReply: string, humanReply: string, query: string): Promise<ActiveLearningResult> {
    try {
      await this.initApiKeys();
      
      logger.info('主動學習');
      
      // 使用 OpenAI API 進行主動學習
      const prompt = `分析以下原始 AI 回覆和人工修改後的回覆，學習如何改進 AI 回覆。
查詢: "${query}"
原始 AI 回覆: "${originalReply}"
人工修改後的回覆: "${humanReply}"
請分析人工修改的內容，提取學習點，並生成一個改進後的回覆模板。
回覆格式:
學習點:
- [學習點1]
- [學習點2]
...
改進後的回覆: [改進後的回覆模板]
置信度: [置信度]`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的主動學習助手，負責分析人工修改的回覆，提取學習點。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const content = response.data.choices[0]?.message?.content || '';
      
      // 解析回覆
      const learningPointsMatch = content.match(/學習點:\n((?:- .+\n)+)(?=改進後的回覆:|$)/s);
      const improvedReplyMatch = content.match(/改進後的回覆:\s*(.+?)(?=\n置信度:|$)/s);
      const confidenceMatch = content.match(/置信度:\s*(.+)/);
      
      // 解析學習點
      const learningPoints: string[] = [];
      if (learningPointsMatch && learningPointsMatch[1]) {
        const learningPointsText = learningPointsMatch[1];
        const learningPointMatches = learningPointsText.match(/- (.+)/g);
        
        if (learningPointMatches) {
          learningPointMatches.forEach(learningPointMatch => {
            const learningPoint = learningPointMatch.replace(/^- /, '').trim();
            if (learningPoint) {
              learningPoints.push(learningPoint);
            }
          });
        }
      }
      
      // 解析改進後的回覆
      const improvedReply = improvedReplyMatch && improvedReplyMatch[1] ? improvedReplyMatch[1].trim() : humanReply;
      
      // 解析置信度
      let confidence = 0.5;
      if (confidenceMatch && confidenceMatch[1]) {
        const confidenceText = confidenceMatch[1];
        const confidenceValue = parseFloat(confidenceText);
        
        if (!isNaN(confidenceValue)) {
          confidence = confidenceValue;
        }
      }
      
      // 將學習點保存到向量數據庫
      await this.saveLearningPoints(query, learningPoints, improvedReply);
      
      return {
        originalReply,
        improvedReply,
        learningPoints,
        confidence
      };
    } catch (error) {
      logger.error('主動學習錯誤:', error);
      
      // 發生錯誤時，返回原始回覆
      return {
        originalReply,
        improvedReply: humanReply,
        learningPoints: [],
        confidence: 0.5
      };
    }
  }
  
  /**
   * 保存學習點
   * @param query 查詢
   * @param learningPoints 學習點
   * @param improvedReply 改進後的回覆
   */
  private async saveLearningPoints(query: string, learningPoints: string[], improvedReply: string): Promise<void> {
    try {
      // 將學習點和改進後的回覆組合成一個知識項目
      const title = `學習點: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`;
      const content = `查詢: ${query}\n\n學習點:\n${learningPoints.map(point => `- ${point}`).join('\n')}\n\n改進後的回覆: ${improvedReply}`;
      const category = '主動學習';
      const tags = ['學習點', '改進', '主動學習'];
      
      // 創建知識項目
      await embeddingService.createEmbeddingForText({
        title,
        content,
        category,
        tags,
        source: '主動學習系統',
        sourceUrl: '',
      });
      
      logger.info('已保存學習點到向量數據庫');
    } catch (error) {
      logger.error('保存學習點錯誤:', error);
      throw error;
    }
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
   * 根據情感調整回覆
   * @param reply 原始回覆
   * @param sentiment 情感分析結果
   */
  async adjustReplyBySentiment(reply: string, sentiment: SentimentAnalysisResult): Promise<string> {
    try {
      await this.initApiKeys();
      
      logger.info(`根據情感調整回覆，情感類型: ${sentiment.sentiment}`);
      
      // 根據情感類型調整回覆
      let adjustmentPrompt = '';
      
      switch (sentiment.sentiment) {
        case SentimentType.POSITIVE:
          adjustmentPrompt = '客戶情緒積極，保持友好和熱情的語氣，可以適當表達感謝。';
          break;
        case SentimentType.NEUTRAL:
          adjustmentPrompt = '客戶情緒中性，保持專業和信息豐富的語氣。';
          break;
        case SentimentType.NEGATIVE:
          adjustmentPrompt = '客戶情緒負面，表示理解和同理心，提供具體的解決方案，避免使用過於歡快的語氣。';
          break;
        case SentimentType.VERY_NEGATIVE:
          adjustmentPrompt = '客戶情緒非常負面，表示深刻的理解和同理心，提供明確的解決方案，使用安撫的語氣，避免任何可能被視為輕率的表達。';
          break;
      }
      
      // 使用 OpenAI API 調整回覆
      const prompt = `根據以下情感分析結果，調整回覆的語氣和內容。
情感類型: ${sentiment.sentiment}
情感分數: ${sentiment.score}
情感解釋: ${sentiment.explanation}
調整指導: ${adjustmentPrompt}
原始回覆: "${reply}"
請調整回覆，使其更適合客戶的情緒狀態，但保留原始回覆的主要信息和解決方案。`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的客服助手，負責根據客戶情緒調整回覆。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const adjustedReply = response.data.choices[0]?.message?.content || reply;
      
      return adjustedReply;
    } catch (error) {
      logger.error('根據情感調整回覆錯誤:', error);
      
      // 發生錯誤時，返回原始回覆
      return reply;
    }
  }
  
  /**
   * 根據意圖調整回覆
   * @param reply 原始回覆
   * @param intent 意圖識別結果
   */
  async adjustReplyByIntent(reply: string, intent: IntentRecognitionResult): Promise<string> {
    try {
      await this.initApiKeys();
      
      logger.info(`根據意圖調整回覆，意圖類型: ${intent.intent}`);
      
      // 根據意圖類型調整回覆
      let adjustmentPrompt = '';
      
      switch (intent.intent) {
        case IntentType.QUESTION:
          adjustmentPrompt = '客戶提出問題，提供清晰、直接的答案，並確保回覆完整解答了問題。';
          break;
        case IntentType.COMPLAINT:
          adjustmentPrompt = '客戶投訴，表示理解和歉意，提供具體的解決方案，並承諾跟進。';
          break;
        case IntentType.PURCHASE:
          adjustmentPrompt = '客戶有購買意向，提供產品信息和購買流程，鼓勵完成購買。';
          break;
        case IntentType.RETURN:
          adjustmentPrompt = '客戶想退貨，提供退貨流程和政策，表示理解並提供協助。';
          break;
        case IntentType.EXCHANGE:
          adjustmentPrompt = '客戶想換貨，提供換貨流程和政策，表示理解並提供協助。';
          break;
        case IntentType.SHIPPING:
          adjustmentPrompt = '客戶詢問運送相關問題，提供運送信息和追蹤方式，表示理解並提供協助。';
          break;
        case IntentType.PRODUCT_INFO:
          adjustmentPrompt = '客戶詢問產品信息，提供詳細的產品描述和特點，強調產品優勢。';
          break;
        case IntentType.PRICE_INFO:
          adjustmentPrompt = '客戶詢問價格信息，提供明確的價格和可能的折扣，強調價值。';
          break;
        case IntentType.GREETING:
          adjustmentPrompt = '客戶問候，回應問候並詢問如何提供幫助。';
          break;
        case IntentType.FAREWELL:
          adjustmentPrompt = '客戶告別，表示感謝並提供進一步協助的可能性。';
          break;
        case IntentType.THANKS:
          adjustmentPrompt = '客戶表示感謝，回應感謝並提供進一步協助的可能性。';
          break;
        default:
          adjustmentPrompt = '保持專業和信息豐富的語氣，確保回覆有幫助。';
      }
      
      // 使用 OpenAI API 調整回覆
      const prompt = `根據以下意圖識別結果，調整回覆的內容和結構。
意圖類型: ${intent.intent}
置信度: ${intent.confidence}
實體: ${JSON.stringify(intent.entities)}
調整指導: ${adjustmentPrompt}
原始回覆: "${reply}"
請調整回覆，使其更適合客戶的意圖，但保留原始回覆的主要信息和解決方案。`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一個專業的客服助手，負責根據客戶意圖調整回覆。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openAIApiKey}`
          }
        }
      );
      
      const adjustedReply = response.data.choices[0]?.message?.content || reply;
      
      return adjustedReply;
    } catch (error) {
      logger.error('根據意圖調整回覆錯誤:', error);
      
      // 發生錯誤時，返回原始回覆
      return reply;
    }
  }
  
  /**
   * 生成多語言回覆
   * @param reply 原始回覆
   * @param targetLanguage 目標語言
   */
  async generateMultilingualReply(reply: string, targetLanguage: LanguageCode): Promise<string> {
    try {
      // 檢測原始回覆的語言
      const languageResult = await this.detectLanguage(reply);
      const sourceLanguage = languageResult.language;
      
      // 如果原始回覆已經是目標語言，則直接返回
      if (sourceLanguage === targetLanguage) {
        return reply;
      }
      
      // 翻譯回覆
      const translatedReply = await this.translateText(reply, targetLanguage, sourceLanguage);
      
      return translatedReply;
    } catch (error) {
      logger.error('生成多語言回覆錯誤:', error);
      
      // 發生錯誤時，返回原始回覆
      return reply;
    }
  }
  
  /**
   * 生成增強回覆
   * @param query 查詢
   * @param customerId 客戶 ID
   */
  async generateEnhancedReply(query: string, customerId: string): Promise<AIReplyResult> {
    try {
      // 檢測查詢語言
      const languageResult = await this.detectLanguage(query);
      const language = languageResult.language;
      
      // 分析情感
      const sentimentResult = await this.analyzeSentiment(query, language);
      
      // 識別意圖
      const intentResult = await this.recognizeIntent(query, language);
      
      // 生成基本回覆
      const replyResult = await aiService.generateReply({
        customerId,
        messageId: '',
        query,
      });
      
      // 根據情感調整回覆
      let enhancedReply = await this.adjustReplyBySentiment(replyResult.reply, sentimentResult);
      
      // 根據意圖調整回覆
      enhancedReply = await this.adjustReplyByIntent(enhancedReply, intentResult);
      
      // 如果查詢語言不是繁體中文，則生成多語言回覆
      if (language !== LanguageCode.ZH_TW) {
        enhancedReply = await this.generateMultilingualReply(enhancedReply, language);
      }
      
      // 更新回覆結果
      replyResult.reply = enhancedReply;
      replyResult.metadata = {
        ...replyResult.metadata,
        language,
        sentiment: sentimentResult,
        intent: intentResult,
      };
      
      return replyResult;
    } catch (error) {
      logger.error('生成增強回覆錯誤:', error);
      throw error;
    }
  }
}

export default new AdvancedAIService();
