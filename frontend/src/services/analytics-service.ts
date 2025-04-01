import analyticsService from './analyticsService';
import { TimeRange } from '../types/analytics';

/**
 * 分析過濾器介面
 */
export interface AnalyticsFilter {
  timeRange: {
    range: string;
  };
}

/**
 * 分析服務
 * 提供儀表板所需的分析數據
 */
class AnalyticsService {
  /**
   * 獲取訊息統計數據
   * @param filter 過濾條件
   * @returns 訊息統計數據
   */
  async getMessageStats(filter: AnalyticsFilter) {
    try {
      // 將儀表板過濾器轉換為分析服務時間範圍
      const timeRange = this.convertTimeRange(filter.timeRange.range);
      
      // 使用分析服務獲取客戶互動分析
      const customerInteraction = await analyticsService.getCustomerInteractionAnalytics(timeRange);
      
      // 處理平台分佈數據
      const byPlatform = customerInteraction.messagesByPlatform;
      
      // 處理每日訊息數據
      const byDay = customerInteraction.messageTrend.map(item => item.count);
      
      return {
        total: customerInteraction.totalMessages,
        inbound: customerInteraction.customerMessages,
        outbound: customerInteraction.replyMessages,
        byPlatform,
        byDay
      };
    } catch (error) {
      console.error('獲取訊息統計數據失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取客戶統計數據
   * @param filter 過濾條件
   * @returns 客戶統計數據
   */
  async getCustomerStats(filter: AnalyticsFilter) {
    try {
      // 將儀表板過濾器轉換為分析服務時間範圍
      const timeRange = this.convertTimeRange(filter.timeRange.range);
      
      // 使用分析服務獲取客戶互動分析
      const customerInteraction = await analyticsService.getCustomerInteractionAnalytics(timeRange);
      
      // 處理頂部客戶數據
      const topCustomers = customerInteraction.topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        messageCount: customer.messageCount
      }));
      
      return {
        total: customerInteraction.activeCustomers * 2, // 估計總客戶數
        active: customerInteraction.activeCustomers,
        topCustomers
      };
    } catch (error) {
      console.error('獲取客戶統計數據失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取 AI 統計數據
   * @param filter 過濾條件
   * @returns AI 統計數據
   */
  async getAIStats(filter: AnalyticsFilter) {
    try {
      // 將儀表板過濾器轉換為分析服務時間範圍
      const timeRange = this.convertTimeRange(filter.timeRange.range);
      
      // 使用分析服務獲取回覆效果評估
      const replyEffectiveness = await analyticsService.getReplyEffectivenessAnalytics(timeRange);
      
      // 處理 AI 信心分佈數據
      const confidenceDistribution = [
        replyEffectiveness.confidenceDistribution.high,
        replyEffectiveness.confidenceDistribution.medium,
        replyEffectiveness.confidenceDistribution.low
      ];
      
      // 處理頂部類別數據
      const topCategories = replyEffectiveness.topCategories.map(category => ({
        name: category.category,
        count: category.count
      }));
      
      return {
        totalReplies: replyEffectiveness.totalReplies,
        aiReplies: replyEffectiveness.aiReplies,
        aiReplyPercentage: replyEffectiveness.aiReplyPercentage,
        confidenceDistribution,
        editRate: replyEffectiveness.editRate,
        topCategories
      };
    } catch (error) {
      console.error('獲取 AI 統計數據失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取銷售統計數據
   * @param filter 過濾條件
   * @returns 銷售統計數據
   */
  async getSalesStats(filter: AnalyticsFilter) {
    try {
      // 將儀表板過濾器轉換為分析服務時間範圍
      const timeRange = this.convertTimeRange(filter.timeRange.range);
      
      // 使用分析服務獲取銷售轉化率分析
      const salesConversion = await analyticsService.getSalesConversionAnalytics(timeRange);
      
      // 處理銷售趨勢數據
      const salesTrend = salesConversion.salesTrend.map(item => ({
        date: item.date,
        count: item.count,
        amount: item.amount
      }));
      
      // 處理頂部產品數據
      const topProducts = salesConversion.topProducts.map(product => ({
        id: product.productId,
        name: product.productName,
        count: product.count,
        amount: product.totalAmount
      }));
      
      return {
        totalConversations: salesConversion.totalConversations,
        conversionsWithRecommendations: salesConversion.conversationsWithRecommendations,
        conversionsWithPurchase: salesConversion.conversationsWithPurchase,
        recommendationRate: salesConversion.recommendationRate,
        conversionRate: salesConversion.conversionRate,
        averagePurchaseAmount: salesConversion.averagePurchaseAmount,
        salesTrend,
        topProducts
      };
    } catch (error) {
      console.error('獲取銷售統計數據失敗', error);
      throw error;
    }
  }
  
  /**
   * 將儀表板時間範圍轉換為分析服務時間範圍
   * @param dashboardTimeRange 儀表板時間範圍
   * @returns 分析服務時間範圍
   */
  private convertTimeRange(dashboardTimeRange: string): TimeRange {
    switch (dashboardTimeRange) {
      case 'day':
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      case 'quarter':
        return 'quarter';
      case 'year':
        return 'year';
      default:
        return 'week';
    }
  }
}

export default new AnalyticsService();