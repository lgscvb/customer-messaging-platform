"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types/user';

/**
 * 認證上下文接口
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * 認證提供者屬性接口
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 創建認證上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認證提供者組件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 檢查認證狀態
   */
  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      setUser(null);
      setError('認證失敗');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 登入
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      setUser(null);
      setError('登入失敗');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 註冊
   */
  const register = async (userData: Partial<User>): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      setUser(null);
      setError('註冊失敗');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 登出
   */
  const logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
  };

  /**
   * 初始化時檢查認證狀態
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用認證上下文的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};