import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Avatar, 
  Divider, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Chip, 
  IconButton, 
  TextField, 
  Button, 
  CircularProgress,
  Paper,
  Collapse
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  LocationOn as LocationIcon, 
  Language as LanguageIcon, 
  CalendarToday as CalendarIcon, 
  LocalOffer as TagIcon, 
  Edit as EditIcon, 
  Add as AddIcon, 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Circle as CircleIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Customer, PlatformType } from '../../types/message';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
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
 * 客戶資料側邊欄屬性接口
 */
interface CustomerSidebarProps {
  customer?: Customer;
}

/**
 * 客戶資料側邊欄組件
 */
const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ customer }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'basic': true,
    'contact': true,
    'platforms': true,
    'tags': true,
    'notes': true,
    'orders': true
  });
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  
  /**
   * 獲取客戶詳細信息
   */
  useEffect(() => {
    if (!customer) {
      setCustomerData(null);
      return;
    }
    
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/customers/${customer.id}`);
        setCustomerData(response.data);
      } catch (error) {
        console.error('獲取客戶詳細信息錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('customer.errors.fetchTitle'),
          message: t('customer.errors.fetchMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerDetails();
  }, [customer, addNotification, t]);
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 切換區段展開/收起
   */
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  /**
   * 添加標籤
   */
  const handleAddTag = async () => {
    if (!customer || !newTag.trim()) return;
    
    try {
      setAddingTag(true);
      
      // 獲取當前標籤
      const currentTags = customerData?.tags || [];
      
      // 檢查標籤是否已存在
      if (currentTags.includes(newTag.trim())) {
        addNotification({
          type: NotificationType.WARNING,
          title: t('customer.tagExistsTitle'),
          message: t('customer.tagExistsMessage')
        });
        return;
      }
      
      // 添加新標籤
      const updatedTags = [...currentTags, newTag.trim()];
      
      // 更新客戶標籤
      await api.patch(`/customers/${customer.id}/tags`, { tags: updatedTags });
      
      // 更新本地數據
      if (customerData) {
        setCustomerData({
          ...customerData,
          tags: updatedTags
        });
      }
      
      // 清空輸入
      setNewTag('');
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('customer.tagAddedTitle'),
        message: t('customer.tagAddedMessage')
      });
    } catch (error) {
      console.error('添加標籤錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('customer.errors.addTagTitle'),
        message: t('customer.errors.addTagMessage')
      });
    } finally {
      setAddingTag(false);
    }
  };
  
  /**
   * 移除標籤
   */
  const handleRemoveTag = async (tag: string) => {
    if (!customer) return;
    
    try {
      // 獲取當前標籤
      const currentTags = customerData?.tags || [];
      
      // 移除標籤
      const updatedTags = currentTags.filter(t => t !== tag);
      
      // 更新客戶標籤
      await api.patch(`/customers/${customer.id}/tags`, { tags: updatedTags });
      
      // 更新本地數據
      if (customerData) {
        setCustomerData({
          ...customerData,
          tags: updatedTags
        });
      }
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('customer.tagRemovedTitle'),
        message: t('customer.tagRemovedMessage')
      });
    } catch (error) {
      console.error('移除標籤錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('customer.errors.removeTagTitle'),
        message: t('customer.errors.removeTagMessage')
      });
    }
  };
  
  /**
   * 格式化日期
   */
  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy/MM/dd', { locale: zhTW });
  };
  
  // 如果沒有選擇客戶，顯示空白狀態
  if (!customer) {
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
        <Typography variant="body1" color="text.secondary" align="center">
          {t('customer.noCustomerSelected')}
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
        backgroundColor: 'background.default',
        borderLeft: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* 頭部 */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Avatar
          alt={customer.name}
          src={customer.avatar}
          sx={{ width: 80, height: 80, mb: 1 }}
        >
          {customer.name.charAt(0)}
        </Avatar>
        
        <Typography variant="h6" fontWeight="bold">
          {customer.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {Object.entries(customer.platformIds).map(([platform, id]) => (
            id && (
              <Chip
                key={platform}
                icon={PlatformIcon[platform as PlatformType]}
                label={t(`customer.platform.${platform}`)}
                size="small"
                sx={{ height: 24 }}
              />
            )
          ))}
        </Box>
      </Box>
      
      {/* 標籤頁 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 'auto',
            '& .MuiTab-root': {
              minHeight: 'auto',
              py: 1.5
            }
          }}
        >
          <Tab label={t('customer.tabs.profile')} />
          <Tab label={t('customer.tabs.history')} />
          <Tab label={t('customer.tabs.orders')} />
        </Tabs>
      </Box>
      
      {/* 內容 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* 個人資料標籤 */}
            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
                {/* 基本信息 */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      backgroundColor: 'background.default',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('basic')}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {t('customer.sections.basic')}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.basic ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.basic}>
                    <Divider />
                    <List disablePadding>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CalendarIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('customer.fields.createdAt')}
                          secondary={formatDate(customerData?.createdAt || customer.createdAt)}
                        />
                      </ListItem>
                    </List>
                  </Collapse>
                </Paper>
                
                {/* 聯絡信息 */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      backgroundColor: 'background.default',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('contact')}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {t('customer.sections.contact')}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.contact ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.contact}>
                    <Divider />
                    <List disablePadding>
                      {customer.email && (
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <EmailIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={t('customer.fields.email')}
                            secondary={customer.email}
                          />
                        </ListItem>
                      )}
                      
                      {customer.phone && (
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <PhoneIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={t('customer.fields.phone')}
                            secondary={customer.phone}
                          />
                        </ListItem>
                      )}
                      
                      {!customer.email && !customer.phone && (
                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            secondary={t('customer.noContactInfo')}
                            sx={{ textAlign: 'center' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Collapse>
                </Paper>
                
                {/* 平台 */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      backgroundColor: 'background.default',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('platforms')}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {t('customer.sections.platforms')}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.platforms ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.platforms}>
                    <Divider />
                    <List disablePadding>
                      {Object.entries(customer.platformIds).map(([platform, id]) => (
                        id ? (
                          <ListItem key={platform} sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {PlatformIcon[platform as PlatformType]}
                            </ListItemIcon>
                            <ListItemText
                              primary={t(`customer.platform.${platform}`)}
                              secondary={id}
                            />
                          </ListItem>
                        ) : null
                      ))}
                      
                      {Object.values(customer.platformIds).every(id => !id) && (
                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            secondary={t('customer.noPlatforms')}
                            sx={{ textAlign: 'center' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Collapse>
                </Paper>
                
                {/* 標籤 */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      backgroundColor: 'background.default',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('tags')}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {t('customer.sections.tags')}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.tags ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.tags}>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {(customerData?.tags || []).length > 0 ? (
                          (customerData?.tags || []).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              onDelete={() => handleRemoveTag(tag)}
                              sx={{ height: 24 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('customer.noTags')}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder={t('customer.addTag')}
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          disabled={addingTag}
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleAddTag}
                          disabled={!newTag.trim() || addingTag}
                          startIcon={addingTag ? <CircularProgress size={16} /> : <AddIcon />}
                        >
                          {t('customer.add')}
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </Paper>
              </Box>
            )}
            
            {/* 歷史標籤 */}
            {activeTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('customer.historyComingSoon')}
                </Typography>
              </Box>
            )}
            
            {/* 訂單標籤 */}
            {activeTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('customer.ordersComingSoon')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CustomerSidebar;