import api from './api';
import { 
  Conversation, 
  Message 
} from '../types/message';

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
 * 知識提取批量處理結果接口
 */
export interface BatchExtractionResult {
  processedCount: number;
  extractedCount: number;
  savedCount: number;
}

/**
 * 知識關聯接口
 */
export interface KnowledgeRelation {
  sourceId: string;
  targetId: string;
  relationType: 'related' | 'parent' | 'child' | 'similar' | 'contradicts';
  strength: number;
  metadata?: Record<string, any>;
}

/**
 * 知識分類建議接口
 */
export interface CategorySuggestion {
  name: string;
  description: string;
  parentCategory?: string;
  confidence: number;
}

/**
 * 知識標籤建議接口
 */
export interface TagSuggestion {
  name: string;
  description: string;
  confidence: number;
}

/**
 * 知識組織結果接口
 */
export interface KnowledgeOrganizationResult {
  knowledgeItemId: string;
  suggestedCategories: CategorySuggestion[];
  suggestedTags: TagSuggestion[];
  suggestedRelations: KnowledgeRelation[];
}

/**
 * 知識圖譜節點接口
 */
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  category: string;
  tags: string[];
}

/**
 * 知識圖譜邊接口
 */
export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

/**
 * 知識圖譜接口
 */
export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

/**
 * 知識庫分析結果接口
 */
export interface KnowledgeStructureAnalysis {
  categoriesAnalysis: {
    totalCategories: number;
    categoriesDistribution: Record<string, number>;
    suggestedNewCategories: Array<{ name: string; description: string }>;
    suggestedMerges: Array<{ categories: string[]; newCategory: string; reason: string }>;
  };
  tagsAnalysis: {
    totalTags: number;
    topTags: Array<{ name: string; count: number }>;
    unusedTags: string[];
    suggestedNewTags: Array<{ name: string; description: string }>;
    suggestedMerges: Array<{ tags: string[]; newTag: string; reason: string }>;
  };
  relationsAnalysis: {
    totalRelations: number;
    relationTypesDistribution: Record<string, number>;
    isolatedItems: number;
    highlyConnectedItems: Array<{ id: string; title: string; connectionsCount: number }>;
  };
}

/**
 * 知識增強服務
 * 提供知識提取和知識組織相關的功能
 */
const knowledgeEnhancementService = {
  /**
   * 從對話中提取知識
   * @param conversation 對話
   */
  async extractFromConversation(conversation: Conversation): Promise<{
    extractedCount: number;
    savedCount: number;
    extractionResults: KnowledgeExtractionResult[];
    savedIds: string[];
  }> {
    try {
      const response = await api.post(`/knowledge-extraction/conversation/${conversation.id}`, {
        conversation,
      });
      
      return response.data.data;
    } catch (error) {
      console.error('從對話中提取知識錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 從修改的 AI 回覆中提取知識
   * @param originalResponse 原始 AI 回覆
   * @param modifiedResponse 修改後的回覆
   * @param messageContext 消息上下文
   * @param conversationId 對話 ID
   */
  async extractFromModifiedResponse(
    originalResponse: string,
    modifiedResponse: string,
    messageContext: string[],
    conversationId: string
  ): Promise<{
    extractedCount: number;
    savedCount: number;
    extractionResults: KnowledgeExtractionResult[];
    savedIds: string[];
  }> {
    try {
      const response = await api.post('/knowledge-extraction/modified-response', {
        originalResponse,
        modifiedResponse,
        messageContext,
        conversationId,
      });
      
      return response.data.data;
    } catch (error) {
      console.error('從修改的 AI 回覆中提取知識錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 批量處理對話，提取知識
   * @param conversations 對話列表
   */
  async batchProcessConversations(conversations: Conversation[]): Promise<BatchExtractionResult> {
    try {
      const response = await api.post('/knowledge-extraction/batch', {
        conversations,
      });
      
      return response.data.data;
    } catch (error) {
      console.error('批量處理對話提取知識錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 組織知識項目
   * @param knowledgeItemId 知識項目 ID
   */
  async organizeKnowledgeItem(knowledgeItemId: string): Promise<KnowledgeOrganizationResult> {
    try {
      const response = await api.post(`/knowledge-organization/${knowledgeItemId}`);
      
      return response.data.data;
    } catch (error) {
      console.error('組織知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 應用組織結果
   * @param organizationResult 組織結果
   * @param applyCategories 是否應用分類建議
   * @param applyTags 是否應用標籤建議
   * @param applyRelations 是否應用關聯建議
   */
  async applyOrganizationResult(
    organizationResult: KnowledgeOrganizationResult,
    applyCategories: boolean = true,
    applyTags: boolean = true,
    applyRelations: boolean = true
  ): Promise<boolean> {
    try {
      const response = await api.post('/knowledge-organization/apply', {
        organizationResult,
        applyCategories,
        applyTags,
        applyRelations,
      });
      
      return response.data.success;
    } catch (error) {
      console.error('應用組織結果錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 批量組織知識項目
   * @param knowledgeItemIds 知識項目 ID 列表
   * @param autoApply 是否自動應用組織結果
   */
  async batchOrganizeKnowledgeItems(
    knowledgeItemIds: string[],
    autoApply: boolean = false
  ): Promise<{
    processedCount: number;
    organizedCount: number;
    appliedCount: number;
    results: KnowledgeOrganizationResult[];
  }> {
    try {
      const response = await api.post('/knowledge-organization/batch', {
        knowledgeItemIds,
        autoApply,
      });
      
      return response.data.data;
    } catch (error) {
      console.error('批量組織知識項目錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 生成知識圖譜
   */
  async generateKnowledgeGraph(): Promise<KnowledgeGraph> {
    try {
      const response = await api.get('/knowledge-organization/graph');
      
      return response.data.data;
    } catch (error) {
      console.error('生成知識圖譜錯誤:', error);
      throw error;
    }
  },
  
  /**
   * 分析知識庫結構
   */
  async analyzeKnowledgeStructure(): Promise<KnowledgeStructureAnalysis> {
    try {
      const response = await api.get('/knowledge-organization/analyze');
      
      return response.data.data;
    } catch (error) {
      console.error('分析知識庫結構錯誤:', error);
      throw error;
    }
  },
};

export default knowledgeEnhancementService;