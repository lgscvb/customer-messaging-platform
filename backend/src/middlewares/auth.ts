import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { UserRole, UserStatus } from '../models/User';

/**
 * JWT 令牌負載
 */
interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * 擴展 Express 請求類型
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

/**
 * 驗證 JWT 令牌中間件
 * 檢查請求頭中的 Authorization 令牌，並驗證其有效性
 */
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 從請求頭中獲取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: '未提供認證令牌' });
    }
    
    // 檢查令牌格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: '認證令牌格式無效' });
    }
    
    const token = parts[1];
    
    // 驗證令牌
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // 檢查用戶是否存在
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: '用戶不存在' });
    }
    
    // 檢查用戶狀態
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ message: '用戶帳號已停用' });
    }
    
    // 將用戶信息添加到請求對象
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    // 更新用戶最後登錄時間
    await UserModel.updateLastLogin(user.id);
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: '無效的認證令牌' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: '認證令牌已過期' });
    }
    
    console.error('認證錯誤:', error);
    return res.status(500).json({ message: '認證過程中發生錯誤' });
  }
};

/**
 * 角色授權中間件
 * 檢查用戶是否具有所需的角色
 * @param roles 允許的角色列表
 */
export const authorizeRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 檢查用戶是否已認證
    if (!req.user) {
      return res.status(401).json({ message: '未認證的用戶' });
    }
    
    // 檢查用戶角色
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '沒有足夠的權限' });
    }
    
    next();
  };
};

/**
 * 僅允許管理員訪問的中間件
 */
export const adminOnly = authorizeRoles([UserRole.ADMIN]);

/**
 * 允許管理員和經理訪問的中間件
 */
export const managerAndAbove = authorizeRoles([UserRole.ADMIN, UserRole.MANAGER]);

/**
 * 允許代理及以上角色訪問的中間件
 */
export const agentAndAbove = authorizeRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT]);

/**
 * 資源所有者授權中間件
 * 檢查用戶是否是資源的所有者
 * @param getResourceOwnerId 獲取資源所有者 ID 的函數
 */
export const authorizeResourceOwner = (
  getResourceOwnerId: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 檢查用戶是否已認證
      if (!req.user) {
        return res.status(401).json({ message: '未認證的用戶' });
      }
      
      // 管理員可以訪問所有資源
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }
      
      // 獲取資源所有者 ID
      const ownerId = await getResourceOwnerId(req);
      
      // 如果找不到資源所有者，返回 404
      if (ownerId === null) {
        return res.status(404).json({ message: '資源不存在' });
      }
      
      // 檢查用戶是否是資源所有者
      if (req.user.id !== ownerId) {
        return res.status(403).json({ message: '沒有足夠的權限' });
      }
      
      next();
    } catch (error) {
      console.error('資源所有者授權錯誤:', error);
      return res.status(500).json({ message: '授權過程中發生錯誤' });
    }
  };
};

/**
 * 生成 JWT 令牌
 * @param userId 用戶 ID
 * @param username 用戶名
 * @param role 用戶角色
 * @returns JWT 令牌
 */
export const generateToken = (userId: string, username: string, role: UserRole): string => {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  
  const payload = {
    userId,
    username,
    role
  };
  
  // 使用 any 類型暫時繞過類型檢查
  // 在實際生產環境中，應該使用更嚴格的類型檢查
  return jwt.sign(payload, jwtSecret, { expiresIn } as any);
};