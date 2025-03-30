import UserModel, { User, UserRole, UserStatus, CreateUserDTO } from '../models/User';
import { generateToken } from '../middlewares/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * 登錄請求 DTO
 */
export interface LoginRequestDTO {
  username: string;
  password: string;
}

/**
 * 登錄響應 DTO
 */
export interface LoginResponseDTO {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    lastLogin: Date | null;
  };
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
  role?: UserRole;
}

/**
 * 認證服務
 * 處理用戶登錄、註冊和認證相關功能
 */
class AuthService {
  /**
   * 用戶登錄
   * @param loginData 登錄數據
   * @returns 登錄響應，包含令牌和用戶信息
   */
  async login(loginData: LoginRequestDTO): Promise<LoginResponseDTO> {
    // 查找用戶
    const user = await UserModel.findByUsername(loginData.username);
    
    // 檢查用戶是否存在
    if (!user) {
      throw new Error('用戶名或密碼不正確');
    }
    
    // 檢查用戶狀態
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('用戶帳號已停用');
    }
    
    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('用戶名或密碼不正確');
    }
    
    // 生成 JWT 令牌
    const token = generateToken(user.id, user.username, user.role);
    
    // 更新最後登錄時間
    await UserModel.updateLastLogin(user.id);
    
    // 返回登錄響應
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin
      }
    };
  }
  
  /**
   * 用戶註冊
   * @param registerData 註冊數據
   * @returns 註冊的用戶
   */
  async register(registerData: RegisterRequestDTO): Promise<User> {
    // 檢查用戶名是否已存在
    const existingUsername = await UserModel.findByUsername(registerData.username);
    if (existingUsername) {
      throw new Error('用戶名已存在');
    }
    
    // 檢查電子郵件是否已存在
    const existingEmail = await UserModel.findByEmail(registerData.email);
    if (existingEmail) {
      throw new Error('電子郵件已存在');
    }
    
    // 創建用戶
    const createUserData: CreateUserDTO = {
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      role: registerData.role || UserRole.AGENT, // 默認角色為代理
      status: UserStatus.ACTIVE
    };
    
    // 創建用戶並返回
    return await UserModel.create(createUserData);
  }
  
  /**
   * 重置密碼
   * @param userId 用戶 ID
   * @param newPassword 新密碼
   * @returns 是否成功
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    // 檢查用戶是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用戶不存在');
    }
    
    // 更新密碼
    const updatedUser = await UserModel.update(userId, { password: newPassword });
    
    return !!updatedUser;
  }
  
  /**
   * 更改密碼
   * @param userId 用戶 ID
   * @param currentPassword 當前密碼
   * @param newPassword 新密碼
   * @returns 是否成功
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // 檢查用戶是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用戶不存在');
    }
    
    // 驗證當前密碼
    const isPasswordValid = await UserModel.verifyPassword(userId, currentPassword);
    if (!isPasswordValid) {
      throw new Error('當前密碼不正確');
    }
    
    // 更新密碼
    const updatedUser = await UserModel.update(userId, { password: newPassword });
    
    return !!updatedUser;
  }
  
  /**
   * 驗證令牌
   * @param token JWT 令牌
   * @returns 用戶信息
   */
  async validateToken(token: string): Promise<User> {
    try {
      // 驗證令牌
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
      const payload = jwt.verify(token, jwtSecret) as { userId: string };
      
      // 查找用戶
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        throw new Error('用戶不存在');
      }
      
      // 檢查用戶狀態
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error('用戶帳號已停用');
      }
      
      return user;
    } catch (error) {
      throw new Error('無效的令牌');
    }
  }
}

export default new AuthService();