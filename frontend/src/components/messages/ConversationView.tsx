import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Avatar, 
  Paper, 
  Divider,
  CircularProgress,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  InsertEmoticon as EmojiIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  AutoAwesome as AiIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  Message, 
  Reply, 
  MessageStatus, 
  PlatformType, 
  MessageType,
  AiReplySuggestion
} from '../../types/message';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import api from '../../services/api';

/**
 * 平台圖標映射
 */
const PlatformIcon: Record<PlatformType, React.ReactNode> = {
  [PlatformType.LINE]: <Box sx={{ width: 16, height: 16, bgcolor: '#06C755', borderRadius: '50%' }} />,
  [PlatformType.FACEBOOK]: <Box sx={{ width: 16, height: 16, bgcolor: '#1877F2', borderRadius: '50%' }} />,
  [PlatformType.INSTAGRAM]: <Box sx={{ width: 16, height: 16, bgcolor: '#E4405F', borderRadius: '50%' }} />,
  [PlatformType.WEBSITE]: <Box sx={{ width: 16, height: 16, bgcolor: '#FF6B00', borderRadius: '50%' }} />,
  [PlatformType.OTHER]: <Box sx={{ width: 16, height: 16, bgcolor: '#888888', borderRadius: '50%' }} />
};

/**
 * 對話界面屬性接口
 */
interface ConversationViewProps {
  selectedMessage?: Message;
  onStatusChange?: (messageId: string, status: MessageStatus) => void;
}

/**
 * 對話界面組件
 */
const ConversationView: React.FC<ConversationViewProps> = ({ 
  selectedMessage,
  onStatusChange
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 狀態
  const [conversation, setConversation] = useState<(Message | Reply)[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AiReplySuggestion[]>([]);
  const [_loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AiReplySuggestion | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  /**
   * 獲取對話
   */
  useEffect(() => {
    if (!selectedMessage) return;
    
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/messages/${selectedMessage.id}/conversation`);
        setConversation(response.data);
      } catch (error) {
        console.error('獲取對話錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('conversation.errors.fetchTitle'),
          message: t('conversation.errors.fetchMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversation();
  }, [selectedMessage, addNotification, t, setLoading, setConversation]);
  
  /**
   * 獲取 AI 回覆建議
   */
  useEffect(() => {
    if (!selectedMessage) return;
    
    const fetchAiSuggestions = async () => {
      try {
        setLoadingAiSuggestions(true);
        const response = await api.get(`/ai/suggestions?messageId=${selectedMessage.id}`);
        setAiSuggestions(response.data);
      } catch (error) {
        console.error('獲取 AI 回覆建議錯誤:', error);
        // 不顯示通知，因為這不是關鍵功能
      } finally {
        setLoadingAiSuggestions(false);
      }
    };
    
    fetchAiSuggestions();
  }, [selectedMessage, setLoadingAiSuggestions, setAiSuggestions]);
  
  /**
   * 滾動到底部
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  /**
   * 處理回覆
   */
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    try {
      setSending(true);
      
      const replyData = {
        messageId: selectedMessage.id,
        content: replyText,
        type: MessageType.TEXT,
        isAiGenerated: !!selectedSuggestion,
        aiSuggestionId: selectedSuggestion?.id
      };
      
      const response = await api.post('/replies', replyData);
      
      // 更新對話
      setConversation(prev => [...prev, response.data]);
      
      // 清空輸入
      setReplyText('');
      setSelectedSuggestion(null);
      
      // 更新消息狀態
      if (selectedMessage.status === MessageStatus.NEW || selectedMessage.status === MessageStatus.PENDING) {
        await updateMessageStatus(selectedMessage.id, MessageStatus.RESOLVED);
      }
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('conversation.replySentTitle'),
        message: t('conversation.replySentMessage')
      });
    } catch (error) {
      console.error('發送回覆錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('conversation.errors.sendReplyTitle'),
        message: t('conversation.errors.sendReplyMessage')
      });
    } finally {
      setSending(false);
    }
  };
  
  /**
   * 更新消息狀態
   */
  const updateMessageStatus = async (messageId: string, status: MessageStatus) => {
    try {
      await api.patch(`/messages/${messageId}/status`, { status });
      
      // 通知父組件
      if (onStatusChange) {
        onStatusChange(messageId, status);
      }
    } catch (error) {
      console.error('更新消息狀態錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('conversation.errors.updateStatusTitle'),
        message: t('conversation.errors.updateStatusMessage')
      });
    }
  };
  
  /**
   * 處理選擇 AI 建議
   */
  const handleSelectSuggestion = (suggestion: AiReplySuggestion) => {
    setReplyText(suggestion.content);
    setSelectedSuggestion(suggestion);
  };
  
  /**
   * 處理菜單打開
   */
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  /**
   * 處理菜單關閉
   */
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  /**
   * 處理解決對話
   */
  const handleResolveConversation = async () => {
    if (!selectedMessage) return;
    
    await updateMessageStatus(selectedMessage.id, MessageStatus.RESOLVED);
    handleMenuClose();
  };
  
  /**
   * 處理關閉對話
   */
  const handleCloseConversation = async () => {
    if (!selectedMessage) return;
    
    await updateMessageStatus(selectedMessage.id, MessageStatus.CLOSED);
    handleMenuClose();
  };
  
  /**
   * 格式化時間
   */
  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'HH:mm');
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return t('conversation.yesterday') + ' ' + format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MM/dd HH:mm');
    }
  };
  
  /**
   * 渲染消息
   */
  const renderMessage = (item: Message | Reply, _index: number) => {
    const isReply = 'messageId' in item;
    const isCurrentUserReply = isReply && item.agentId === user?.id;
    
    return (
      <Box
        key={item.id}
        sx={{
          display: 'flex',
          flexDirection: isReply ? 'row-reverse' : 'row',
          mb: 2
        }}
      >
        <Avatar
          alt={isReply ? user?.firstName || 'Agent' : selectedMessage?.customer.name}
          src={isReply ? '' : selectedMessage?.customer.avatar}
          sx={{ 
            width: 40, 
            height: 40,
            bgcolor: isReply ? 'primary.main' : 'grey.300',
            mr: isReply ? 0 : 1,
            ml: isReply ? 1 : 0
          }}
        >
          {isReply 
            ? (user?.firstName?.charAt(0) || 'A') 
            : (selectedMessage?.customer.name.charAt(0) || 'C')}
        </Avatar>
        
        <Box
          sx={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isReply ? 'flex-end' : 'flex-start'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 0.5,
              flexDirection: isReply ? 'row-reverse' : 'row'
            }}
          >
            <Typography variant="body2" fontWeight="medium" sx={{ mr: isReply ? 0 : 1, ml: isReply ? 1 : 0 }}>
              {isReply 
                ? (isCurrentUserReply ? t('conversation.you') : item.agentId) 
                : selectedMessage?.customer.name}
            </Typography>
            
            {!isReply && (
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={PlatformIcon[selectedMessage?.platform || PlatformType.OTHER]}
              >
                <Box sx={{ width: 8, height: 8 }} />
              </Badge>
            )}
            
            {isReply && 'isAiGenerated' in item && item.isAiGenerated && (
              <Chip
                icon={<AiIcon fontSize="small" />}
                label={t('conversation.aiGenerated')}
                size="small"
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem',
                  mr: isReply ? 1 : 0,
                  ml: isReply ? 0 : 1,
                  backgroundColor: '#8C6EFF20',
                  color: '#8C6EFF',
                }}
              />
            )}
          </Box>
          
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isReply 
                ? 'primary.main' 
                : 'grey.100',
              color: isReply ? 'white' : 'text.primary',
              position: 'relative'
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {item.content}
            </Typography>
          </Paper>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {formatTime(item.createdAt)}
          </Typography>
        </Box>
      </Box>
    );
  };
  
  // 如果沒有選擇消息，顯示空白狀態
  if (!selectedMessage) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
          backgroundColor: 'background.default'
        }}
      >
        <Typography variant="h6" color="text.secondary" align="center">
          {t('conversation.noMessageSelected')}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          {t('conversation.selectMessage')}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default'
      }}
    >
      {/* 頭部 */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={PlatformIcon[selectedMessage.platform]}
          >
            <Avatar 
              alt={selectedMessage.customer.name} 
              src={selectedMessage.customer.avatar}
              sx={{ width: 40, height: 40 }}
            >
              {selectedMessage.customer.name.charAt(0)}
            </Avatar>
          </Badge>
          
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {selectedMessage.customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(`messages.platform.${selectedMessage.platform}`)} • {
                formatDistanceToNow(new Date(selectedMessage.createdAt), { 
                  addSuffix: true,
                  locale: zhTW
                })
              }
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Chip
            label={t(`messages.status.${selectedMessage.status.toLowerCase()}`)}
            size="small"
            sx={{
              mr: 1,
              backgroundColor: selectedMessage.status === MessageStatus.NEW
                ? '#FF572220'
                : selectedMessage.status === MessageStatus.PENDING
                  ? '#FFC10720'
                  : selectedMessage.status === MessageStatus.RESOLVED
                    ? '#4CAF5020'
                    : '#9E9E9E20',
              color: selectedMessage.status === MessageStatus.NEW
                ? '#FF5722'
                : selectedMessage.status === MessageStatus.PENDING
                  ? '#FFC107'
                  : selectedMessage.status === MessageStatus.RESOLVED
                    ? '#4CAF50'
                    : '#9E9E9E',
            }}
          />
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            {selectedMessage.status !== MessageStatus.RESOLVED && (
              <MenuItem onClick={handleResolveConversation}>
                <ListItemIcon>
                  <CheckCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('conversation.resolveConversation')}</ListItemText>
              </MenuItem>
            )}
            
            {selectedMessage.status !== MessageStatus.CLOSED && (
              <MenuItem onClick={handleCloseConversation}>
                <ListItemIcon>
                  <CloseIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('conversation.closeConversation')}</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('conversation.addNote')}</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('conversation.copyConversation')}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* 消息列表 */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : conversation.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              {t('conversation.noMessages')}
            </Typography>
          </Box>
        ) : (
          <>
            {conversation.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      {/* AI 建議 */}
      {aiSuggestions.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#F8F9FF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AiIcon fontSize="small" sx={{ color: '#8C6EFF', mr: 1 }} />
            <Typography variant="subtitle2" fontWeight="medium">
              {t('conversation.aiSuggestions')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {aiSuggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant={selectedSuggestion?.id === suggestion.id ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleSelectSuggestion(suggestion)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedSuggestion?.id === suggestion.id ? '#8C6EFF' : 'transparent',
                  borderColor: '#8C6EFF',
                  color: selectedSuggestion?.id === suggestion.id ? 'white' : '#8C6EFF',
                  '&:hover': {
                    backgroundColor: selectedSuggestion?.id === suggestion.id ? '#7B5CE6' : '#8C6EFF10',
                  }
                }}
              >
                {suggestion.content.length > 30 
                  ? suggestion.content.substring(0, 30) + '...' 
                  : suggestion.content}
              </Button>
            ))}
          </Box>
        </Box>
      )}
      
      {/* 回覆輸入 */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={t('conversation.typeMessage')}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={sending || selectedMessage.status === MessageStatus.CLOSED}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={t('conversation.attachFile')}>
                  <IconButton disabled={sending || selectedMessage.status === MessageStatus.CLOSED}>
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('conversation.insertEmoji')}>
                  <IconButton disabled={sending || selectedMessage.status === MessageStatus.CLOSED}>
                    <EmojiIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('conversation.sendMessage')}>
                  <IconButton 
                    color="primary" 
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending || selectedMessage.status === MessageStatus.CLOSED}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            ),
            sx: {
              p: 1,
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        
        {selectedMessage.status === MessageStatus.CLOSED && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {t('conversation.conversationClosed')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ConversationView;