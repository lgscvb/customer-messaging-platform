import express from 'express';
import { Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/auth-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

// 創建管理員中間件包裝器
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.isAdmin(req, res, next);
};

/**
 * @route POST /api/auth/login
 * @desc 用戶登入
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/register
 * @desc 用戶註冊
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /api/auth/reset-password
 * @desc 重置密碼
 * @access Private (Admin)
 */
router.post('/reset-password', authenticate, adminOnly, AuthController.resetPassword);

/**
 * @route POST /api/auth/change-password
 * @desc 更改密碼
 * @access Private
 */
router.post('/change-password', authenticate, AuthController.changePassword);

/**
 * @route GET /api/auth/verify-token
 * @desc 驗證令牌
 * @access Public
 */
router.get('/verify-token', AuthController.verifyToken);

/**
 * @route GET /api/auth/me
 * @desc 獲取當前用戶
 * @access Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;