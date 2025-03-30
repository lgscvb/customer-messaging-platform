import express from 'express';
import analyticsController from '../controllers/analytics-controller';
import { authenticateJwt, isAdminOrManager } from '../middlewares/auth';

const router = express.Router();

/**
 * @route GET /api/analytics/customer-interaction
 * @desc 獲取客戶互動分析
 * @access Private
 */
router.get('/customer-interaction', authenticateJwt, isAdminOrManager, analyticsController.getCustomerInteractionAnalytics);

/**
 * @route GET /api/analytics/reply-effectiveness
 * @desc 獲取回覆效果評估
 * @access Private
 */
router.get('/reply-effectiveness', authenticateJwt, isAdminOrManager, analyticsController.getReplyEffectivenessAnalytics);

/**
 * @route GET /api/analytics/sales-conversion
 * @desc 獲取銷售轉化率分析
 * @access Private
 */
router.get('/sales-conversion', authenticateJwt, isAdminOrManager, analyticsController.getSalesConversionAnalytics);

/**
 * @route GET /api/analytics/all
 * @desc 獲取所有分析數據
 * @access Private
 */
router.get('/all', authenticateJwt, isAdminOrManager, analyticsController.getAllAnalytics);

export default router;