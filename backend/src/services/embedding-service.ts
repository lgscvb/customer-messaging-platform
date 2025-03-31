import axios from 'axios';
import { OpenAIEmbeddings } from '@langchain/openai';
import Embedding, { EmbeddingExtension } from '../models/Embedding';
import KnowledgeItem from '../models/KnowledgeItem';
import { Message } from '../models/Message';
import logger from '../utils/logger';
import apiConfigService from './api-config-service';

/**
 * 嵌入提供者類型
 */
export enum EmbeddingProvider {
  GOOGLE = 'google',
  OPENAI = 'openai',
}

/**
 * 嵌入服務
 * 負責生成和管理嵌入向量
 */
class EmbeddingService {
  private openAIEmbedding: OpenAIEmbeddings | null = null;
  private provider: EmbeddingProvider;
  private modelName: string;
  
  constructor() {
    // 從環境變量獲取嵌入提供者
    this.provider = (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || EmbeddingProvider.GOOGLE;
    
    // 設置模型名稱
    if (this.provider === EmbeddingProvider.GOOGLE) {
      this.modelName = process.env.GOOGLE_EMBEDDING_MODEL || 'textembedding-gecko';
    } else {
      this.modelName = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002';
    }
    
    logger.info(`嵌入服務初始化，使用提供者: ${this.provider}，模型: ${this.modelName}`);
  }
  
  /**
   * 初始化 OpenAI 嵌入模型
   */
  private async initOpenAIEmbedding(): Promise<void> {
    try {
      if (!this.openAIEmbedding) {
        // 獲取 OpenAI API 配置
        const apiKey = await apiConfigService.getApiConfigValue('OPENAI_API_KEY');
        
        // 初始化 OpenAI 嵌入模型
        this.openAIEmbedding = new OpenAIEmbeddings({
          openAIApiKey: apiKey,
          modelName: this.modelName,
        });
        
        logger.info('已初始化 OpenAI 嵌入模型');
      }
    } catch (error) {
      logger.error('初始化 OpenAI 嵌入模型錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 使用 Google Vertex AI 生成嵌入向量
   * @param text 文本
   */
  private async generateGoogleEmbedding(text: string): Promise<number[]> {
    try {
      // 獲取 Google API 配置
      const projectId = await apiConfigService.getApiConfigValue('GOOGLE_PROJECT_ID');
      const location = await apiConfigService.getApiConfigValue('GOOGLE_LOCATION', 'us-central1');
      const apiKey = await apiConfigService.getApiConfigValue('GOOGLE_API_KEY');
      
      // 構建 API URL
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.modelName}:predict`;
      
      // 發送請求
      const response = await axios.post(
        url,
        {
          instances: [
            { content: text }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      // 解析響應
      const embeddings = response.data.predictions[0].embeddings.values;
      
      return embeddings;
    } catch (error) {
      logger.error('使用 Google Vertex AI 生成嵌入向量錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 生成嵌入向量
   * @param text 文本
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 根據提供者生成嵌入向量
      if (this.provider === EmbeddingProvider.GOOGLE) {
        return await this.generateGoogleEmbedding(text);
      } else {
        // 初始化 OpenAI 嵌入模型
        await this.initOpenAIEmbedding();
        
        if (this.openAIEmbedding) {
          const response = await this.openAIEmbedding.embedQuery(text);
          return response;
        } else {
          throw new Error('OpenAI 嵌入模型未初始化');
        }
      }
    } catch (error) {
      logger.error('生成嵌入向量錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 為知識項目生成嵌入向量
   * @param knowledgeItem 知識項目
   */
  async generateEmbeddingForKnowledgeItem(knowledgeItem: KnowledgeItem): Promise<Embedding> {
    try {
      logger.info(`為知識項目 ${knowledgeItem.id} 生成嵌入向量`);
      
      // 組合文本
      const text = `標題: ${knowledgeItem.title}\n內容: ${knowledgeItem.content}\n分類: ${knowledgeItem.category}\n標籤: ${knowledgeItem.tags.join(', ')}`;
      
      // 生成嵌入向量
      const vector = await this.generateEmbedding(text);
      
      // 創建或更新嵌入向量
      const embedding = await EmbeddingExtension.createOrUpdate(
        knowledgeItem.id,
        'knowledge_item',
        vector,
        this.modelName,
        {
          title: knowledgeItem.title,
          category: knowledgeItem.category,
          tags: knowledgeItem.tags,
        }
      );
      
      logger.info(`已為知識項目 ${knowledgeItem.id} 生成嵌入向量`);
      
      return embedding;
    } catch (error) {
      logger.error(`為知識項目 ${knowledgeItem.id} 生成嵌入向量錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 為消息生成嵌入向量
   * @param message 消息
   */
  async generateEmbeddingForMessage(message: Message): Promise<Embedding> {
    try {
      logger.info(`為消息 ${message.id} 生成嵌入向量`);
      
      // 組合文本
      const text = message.content || '';
      
      // 生成嵌入向量
      const vector = await this.generateEmbedding(text);
      
      // 創建或更新嵌入向量
      const embedding = await EmbeddingExtension.createOrUpdate(
        message.id,
        'message',
        vector,
        this.modelName,
        {
          customerId: message.customerId,
          direction: message.direction,
          platformType: message.platformType,
          messageType: message.messageType,
        }
      );
      
      logger.info(`已為消息 ${message.id} 生成嵌入向量`);
      
      return embedding;
    } catch (error) {
      logger.error(`為消息 ${message.id} 生成嵌入向量錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 為文本生成嵌入向量
   * @param text 文本
   * @param sourceId 源 ID
   * @param metadata 元數據
   */
  async generateEmbeddingForText(text: string, sourceId: string, metadata: Record<string, any> = {}): Promise<Embedding> {
    try {
      logger.info(`為文本 ${sourceId} 生成嵌入向量`);
      
      // 生成嵌入向量
      const vector = await this.generateEmbedding(text);
      
      // 創建或更新嵌入向量
      const embedding = await EmbeddingExtension.createOrUpdate(
        sourceId,
        'document',
        vector,
        this.modelName,
        metadata
      );
      
      logger.info(`已為文本 ${sourceId} 生成嵌入向量`);
      
      return embedding;
    } catch (error) {
      logger.error(`為文本 ${sourceId} 生成嵌入向量錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 搜索相似知識項目
   * @param query 查詢文本
   * @param limit 限制數量
   * @param threshold 相似度閾值
   */
  async searchSimilarKnowledgeItems(query: string, limit: number = 10, threshold: number = 0.7): Promise<Array<{
    knowledgeItem: KnowledgeItem;
    similarity: number;
  }>> {
    try {
      logger.info(`搜索相似知識項目，查詢: ${query}`);
      
      // 生成查詢向量
      const queryVector = await this.generateEmbedding(query);
      
      // 搜索相似嵌入向量
      const similarEmbeddings = await EmbeddingExtension.findSimilar(
        queryVector,
        'knowledge_item',
        limit,
        threshold
      );
      
      // 獲取知識項目
      const result = await Promise.all(
        similarEmbeddings.map(async ({ embedding, similarity }) => {
          const knowledgeItem = await KnowledgeItem.findByPk(embedding.sourceId);
          
          if (!knowledgeItem) {
            // 如果找不到知識項目，刪除嵌入向量
            await EmbeddingExtension.deleteBySource(embedding.sourceId, 'knowledge_item');
            return null;
          }
          
          return {
            knowledgeItem,
            similarity,
          };
        })
      );
      
      // 過濾掉空值
      const filteredResult = result.filter(item => item !== null) as Array<{
        knowledgeItem: KnowledgeItem;
        similarity: number;
      }>;
      
      logger.info(`搜索到 ${filteredResult.length} 個相似知識項目`);
      
      return filteredResult;
    } catch (error) {
      logger.error('搜索相似知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 搜索相似消息
   * @param query 查詢文本
   * @param limit 限制數量
   * @param threshold 相似度閾值
   */
  async searchSimilarMessages(query: string, limit: number = 10, threshold: number = 0.7): Promise<Array<{
    message: Message;
    similarity: number;
  }>> {
    try {
      logger.info(`搜索相似消息，查詢: ${query}`);
      
      // 生成查詢向量
      const queryVector = await this.generateEmbedding(query);
      
      // 搜索相似嵌入向量
      const similarEmbeddings = await EmbeddingExtension.findSimilar(
        queryVector,
        'message',
        limit,
        threshold
      );
      
      // 獲取消息
      const result = await Promise.all(
        similarEmbeddings.map(async ({ embedding, similarity }) => {
          const message = await Message.findByPk(embedding.sourceId);
          
          if (!message) {
            // 如果找不到消息，刪除嵌入向量
            await EmbeddingExtension.deleteBySource(embedding.sourceId, 'message');
            return null;
          }
          
          return {
            message,
            similarity,
          };
        })
      );
      
      // 過濾掉空值
      const filteredResult = result.filter(item => item !== null) as Array<{
        message: Message;
        similarity: number;
      }>;
      
      logger.info(`搜索到 ${filteredResult.length} 個相似消息`);
      
      return filteredResult;
    } catch (error) {
      logger.error('搜索相似消息錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量處理知識項目，生成嵌入向量
   * @param knowledgeItemIds 知識項目 ID 列表
   */
  async batchProcessKnowledgeItems(knowledgeItemIds: string[]): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
  }> {
    try {
      logger.info(`開始批量處理 ${knowledgeItemIds.length} 個知識項目`);
      
      let successCount = 0;
      let failedCount = 0;
      
      // 遍歷知識項目，生成嵌入向量
      for (const knowledgeItemId of knowledgeItemIds) {
        try {
          // 獲取知識項目
          const knowledgeItem = await KnowledgeItem.findByPk(knowledgeItemId);
          
          if (!knowledgeItem) {
            logger.warn(`找不到知識項目 ${knowledgeItemId}`);
            failedCount++;
            continue;
          }
          
          // 生成嵌入向量
          await this.generateEmbeddingForKnowledgeItem(knowledgeItem);
          
          successCount++;
        } catch (error) {
          logger.error(`處理知識項目 ${knowledgeItemId} 錯誤:`, error);
          failedCount++;
          // 繼續處理下一個知識項目
          continue;
        }
      }
      
      logger.info(`批量處理完成，成功: ${successCount}，失敗: ${failedCount}`);
      
      return {
        processedCount: knowledgeItemIds.length,
        successCount,
        failedCount,
      };
    } catch (error) {
      logger.error('批量處理知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 重新生成所有知識項目的嵌入向量
   */
  async regenerateAllKnowledgeItemEmbeddings(): Promise<{
    totalCount: number;
    successCount: number;
    failedCount: number;
  }> {
    try {
      logger.info('開始重新生成所有知識項目的嵌入向量');
      
      // 獲取所有知識項目
      const knowledgeItems = await KnowledgeItem.findAll();
      
      let successCount = 0;
      let failedCount = 0;
      
      // 遍歷知識項目，生成嵌入向量
      for (const knowledgeItem of knowledgeItems) {
        try {
          // 生成嵌入向量
          await this.generateEmbeddingForKnowledgeItem(knowledgeItem);
          
          successCount++;
        } catch (error) {
          logger.error(`為知識項目 ${knowledgeItem.id} 生成嵌入向量錯誤:`, error);
          failedCount++;
          // 繼續處理下一個知識項目
          continue;
        }
      }
      
      logger.info(`重新生成完成，總數: ${knowledgeItems.length}，成功: ${successCount}，失敗: ${failedCount}`);
      
      return {
        totalCount: knowledgeItems.length,
        successCount,
        failedCount,
      };
    } catch (error) {
      logger.error('重新生成所有知識項目的嵌入向量錯誤:', error);
      throw error;
    }
  }
}

export default new EmbeddingService();