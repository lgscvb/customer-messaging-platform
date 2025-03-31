import User, { UserRole, UserStatus, CreateUserDTO, UserExtension } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';

/**
 * 密碼複雜度檢查結果
 */
interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 登錄嘗試記錄
 */
interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  locked: boolean;
  lockUntil?: Date;
}

// 存儲用戶登錄嘗試記錄
const loginAttempts: Map<string, LoginAttempt> = new Map();

// 登錄嘗試限制配置
const LOGIN_ATTEMPT_LIMIT = 5; // 最大嘗試次數
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 分鐘內的嘗試次數
const LOGIN_LOCK_DURATION = 30 * 60 * 1000; // 鎖定 30 分鐘

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
   * 檢查用戶是否被鎖定
   * @param username 用戶名
   */
  private checkUserLocked(username: string): boolean {
    const attempt = loginAttempts.get(username);
    
    if (!attempt) {
      return false;
    }
    
    // 檢查是否被鎖定
    if (attempt.locked && attempt.lockUntil) {
      // 檢查鎖定時間是否已過
      if (new Date() > attempt.lockUntil) {
        // 鎖定時間已過，重置嘗試記錄
        loginAttempts.set(username, {
          count: 0,
          lastAttempt: new Date(),
          locked: false,
        });
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * 記錄登錄嘗試
   * @param username 用戶名
   * @param success 是否成功
   */
  private recordLoginAttempt(username: string, success: boolean): void {
    const now = new Date();
    const attempt = loginAttempts.get(username);
    
    if (!attempt) {
      // 第一次嘗試
      loginAttempts.set(username, {
        count: success ? 0 : 1,
        lastAttempt: now,
        locked: false,
      });
      return;
    }
    
    // 檢查是否在嘗試窗口期內
    const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime();
    
    if (success) {
      // 登錄成功，重置嘗試記錄
      loginAttempts.set(username, {
        count: 0,
        lastAttempt: now,
        locked: false,
      });
      return;
    }
    
    // 登錄失敗
    if (timeSinceLastAttempt > LOGIN_ATTEMPT_WINDOW) {
      // 超過窗口期，重置計數
      loginAttempts.set(username, {
        count: 1,
        lastAttempt: now,
        locked: false,
      });
    } else {
      // 在窗口期內，增加計數
      const newCount = attempt.count + 1;
      
      if (newCount >= LOGIN_ATTEMPT_LIMIT) {
        // 超過嘗試次數限制，鎖定帳戶
        const lockUntil = new Date(now.getTime() + LOGIN_LOCK_DURATION);
        
        loginAttempts.set(username, {
          count: newCount,
          lastAttempt: now,
          locked: true,
          lockUntil,
        });
        
        logger.warn(`用戶 ${username} 因多次登錄失敗被鎖定至 ${lockUntil}`);
      } else {
        // 未超過限制，更新計數
        loginAttempts.set(username, {
          count: newCount,
          lastAttempt: now,
          locked: false,
        });
      }
    }
  }
  
  /**
   * 檢查密碼複雜度
   * @param password 密碼
   * @returns 密碼複雜度檢查結果
   */
  private validatePasswordComplexity(password: string): PasswordValidationResult {
    // 檢查密碼長度
    if (password.length < 8) {
      return {
        isValid: false,
        message: '密碼長度必須至少為 8 個字符',
      };
    }
    
    // 檢查是否包含數字
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: '密碼必須包含至少一個數字',
      };
    }
    
    // 檢查是否包含小寫字母
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: '密碼必須包含至少一個小寫字母',
      };
    }
    
    // 檢查是否包含大寫字母
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: '密碼必須包含至少一個大寫字母',
      };
    }
    
    // 檢查是否包含特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return {
        isValid: false,
        message: '密碼必須包含至少一個特殊字符',
      };
    }
    
    return { isValid: true };
  }
  /**
   * 登入
   * @param loginData 登入數據
   */
  async login(loginData: LoginData): Promise<AuthResult> {
    try {
      // 檢查用戶是否被鎖定
      if (this.checkUserLocked(loginData.username)) {
        const attempt = loginAttempts.get(loginData.username);
        throw new Error(`帳戶已被鎖定，請在 ${attempt?.lockUntil?.toLocaleString()} 後重試`);
      }
      
      // 查找用戶
      const user = await UserExtension.findByUsername(loginData.username);
      
      // 檢查用戶是否存在
      if (!user) {
        // 記錄登錄失敗
        this.recordLoginAttempt(loginData.username, false);
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
        // 記錄登錄失敗
        this.recordLoginAttempt(loginData.username, false);
        throw new Error('用戶名或密碼不正確');
      }
      
      // 更新最後登入時間
      await UserExtension.updateLastLogin(user.id);
      
      // 記錄登錄成功
      this.recordLoginAttempt(loginData.username, true);
      
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
      
      // 檢查密碼複雜度
      const passwordValidation = this.validatePasswordComplexity(registerData.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
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
      
      // 檢查密碼複雜度
      const passwordValidation = this.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
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
      
      // 檢查密碼複雜度
      const passwordValidation = this.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
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
      // 檢查 JWT_SECRET 是否設置
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET 環境變量未設置');
      }
      
      // 驗證 JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET) as any;
      
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
    // 檢查 JWT_SECRET 是否設置
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET 環境變量未設置');
    }
    
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h', // 縮短過期時間為 8 小時，提高安全性
    });
  }
}

export default new AuthService();