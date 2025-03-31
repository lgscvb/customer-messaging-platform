import express from 'express';
import advancedAiController from '../controllers/advanced-ai-controller';
import authMiddleware from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/advanced-ai/detect-language:
 *   post:
 *     summary: 檢測文本語言
 *     description: 檢測文本的語言並返回語言代碼和置信度
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: 要檢測語言的文本
 *     responses:
 *       200:
 *         description: 成功檢測語言
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                   description: 語言代碼
 *                 confidence:
 *                   type: number
 *                   description: 置信度
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/detect-language', authMiddleware, advancedAiController.detectLanguage);

/**
 * @swagger
 * /api/advanced-ai/translate-text:
 *   post:
 *     summary: 翻譯文本
 *     description: 將文本翻譯為指定語言
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLanguage
 *             properties:
 *               text:
 *                 type: string
 *                 description: 要翻譯的文本
 *               targetLanguage:
 *                 type: string
 *                 description: 目標語言代碼
 *               sourceLanguage:
 *                 type: string
 *                 description: 源語言代碼（可選）
 *     responses:
 *       200:
 *         description: 成功翻譯文本
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 translatedText:
 *                   type: string
 *                   description: 翻譯後的文本
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/translate-text', authMiddleware, advancedAiController.translateText);

/**
 * @swagger
 * /api/advanced-ai/analyze-sentiment:
 *   post:
 *     summary: 分析情感
 *     description: 分析文本的情感，返回情感類型、分數和解釋
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: 要分析情感的文本
 *               language:
 *                 type: string
 *                 description: 文本語言代碼（可選）
 *     responses:
 *       200:
 *         description: 成功分析情感
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentiment:
 *                   type: string
 *                   description: 情感類型
 *                 score:
 *                   type: number
 *                   description: 情感分數
 *                 explanation:
 *                   type: string
 *                   description: 情感解釋
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/analyze-sentiment', authMiddleware, advancedAiController.analyzeSentiment);

/**
 * @swagger
 * /api/advanced-ai/recognize-intent:
 *   post:
 *     summary: 識別意圖
 *     description: 識別文本的意圖，返回意圖類型、置信度和實體
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: 要識別意圖的文本
 *               language:
 *                 type: string
 *                 description: 文本語言代碼（可選）
 *     responses:
 *       200:
 *         description: 成功識別意圖
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intent:
 *                   type: string
 *                   description: 意圖類型
 *                 confidence:
 *                   type: number
 *                   description: 置信度
 *                 entities:
 *                   type: array
 *                   description: 實體列表
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: 實體類型
 *                       value:
 *                         type: string
 *                         description: 實體值
 *                       position:
 *                         type: array
 *                         description: 實體位置
 *                         items:
 *                           type: number
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/recognize-intent', authMiddleware, advancedAiController.recognizeIntent);

/**
 * @swagger
 * /api/advanced-ai/generate-conversation-summary:
 *   post:
 *     summary: 生成對話摘要
 *     description: 生成客戶對話的摘要，包括關鍵點、客戶需求和行動項目
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: 客戶 ID
 *               limit:
 *                 type: number
 *                 description: 消息數量限制（可選）
 *     responses:
 *       200:
 *         description: 成功生成對話摘要
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: 摘要
 *                 keyPoints:
 *                   type: array
 *                   description: 關鍵點列表
 *                   items:
 *                     type: string
 *                 customerNeeds:
 *                   type: array
 *                   description: 客戶需求列表
 *                   items:
 *                     type: string
 *                 actionItems:
 *                   type: array
 *                   description: 行動項目列表
 *                   items:
 *                     type: string
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/generate-conversation-summary', authMiddleware, advancedAiController.generateConversationSummary);

/**
 * @swagger
 * /api/advanced-ai/active-learning:
 *   post:
 *     summary: 主動學習
 *     description: 分析原始 AI 回覆和人工修改後的回覆，提取學習點
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalReply
 *               - humanReply
 *               - query
 *             properties:
 *               originalReply:
 *                 type: string
 *                 description: 原始 AI 回覆
 *               humanReply:
 *                 type: string
 *                 description: 人工修改後的回覆
 *               query:
 *                 type: string
 *                 description: 查詢
 *     responses:
 *       200:
 *         description: 成功進行主動學習
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalReply:
 *                   type: string
 *                   description: 原始 AI 回覆
 *                 improvedReply:
 *                   type: string
 *                   description: 改進後的回覆
 *                 learningPoints:
 *                   type: array
 *                   description: 學習點列表
 *                   items:
 *                     type: string
 *                 confidence:
 *                   type: number
 *                   description: 置信度
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/active-learning', authMiddleware, advancedAiController.activeLearning);

/**
 * @swagger
 * /api/advanced-ai/adjust-reply-by-sentiment:
 *   post:
 *     summary: 根據情感調整回覆
 *     description: 根據情感分析結果調整回覆的語氣和內容
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *               - sentiment
 *             properties:
 *               reply:
 *                 type: string
 *                 description: 原始回覆
 *               sentiment:
 *                 type: object
 *                 description: 情感分析結果
 *                 properties:
 *                   sentiment:
 *                     type: string
 *                     description: 情感類型
 *                   score:
 *                     type: number
 *                     description: 情感分數
 *                   explanation:
 *                     type: string
 *                     description: 情感解釋
 *     responses:
 *       200:
 *         description: 成功調整回覆
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adjustedReply:
 *                   type: string
 *                   description: 調整後的回覆
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/adjust-reply-by-sentiment', authMiddleware, advancedAiController.adjustReplyBySentiment);

/**
 * @swagger
 * /api/advanced-ai/adjust-reply-by-intent:
 *   post:
 *     summary: 根據意圖調整回覆
 *     description: 根據意圖識別結果調整回覆的內容和結構
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *               - intent
 *             properties:
 *               reply:
 *                 type: string
 *                 description: 原始回覆
 *               intent:
 *                 type: object
 *                 description: 意圖識別結果
 *                 properties:
 *                   intent:
 *                     type: string
 *                     description: 意圖類型
 *                   confidence:
 *                     type: number
 *                     description: 置信度
 *                   entities:
 *                     type: array
 *                     description: 實體列表
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: 實體類型
 *                         value:
 *                           type: string
 *                           description: 實體值
 *                         position:
 *                           type: array
 *                           description: 實體位置
 *                           items:
 *                             type: number
 *     responses:
 *       200:
 *         description: 成功調整回覆
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adjustedReply:
 *                   type: string
 *                   description: 調整後的回覆
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/adjust-reply-by-intent', authMiddleware, advancedAiController.adjustReplyByIntent);

/**
 * @swagger
 * /api/advanced-ai/generate-multilingual-reply:
 *   post:
 *     summary: 生成多語言回覆
 *     description: 將回覆翻譯為指定語言
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *               - targetLanguage
 *             properties:
 *               reply:
 *                 type: string
 *                 description: 原始回覆
 *               targetLanguage:
 *                 type: string
 *                 description: 目標語言代碼
 *     responses:
 *       200:
 *         description: 成功生成多語言回覆
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 translatedReply:
 *                   type: string
 *                   description: 翻譯後的回覆
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/generate-multilingual-reply', authMiddleware, advancedAiController.generateMultilingualReply);

/**
 * @swagger
 * /api/advanced-ai/generate-enhanced-reply:
 *   post:
 *     summary: 生成增強回覆
 *     description: 生成增強的 AI 回覆，包括語言檢測、情感分析、意圖識別和多語言支持
 *     tags: [Advanced AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - customerId
 *             properties:
 *               query:
 *                 type: string
 *                 description: 查詢
 *               customerId:
 *                 type: string
 *                 description: 客戶 ID
 *     responses:
 *       200:
 *         description: 成功生成增強回覆
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: 回覆
 *                 confidence:
 *                   type: number
 *                   description: 置信度
 *                 sources:
 *                   type: array
 *                   description: 來源列表
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 來源 ID
 *                       title:
 *                         type: string
 *                         description: 來源標題
 *                       content:
 *                         type: string
 *                         description: 來源內容
 *                       relevance:
 *                         type: number
 *                         description: 相關性
 *                 metadata:
 *                   type: object
 *                   description: 元數據
 *       400:
 *         description: 缺少必要參數
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/generate-enhanced-reply', authMiddleware, advancedAiController.generateEnhancedReply);

export default router;
