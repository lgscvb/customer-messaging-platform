import express from 'express';
import knowledgeOrganizationController from '../controllers/knowledge-organization-controller';
import { authenticateJwt, isAgent, isAdminOrManager } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/knowledge-organization/:knowledgeItemId
 * @desc 組織知識項目
 * @access Private (需要客服人員權限)
 */
router.post(
  '/:knowledgeItemId',
  authenticateJwt,
  isAgent,
  knowledgeOrganizationController.organizeKnowledgeItem
);

/**
 * @route POST /api/knowledge-organization/apply
 * @desc 應用組織結果
 * @access Private (需要客服人員權限)
 */
router.post(
  '/apply',
  authenticateJwt,
  isAgent,
  knowledgeOrganizationController.applyOrganizationResult
);

/**
 * @route POST /api/knowledge-organization/batch
 * @desc 批量組織知識項目
 * @access Private (需要管理員或經理權限)
 */
router.post(
  '/batch',
  authenticateJwt,
  isAdminOrManager,
  knowledgeOrganizationController.batchOrganizeKnowledgeItems
);

/**
 * @route GET /api/knowledge-organization/graph
 * @desc 生成知識圖譜
 * @access Private (需要客服人員權限)
 */
router.get(
  '/graph',
  authenticateJwt,
  isAgent,
  knowledgeOrganizationController.generateKnowledgeGraph
);

/**
 * @route GET /api/knowledge-organization/analyze
 * @desc 分析知識庫結構
 * @access Private (需要管理員或經理權限)
 */
router.get(
  '/analyze',
  authenticateJwt,
  isAdminOrManager,
  knowledgeOrganizationController.analyzeKnowledgeStructure
);

export default router;