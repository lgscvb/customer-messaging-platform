import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole, UserStatus, UserExtension } from '../models/User';
import logger from '../utils/logger';

/**
 * JWT 負載接口
 */
interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * 擴展 Express 的 Request 接口，添加 user 屬性
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * 驗證 JWT
 * @param req 請求
 * @param res 響應
 * @param next 下一個中間件
 */
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 獲取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: '未提供認證令牌' });
      return;
    }
    
    // 提取令牌
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    // 驗證令牌
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as JwtPayload;
    
    // 查找用戶
    const user = await UserExtension.findById(payload.userId);
    
    if (!user) {
      res.status(401).json({ message: '無效的令牌' });
      return;
    }
    
    // 檢查用戶是否啟用
    if (!user.isActive) {
      res.status(403).json({ message: '用戶已被禁用' });
      return;
    }
    
    // 檢查用戶狀態
    if (user.status === UserStatus.SUSPENDED) {
      res.status(403).json({ message: '用戶已被暫停' });
      return;
    }
    
    // 更新最後登入時間
    await UserExtension.updateLastLogin(user.id);
    
    // 將用戶添加到請求中
    req.user = user;
    
    // 繼續下一個中間件
    next();
  } catch (error) {
    logger.error('認證錯誤:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: '無效的令牌' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: '令牌已過期' });
    } else {
      res.status(500).json({ message: '認證時發生錯誤' });
    }
  }
};

/**
 * 檢查角色
 * @param roles 允許的角色
 */
export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 檢查用戶是否存在
      if (!req.user) {
        res.status(401).json({ message: '未授權' });
        return;
      }
      
      // 檢查用戶角色
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ message: '沒有權限' });
        return;
      }
      
      // 繼續下一個中間件
      next();
    } catch (error) {
      logger.error('檢查角色錯誤:', error);
      res.status(500).json({ message: '檢查角色時發生錯誤' });
    }
  };
};

/**
 * 檢查是否為管理員
 */
export const isAdmin = checkRole([UserRole.ADMIN]);

/**
 * 檢查是否為管理員或經理
 */
export const isAdminOrManager = checkRole([UserRole.ADMIN, UserRole.MANAGER]);

/**
 * 檢查是否為客服人員
 */
export const isAgent = checkRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT]);