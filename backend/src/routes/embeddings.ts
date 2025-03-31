import express from 'express';
import embeddingController from '../controllers/embedding-controller';
import { authenticateJwt as authMiddleware } from '../middlewares/auth';

const router = express.Router();

/**
 * @route   POST /api/embeddings/knowledge-items/:id
 * @desc    為知識項目生成嵌入向量
 * @access  Private
 */
router.post(
  '/knowledge-items/:id',
  authMiddleware,
  embeddingController.generateEmbeddingForKnowledgeItem
);

/**
 * @route   POST /api/embeddings/messages/:id
 * @desc    為消息生成嵌入向量
 * @access  Private
 */
router.post(
  '/messages/:id',
  authMiddleware,
  embeddingController.generateEmbeddingForMessage
);

/**
 * @route   POST /api/embeddings/text
 * @desc    為文本生成嵌入向量
 * @access  Private
 */
router.post(
  '/text',
  authMiddleware,
  embeddingController.generateEmbeddingForText
);

/**
 * @route   GET /api/embeddings/search/knowledge-items
 * @desc    搜索相似知識項目
 * @access  Private
 */
router.get(
  '/search/knowledge-items',
  authMiddleware,
  embeddingController.searchSimilarKnowledgeItems
);

/**
 * @route   GET /api/embeddings/search/messages
 * @desc    搜索相似消息
 * @access  Private
 */
router.get(
  '/search/messages',
  authMiddleware,
  embeddingController.searchSimilarMessages
);

/**
 * @route   POST /api/embeddings/batch/knowledge-items
 * @desc    批量處理知識項目，生成嵌入向量
 * @access  Private
 */
router.post(
  '/batch/knowledge-items',
  authMiddleware,
  embeddingController.batchProcessKnowledgeItems
);

/**
 * @route   POST /api/embeddings/regenerate/knowledge-items
 * @desc    重新生成所有知識項目的嵌入向量
 * @access  Private
 */
router.post(
  '/regenerate/knowledge-items',
  authMiddleware,
  embeddingController.regenerateAllKnowledgeItemEmbeddings
);

export default router;