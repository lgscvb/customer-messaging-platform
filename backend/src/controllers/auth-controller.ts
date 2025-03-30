import { Request, Response } from 'express';
import authService, { LoginData, RegisterData } from '../services/auth-service';
import logger from '../utils/logger';

/**
 * 登入請求 DTO
 */
export interface LoginRequestDTO {
  username: string;
  password: string;
}

/**
 * 註冊請求 DTO
 */
export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * 重置密碼請求 DTO
 */
export interface ResetPasswordRequestDTO {
  userId: string;
  newPassword: string;
}

/**
 * 更改密碼請求 DTO
 */
export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * 認證控制器
 * 處理認證相關的 API 請求
 */
class AuthController {
  /**
   * 登入
   * @route POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginData = req.body;
      
      // 驗證參數
      if (!loginData.username || !loginData.password) {
        res.status(400).json({ message: '用戶名和密碼為必填項' });
        return;
      }
      
      // 登入
      const result = await authService.login(loginData);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('登入錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '登入時發生錯誤' });
      }
    }
  }
  
  /**
   * 註冊
   * @route POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterData = req.body;
      
      // 驗證參數
      if (!registerData.username || !registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
        res.status(400).json({ message: '用戶名、郵箱、密碼、名字和姓氏為必填項' });
        return;
      }
      
      // 註冊
      const result = await authService.register(registerData);
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('註冊錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '註冊時發生錯誤' });
      }
    }
  }
  
  /**
   * 重置密碼
   * @route POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId, newPassword } = req.body as ResetPasswordRequestDTO;
      
      // 驗證參數
      if (!userId || !newPassword) {
        res.status(400).json({ message: '用戶 ID 和新密碼為必填項' });
        return;
      }
      
      // 重置密碼
      const success = await authService.resetPassword(userId, newPassword);
      
      if (success) {
        res.status(200).json({ message: '密碼已重置' });
      } else {
        res.status(400).json({ message: '密碼重置失敗' });
      }
    } catch (error) {
      logger.error('重置密碼錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '重置密碼時發生錯誤' });
      }
    }
  }
  
  /**
   * 更改密碼
   * @route POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as ChangePasswordRequestDTO;
      
      // 驗證參數
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: '當前密碼和新密碼為必填項' });
        return;
      }
      
      // 獲取用戶 ID
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 更改密碼
      const success = await authService.changePassword(userId, currentPassword, newPassword);
      
      if (success) {
        res.status(200).json({ message: '密碼已更改' });
      } else {
        res.status(400).json({ message: '密碼更改失敗' });
      }
    } catch (error) {
      logger.error('更改密碼錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '更改密碼時發生錯誤' });
      }
    }
  }
  
  /**
   * 驗證令牌
   * @route GET /api/auth/verify-token
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      // 獲取令牌
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ message: '未提供令牌' });
        return;
      }
      
      // 驗證令牌
      const result = await authService.verifyToken(token);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('驗證令牌錯誤:', error);
      
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: '驗證令牌時發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取當前用戶
   * @route GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // 獲取令牌
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ message: '未提供令牌' });
        return;
      }
      
      // 驗證令牌
      const result = await authService.verifyToken(token);
      
      res.status(200).json(result.user);
    } catch (error) {
      logger.error('獲取當前用戶錯誤:', error);
      
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取當前用戶時發生錯誤' });
      }
    }
  }
}

export default new AuthController();