import pool from '../config/database';
import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';

/**
 * 用戶角色枚舉
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer'
}

/**
 * 用戶狀態枚舉
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  LOCKED = 'locked'
}

/**
 * 用戶介面
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
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
  role: UserRole;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

/**
 * 更新用戶 DTO
 */
export interface UpdateUserDTO {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

/**
 * 用戶模型類
 */
class UserModel {
  /**
   * 創建用戶
   */
  async create(userData: CreateUserDTO): Promise<User> {
    // 生成密碼哈希
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // 設置默認狀態
    const status = userData.status || UserStatus.ACTIVE;
    
    // 設置默認元數據
    const metadata = userData.metadata || {};
    
    // 構建 SQL 查詢
    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    // 查詢參數
    const values = [
      userData.username,
      userData.email,
      passwordHash,
      userData.firstName,
      userData.lastName,
      userData.role,
      status,
      metadata
    ];
    
    try {
      // 執行查詢
      const result: QueryResult = await pool.query(query, values);
      
      // 返回創建的用戶
      return this.mapToUser(result.rows[0]);
    } catch (error) {
      console.error('創建用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據 ID 查詢用戶
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error) {
      console.error('查詢用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據用戶名查詢用戶
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error) {
      console.error('查詢用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據電子郵件查詢用戶
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error) {
      console.error('查詢用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更新用戶
   */
  async update(id: string, userData: UpdateUserDTO): Promise<User | null> {
    // 構建更新查詢
    let updateQuery = 'UPDATE users SET ';
    const updateValues: any[] = [];
    let valueIndex = 1;
    
    // 添加要更新的字段
    const updates: string[] = [];
    
    if (userData.email !== undefined) {
      updates.push(`email = $${valueIndex++}`);
      updateValues.push(userData.email);
    }
    
    if (userData.password !== undefined) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      updates.push(`password_hash = $${valueIndex++}`);
      updateValues.push(passwordHash);
    }
    
    if (userData.firstName !== undefined) {
      updates.push(`first_name = $${valueIndex++}`);
      updateValues.push(userData.firstName);
    }
    
    if (userData.lastName !== undefined) {
      updates.push(`last_name = $${valueIndex++}`);
      updateValues.push(userData.lastName);
    }
    
    if (userData.role !== undefined) {
      updates.push(`role = $${valueIndex++}`);
      updateValues.push(userData.role);
    }
    
    if (userData.status !== undefined) {
      updates.push(`status = $${valueIndex++}`);
      updateValues.push(userData.status);
    }
    
    if (userData.metadata !== undefined) {
      updates.push(`metadata = $${valueIndex++}`);
      updateValues.push(userData.metadata);
    }
    
    // 添加更新時間
    updates.push(`updated_at = NOW()`);
    
    // 如果沒有要更新的字段，則返回 null
    if (updates.length === 0) {
      return null;
    }
    
    // 完成更新查詢
    updateQuery += updates.join(', ');
    updateQuery += ` WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(id);
    
    try {
      const result: QueryResult = await pool.query(updateQuery, updateValues);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error) {
      console.error('更新用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 刪除用戶
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('刪除用戶錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 獲取所有用戶
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    
    try {
      const result: QueryResult = await pool.query(query, [limit, offset]);
      return result.rows.map(row => this.mapToUser(row));
    } catch (error) {
      console.error('獲取用戶列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據角色獲取用戶
   */
  async findByRole(role: UserRole, limit: number = 50, offset: number = 0): Promise<User[]> {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    
    try {
      const result: QueryResult = await pool.query(query, [role, limit, offset]);
      return result.rows.map(row => this.mapToUser(row));
    } catch (error) {
      console.error('獲取用戶列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據狀態獲取用戶
   */
  async findByStatus(status: UserStatus, limit: number = 50, offset: number = 0): Promise<User[]> {
    const query = 'SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    
    try {
      const result: QueryResult = await pool.query(query, [status, limit, offset]);
      return result.rows.map(row => this.mapToUser(row));
    } catch (error) {
      console.error('獲取用戶列表錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 更新用戶最後登錄時間
   */
  async updateLastLogin(id: string): Promise<boolean> {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('更新用戶最後登錄時間錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 驗證用戶密碼
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const passwordHash = result.rows[0].password_hash;
      return await bcrypt.compare(password, passwordHash);
    } catch (error) {
      console.error('驗證用戶密碼錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 將數據庫行映射到用戶對象
   */
  private mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      status: row.status,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }
}

export default new UserModel();