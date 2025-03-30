import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography, 
  Divider, 
  TextField, 
  InputAdornment, 
  IconButton,
  Badge,
  Chip,
  CircularProgress,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Circle as CircleIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Message, MessageStatus, PlatformType } from '../../types/message';
import { useNotifications } from '../../contexts/NotificationContext';
import api from '../../services/api';

/**
 * 平台圖標映射
 */
const PlatformIcon: Record<PlatformType, React.ReactNode> = {
  [PlatformType.LINE]: <CircleIcon style={{ color: '#06C755' }} />,
  [PlatformType.FACEBOOK]: <FacebookIcon style={{ color: '#1877F2' }} />,
  [PlatformType.INSTAGRAM]: <InstagramIcon style={{ color: '#E4405F' }} />,
  [PlatformType.WEBSITE]: <CircleIcon style={{ color: '#FF6B00' }} />,
  [PlatformType.OTHER]: <CircleIcon style={{ color: '#888888' }} />
};

/**
 * 消息狀態顏色映射
 */
const StatusColor: Record<MessageStatus, string> = {
  [MessageStatus.NEW]: '#FF5722',
  [MessageStatus.PENDING]: '#FFC107',
  [MessageStatus.RESOLVED]: '#4CAF50',
  [MessageStatus.CLOSED]: '#9E9E9E'
};

/**
 * 消息列表屬性接口
 */
interface MessageListProps {
  onSelectMessage: (message: Message) => void;
  selectedMessageId?: string;
}

/**
 * 消息列表組件
 */
const MessageList: React.FC<MessageListProps> = ({ onSelectMessage, selectedMessageId }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // 標籤選項
  const tabs = [
    { label: t('messages.tabs.all'), value: 'all' },
    { label: t('messages.tabs.new'), value: MessageStatus.NEW },
    { label: t('messages.tabs.pending'), value: MessageStatus.PENDING },
    { label: t('messages.tabs.resolved'), value: MessageStatus.RESOLVED }
  ];
  
  /**
   * 獲取消息列表
   */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get('/messages');
        setMessages(response.data);
        setFilteredMessages(response.data);
      } catch (error) {
        console.error('獲取消息列表錯誤:', error);
        addNotification({
          type: 'error',
          title: t('messages.errors.fetchTitle'),
          message: t('messages.errors.fetchMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // 設置輪詢
    const interval = setInterval(fetchMessages, 30000);
    
    return () => clearInterval(interval);
  }, [addNotification, t]);
  
  /**
   * 過濾消息
   */
  useEffect(() => {
    let filtered = [...messages];
    
    // 根據搜索查詢過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        message => 
          message.customer.name.toLowerCase().includes(query) ||
          message.content.toLowerCase().includes(query)
      );
    }
    
    // 根據標籤過濾
    if (activeTab > 0) {
      const status = tabs[activeTab].value as MessageStatus;
      filtered = filtered.filter(message => message.status === status);
    }
    
    setFilteredMessages(filtered);
  }, [messages, searchQuery, activeTab, tabs]);
  
  /**
   * 處理搜索變更
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 處理消息選擇
   */
  const handleSelectMessage = (message: Message) => {
    onSelectMessage(message);
    
    // 如果消息是新的，則更新狀態
    if (message.status === MessageStatus.NEW) {
      updateMessageStatus(message.id, MessageStatus.PENDING);
    }
  };
  
  /**
   * 更新消息狀態
   */
  const updateMessageStatus = async (messageId: string, status: MessageStatus) => {
    try {
      await api.patch(`/messages/${messageId}/status`, { status });
      
      // 更新本地消息列表
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        )
      );
    } catch (error) {
      console.error('更新消息狀態錯誤:', error);
      addNotification({
        type: 'error',
        title: t('messages.errors.updateStatusTitle'),
        message: t('messages.errors.updateStatusMessage')
      });
    }
  };
  
  /**
   * 格式化時間
   */
  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: zhTW
    });
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          {t('messages.title')}
        </Typography>
        
        <TextField
          fullWidth
          placeholder={t('messages.search')}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            minHeight: 'auto',
            '& .MuiTab-root': {
              minHeight: 'auto',
              py: 1
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              label={tab.label} 
              sx={{ 
                textTransform: 'none',
                fontWeight: activeTab === index ? 'bold' : 'normal'
              }} 
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredMessages.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery 
                ? t('messages.noSearchResults') 
                : t('messages.noMessages')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredMessages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem 
                  button
                  alignItems="flex-start"
                  selected={selectedMessageId === message.id}
                  onClick={() => handleSelectMessage(message)}
                  sx={{ 
                    px: 2, 
                    py: 1.5,
                    backgroundColor: selectedMessageId === message.id 
                      ? 'action.selected' 
                      : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Avatar 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            border: '2px solid white',
                            backgroundColor: 'background.paper'
                          }}
                        >
                          {PlatformIcon[message.platform]}
                        </Avatar>
                      }
                    >
                      <Avatar 
                        alt={message.customer.name} 
                        src={message.customer.avatar}
                        sx={{ width: 48, height: 48 }}
                      >
                        {message.customer.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {message.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(message.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 0.5
                          }}
                        >
                          {message.content}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            size="small"
                            label={t(`messages.status.${message.status.toLowerCase()}`)}
                            sx={{
                              backgroundColor: `${StatusColor[message.status]}20`,
                              color: StatusColor[message.status],
                              fontWeight: 'medium',
                              height: 24
                            }}
                          />
                          
                          {message.isAiReplied && (
                            <Chip
                              size="small"
                              label={t('messages.aiReplied')}
                              sx={{
                                backgroundColor: '#8C6EFF20',
                                color: '#8C6EFF',
                                fontWeight: 'medium',
                                height: 24
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    sx={{ ml: 1 }}
                  />
                </ListItem>
                
                {index < filteredMessages.length - 1 && (
                  <Divider component="li" sx={{ ml: 9 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default MessageList;