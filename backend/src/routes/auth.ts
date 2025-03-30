import express from 'express';
import AuthController from '../controllers/auth-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

const requireAdminRole = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return authMiddleware.adminOnly(req, res, next);
};

/**
 * @route POST /api/auth/login
 * @desc 用戶登錄
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/register
 * @desc 用戶註冊
 * @access Public/Admin (管理員可以創建任何角色的用戶)
 */
router.post('/register', AuthController.register);

/**
 * @route POST /api/auth/reset-password
 * @desc 重置密碼
 * @access Private (用戶本人或管理員)
 */
router.post('/reset-password', authenticate, AuthController.resetPassword);

/**
 * @route POST /api/auth/change-password
 * @desc 更改密碼
 * @access Private (僅用戶本人)
 */
router.post('/change-password', authenticate, AuthController.changePassword);

/**
 * @route GET /api/auth/me
 * @desc 獲取當前用戶信息
 * @access Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

/**
 * @route POST /api/auth/logout
 * @desc 用戶登出
 * @access Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route POST /api/auth/admin/create-user
 * @desc 管理員創建用戶
 * @access Admin
 */
router.post('/admin/create-user', authenticate, requireAdminRole, AuthController.register);

export default router;