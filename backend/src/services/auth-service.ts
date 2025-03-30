import User, { UserRole, UserStatus, CreateUserDTO, UserExtension } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';

/**
 * 登入數據接口
 */
export interface LoginData {
  username: string;
  password: string;
}

/**
 * 註冊數據接口
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * 認證結果接口
 */
export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date | null;
  };
  token: string;
}

/**
 * 認證服務
 * 處理用戶認證、註冊和密碼重置
 */
class AuthService {
  /**
   * 登入
   * @param loginData 登入數據
   */
  async login(loginData: LoginData): Promise<AuthResult> {
    try {
      // 查找用戶
      const user = await UserExtension.findByUsername(loginData.username);
      
      // 檢查用戶是否存在
      if (!user) {
        throw new Error('用戶名或密碼不正確');
      }
      
      // 檢查用戶是否啟用
      if (!user.isActive) {
        throw new Error('用戶已被禁用');
      }
      
      // 檢查用戶狀態
      if (user.status === UserStatus.SUSPENDED) {
        throw new Error('用戶已被暫停');
      }
      
      // 驗證密碼
      const isPasswordValid = await user.validatePassword(loginData.password);
      
      if (!isPasswordValid) {
        throw new Error('用戶名或密碼不正確');
      }
      
      // 更新最後登入時間
      await UserExtension.updateLastLogin(user.id);
      
      // 生成 JWT
      const token = this.generateToken(user);
      
      // 返回認證結果
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
        token,
      };
    } catch (error) {
      logger.error('登入錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 註冊
   * @param registerData 註冊數據
   */
  async register(registerData: RegisterData): Promise<AuthResult> {
    try {
      // 檢查用戶名是否已存在
      const existingUsername = await UserExtension.findByUsername(registerData.username);
      
      if (existingUsername) {
        throw new Error('用戶名已存在');
      }
      
      // 檢查郵箱是否已存在
      const existingEmail = await UserExtension.findByEmail(registerData.email);
      
      if (existingEmail) {
        throw new Error('郵箱已存在');
      }
      
      // 創建用戶
      const createUserData: CreateUserDTO = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: registerData.role || UserRole.AGENT,
        status: UserStatus.ACTIVE,
        isActive: true,
        metadata: {},
      };
      
      // 創建用戶
      const user = await User.create(createUserData);
      
      // 生成 JWT
      const token = this.generateToken(user);
      
      // 返回認證結果
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
        token,
      };
    } catch (error) {
      logger.error('註冊錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 重置密碼
   * @param userId 用戶 ID
   * @param newPassword 新密碼
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      // 查找用戶
      const user = await UserExtension.findById(userId);
      
      if (!user) {
        throw new Error('用戶不存在');
      }
      
      // 更新密碼
      const updatedUser = await UserExtension.update(userId, { password: newPassword });
      
      return !!updatedUser;
    } catch (error) {
      logger.error('重置密碼錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更改密碼
   * @param userId 用戶 ID
   * @param currentPassword 當前密碼
   * @param newPassword 新密碼
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // 查找用戶
      const user = await UserExtension.findById(userId);
      
      if (!user) {
        throw new Error('用戶不存在');
      }
      
      // 驗證當前密碼
      const isPasswordValid = await UserExtension.verifyPassword(userId, currentPassword);
      
      if (!isPasswordValid) {
        throw new Error('當前密碼不正確');
      }
      
      // 更新密碼
      const updatedUser = await UserExtension.update(userId, { password: newPassword });
      
      return !!updatedUser;
    } catch (error) {
      logger.error('更改密碼錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 驗證 JWT
   * @param token JWT
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      // 驗證 JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret') as any;
      
      // 查找用戶
      const user = await UserExtension.findById(payload.userId);
      
      if (!user) {
        throw new Error('無效的令牌');
      }
      
      // 檢查用戶是否啟用
      if (!user.isActive) {
        throw new Error('用戶已被禁用');
      }
      
      // 檢查用戶狀態
      if (user.status === UserStatus.SUSPENDED) {
        throw new Error('用戶已被暫停');
      }
      
      // 返回認證結果
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
        token,
      };
    } catch (error) {
      logger.error('驗證令牌錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 生成 JWT
   * @param user 用戶
   */
  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', {
      expiresIn: '24h',
    });
  }
}

export default new AuthService();