import express from 'express';
import platformController from '../controllers/platform-controller';
import { authenticateJwt } from '../middlewares/auth';

const router = express.Router();

// 所有路由都需要認證
router.use(authenticateJwt);

// 平台 CRUD 操作
router.get('/', platformController.getAllPlatforms);
router.get('/:id', platformController.getPlatformById);
router.post('/', platformController.createPlatform);
router.put('/:id', platformController.updatePlatform);
router.delete('/:id', platformController.deletePlatform);

// 平台連接操作
router.post('/:id/connect', platformController.connectPlatform);
router.post('/:id/disconnect', platformController.disconnectPlatform);
router.post('/:id/test', platformController.testPlatformConnection);
router.get('/:id/status', platformController.getPlatformStatus);

// 平台同步操作
router.post('/:id/sync', platformController.syncPlatform);
router.post('/:id/sync/:syncId/cancel', platformController.cancelSync);
router.get('/:id/sync/:syncId', platformController.getSyncStatus);
router.get('/:id/sync-history', platformController.getSyncHistory);

export default router;