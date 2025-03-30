import api from './api';
import { TimeRange } from '../types/analytics';

/**
 * 分析服務
 * 提供客戶互動分析、回覆效果評估和銷售轉化率分析的 API 調用
 */
class AnalyticsService {
  /**
   * 獲取客戶互動分析
   * @param timeRange 時間範圍
   * @returns 客戶互動分析數據
   */
  async getCustomerInteractionAnalytics(timeRange: TimeRange = 'week') {
    try {
      const response = await api.get(`/analytics/customer-interaction?timeRange=${timeRange}`);
      return response.data.data;
    } catch (error) {
      console.error('獲取客戶互動分析失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取回覆效果評估
   * @param timeRange 時間範圍
   * @returns 回覆效果評估數據
   */
  async getReplyEffectivenessAnalytics(timeRange: TimeRange = 'week') {
    try {
      const response = await api.get(`/analytics/reply-effectiveness?timeRange=${timeRange}`);
      return response.data.data;
    } catch (error) {
      console.error('獲取回覆效果評估失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取銷售轉化率分析
   * @param timeRange 時間範圍
   * @returns 銷售轉化率分析數據
   */
  async getSalesConversionAnalytics(timeRange: TimeRange = 'week') {
    try {
      const response = await api.get(`/analytics/sales-conversion?timeRange=${timeRange}`);
      return response.data.data;
    } catch (error) {
      console.error('獲取銷售轉化率分析失敗', error);
      throw error;
    }
  }
  
  /**
   * 獲取所有分析數據
   * @param timeRange 時間範圍
   * @returns 所有分析數據
   */
  async getAllAnalytics(timeRange: TimeRange = 'week') {
    try {
      const response = await api.get(`/analytics/all?timeRange=${timeRange}`);
      return response.data.data;
    } catch (error) {
      console.error('獲取所有分析數據失敗', error);
      throw error;
    }
  }
}

export default new AnalyticsService();