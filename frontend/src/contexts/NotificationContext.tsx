import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * 通知類型
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * 通知介面
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, any>;
}

/**
 * 通知上下文介面
 */
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

/**
 * 通知提供者屬性
 */
interface NotificationProviderProps {
  children: ReactNode;
}

// 創建通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * 通知提供者組件
 * 管理應用程序中的所有通知
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // 計算未讀通知數量
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // 連接 Socket.IO
  useEffect(() => {
    // 創建 Socket.IO 連接
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });
    
    setSocket(socketInstance);
    
    // 監聽通知事件
    socketInstance.on('notification', (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      addNotification(notification);
    });
    
    // 清理函數
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  /**
   * 添加通知
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      read: false,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // 如果支持瀏覽器通知，則顯示瀏覽器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
      });
    }
  };
  
  /**
   * 將通知標記為已讀
   */
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  /**
   * 將所有通知標記為已讀
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
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };
  
  /**
   * 清除所有通知
   */
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  // 提供上下文值
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * 使用通知上下文的自定義 Hook
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};