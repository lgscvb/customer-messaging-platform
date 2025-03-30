import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import MessageList from '../../components/messages/MessageList';
import ConversationView from '../../components/messages/ConversationView';
import CustomerSidebar from '../../components/messages/CustomerSidebar';
import { Message, MessageStatus } from '../../types/message';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 消息頁面
 */
const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { addNotification } = useNotifications();
  
  // 狀態
  const [selectedMessage, setSelectedMessage] = useState<Message | undefined>(undefined);
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(!isTablet);
  
  /**
   * 處理選擇消息
   */
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    
    // 在移動設備上，選擇消息後隱藏客戶側邊欄
    if (isMobile) {
      setShowCustomerSidebar(false);
    }
  };
  
  /**
   * 處理消息狀態變更
   */
  const handleMessageStatusChange = (messageId: string, status: MessageStatus) => {
    // 更新選定的消息狀態
    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage({
        ...selectedMessage,
        status
      });
    }
    
    // 顯示通知
    addNotification({
      type: NotificationType.SUCCESS,
      title: t('messages.statusUpdatedTitle'),
      message: t(`messages.statusUpdated.${status.toLowerCase()}`)
    });
  };
  
  /**
   * 切換客戶側邊欄
   */
  const toggleCustomerSidebar = () => {
    setShowCustomerSidebar(!showCustomerSidebar);
  };
  
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* 消息列表 */}
        <Grid 
          item 
          xs={12} 
          sm={selectedMessage ? 4 : 12} 
          md={3} 
          lg={3} 
          xl={2}
          sx={{ 
            height: '100%',
            display: { 
              xs: selectedMessage ? 'none' : 'block', 
              sm: 'block' 
            }
          }}
        >
          <MessageList 
            onSelectMessage={handleSelectMessage} 
            selectedMessageId={selectedMessage?.id}
          />
        </Grid>
        
        {/* 對話界面 */}
        <Grid 
          item 
          xs={12} 
          sm={showCustomerSidebar ? 8 : 8} 
          md={showCustomerSidebar ? 6 : 9} 
          lg={showCustomerSidebar ? 6 : 9} 
          xl={showCustomerSidebar ? 7 : 10}
          sx={{ 
            height: '100%',
            display: { 
              xs: selectedMessage ? 'block' : 'none', 
              sm: 'block' 
            }
          }}
        >
          <ConversationView 
            selectedMessage={selectedMessage}
            onStatusChange={handleMessageStatusChange}
          />
        </Grid>
        
        {/* 客戶側邊欄 */}
        <Grid 
          item 
          xs={12} 
          sm={12} 
          md={3} 
          lg={3} 
          xl={3}
          sx={{ 
            height: '100%',
            display: showCustomerSidebar ? 'block' : 'none'
          }}
        >
          <CustomerSidebar customer={selectedMessage?.customer} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MessagesPage;