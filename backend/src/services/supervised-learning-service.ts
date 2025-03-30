import { Message } from '../models/Message';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import KnowledgeItemModel from '../models/KnowledgeItem';
import logger from '../utils/logger';

/**
 * 學習樣本接口
 */
export interface LearningSample {
  aiResponse: string;
  humanResponse: string;
  messageId: string;
  customerId: string;
  messageContent: string;
  similarity: number;
  learningPoints: string[];
}

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
 * 監督式學習服務
 * 處理 AI 回覆的人工修改，從中學習並改進
 */
class SupervisedLearningService {
  private embeddings: OpenAIEmbeddings;
  private llm: OpenAI;
  
  /**
   * 構造函數
   */
  constructor() {
    // 初始化嵌入模型
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    // 初始化 OpenAI 模型
    this.llm = new OpenAI({
      modelName: 'gpt-4', // 或使用其他模型
      temperature: 0.3, // 較低的溫度以獲得更確定性的結果
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('監督式學習服務初始化完成');
  }
  
  /**
   * 從人工修改的回覆中學習
   * @param aiMessageId AI 回覆消息 ID
   * @param humanMessageId 人工修改的回覆消息 ID
   */
  async learnFromHumanCorrection(aiMessageId: string, humanMessageId: string): Promise<LearningResult> {
    try {
      // 獲取 AI 回覆和人工修改的回覆
      const aiMessage = await Message.findByPk(aiMessageId);
      const humanMessage = await Message.findByPk(humanMessageId);
      
      if (!aiMessage || !humanMessage) {
        return {
          success: false,
          message: '找不到指定的消息',
        };
      }
      
      // 確保消息內容不為 null
      if (!aiMessage.content || !humanMessage.content) {
        return {
          success: false,
          message: '消息內容為空',
        };
      }
      
      // 獲取原始客戶消息
      const customerMessage = await Message.findOne({
        where: {
          id: aiMessage.metadata?.replyToMessageId,
        },
      });
      
      if (!customerMessage || !customerMessage.content) {
        return {
          success: false,
          message: '找不到原始客戶消息或消息內容為空',
        };
      }
      
      // 計算相似度
      const similarity = await this.calculateSimilarity(aiMessage.content, humanMessage.content);
      
      // 如果相似度很高，表示人工幾乎沒有修改，不需要學習
      if (similarity > 0.9) {
        return {
          success: true,
          message: '人工修改與 AI 回覆非常相似，無需學習',
        };
      }
      
      // 分析差異並提取學習點
      const learningPoints = await this.extractLearningPoints(
        customerMessage.content,
        aiMessage.content,
        humanMessage.content
      );
      
      // 創建學習樣本
      const sample: LearningSample = {
        aiResponse: aiMessage.content,
        humanResponse: humanMessage.content,
        messageId: customerMessage.id,
        customerId: customerMessage.customerId,
        messageContent: customerMessage.content,
        similarity,
        learningPoints,
      };
      
      // 從學習樣本中生成新的知識項目
      const newKnowledgeItems = await this.generateKnowledgeItems(sample);
      
      // 生成改進建議
      const improvementSuggestions = await this.generateImprovementSuggestions(sample);
      
      // 記錄學習結果
      logger.info(`從人工修改中學習完成，相似度: ${similarity}, 學習點: ${learningPoints.length}`);
      
      return {
        success: true,
        message: '從人工修改中學習成功',
        newKnowledgeItems,
        improvementSuggestions,
      };
    } catch (error) {
      logger.error('從人工修改中學習錯誤:', error);
      
      return {
        success: false,
        message: '從人工修改中學習時發生錯誤',
      };
    }
  }
  
  /**
   * 計算兩個文本的相似度
   * @param text1 文本 1
   * @param text2 文本 2
   */
  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // 使用 OpenAI 嵌入計算相似度
      const embedding1 = await this.embeddings.embedQuery(text1);
      const embedding2 = await this.embeddings.embedQuery(text2);
      
      // 計算餘弦相似度
      const dotProduct = embedding1.reduce((sum, value, i) => sum + value * embedding2[i], 0);
      const magnitude1 = Math.sqrt(embedding1.reduce((sum, value) => sum + value * value, 0));
      const magnitude2 = Math.sqrt(embedding2.reduce((sum, value) => sum + value * value, 0));
      
      const similarity = dotProduct / (magnitude1 * magnitude2);
      
      return similarity;
    } catch (error) {
      logger.error('計算相似度錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 提取學習點
   * @param customerMessage 客戶消息
   * @param aiResponse AI 回覆
   * @param humanResponse 人工回覆
   */
  private async extractLearningPoints(
    customerMessage: string,
    aiResponse: string,
    humanResponse: string
  ): Promise<string[]> {
    try {
      // 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的 AI 訓練師，負責分析 AI 回覆與人工修改的差異，並提取有價值的學習點。

客戶問題:
{customerMessage}

AI 回覆:
{aiResponse}

人工修改後的回覆:
{humanResponse}

請分析 AI 回覆與人工修改的差異，提取 3-5 個具體的學習點。每個學習點應該描述 AI 可以如何改進，以及人工回覆中的哪些元素更好。

學習點:
        `,
        inputVariables: ['customerMessage', 'aiResponse', 'humanResponse'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並生成學習點
      const result = await chain.call({
        customerMessage,
        aiResponse,
        humanResponse,
      });
      
      // 解析學習點
      const learningPoints = result.text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
      
      return learningPoints;
    } catch (error) {
      logger.error('提取學習點錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 從學習樣本中生成知識項目
   * @param sample 學習樣本
   */
  private async generateKnowledgeItems(sample: LearningSample): Promise<string[]> {
    try {
      // 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個知識庫管理專家，負責從客戶互動中提取有價值的知識。

客戶問題:
{messageContent}

AI 回覆:
{aiResponse}

人工修改後的回覆:
{humanResponse}

學習點:
{learningPoints}

請基於以上信息，生成 1-3 個可以添加到知識庫的知識項目。每個知識項目應包含標題和內容。

知識項目:
        `,
        inputVariables: ['messageContent', 'aiResponse', 'humanResponse', 'learningPoints'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並生成知識項目
      const result = await chain.call({
        messageContent: sample.messageContent,
        aiResponse: sample.aiResponse,
        humanResponse: sample.humanResponse,
        learningPoints: sample.learningPoints.join('\n'),
      });
      
      // 解析知識項目
      const knowledgeItems = result.text
        .split('\n\n')
        .filter((item: string) => item.trim().length > 0)
        .map((item: string) => item.trim());
      
      // 將知識項目保存到數據庫
      for (const item of knowledgeItems) {
        const titleMatch = item.match(/^(.+?)[:：]/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          const content = item.substring(titleMatch[0].length).trim();
          
          // 創建知識項目
          await KnowledgeItemModel.create({
            title,
            content,
            category: '自動生成',
            tags: ['監督學習', '自動生成'],
            source: 'supervised-learning',
            metadata: {
              originalMessageId: sample.messageId,
              customerId: sample.customerId,
              aiResponse: sample.aiResponse,
              humanResponse: sample.humanResponse,
              similarity: sample.similarity,
            },
            createdBy: 'system',
            updatedBy: 'system'
          });
        }
      }
      
      return knowledgeItems;
    } catch (error) {
      logger.error('生成知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 生成改進建議
   * @param sample 學習樣本
   */
  private async generateImprovementSuggestions(sample: LearningSample): Promise<string[]> {
    try {
      // 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個 AI 系統改進專家，負責分析 AI 回覆與人工修改的差異，並提出系統改進建議。

客戶問題:
{messageContent}

AI 回覆:
{aiResponse}

人工修改後的回覆:
{humanResponse}

學習點:
{learningPoints}

請基於以上信息，提出 2-3 個具體的系統改進建議，以提高 AI 回覆的質量。

改進建議:
        `,
        inputVariables: ['messageContent', 'aiResponse', 'humanResponse', 'learningPoints'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並生成改進建議
      const result = await chain.call({
        messageContent: sample.messageContent,
        aiResponse: sample.aiResponse,
        humanResponse: sample.humanResponse,
        learningPoints: sample.learningPoints.join('\n'),
      });
      
      // 解析改進建議
      const suggestions = result.text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
      
      return suggestions;
    } catch (error) {
      logger.error('生成改進建議錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量處理學習樣本
   * @param sampleIds 樣本 ID 數組，每個 ID 是一個包含 aiMessageId 和 humanMessageId 的對象
   */
  async batchLearn(sampleIds: Array<{ aiMessageId: string; humanMessageId: string }>): Promise<{
    success: boolean;
    message: string;
    results: LearningResult[];
  }> {
    try {
      const results: LearningResult[] = [];
      
      for (const { aiMessageId, humanMessageId } of sampleIds) {
        const result = await this.learnFromHumanCorrection(aiMessageId, humanMessageId);
        results.push(result);
      }
      
      const successCount = results.filter(result => result.success).length;
      
      return {
        success: successCount > 0,
        message: `批量學習完成，成功: ${successCount}，失敗: ${results.length - successCount}`,
        results,
      };
    } catch (error) {
      logger.error('批量學習錯誤:', error);
      
      return {
        success: false,
        message: '批量學習時發生錯誤',
        results: [],
      };
    }
  }
  
  /**
   * 獲取學習統計信息
   */
  async getLearningStats(): Promise<{
    totalSamples: number;
    successfulSamples: number;
    averageSimilarity: number;
    knowledgeItemsGenerated: number;
    topLearningPoints: string[];
  }> {
    try {
      // 獲取所有通過監督學習生成的知識項目
      const knowledgeItems = await KnowledgeItemModel.findAll({
        where: {
          source: 'supervised-learning',
        },
      });
      
      // 計算統計信息
      const similarities = knowledgeItems.map(item => (item.metadata as any)?.similarity || 0);
      const averageSimilarity = similarities.length > 0
        ? similarities.reduce((sum, value) => sum + value, 0) / similarities.length
        : 0;
      
      // 提取學習點（這裡簡化處理，實際應用中可能需要更複雜的邏輯）
      const learningPoints: string[] = [];
      knowledgeItems.forEach(item => {
        if (item.tags && item.tags.includes('監督學習')) {
          learningPoints.push(item.title);
        }
      });
      
      // 統計學習點出現頻率
      const pointFrequency: Record<string, number> = {};
      learningPoints.forEach(point => {
        pointFrequency[point] = (pointFrequency[point] || 0) + 1;
      });
      
      // 獲取頻率最高的學習點
      const topLearningPoints = Object.entries(pointFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([point]) => point);
      
      return {
        totalSamples: knowledgeItems.length,
        successfulSamples: knowledgeItems.length,
        averageSimilarity,
        knowledgeItemsGenerated: knowledgeItems.length,
        topLearningPoints,
      };
    } catch (error) {
      logger.error('獲取學習統計信息錯誤:', error);
      throw error;
    }
  }
}

export default new SupervisedLearningService();