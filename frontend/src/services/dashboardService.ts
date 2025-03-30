import api from './api';

/**
 * 概覽統計接口
 */
export interface OverviewStats {
  totalMessages: number;
  totalCustomers: number;
  totalReplies: number;
  totalAiReplies: number;
  activeConversations: number;
  averageResponseTime: number;
  messagesByPlatform: Record<string, number>;
  messagesByStatus: Record<string, number>;
}

/**
 * 時間範圍類型
 */
export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

/**
 * 趨勢數據接口
 */
export interface TrendData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * 客戶互動數據接口
 */
export interface CustomerInteractionData {
  messagesTrend: TrendData;
  repliesTrend: TrendData;
  responseTimeTrend: TrendData;
  topCustomers: {
    id: string;
    name: string;
    avatar: string;
    messageCount: number;
    platform: string;
  }[];
}

/**
 * 回覆效果數據接口
 */
export interface ReplyEffectivenessData {
  aiRepliesPercentage: number;
  aiRepliesTrend: TrendData;
  aiConfidenceDistribution: {
    label: string;
    value: number;
    color: string;
  }[];
  topCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * 儀表板服務
 */
const dashboardService = {
  /**
   * 獲取概覽統計
   */
  getOverviewStats: async (timeRange: TimeRange = 'week'): Promise<OverviewStats> => {
    const response = await api.get(`/dashboard/overview?timeRange=${timeRange}`);
    return response.data;
  },
  
  /**
   * 獲取客戶互動數據
   */
  getCustomerInteractionData: async (timeRange: TimeRange = 'week'): Promise<CustomerInteractionData> => {
    const response = await api.get(`/dashboard/customer-interaction?timeRange=${timeRange}`);
    return response.data;
  },
  
  /**
   * 獲取回覆效果數據
   */
  getReplyEffectivenessData: async (timeRange: TimeRange = 'week'): Promise<ReplyEffectivenessData> => {
    const response = await api.get(`/dashboard/reply-effectiveness?timeRange=${timeRange}`);
    return response.data;
  },
  
  /**
   * 獲取模擬概覽統計（用於開發）
   */
  getMockOverviewStats: (): OverviewStats => {
    return {
      totalMessages: 1248,
      totalCustomers: 356,
      totalReplies: 987,
      totalAiReplies: 623,
      activeConversations: 42,
      averageResponseTime: 5.2,
      messagesByPlatform: {
        line: 523,
        facebook: 412,
        instagram: 198,
        website: 115
      },
      messagesByStatus: {
        new: 87,
        pending: 156,
        resolved: 892,
        closed: 113
      }
    };
  },
  
  /**
   * 獲取模擬客戶互動數據（用於開發）
   */
  getMockCustomerInteractionData: (): CustomerInteractionData => {
    return {
      messagesTrend: {
        labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
        datasets: [
          {
            label: '訊息數量',
            data: [65, 78, 52, 91, 83, 56, 47],
            color: '#2196f3'
          }
        ]
      },
      repliesTrend: {
        labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
        datasets: [
          {
            label: '回覆數量',
            data: [54, 67, 41, 76, 68, 42, 35],
            color: '#4caf50'
          }
        ]
      },
      responseTimeTrend: {
        labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
        datasets: [
          {
            label: '回覆時間 (分鐘)',
            data: [6.2, 5.8, 7.1, 4.5, 5.3, 6.7, 5.9],
            color: '#ff9800'
          }
        ]
      },
      topCustomers: [
        {
          id: '1',
          name: '王小明',
          avatar: '',
          messageCount: 42,
          platform: 'line'
        },
        {
          id: '2',
          name: '李小花',
          avatar: '',
          messageCount: 38,
          platform: 'facebook'
        },
        {
          id: '3',
          name: '張大山',
          avatar: '',
          messageCount: 31,
          platform: 'instagram'
        },
        {
          id: '4',
          name: '陳小華',
          avatar: '',
          messageCount: 27,
          platform: 'line'
        },
        {
          id: '5',
          name: '林小雨',
          avatar: '',
          messageCount: 24,
          platform: 'website'
        }
      ]
    };
  },
  
  /**
   * 獲取模擬回覆效果數據（用於開發）
   */
  getMockReplyEffectivenessData: (): ReplyEffectivenessData => {
    return {
      aiRepliesPercentage: 63.1,
      aiRepliesTrend: {
        labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
        datasets: [
          {
            label: 'AI 回覆百分比',
            data: [58, 62, 65, 61, 67, 64, 63],
            color: '#8c6eff'
          }
        ]
      },
      aiConfidenceDistribution: [
        {
          label: '高信心 (>80%)',
          value: 42,
          color: '#4caf50'
        },
        {
          label: '中信心 (50-80%)',
          value: 35,
          color: '#ff9800'
        },
        {
          label: '低信心 (<50%)',
          value: 23,
          color: '#f44336'
        }
      ],
      topCategories: [
        {
          category: '產品詢問',
          count: 312,
          percentage: 25
        },
        {
          category: '訂單狀態',
          count: 287,
          percentage: 23
        },
        {
          category: '退換貨',
          count: 198,
          percentage: 16
        },
        {
          category: '付款問題',
          count: 156,
          percentage: 12.5
        },
        {
          category: '配送查詢',
          count: 143,
          percentage: 11.5
        }
      ]
    };
  }
};

export default dashboardService;