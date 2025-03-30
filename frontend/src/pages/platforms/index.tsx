import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import PlatformCard from '../../components/platforms/PlatformCard';
import { PlatformConfig, PlatformType, PlatformStatus } from '../../types/platform';
import platformService from '../../services/platformService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 平台列表頁面
 */
const PlatformsPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlatformType, setSelectedPlatformType] = useState<PlatformType | ''>('');
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<PlatformConfig | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  
  /**
   * 獲取平台列表
   */
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockPlatforms = platformService.getMockPlatforms();
          setPlatforms(mockPlatforms);
          setLoading(false);
          return;
        }
        
        const data = await platformService.getAllPlatforms();
        setPlatforms(data);
      } catch (error) {
        console.error('獲取平台列表錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.fetchTitle'),
          message: t('platforms.errors.fetchMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlatforms();
  }, [addNotification, t]);
  
  /**
   * 過濾平台
   */
  useEffect(() => {
    let filtered = [...platforms];
    
    // 根據標籤過濾
    if (activeTab === 1) {
      filtered = filtered.filter(platform => platform.status === PlatformStatus.ACTIVE);
    } else if (activeTab === 2) {
      filtered = filtered.filter(platform => platform.status !== PlatformStatus.ACTIVE);
    }
    
    setFilteredPlatforms(filtered);
  }, [platforms, activeTab]);
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 處理刷新
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        const mockPlatforms = platformService.getMockPlatforms();
        setPlatforms(mockPlatforms);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.refreshSuccessTitle'),
          message: t('platforms.refreshSuccessMessage')
        });
        
        setRefreshing(false);
        return;
      }
      
      const data = await platformService.getAllPlatforms();
      setPlatforms(data);
      
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('platforms.refreshSuccessTitle'),
        message: t('platforms.refreshSuccessMessage')
      });
    } catch (error) {
      console.error('刷新平台列表錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.refreshTitle'),
        message: t('platforms.errors.refreshMessage')
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  /**
   * 處理添加平台對話框打開
   */
  const handleOpenAddDialog = () => {
    setSelectedPlatformType('');
    setOpenDialog(true);
  };
  
  /**
   * 處理對話框關閉
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  /**
   * 處理平台類型選擇
   */
  const handlePlatformTypeSelect = (type: PlatformType) => {
    setSelectedPlatformType(type);
    setOpenDialog(false);
    
    // 導航到添加平台頁面
    router.push(`/platforms/add?type=${type}`);
  };
  
  /**
   * 處理編輯平台
   */
  const handleEditPlatform = (platform: PlatformConfig) => {
    router.push(`/platforms/edit/${platform.id}`);
  };
  
  /**
   * 處理刪除平台確認對話框打開
   */
  const handleOpenDeleteConfirm = (platform: PlatformConfig) => {
    setPlatformToDelete(platform);
    setConfirmDeleteDialog(true);
  };
  
  /**
   * 處理刪除平台確認對話框關閉
   */
  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteDialog(false);
    setPlatformToDelete(null);
  };
  
  /**
   * 處理刪除平台
   */
  const handleDeletePlatform = async () => {
    if (!platformToDelete) return;
    
    try {
      await platformService.deletePlatform(platformToDelete.id);
      
      // 更新平台列表
      setPlatforms(platforms.filter(p => p.id !== platformToDelete.id));
      
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('platforms.deleteSuccessTitle'),
        message: t('platforms.deleteSuccessMessage')
      });
    } catch (error) {
      console.error('刪除平台錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.deleteTitle'),
        message: t('platforms.errors.deleteMessage')
      });
    } finally {
      handleCloseDeleteConfirm();
    }
  };
  
  /**
   * 處理同步平台
   */
  const handleSyncPlatform = async (platform: PlatformConfig) => {
    try {
      setSyncingPlatform(platform.id);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.syncSuccessTitle'),
          message: t('platforms.syncSuccessMessage')
        });
        
        setSyncingPlatform(null);
        return;
      }
      
      const result = await platformService.syncPlatform(platform.id);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.syncSuccessTitle'),
          message: t('platforms.syncSuccessMessage')
        });
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.syncTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('同步平台錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.syncTitle'),
        message: t('platforms.errors.syncMessage')
      });
    } finally {
      setSyncingPlatform(null);
    }
  };
  
  /**
   * 處理測試平台連接
   */
  const handleTestConnection = async (platform: PlatformConfig) => {
    try {
      setTestingPlatform(platform.id);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.testSuccessTitle'),
          message: t('platforms.testSuccessMessage')
        });
        
        setTestingPlatform(null);
        return;
      }
      
      const result = await platformService.testConnection(platform.id);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.testSuccessTitle'),
          message: t('platforms.testSuccessMessage')
        });
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.testTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('測試平台連接錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.testTitle'),
        message: t('platforms.errors.testMessage')
      });
    } finally {
      setTestingPlatform(null);
    }
  };
  
  /**
   * 處理查看平台
   */
  const handleViewPlatform = (platform: PlatformConfig) => {
    router.push(`/platforms/${platform.id}`);
  };
  
  /**
   * 渲染平台卡片
   */
  const renderPlatformCards = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
          <PlatformCard platform={{} as PlatformConfig} loading />
        </Grid>
      ));
    }
    
    if (filteredPlatforms.length === 0) {
      return (
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('platforms.noPlatforms')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{ mt: 2 }}
            >
              {t('platforms.addPlatform')}
            </Button>
          </Box>
        </Grid>
      );
    }
    
    return filteredPlatforms.map(platform => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={platform.id}>
        <PlatformCard
          platform={platform}
          onEdit={handleEditPlatform}
          onDelete={handleOpenDeleteConfirm}
          onSync={handleSyncPlatform}
          onTest={handleTestConnection}
          onView={handleViewPlatform}
        />
      </Grid>
    ));
  };
  
  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 }, height: 'calc(100vh - 64px)' }}>
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            {t('platforms.title')}
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ mr: 2 }}
            >
              {refreshing ? (
                <CircularProgress size={24} />
              ) : (
                t('platforms.refresh')
              )}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              {t('platforms.addPlatform')}
            </Button>
          </Box>
        </Box>
        
        <Paper 
          elevation={0} 
          sx={{ 
            height: 'calc(100% - 60px)', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ px: 2 }}
            >
              <Tab 
                label={t('platforms.tabs.all')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
              <Tab 
                label={t('platforms.tabs.active')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
              <Tab 
                label={t('platforms.tabs.inactive')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {renderPlatformCards()}
            </Grid>
          </Box>
        </Paper>
      </Container>
      
      {/* 添加平台對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('platforms.selectPlatformType')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handlePlatformTypeSelect(PlatformType.LINE)}
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box 
                  component="img" 
                  src="/images/platforms/line.svg" 
                  alt="LINE" 
                  sx={{ width: 48, height: 48, mb: 1 }} 
                />
                <Typography>{t('platforms.types.line')}</Typography>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handlePlatformTypeSelect(PlatformType.FACEBOOK)}
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box 
                  component="img" 
                  src="/images/platforms/facebook.svg" 
                  alt="Facebook" 
                  sx={{ width: 48, height: 48, mb: 1 }} 
                />
                <Typography>{t('platforms.types.facebook')}</Typography>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handlePlatformTypeSelect(PlatformType.INSTAGRAM)}
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box 
                  component="img" 
                  src="/images/platforms/instagram.svg" 
                  alt="Instagram" 
                  sx={{ width: 48, height: 48, mb: 1 }} 
                />
                <Typography>{t('platforms.types.instagram')}</Typography>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handlePlatformTypeSelect(PlatformType.WEBSITE)}
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box 
                  component="img" 
                  src="/images/platforms/website.svg" 
                  alt="Website" 
                  sx={{ width: 48, height: 48, mb: 1 }} 
                />
                <Typography>{t('platforms.types.website')}</Typography>
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 刪除確認對話框 */}
      <Dialog open={confirmDeleteDialog} onClose={handleCloseDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{t('platforms.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {platformToDelete && t('platforms.deleteConfirmation', { name: platformToDelete.name })}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('platforms.deleteWarning')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>
            {t('common.cancel')}
          </Button>
          <Button color="error" onClick={handleDeletePlatform}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformsPage;