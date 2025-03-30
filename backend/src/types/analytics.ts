/**
 * 時間範圍類型
 */
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * 客戶互動分析數據接口
 */
export interface CustomerInteractionAnalytics {
  totalMessages: number;
  customerMessages: number;
  replyMessages: number;
  averageResponseTime: number;
  activeCustomers: number;
  messagesByPlatform: Record<string, number>;
  messageTrend: Array<{
    date: string;
    count: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    messageCount: number;
  }>;
}

/**
 * 回覆效果評估數據接口
 */
export interface ReplyEffectivenessAnalytics {
  totalReplies: number;
  aiReplies: number;
  aiReplyPercentage: number;
  confidenceDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  aiReplyTrend: Array<{
    date: string;
    count: number;
    aiCount: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  editedReplies: number;
  editRate: number;
}

/**
 * 銷售轉化率分析數據接口
 */
export interface SalesConversionAnalytics {
  totalConversations: number;
  conversationsWithRecommendations: number;
  conversationsWithPurchase: number;
  recommendationRate: number;
  conversionRate: number;
  averagePurchaseAmount: number;
  salesTrend: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    count: number;
    totalAmount: number;
  }>;
}