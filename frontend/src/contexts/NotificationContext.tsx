"use client";

import React from 'react';

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
  type: NotificationType;
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
  children: React.ReactNode;
}

/**
 * 創建通知上下文
 */
const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

/**
 * 通知提供者組件
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  
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
  
  // 注意：我們移除了 Socket.IO 相關的代碼，因為它在當前上下文中沒有被使用
  
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
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * 為了兼容性，提供 useNotifications 別名
 */
export const useNotifications = useNotification;