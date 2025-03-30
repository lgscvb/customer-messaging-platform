import React from 'react';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography, Paper, Divider } from '@mui/material';
import { Message as MessageIcon, Person as PersonIcon } from '@mui/icons-material';

// 訊息介面
export interface Message {
  id: string;
  customerId: string;
  platform: 'line' | 'website' | 'meta' | 'shopee';
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  metadata?: Record<string, any>;
  createdAt: string;
}

// 訊息列表屬性
interface MessageListProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
  selectedMessageId?: string;
}

/**
 * 訊息列表組件
 * 顯示客戶訊息列表
 */
const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onMessageClick,
  selectedMessageId
}) => {
  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // 獲取平台圖標
  const getPlatformIcon = (platform: Message['platform']) => {
    switch (platform) {
      case 'line':
        return <MessageIcon style={{ color: '#06C755' }} />;
      case 'website':
        return <MessageIcon style={{ color: '#0078D7' }} />;
      case 'meta':
        return <MessageIcon style={{ color: '#1877F2' }} />;
      case 'shopee':
        return <MessageIcon style={{ color: '#EE4D2D' }} />;
      default:
        return <MessageIcon />;
    }
  };

  // 獲取訊息方向標籤
  const getDirectionLabel = (direction: Message['direction']) => {
    return direction === 'inbound' ? '收到' : '發送';
  };

  // 獲取訊息狀態標籤
  const getStatusLabel = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'read':
        return '已讀';
      case 'replied':
        return '已回覆';
      case 'archived':
        return '已歸檔';
      default:
        return status;
    }
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', overflow: 'auto' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
        {messages.length === 0 ? (
          <ListItem alignItems="center">
            <ListItemText
              primary="沒有訊息"
              secondary="目前沒有任何訊息"
            />
          </ListItem>
        ) : (
          messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem 
                alignItems="flex-start"
                button
                onClick={() => onMessageClick && onMessageClick(message)}
                selected={selectedMessageId === message.id}
                sx={{
                  backgroundColor: message.status === 'pending' ? 'rgba(255, 235, 59, 0.1)' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {message.direction === 'inbound' ? 
                      getPlatformIcon(message.platform) : 
                      <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      variant="body1"
                      color="text.primary"
                      sx={{ fontWeight: message.status === 'pending' ? 'bold' : 'normal' }}
                    >
                      {message.content.length > 50 
                        ? `${message.content.substring(0, 50)}...` 
                        : message.content}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {`${getDirectionLabel(message.direction)} · ${getStatusLabel(message.status)}`}
                      </Typography>
                      {" — "}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
};

export default MessageList;