import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import logger from '../utils/logger';
import knowledgeService from './knowledge-service';
import KnowledgeItem, { KnowledgeItemAttributes } from '../models/KnowledgeItem';

/**
 * 知識關聯接口
 */
export interface KnowledgeRelation {
  sourceId: string;
  targetId: string;
  relationType: 'related' | 'parent' | 'child' | 'similar' | 'contradicts';
  strength: number; // 0-1 之間的關聯強度
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
 * 知識組織服務
 * 負責對知識庫中的知識進行分類、標籤和關聯，使其更易於檢索和使用
 */
class KnowledgeOrganizationService {
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
   * 組織知識項目
   * @param knowledgeItemId 知識項目 ID
   */
  async organizeKnowledgeItem(knowledgeItemId: string): Promise<KnowledgeOrganizationResult | null> {
    try {
      logger.info(`開始組織知識項目 ${knowledgeItemId}`);
      
      // 1. 獲取知識項目
      const knowledgeItem = await knowledgeService.getKnowledgeItem(knowledgeItemId);
      
      if (!knowledgeItem) {
        logger.warn(`找不到知識項目 ${knowledgeItemId}`);
        return null;
      }
      
      // 2. 獲取現有的分類和標籤
      const existingCategories = await knowledgeService.getCategories();
      const existingTags = await knowledgeService.getTags();
      
      // 3. 獲取相關知識項目
      const relatedItems = await this.findRelatedKnowledgeItems(knowledgeItem);
      
      // 4. 使用 LLM 組織知識
      const organizationResult = await this.organizeKnowledgeWithLLM(
        knowledgeItem,
        existingCategories,
        existingTags,
        relatedItems
      );
      
      logger.info(`成功組織知識項目 ${knowledgeItemId}`);
      
      return organizationResult;
    } catch (error) {
      logger.error(`組織知識項目 ${knowledgeItemId} 錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 應用組織結果
   * @param organizationResult 組織結果
   * @param userId 用戶 ID
   * @param applyCategories 是否應用分類建議
   * @param applyTags 是否應用標籤建議
   * @param applyRelations 是否應用關聯建議
   */
  async applyOrganizationResult(
    organizationResult: KnowledgeOrganizationResult,
    userId: string,
    applyCategories: boolean = true,
    applyTags: boolean = true,
    applyRelations: boolean = true
  ): Promise<boolean> {
    try {
      logger.info(`開始應用知識項目 ${organizationResult.knowledgeItemId} 的組織結果`);
      
      // 1. 獲取知識項目
      const knowledgeItem = await knowledgeService.getKnowledgeItem(organizationResult.knowledgeItemId);
      
      if (!knowledgeItem) {
        logger.warn(`找不到知識項目 ${organizationResult.knowledgeItemId}`);
        return false;
      }
      
      // 2. 應用分類建議
      if (applyCategories && organizationResult.suggestedCategories.length > 0) {
        // 選擇信心分數最高的分類
        const bestCategory = organizationResult.suggestedCategories.reduce((prev, current) => 
          prev.confidence > current.confidence ? prev : current
        );
        
        // 更新知識項目的分類
        await knowledgeService.updateKnowledgeItem(
          organizationResult.knowledgeItemId,
          { category: bestCategory.name },
          userId
        );
        
        logger.info(`已更新知識項目 ${organizationResult.knowledgeItemId} 的分類為 ${bestCategory.name}`);
      }
      
      // 3. 應用標籤建議
      if (applyTags && organizationResult.suggestedTags.length > 0) {
        // 選擇信心分數較高的標籤（最多 5 個）
        const bestTags = organizationResult.suggestedTags
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5)
          .map(tag => tag.name);
        
        // 更新知識項目的標籤
        await knowledgeService.updateKnowledgeItem(
          organizationResult.knowledgeItemId,
          { tags: bestTags },
          userId
        );
        
        logger.info(`已更新知識項目 ${organizationResult.knowledgeItemId} 的標籤為 ${bestTags.join(', ')}`);
      }
      
      // 4. 應用關聯建議
      if (applyRelations && organizationResult.suggestedRelations.length > 0) {
        // 選擇關聯強度較高的關聯（最多 10 個）
        const bestRelations = organizationResult.suggestedRelations
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 10);
        
        // 更新知識項目的元數據，添加關聯信息
        const metadata = knowledgeItem.metadata || {};
        metadata.relations = bestRelations;
        
        await knowledgeService.updateKnowledgeItem(
          organizationResult.knowledgeItemId,
          { metadata },
          userId
        );
        
        logger.info(`已更新知識項目 ${organizationResult.knowledgeItemId} 的關聯，添加了 ${bestRelations.length} 個關聯`);
      }
      
      logger.info(`成功應用知識項目 ${organizationResult.knowledgeItemId} 的組織結果`);
      
      return true;
    } catch (error) {
      logger.error(`應用知識項目 ${organizationResult.knowledgeItemId} 的組織結果錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 查找相關知識項目
   * @param knowledgeItem 知識項目
   */
  private async findRelatedKnowledgeItems(knowledgeItem: KnowledgeItem): Promise<KnowledgeItem[]> {
    try {
      // 使用標題和內容進行搜索
      const searchTerm = `${knowledgeItem.title} ${knowledgeItem.content.substring(0, 100)}`;
      
      // 搜索相關知識項目
      const relatedItems = await knowledgeService.searchKnowledgeItems({
        query: searchTerm,
        limit: 10,
      });
      
      // 排除自身
      return relatedItems.filter(item => item.id !== knowledgeItem.id);
    } catch (error) {
      logger.error('查找相關知識項目錯誤:', error);
      return [];
    }
  }
  
  /**
   * 使用 LLM 組織知識
   * @param knowledgeItem 知識項目
   * @param existingCategories 現有分類
   * @param existingTags 現有標籤
   * @param relatedItems 相關知識項目
   */
  private async organizeKnowledgeWithLLM(
    knowledgeItem: KnowledgeItem,
    existingCategories: string[],
    existingTags: string[],
    relatedItems: KnowledgeItem[]
  ): Promise<KnowledgeOrganizationResult> {
    try {
      // 1. 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的知識組織助手，負責對知識庫中的知識進行分類、標籤和關聯，使其更易於檢索和使用。

請分析以下知識項目，並提供分類、標籤和關聯建議：

知識項目：
標題: {title}
內容: {content}
當前分類: {category}
當前標籤: {tags}

現有分類列表：
{existingCategories}

現有標籤列表：
{existingTags}

相關知識項目：
{relatedItems}

請提供以下建議：

1. 分類建議：提供 1-3 個最適合的分類建議。可以使用現有分類，也可以建議新的分類。
2. 標籤建議：提供 3-5 個最適合的標籤建議。可以使用現有標籤，也可以建議新的標籤。
3. 關聯建議：分析相關知識項目，提供與當前知識項目的關聯建議。

請以 JSON 格式輸出，包含以下字段：
- suggestedCategories: 分類建議數組，每個建議包含 name（分類名稱）、description（分類描述）、parentCategory（父分類，可選）和 confidence（信心分數，0-1之間的小數）
- suggestedTags: 標籤建議數組，每個建議包含 name（標籤名稱）、description（標籤描述）和 confidence（信心分數，0-1之間的小數）
- suggestedRelations: 關聯建議數組，每個建議包含 sourceId（源知識項目ID）、targetId（目標知識項目ID）、relationType（關聯類型，可以是 related、parent、child、similar 或 contradicts）和 strength（關聯強度，0-1之間的小數）

JSON 輸出：
        `,
        inputVariables: ['title', 'content', 'category', 'tags', 'existingCategories', 'existingTags', 'relatedItems'],
      });
      
      // 2. 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 3. 執行鏈並組織知識
      const result = await chain.call({
        title: knowledgeItem.title,
        content: knowledgeItem.content,
        category: knowledgeItem.category,
        tags: knowledgeItem.tags.join(', '),
        existingCategories: existingCategories.join('\n'),
        existingTags: existingTags.join(', '),
        relatedItems: relatedItems.map(item => `ID: ${item.id}\n標題: ${item.title}\n分類: ${item.category}\n標籤: ${item.tags.join(', ')}`).join('\n\n'),
      });
      
      // 4. 解析結果
      try {
        const organizationResult = JSON.parse(result.text) as Omit<KnowledgeOrganizationResult, 'knowledgeItemId'>;
        
        // 5. 添加知識項目 ID
        return {
          knowledgeItemId: knowledgeItem.id,
          ...organizationResult,
        };
      } catch (error) {
        logger.error('解析 LLM 組織結果錯誤:', error);
        
        // 返回默認結果
        return {
          knowledgeItemId: knowledgeItem.id,
          suggestedCategories: [],
          suggestedTags: [],
          suggestedRelations: [],
        };
      }
    } catch (error) {
      logger.error('使用 LLM 組織知識錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 批量組織知識項目
   * @param knowledgeItemIds 知識項目 ID 列表
   * @param userId 用戶 ID
   * @param autoApply 是否自動應用組織結果
   */
  async batchOrganizeKnowledgeItems(
    knowledgeItemIds: string[],
    userId: string,
    autoApply: boolean = false
  ): Promise<{
    processedCount: number;
    organizedCount: number;
    appliedCount: number;
    results: KnowledgeOrganizationResult[];
  }> {
    try {
      logger.info(`開始批量組織 ${knowledgeItemIds.length} 個知識項目`);
      
      let organizedCount = 0;
      let appliedCount = 0;
      const results: KnowledgeOrganizationResult[] = [];
      
      // 遍歷知識項目，進行組織
      for (const knowledgeItemId of knowledgeItemIds) {
        try {
          // 組織知識項目
          const organizationResult = await this.organizeKnowledgeItem(knowledgeItemId);
          
          if (organizationResult) {
            organizedCount++;
            results.push(organizationResult);
            
            // 自動應用組織結果
            if (autoApply) {
              const applied = await this.applyOrganizationResult(organizationResult, userId);
              
              if (applied) {
                appliedCount++;
              }
            }
          }
        } catch (error) {
          logger.error(`組織知識項目 ${knowledgeItemId} 錯誤:`, error);
          // 繼續處理下一個知識項目
          continue;
        }
      }
      
      logger.info(`批量組織完成，處理了 ${knowledgeItemIds.length} 個知識項目，組織了 ${organizedCount} 個，應用了 ${appliedCount} 個`);
      
      return {
        processedCount: knowledgeItemIds.length,
        organizedCount,
        appliedCount,
        results,
      };
    } catch (error) {
      logger.error('批量組織知識項目錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 生成知識圖譜
   * 將知識項目之間的關聯可視化為圖譜
   */
  async generateKnowledgeGraph(): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      category: string;
      tags: string[];
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }>;
  }> {
    try {
      logger.info('開始生成知識圖譜');
      
      // 1. 獲取所有知識項目
      const knowledgeItems = await knowledgeService.searchKnowledgeItems({
        isPublished: true,
        limit: 1000,
      });
      
      // 2. 構建節點
      const nodes = knowledgeItems.map(item => ({
        id: item.id,
        label: item.title,
        category: item.category,
        tags: item.tags,
      }));
      
      // 3. 構建邊
      const edges: Array<{
        source: string;
        target: string;
        type: string;
        strength: number;
      }> = [];
      
      // 遍歷知識項目，提取關聯
      for (const item of knowledgeItems) {
        const metadata = item.metadata || {};
        const relations = metadata.relations || [];
        
        for (const relation of relations) {
          edges.push({
            source: relation.sourceId,
            target: relation.targetId,
            type: relation.relationType,
            strength: relation.strength,
          });
        }
      }
      
      logger.info(`成功生成知識圖譜，包含 ${nodes.length} 個節點和 ${edges.length} 條邊`);
      
      return { nodes, edges };
    } catch (error) {
      logger.error('生成知識圖譜錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 分析知識庫結構
   * 分析知識庫的分類、標籤和關聯結構，提供優化建議
   */
  async analyzeKnowledgeStructure(): Promise<{
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
  }> {
    try {
      logger.info('開始分析知識庫結構');
      
      // 1. 獲取所有知識項目
      const knowledgeItems = await knowledgeService.searchKnowledgeItems({
        limit: 1000,
      });
      
      // 2. 分析分類
      const categories = new Map<string, number>();
      
      for (const item of knowledgeItems) {
        const category = item.category;
        categories.set(category, (categories.get(category) || 0) + 1);
      }
      
      const categoriesDistribution: Record<string, number> = {};
      categories.forEach((count, category) => {
        categoriesDistribution[category] = count;
      });
      
      // 3. 分析標籤
      const tags = new Map<string, number>();
      
      for (const item of knowledgeItems) {
        for (const tag of item.tags) {
          tags.set(tag, (tags.get(tag) || 0) + 1);
        }
      }
      
      const topTags = Array.from(tags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      
      const unusedTags = Array.from(tags.entries())
        .filter(([_, count]) => count === 1)
        .map(([name, _]) => name);
      
      // 4. 分析關聯
      let totalRelations = 0;
      const relationTypes = new Map<string, number>();
      const connections = new Map<string, number>();
      
      for (const item of knowledgeItems) {
        const metadata = item.metadata || {};
        const relations = metadata.relations || [];
        
        totalRelations += relations.length;
        
        for (const relation of relations) {
          relationTypes.set(relation.relationType, (relationTypes.get(relation.relationType) || 0) + 1);
          connections.set(item.id, (connections.get(item.id) || 0) + 1);
        }
      }
      
      const relationTypesDistribution: Record<string, number> = {};
      relationTypes.forEach((count, type) => {
        relationTypesDistribution[type] = count;
      });
      
      const isolatedItems = knowledgeItems.filter(item => !connections.has(item.id)).length;
      
      const highlyConnectedItems = Array.from(connections.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, connectionsCount]) => {
          const item = knowledgeItems.find(item => item.id === id);
          return {
            id,
            title: item ? item.title : 'Unknown',
            connectionsCount,
          };
        });
      
      // 5. 使用 LLM 生成優化建議
      const optimizationSuggestions = await this.generateOptimizationSuggestions(
        categoriesDistribution,
        Array.from(tags.keys()),
        knowledgeItems.length
      );
      
      logger.info('成功分析知識庫結構');
      
      return {
        categoriesAnalysis: {
          totalCategories: categories.size,
          categoriesDistribution,
          suggestedNewCategories: optimizationSuggestions.suggestedNewCategories,
          suggestedMerges: optimizationSuggestions.suggestedCategoryMerges,
        },
        tagsAnalysis: {
          totalTags: tags.size,
          topTags,
          unusedTags,
          suggestedNewTags: optimizationSuggestions.suggestedNewTags,
          suggestedMerges: optimizationSuggestions.suggestedTagMerges,
        },
        relationsAnalysis: {
          totalRelations,
          relationTypesDistribution,
          isolatedItems,
          highlyConnectedItems,
        },
      };
    } catch (error) {
      logger.error('分析知識庫結構錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 生成優化建議
   * @param categoriesDistribution 分類分佈
   * @param allTags 所有標籤
   * @param totalItems 知識項目總數
   */
  private async generateOptimizationSuggestions(
    categoriesDistribution: Record<string, number>,
    allTags: string[],
    totalItems: number
  ): Promise<{
    suggestedNewCategories: Array<{ name: string; description: string }>;
    suggestedCategoryMerges: Array<{ categories: string[]; newCategory: string; reason: string }>;
    suggestedNewTags: Array<{ name: string; description: string }>;
    suggestedTagMerges: Array<{ tags: string[]; newTag: string; reason: string }>;
  }> {
    try {
      // 1. 構建提示模板
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的知識組織助手，負責分析知識庫的結構並提供優化建議。

知識庫統計信息：
- 知識項目總數：{totalItems}

分類分佈：
{categoriesDistribution}

所有標籤：
{allTags}

請分析上述知識庫結構，並提供以下優化建議：

1. 建議新增的分類：考慮現有分類的覆蓋範圍，建議 2-3 個可能缺失的重要分類。
2. 建議合併的分類：識別可能重疊或相似的分類，建議合併為更清晰的分類。
3. 建議新增的標籤：考慮現有標籤的覆蓋範圍，建議 3-5 個可能缺失的重要標籤。
4. 建議合併的標籤：識別可能重疊或相似的標籤，建議合併為更清晰的標籤。

請以 JSON 格式輸出，包含以下字段：
- suggestedNewCategories: 建議新增的分類數組，每個建議包含 name（分類名稱）和 description（分類描述）
- suggestedCategoryMerges: 建議合併的分類數組，每個建議包含 categories（要合併的分類數組）、newCategory（新分類名稱）和 reason（合併理由）
- suggestedNewTags: 建議新增的標籤數組，每個建議包含 name（標籤名稱）和 description（標籤描述）
- suggestedTagMerges: 建議合併的標籤數組，每個建議包含 tags（要合併的標籤數組）、newTag（新標籤名稱）和 reason（合併理由）

JSON 輸出：
        `,
        inputVariables: ['totalItems', 'categoriesDistribution', 'allTags'],
      });
      
      // 2. 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 3. 執行鏈並生成優化建議
      const result = await chain.call({
        totalItems,
        categoriesDistribution: Object.entries(categoriesDistribution)
          .map(([category, count]) => `${category}: ${count} 項 (${(count / totalItems * 100).toFixed(1)}%)`)
          .join('\n'),
        allTags: allTags.join(', '),
      });
      
      // 4. 解析結果
      try {
        return JSON.parse(result.text);
      } catch (error) {
        logger.error('解析 LLM 優化建議結果錯誤:', error);
        
        // 返回默認結果
        return {
          suggestedNewCategories: [],
          suggestedCategoryMerges: [],
          suggestedNewTags: [],
          suggestedTagMerges: [],
        };
      }
    } catch (error) {
      logger.error('生成優化建議錯誤:', error);
      throw error;
    }
  }
}

export default new KnowledgeOrganizationService();