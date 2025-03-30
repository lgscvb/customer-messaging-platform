import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Typography, 
  Divider, 
  Box, 
  Button,
  Tooltip
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNotifications, NotificationType, Notification } from '../../contexts/NotificationContext';
import NotificationToast from './NotificationToast';

/**
 * 通知容器組件
 * 顯示通知圖標和通知列表
 */
const NotificationContainer: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  
  // 處理通知圖標點擊
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };
  
  // 處理通知列表關閉
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // 處理通知點擊
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };
  
  // 處理通知刪除
  const handleNotificationDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    removeNotification(id);
  };
  
  // 處理清除所有通知
  const handleClearAll = () => {
    clearAllNotifications();
    handleClose();
  };
  
  // 處理吐司關閉
  const handleToastClose = () => {
    setToastOpen(false);
    if (latestNotification) {
      markAsRead(latestNotification.id);
    }
  };
  
  // 監聽新通知
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read) {
        setLatestNotification(latest);
        setToastOpen(true);
      }
    }
  }, [notifications]);
  
  // 獲取通知圖標
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircleIcon fontSize="small" color="success" />;
      case NotificationType.WARNING:
        return <WarningIcon fontSize="small" color="warning" />;
      case NotificationType.ERROR:
        return <ErrorIcon fontSize="small" color="error" />;
      case NotificationType.INFO:
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };
  
  // 格式化時間
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  
  return (
    <>
      <Tooltip title="通知">
        <IconButton
          aria-describedby={id}
          onClick={handleClick}
          size="large"
          color="inherit"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: '350px', maxHeight: '500px' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">通知</Typography>
          {notifications.length > 0 && (
            <Button 
              size="small" 
              onClick={handleClearAll}
              startIcon={<DeleteIcon />}
            >
              清除全部
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              沒有通知
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{
                            display: 'inline',
                            wordBreak: 'break-word',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatTime(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => handleNotificationDelete(e, notification.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
      
      {latestNotification && (
        <NotificationToast
          notification={latestNotification}
          open={toastOpen}
          onClose={handleToastClose}
        />
      )}
    </>
  );
};

export default NotificationContainer;