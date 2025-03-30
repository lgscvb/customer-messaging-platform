import express from 'express';
import apiConfigController from '../controllers/api-config-controller';
import { authenticateJwt, isAdmin } from '../middlewares/auth';

const router = express.Router();

/**
 * @route   GET /api/api-configs
 * @desc    獲取所有 API 設定
 * @access  管理員
 */
router.get('/', authenticateJwt, isAdmin, apiConfigController.getAllApiConfigs);

/**
 * @route   GET /api/api-configs/active
 * @desc    獲取所有啟用的 API 設定
 * @access  管理員
 */
router.get('/active', authenticateJwt, isAdmin, apiConfigController.getAllActiveApiConfigs);

/**
 * @route   GET /api/api-configs/:id
 * @desc    根據 ID 獲取 API 設定
 * @access  管理員
 */
router.get('/:id', authenticateJwt, isAdmin, apiConfigController.getApiConfigById);

/**
 * @route   GET /api/api-configs/key/:key
 * @desc    根據鍵獲取 API 設定
 * @access  管理員
 */
router.get('/key/:key', authenticateJwt, isAdmin, apiConfigController.getApiConfigByKey);

/**
 * @route   GET /api/api-configs/type/:type
 * @desc    根據類型獲取 API 設定列表
 * @access  管理員
 */
router.get('/type/:type', authenticateJwt, isAdmin, apiConfigController.getApiConfigsByType);

/**
 * @route   POST /api/api-configs
 * @desc    創建 API 設定
 * @access  管理員
 */
router.post('/', authenticateJwt, isAdmin, apiConfigController.createApiConfig);

/**
 * @route   PUT /api/api-configs/:id
 * @desc    更新 API 設定
 * @access  管理員
 */
router.put('/:id', authenticateJwt, isAdmin, apiConfigController.updateApiConfig);

/**
 * @route   DELETE /api/api-configs/:id
 * @desc    刪除 API 設定
 * @access  管理員
 */
router.delete('/:id', authenticateJwt, isAdmin, apiConfigController.deleteApiConfig);

/**
 * @route   GET /api/api-configs/value/:key
 * @desc    獲取 API 設定值
 * @access  管理員
 */
router.get('/value/:key', authenticateJwt, isAdmin, apiConfigController.getApiConfigValue);

/**
 * @route   PUT /api/api-configs/value/:key
 * @desc    設置 API 設定值
 * @access  管理員
 */
router.put('/value/:key', authenticateJwt, isAdmin, apiConfigController.setApiConfigValue);

/**
 * @route   POST /api/api-configs/bulk
 * @desc    批量創建 API 設定
 * @access  管理員
 */
router.post('/bulk', authenticateJwt, isAdmin, apiConfigController.bulkCreateApiConfigs);

/**
 * @route   PUT /api/api-configs/bulk
 * @desc    批量更新 API 設定
 * @access  管理員
 */
router.put('/bulk', authenticateJwt, isAdmin, apiConfigController.bulkUpdateApiConfigs);

export default router;