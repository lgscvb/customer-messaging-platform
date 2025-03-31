import React from 'react';
import {
  Alert,
  Snackbar,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';
import { Close as CloseIcon } from '@mui/icons-material';
import { Notification, NotificationType } from '../../contexts/NotificationContext';

/**
 * 通知吐司屬性
 */
interface NotificationToastProps {
  notification: Notification;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

/**
 * 通知吐司組件
 * 顯示單個通知的吐司消息
 */
const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  open,
  onClose,
  autoHideDuration = 6000,
}) => {
  // 根據通知類型獲取嚴重性
  const getSeverity = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'success';
      case NotificationType.WARNING:
        return 'warning';
      case NotificationType.ERROR:
        return 'error';
      case NotificationType.INFO:
      default:
        return 'info';
    }
  };

  // 格式化時間
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={getSeverity(notification.type)}
        variant="filled"
        sx={{ width: '100%', maxWidth: '400px' }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>{notification.title}</AlertTitle>
        <Typography variant="body2">{notification.message}</Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 1,
            fontSize: '0.75rem',
            opacity: 0.8
          }}
        >
          <Typography variant="caption">
            {formatTime(notification.timestamp)}
          </Typography>
          {notification.link && (
            <Typography 
              variant="caption" 
              component="a" 
              href={notification.link}
              sx={{ 
                color: 'inherit', 
                textDecoration: 'underline',
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              查看詳情
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;