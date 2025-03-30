import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types/user';

/**
 * 認證上下文接口
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  role?: string;
}

/**
 * 認證上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認證提供者屬性接口
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 認證提供者
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  /**
   * 初始化認證狀態
   */
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // 設置 API 請求頭
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 獲取當前用戶
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('初始化認證錯誤:', error);
          // 清除無效的令牌
          localStorage.removeItem('token');
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [token]);
  
  /**
   * 登入
   * @param username 用戶名
   * @param password 密碼
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;
      
      // 保存令牌
      localStorage.setItem('token', token);
      setToken(token);
      
      // 設置 API 請求頭
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 設置用戶
      setUser(user);
    } catch (error) {
      console.error('登入錯誤:', error);
      throw error;
    }
  };
  
  /**
   * 註冊
   * @param userData 用戶數據
   */
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      // 保存令牌
      localStorage.setItem('token', token);
      setToken(token);
      
      // 設置 API 請求頭
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 設置用戶
      setUser(user);
    } catch (error) {
      console.error('註冊錯誤:', error);
      throw error;
    }
  };
  
  /**
   * 登出
   */
  const logout = (): void => {
    // 清除令牌
    localStorage.removeItem('token');
    setToken(null);
    
    // 清除用戶
    setUser(null);
    
    // 清除 API 請求頭
    delete api.defaults.headers.common['Authorization'];
  };
  
  /**
   * 重置密碼
   * @param userId 用戶 ID
   * @param newPassword 新密碼
   */
  const resetPassword = async (userId: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { userId, newPassword });
    } catch (error) {
      console.error('重置密碼錯誤:', error);
      throw error;
    }
  };
  
  /**
   * 更改密碼
   * @param currentPassword 當前密碼
   * @param newPassword 新密碼
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      console.error('更改密碼錯誤:', error);
      throw error;
    }
  };
  
  // 認證上下文值
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 使用認證上下文
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};