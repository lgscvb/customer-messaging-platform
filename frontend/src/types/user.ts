/**
 * 用戶角色枚舉
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

/**
 * 用戶狀態枚舉
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * 用戶接口
 */
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // 全名（firstName + lastName）
  avatar?: string; // 頭像 URL
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 創建用戶 DTO
 */
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
}

/**
 * 更新用戶 DTO
 */
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
}

/**
 * 用戶登入 DTO
 */
export interface LoginUserDTO {
  username: string;
  password: string;
}