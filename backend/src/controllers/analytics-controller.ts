import { Request, Response } from 'express';
import analyticsService from '../services/analytics-service';
import { TimeRange } from '../types/analytics';
import logger from '../utils/logger';

/**
 * 分析控制器
 * 處理分析相關的請求
 */
class AnalyticsController {
  /**
   * 獲取客戶互動分析
   * @param req 請求對象
   * @param res 響應對象
   */
  async getCustomerInteractionAnalytics(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || 'week';
      const analytics = await analyticsService.getCustomerInteractionAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('獲取客戶互動分析失敗', error);
      res.status(500).json({
        success: false,
        message: '獲取客戶互動分析失敗',
        error: (error as Error).message,
      });
    }
  }
  
  /**
   * 獲取回覆效果評估
   * @param req 請求對象
   * @param res 響應對象
   */
  async getReplyEffectivenessAnalytics(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || 'week';
      const analytics = await analyticsService.getReplyEffectivenessAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('獲取回覆效果評估失敗', error);
      res.status(500).json({
        success: false,
        message: '獲取回覆效果評估失敗',
        error: (error as Error).message,
      });
    }
  }
  
  /**
   * 獲取銷售轉化率分析
   * @param req 請求對象
   * @param res 響應對象
   */
  async getSalesConversionAnalytics(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || 'week';
      const analytics = await analyticsService.getSalesConversionAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('獲取銷售轉化率分析失敗', error);
      res.status(500).json({
        success: false,
        message: '獲取銷售轉化率分析失敗',
        error: (error as Error).message,
      });
    }
  }
  
  /**
   * 獲取所有分析數據
   * @param req 請求對象
   * @param res 響應對象
   */
  async getAllAnalytics(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as TimeRange) || 'week';
      
      const [customerInteraction, replyEffectiveness, salesConversion] = await Promise.all([
        analyticsService.getCustomerInteractionAnalytics(timeRange),
        analyticsService.getReplyEffectivenessAnalytics(timeRange),
        analyticsService.getSalesConversionAnalytics(timeRange),
      ]);
      
      res.json({
        success: true,
        data: {
          customerInteraction,
          replyEffectiveness,
          salesConversion,
        },
      });
    } catch (error) {
      logger.error('獲取所有分析數據失敗', error);
      res.status(500).json({
        success: false,
        message: '獲取所有分析數據失敗',
        error: (error as Error).message,
      });
    }
  }
}

export default new AnalyticsController();