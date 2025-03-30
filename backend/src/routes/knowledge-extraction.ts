import express from 'express';
import knowledgeExtractionController from '../controllers/knowledge-extraction-controller';
import { authenticateJwt, isAgent } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/knowledge-extraction/conversation/:conversationId
 * @desc 從對話中提取知識
 * @access Private (需要客服人員權限)
 */
router.post(
  '/conversation/:conversationId',
  authenticateJwt,
  isAgent,
  knowledgeExtractionController.extractFromConversation
);

/**
 * @route POST /api/knowledge-extraction/modified-response
 * @desc 從修改的 AI 回覆中提取知識
 * @access Private (需要客服人員權限)
 */
router.post(
  '/modified-response',
  authenticateJwt,
  isAgent,
  knowledgeExtractionController.extractFromModifiedResponse
);

/**
 * @route POST /api/knowledge-extraction/batch
 * @desc 批量處理對話，提取知識
 * @access Private (需要客服人員權限)
 */
router.post(
  '/batch',
  authenticateJwt,
  isAgent,
  knowledgeExtractionController.batchProcess
);

export default router;