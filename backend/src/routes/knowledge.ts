import express from 'express';
import { Request, Response, NextFunction } from 'express';
import KnowledgeController from '../controllers/knowledge-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

/**
 * @route POST /api/knowledge
 * @desc 創建知識項目
 * @access Private
 */
router.post('/', authenticate, KnowledgeController.createKnowledgeItem);

/**
 * @route GET /api/knowledge/:id
 * @desc 獲取知識項目
 * @access Private
 */
router.get('/:id', authenticate, KnowledgeController.getKnowledgeItem);

/**
 * @route PUT /api/knowledge/:id
 * @desc 更新知識項目
 * @access Private
 */
router.put('/:id', authenticate, KnowledgeController.updateKnowledgeItem);

/**
 * @route DELETE /api/knowledge/:id
 * @desc 刪除知識項目
 * @access Private
 */
router.delete('/:id', authenticate, KnowledgeController.deleteKnowledgeItem);

/**
 * @route GET /api/knowledge/search
 * @desc 搜索知識項目
 * @access Private
 */
router.get('/search', authenticate, KnowledgeController.searchKnowledgeItems);

/**
 * @route GET /api/knowledge/categories
 * @desc 獲取知識項目分類列表
 * @access Private
 */
router.get('/categories', authenticate, KnowledgeController.getCategories);

/**
 * @route GET /api/knowledge/tags
 * @desc 獲取知識項目標籤列表
 * @access Private
 */
router.get('/tags', authenticate, KnowledgeController.getTags);

/**
 * @route GET /api/knowledge/sources
 * @desc 獲取知識項目來源列表
 * @access Private
 */
router.get('/sources', authenticate, KnowledgeController.getSources);

/**
 * @route POST /api/knowledge/bulk-import
 * @desc 批量導入知識項目
 * @access Private
 */
router.post('/bulk-import', authenticate, KnowledgeController.bulkImport);

/**
 * @route PUT /api/knowledge/bulk-update
 * @desc 批量更新知識項目
 * @access Private
 */
router.put('/bulk-update', authenticate, KnowledgeController.bulkUpdate);

/**
 * @route DELETE /api/knowledge/bulk-delete
 * @desc 批量刪除知識項目
 * @access Private
 */
router.delete('/bulk-delete', authenticate, KnowledgeController.bulkDelete);

/**
 * @route GET /api/knowledge/statistics
 * @desc 獲取知識項目統計信息
 * @access Private
 */
router.get('/statistics', authenticate, KnowledgeController.getStatistics);

export default router;