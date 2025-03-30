"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * 通知類型枚舉
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * 通知類型
 */
export interface Notification {
  id: string;
  type: NotificationType | 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  timestamp: Date;
  read: boolean;
}

/**
 * 通知上下文接口
 */
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

/**
 * 通知提供者屬性接口
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * 創建通知上下文
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * 通知提供者組件
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // 計算未讀通知數量
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  /**
   * 添加通知
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  /**
   * 標記通知為已讀
   */
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  /**
   * 標記所有通知為已讀
   */
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  /**
   * 移除通知
   */
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  /**
   * 清除所有通知
   */
  const clearAll = () => {
    setNotifications([]);
  };
  
  /**
   * 初始化 Socket.IO 連接
   */
  useEffect(() => {
    // 只在客戶端執行
    if (typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const newSocket = io(apiUrl, {
        path: '/socket.io',
        transports: ['websocket'],
      });
      
      setSocket(newSocket);
      
      // 監聽通知事件
      newSocket.on('notification', (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        addNotification(data);
      });
      
      // 清理函數
      return () => {
        newSocket.disconnect();
      };
    }
  }, []);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * 使用通知上下文的 Hook
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * 為了兼容性，提供 useNotifications 別名
 */
export const useNotifications = useNotification;