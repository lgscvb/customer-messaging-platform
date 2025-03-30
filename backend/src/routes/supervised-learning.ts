import express from 'express';
import { Request, Response, NextFunction } from 'express';
import SupervisedLearningController from '../controllers/supervised-learning-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

/**
 * @route POST /api/supervised-learning/learn
 * @desc 從人工修改的回覆中學習
 * @access Private
 */
router.post('/learn', authenticate, SupervisedLearningController.learnFromHumanCorrection);

/**
 * @route POST /api/supervised-learning/batch-learn
 * @desc 批量處理學習樣本
 * @access Private
 */
router.post('/batch-learn', authenticate, SupervisedLearningController.batchLearn);

/**
 * @route GET /api/supervised-learning/stats
 * @desc 獲取學習統計信息
 * @access Private
 */
router.get('/stats', authenticate, SupervisedLearningController.getLearningStats);

export default router;