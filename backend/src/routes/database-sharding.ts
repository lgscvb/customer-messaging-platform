/**
 * 資料庫分片路由
 * 
 * 此路由定義資料庫分片相關的 API 端點
 */

import express from 'express';
import databaseShardingController from '../controllers/database-sharding-controller';
import { authenticateJwt, isAdmin } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/database-sharding/status:
 *   get:
 *     summary: 獲取資料庫分片狀態
 *     description: 獲取資料庫分片的當前狀態信息
 *     tags: [Database Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取資料庫分片狀態
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 initialized:
 *                   type: boolean
 *                 masterConnected:
 *                   type: boolean
 *                 slavesConnected:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: 服務器錯誤
 */
router.get('/status', authenticateJwt, isAdmin, databaseShardingController.getStatus);

/**
 * @swagger
 * /api/database-sharding/config:
 *   get:
 *     summary: 獲取資料庫分片配置
 *     description: 獲取資料庫分片的配置信息
 *     tags: [Database Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取資料庫分片配置
 *       500:
 *         description: 服務器錯誤
 */
router.get('/config', authenticateJwt, isAdmin, databaseShardingController.getConfig);

/**
 * @swagger
 * /api/database-sharding/initialize:
 *   post:
 *     summary: 初始化資料庫分片
 *     description: 初始化資料庫分片並測試連接
 *     tags: [Database Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 資料庫分片初始化成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 服務器錯誤
 */
router.post('/initialize', authenticateJwt, isAdmin, databaseShardingController.initialize);

/**
 * @swagger
 * /api/database-sharding/check:
 *   get:
 *     summary: 檢查資料庫分片功能是否啟用
 *     description: 檢查資料庫分片和讀寫分離功能是否啟用
 *     tags: [Database Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功檢查資料庫分片功能
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shardingEnabled:
 *                   type: boolean
 *                 readWriteSeparationEnabled:
 *                   type: boolean
 *       500:
 *         description: 服務器錯誤
 */
router.get('/check', authenticateJwt, isAdmin, databaseShardingController.checkShardingEnabled);

export default router;