import express from 'express';
import { Request, Response, NextFunction } from 'express';
import AIController from '../controllers/ai-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

/**
 * @route POST /api/ai/reply
 * @desc 生成 AI 回覆
 * @access Private
 */
router.post('/reply', authenticate, AIController.generateReply);

/**
 * @route POST /api/ai/send-reply
 * @desc 發送 AI 回覆
 * @access Private
 */
router.post('/send-reply', authenticate, AIController.sendReply);

/**
 * @route GET /api/ai/knowledge-search
 * @desc 搜索知識庫
 * @access Private
 */
router.get('/knowledge-search', authenticate, AIController.searchKnowledge);

/**
 * @route POST /api/ai/evaluate-reply
 * @desc 評估回覆品質
 * @access Private
 */
router.post('/evaluate-reply', authenticate, AIController.evaluateReply);

export default router;