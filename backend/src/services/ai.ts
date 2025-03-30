import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import KnowledgeItemModel from '../models/KnowledgeItem';

// 定義回覆生成請求接口
export interface GenerateResponseRequest {
  customerId: string;
  messageContent: string;
  messageContext: string[];
  customerInfo?: Record<string, any>;
}

// 定義回覆生成結果接口
export interface GenerateResponseResult {
  response: string;
  confidenceScore: number;
  knowledgeSources: Array<{
    id: string;
    title: string;
    relevanceScore: number;
  }>;
}

class AIService {
  private llm: OpenAI;
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    // 初始化 OpenAI 模型
    this.llm = new OpenAI({
      modelName: 'gpt-4', // 或使用其他模型
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    // 初始化嵌入模型
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * 生成 AI 輔助回覆
   */
  async generateResponse(request: GenerateResponseRequest): Promise<GenerateResponseResult> {
    try {
      const { customerId, messageContent, messageContext, customerInfo } = request;
      
      // 1. 檢索相關知識
      const relevantKnowledge = await this.retrieveRelevantKnowledge(messageContent);
      
      // 2. 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一位專業的客服助手，負責協助回覆客戶的問題。請根據以下信息生成一個專業、有禮貌且有幫助的回覆。

客戶信息：
{customerInfo}

對話歷史：
{messageContext}

客戶最新訊息：
{messageContent}

相關知識：
{relevantKnowledgeText}

請生成一個專業的回覆，確保回覆：
1. 直接回答客戶的問題
2. 語氣友善且專業
3. 提供準確的信息
4. 如果無法確定答案，請誠實表明

回覆：
        `,
        inputVariables: ['customerInfo', 'messageContext', 'messageContent', 'relevantKnowledgeText'],
      });
      
      // 3. 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 4. 執行鏈並生成回覆
      const result = await chain.call({
        customerInfo: customerInfo ? JSON.stringify(customerInfo, null, 2) : '無可用的客戶信息',
        messageContext: messageContext.join('\n'),
        messageContent: messageContent,
        relevantKnowledgeText: relevantKnowledge.documents.map(doc => doc.pageContent).join('\n\n'),
      });
      
      // 5. 計算信心分數（這裡使用一個簡單的啟發式方法，實際應用中可能需要更複雜的算法）
      const confidenceScore = this.calculateConfidenceScore(
        relevantKnowledge.documents,
        result.text
      );
      
      // 6. 構建回覆結果
      return {
        response: result.text,
        confidenceScore,
        knowledgeSources: relevantKnowledge.documents.map(doc => ({
          id: doc.metadata.id,
          title: doc.metadata.title,
          relevanceScore: doc.metadata.score,
        })),
      };
    } catch (error) {
      console.error('生成 AI 回覆錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 檢索相關知識
   */
  private async retrieveRelevantKnowledge(query: string): Promise<{
    documents: Array<Document<{ id: string; title: string; score: number }>>;
  }> {
    try {
      // 1. 將查詢轉換為向量
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // 2. 從知識庫中檢索相關文檔
      // 注意：這裡是一個簡化的實現，實際應用中應該使用向量數據庫如 Pinecone
      // 這裡我們使用模擬數據
      
      // 從數據庫獲取知識條目
      const knowledgeItems = await KnowledgeItemModel.search(query);
      
      // 將知識條目轉換為文檔
      const documents = knowledgeItems.map(item => {
        return new Document({
          pageContent: `${item.title}\n\n${item.content}`,
          metadata: {
            id: item.id,
            title: item.title,
            score: 0.85, // 模擬相關性分數
          },
        });
      });
      
      // 如果沒有找到相關知識，返回空數組
      if (documents.length === 0) {
        return { documents: [] };
      }
      
      // 返回檢索結果
      return { documents };
    } catch (error) {
      console.error('檢索相關知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 計算信心分數
   */
  private calculateConfidenceScore(
    documents: Array<Document<{ id: string; title: string; score: number }>>,
    response: string
  ): number {
    // 這裡使用一個簡單的啟發式方法計算信心分數
    // 實際應用中可能需要更複雜的算法
    
    // 如果沒有相關文檔，信心分數較低
    if (documents.length === 0) {
      return 0.3;
    }
    
    // 基於文檔相關性分數計算平均信心分數
    const avgDocScore = documents.reduce((sum, doc) => sum + doc.metadata.score, 0) / documents.length;
    
    // 回覆長度因子（假設較長的回覆可能包含更多信息）
    const lengthFactor = Math.min(response.length / 200, 1);
    
    // 綜合計算信心分數
    const confidenceScore = avgDocScore * 0.7 + lengthFactor * 0.3;
    
    // 確保分數在 0-1 範圍內
    return Math.max(0, Math.min(1, confidenceScore));
  }
}

export default new AIService();