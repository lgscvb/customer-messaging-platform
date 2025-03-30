import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import logger from '../utils/logger';
import knowledgeService from './knowledge-service';

/**
 * 對話訊息接口
 */
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'customer' | 'agent' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * 對話接口
 */
export interface Conversation {
  id: string;
  customerId: string;
  platformId: string;
  messages: Message[];
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

/**
 * 知識提取結果接口
 */
export interface KnowledgeExtractionResult {
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  confidence: number;
  extractedFrom: {
    conversationId: string;
    messageIds: string[];
  };
}

/**
 * 知識提取服務
 * 負責從客服對話中提取有價值的知識，並將其添加到知識庫中
 */
class KnowledgeExtractionService {
  private llm: OpenAI;
  
  constructor() {
    // 初始化 OpenAI 模型
    this.llm = new OpenAI({
      modelName: 'gpt-4', // 或使用其他模型
      temperature: 0.2, // 使用較低的溫度以獲得更確定性的結果
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * 從對話中提取知識
   * @param conversation 對話
   */
  async extractKnowledgeFromConversation(conversation: Conversation): Promise<KnowledgeExtractionResult[]> {
    try {
      logger.info(`開始從對話 ${conversation.id} 中提取知識`);
      
      // 1. 將對話轉換為文本
      const conversationText = this.convertConversationToText(conversation);
      
      // 2. 使用 LLM 提取知識
      const extractedKnowledge = await this.extractKnowledgeWithLLM(conversationText, conversation.id);
      
      logger.info(`從對話 ${conversation.id} 中提取了 ${extractedKnowledge.length} 條知識`);
      
      return extractedKnowledge;
    } catch (error) {
      logger.error('從對話中提取知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 將提取的知識保存到知識庫
   * @param extractionResults 提取結果
   * @param userId 用戶 ID
   */
  async saveExtractedKnowledge(extractionResults: KnowledgeExtractionResult[], userId: string): Promise<string[]> {
    try {
      logger.info(`開始保存 ${extractionResults.length} 條提取的知識`);
      
      const savedIds: string[] = [];
      
      // 遍歷提取結果，保存到知識庫
      for (const result of extractionResults) {
        // 只保存信心分數較高的知識
        if (result.confidence >= 0.7) {
          const knowledgeItem = await knowledgeService.createKnowledgeItem({
            title: result.title,
            content: result.content,
            category: result.category,
            tags: result.tags,
            source: result.source,
            sourceUrl: result.sourceUrl,
            metadata: {
              extractedFrom: result.extractedFrom,
              confidence: result.confidence,
              extractionTime: new Date().toISOString(),
            },
            isPublished: false, // 默認不發布，需要人工審核
          }, userId);
          
          savedIds.push(knowledgeItem.id);
          logger.info(`已保存提取的知識: ${knowledgeItem.id}`);
        } else {
          logger.info(`跳過低信心分數的知識: ${result.title} (${result.confidence})`);
        }
      }
      
      logger.info(`成功保存了 ${savedIds.length} 條提取的知識`);
      
      return savedIds;
    } catch (error) {
      logger.error('保存提取的知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 將對話轉換為文本
   * @param conversation 對話
   */
  private convertConversationToText(conversation: Conversation): string {
    return conversation.messages.map(message => {
      const sender = message.sender === 'customer' ? '客戶' : message.sender === 'agent' ? '客服' : '系統';
      const timestamp = message.timestamp.toLocaleString('zh-TW');
      return `[${timestamp}] ${sender}: ${message.content}`;
    }).join('\n\n');
  }
  
  /**
   * 使用 LLM 提取知識
   * @param conversationText 對話文本
   * @param conversationId 對話 ID
   */
  private async extractKnowledgeWithLLM(conversationText: string, conversationId: string): Promise<KnowledgeExtractionResult[]> {
    try {
      // 1. 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的知識提取助手，負責從客服對話中提取有價值的知識，以便添加到知識庫中。

請分析以下對話，提取其中包含的有價值的知識點。這些知識點應該是：
1. 產品信息（如功能、價格、規格等）
2. 常見問題及其解答
3. 流程說明（如訂購流程、退貨流程等）
4. 政策信息（如保固政策、退款政策等）
5. 故障排除方法

對話內容：
{conversationText}

請以 JSON 數組格式輸出提取的知識點，每個知識點包含以下字段：
- title: 知識點標題（簡短、明確）
- content: 知識點內容（詳細、完整）
- category: 知識點分類（產品信息、常見問題、流程說明、政策信息、故障排除）
- tags: 相關標籤數組（3-5個關鍵詞）
- source: 知識來源（例如：客服對話）
- confidence: 信心分數（0-1之間的小數，表示對提取知識的確信程度）

只提取確定的、明確的知識點，不要猜測或推斷。如果對話中沒有有價值的知識點，請返回空數組。

JSON 輸出：
        `,
        inputVariables: ['conversationText'],
      });
      
      // 2. 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 3. 執行鏈並提取知識
      const result = await chain.call({
        conversationText,
      });
      
      // 4. 解析結果
      try {
        const extractedKnowledge = JSON.parse(result.text) as Omit<KnowledgeExtractionResult, 'extractedFrom'>[];
        
        // 5. 添加對話來源信息
        return extractedKnowledge.map(knowledge => ({
          ...knowledge,
          extractedFrom: {
            conversationId,
            messageIds: [], // 這裡可以添加具體的消息 ID，但需要更複雜的分析
          },
        }));
      } catch (error) {
        logger.error('解析 LLM 提取結果錯誤:', error);
        return [];
      }
    } catch (error) {
      logger.error('使用 LLM 提取知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 從客服修改的 AI 回覆中提取知識
   * @param originalResponse 原始 AI 回覆
   * @param modifiedResponse 客服修改後的回覆
   * @param messageContext 消息上下文
   * @param conversationId 對話 ID
   */
  async extractKnowledgeFromModifiedResponse(
    originalResponse: string,
    modifiedResponse: string,
    messageContext: string[],
    conversationId: string
  ): Promise<KnowledgeExtractionResult[]> {
    try {
      logger.info(`開始從修改的回覆中提取知識，對話 ID: ${conversationId}`);
      
      // 1. 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的知識提取助手，負責從客服修改的 AI 回覆中提取有價值的知識。

原始 AI 回覆：
{originalResponse}

客服修改後的回覆：
{modifiedResponse}

對話上下文：
{messageContext}

請分析客服的修改，提取其中包含的有價值的知識點。這些知識點應該是：
1. 產品信息（如功能、價格、規格等）
2. 常見問題及其解答
3. 流程說明（如訂購流程、退貨流程等）
4. 政策信息（如保固政策、退款政策等）
5. 故障排除方法

請特別關注客服修改或添加的內容，這些通常代表了 AI 缺少的知識。

請以 JSON 數組格式輸出提取的知識點，每個知識點包含以下字段：
- title: 知識點標題（簡短、明確）
- content: 知識點內容（詳細、完整）
- category: 知識點分類（產品信息、常見問題、流程說明、政策信息、故障排除）
- tags: 相關標籤數組（3-5個關鍵詞）
- source: 知識來源（例如：客服修改）
- confidence: 信心分數（0-1之間的小數，表示對提取知識的確信程度）

只提取確定的、明確的知識點，不要猜測或推斷。如果修改中沒有有價值的知識點，請返回空數組。

JSON 輸出：
        `,
        inputVariables: ['originalResponse', 'modifiedResponse', 'messageContext'],
      });
      
      // 2. 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 3. 執行鏈並提取知識
      const result = await chain.call({
        originalResponse,
        modifiedResponse,
        messageContext: messageContext.join('\n\n'),
      });
      
      // 4. 解析結果
      try {
        const extractedKnowledge = JSON.parse(result.text) as Omit<KnowledgeExtractionResult, 'extractedFrom'>[];
        
        // 5. 添加對話來源信息
        return extractedKnowledge.map(knowledge => ({
          ...knowledge,
          extractedFrom: {
            conversationId,
            messageIds: [], // 這裡可以添加具體的消息 ID，但需要更複雜的分析
          },
        }));
      } catch (error) {
        logger.error('解析 LLM 提取結果錯誤:', error);
        return [];
      }
    } catch (error) {
      logger.error('從修改的回覆中提取知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量處理對話，提取知識
   * @param conversations 對話列表
   * @param userId 用戶 ID
   */
  async batchProcessConversations(conversations: Conversation[], userId: string): Promise<{
    processedCount: number;
    extractedCount: number;
    savedCount: number;
  }> {
    try {
      logger.info(`開始批量處理 ${conversations.length} 個對話`);
      
      let extractedCount = 0;
      let savedCount = 0;
      
      // 遍歷對話，提取知識
      for (const conversation of conversations) {
        try {
          // 提取知識
          const extractionResults = await this.extractKnowledgeFromConversation(conversation);
          extractedCount += extractionResults.length;
          
          // 保存知識
          if (extractionResults.length > 0) {
            const savedIds = await this.saveExtractedKnowledge(extractionResults, userId);
            savedCount += savedIds.length;
          }
        } catch (error) {
          logger.error(`處理對話 ${conversation.id} 錯誤:`, error);
          // 繼續處理下一個對話
          continue;
        }
      }
      
      logger.info(`批量處理完成，處理了 ${conversations.length} 個對話，提取了 ${extractedCount} 條知識，保存了 ${savedCount} 條知識`);
      
      return {
        processedCount: conversations.length,
        extractedCount,
        savedCount,
      };
    } catch (error) {
      logger.error('批量處理對話錯誤:', error);
      throw error;
    }
  }
}

export default new KnowledgeExtractionService();