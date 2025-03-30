import { Request, Response, NextFunction } from 'express';
import AuthService, { LoginRequestDTO, RegisterRequestDTO } from '../services/auth-service';
import { UserRole } from '../models/User';

/**
 * 認證控制器
 * 處理用戶認證相關的 API 請求
 */
class AuthController {
  /**
   * 用戶登錄
   * @route POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequestDTO = req.body;
      
      // 驗證請求數據
      if (!loginData.username || !loginData.password) {
        res.status(400).json({ message: '用戶名和密碼為必填項' });
        return;
      }
      
      // 調用認證服務進行登錄
      const loginResponse = await AuthService.login(loginData);
      
      // 返回登錄響應
      res.status(200).json(loginResponse);
    } catch (error) {
      console.error('登錄錯誤:', error);
      
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: '登錄過程中發生錯誤' });
      }
    }
  }
  
  /**
   * 用戶註冊
   * @route POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequestDTO = req.body;
      
      // 驗證請求數據
      if (!registerData.username || !registerData.email || !registerData.password || 
          !registerData.firstName || !registerData.lastName) {
        res.status(400).json({ message: '所有字段都為必填項' });
        return;
      }
      
      // 驗證密碼強度
      if (registerData.password.length < 8) {
        res.status(400).json({ message: '密碼長度必須至少為 8 個字符' });
        return;
      }
      
      // 驗證電子郵件格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        res.status(400).json({ message: '電子郵件格式無效' });
        return;
      }
      
      // 檢查角色權限
      // 只有管理員可以創建管理員或經理角色的用戶
      if (registerData.role && 
          (registerData.role === UserRole.ADMIN || registerData.role === UserRole.MANAGER)) {
        // 檢查當前用戶是否為管理員
        if (!req.user || req.user.role !== UserRole.ADMIN) {
          res.status(403).json({ message: '沒有權限創建此角色的用戶' });
          return;
        }
      }
      
      // 調用認證服務進行註冊
      const user = await AuthService.register(registerData);
      
      // 返回註冊響應
      res.status(201).json({
        message: '註冊成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('註冊錯誤:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('已存在')) {
          res.status(409).json({ message: error.message });
        } else {
          res.status(400).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: '註冊過程中發生錯誤' });
      }
    }
  }
  
  /**
   * 重置密碼
   * @route POST /api/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, newPassword } = req.body;
      
      // 驗證請求數據
      if (!userId || !newPassword) {
        res.status(400).json({ message: '用戶 ID 和新密碼為必填項' });
        return;
      }
      
      // 驗證密碼強度
      if (newPassword.length < 8) {
        res.status(400).json({ message: '密碼長度必須至少為 8 個字符' });
        return;
      }
      
      // 檢查權限
      // 只有管理員或用戶本人可以重置密碼
      if (!req.user || (req.user.id !== userId && req.user.role !== UserRole.ADMIN)) {
        res.status(403).json({ message: '沒有權限重置此用戶的密碼' });
        return;
      }
      
      // 調用認證服務重置密碼
      const success = await AuthService.resetPassword(userId, newPassword);
      
      if (success) {
        res.status(200).json({ message: '密碼重置成功' });
      } else {
        res.status(400).json({ message: '密碼重置失敗' });
      }
    } catch (error) {
      console.error('重置密碼錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '重置密碼過程中發生錯誤' });
      }
    }
  }
  
  /**
   * 更改密碼
   * @route POST /api/auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // 驗證請求數據
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: '當前密碼和新密碼為必填項' });
        return;
      }
      
      // 驗證密碼強度
      if (newPassword.length < 8) {
        res.status(400).json({ message: '密碼長度必須至少為 8 個字符' });
        return;
      }
      
      // 檢查用戶是否已認證
      if (!req.user) {
        res.status(401).json({ message: '未認證的用戶' });
        return;
      }
      
      // 調用認證服務更改密碼
      const success = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      if (success) {
        res.status(200).json({ message: '密碼更改成功' });
      } else {
        res.status(400).json({ message: '密碼更改失敗' });
      }
    } catch (error) {
      console.error('更改密碼錯誤:', error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '更改密碼過程中發生錯誤' });
      }
    }
  }
  
  /**
   * 獲取當前用戶信息
   * @route GET /api/auth/me
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // 檢查用戶是否已認證
      if (!req.user) {
        res.status(401).json({ message: '未認證的用戶' });
        return;
      }
      
      // 獲取用戶信息
      const user = await AuthService.validateToken(req.headers.authorization?.split(' ')[1] || '');
      
      // 返回用戶信息
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin
      });
    } catch (error) {
      console.error('獲取當前用戶信息錯誤:', error);
      
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: '獲取當前用戶信息過程中發生錯誤' });
      }
    }
  }
  
  /**
   * 登出
   * @route POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    // 由於使用 JWT，服務器端不需要做任何操作
    // 客戶端需要刪除本地存儲的令牌
    res.status(200).json({ message: '登出成功' });
  }
}

// 導出控制器實例
export default new AuthController();