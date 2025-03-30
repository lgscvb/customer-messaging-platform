import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Refresh as RefreshIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import platformService from '../../../services/platformService';
import { 
  PlatformConfig, 
  PlatformType, 
  PlatformStatus, 
  PlatformStats,
  SyncHistory,
  SyncStatus
} from '../../../types/platform';
import { useNotifications } from '../../../contexts/NotificationContext';
import { NotificationType } from '../../../contexts/NotificationContext';
import SyncHistoryList from '../../../components/platforms/SyncHistoryList';
import SyncDetailsDialog from '../../../components/platforms/SyncDetailsDialog';

/**
 * 平台詳細頁面
 */
const PlatformDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const { addNotification } = useNotifications();
  
  // 狀態
  const [platform, setPlatform] = useState<PlatformConfig | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingPlatform, setSyncingPlatform] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [selectedSyncHistory, setSelectedSyncHistory] = useState<SyncHistory | null>(null);
  const [syncDetailsDialog, setSyncDetailsDialog] = useState(false);
  const [cancelSyncDialog, setCancelSyncDialog] = useState(false);
  const [syncToCancelId, setSyncToCancelId] = useState<string | null>(null);
  
  /**
   * 獲取平台詳細信息
   */
  useEffect(() => {
    const fetchPlatformDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockPlatforms = platformService.getMockPlatforms();
          const mockPlatform = mockPlatforms.find(p => p.id === id);
          
          if (mockPlatform) {
            setPlatform(mockPlatform);
            setStats(platformService.getMockPlatformStats(mockPlatform.id));
            setSyncHistory(platformService.getMockSyncHistory(mockPlatform.id));
          } else {
            router.push('/platforms');
            addNotification({
              type: NotificationType.ERROR,
              title: t('platforms.errors.notFoundTitle'),
              message: t('platforms.errors.notFoundMessage')
            });
          }
          
          setLoading(false);
          return;
        }
        
        const platformData = await platformService.getPlatform(id as string);
        setPlatform(platformData);
        
        const statsData = await platformService.getPlatformStats(id as string);
        setStats(statsData);
        
        const historyData = await platformService.getSyncHistory(id as string);
        setSyncHistory(historyData);
      } catch (error) {
        console.error('獲取平台詳細信息錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.fetchTitle'),
          message: t('platforms.errors.fetchMessage')
        });
        router.push('/platforms');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlatformDetails();
  }, [id, router, addNotification, t]);
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 處理返回
   */
  const handleBack = () => {
    router.push('/platforms');
  };
  
  /**
   * 處理編輯平台
   */
  const handleEdit = () => {
    router.push(`/platforms/edit/${id}`);
  };
  
  /**
   * 處理刪除平台確認對話框打開
   */
  const handleOpenDeleteConfirm = () => {
    setConfirmDeleteDialog(true);
  };
  
  /**
   * 處理刪除平台確認對話框關閉
   */
  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteDialog(false);
  };
  
  /**
   * 處理刪除平台
   */
  const handleDeletePlatform = async () => {
    if (!platform) return;
    
    try {
      await platformService.deletePlatform(platform.id);
      
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('platforms.deleteSuccessTitle'),
        message: t('platforms.deleteSuccessMessage')
      });
      
      router.push('/platforms');
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
  const handleSyncPlatform = async () => {
    if (!platform) return;
    
    try {
      setSyncingPlatform(true);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 創建新的同步歷史記錄
        const now = new Date();
        const newSyncHistory: SyncHistory = {
          id: `${platform.id}-${syncHistory.length + 1}`,
          platformId: platform.id,
          status: SyncStatus.SUCCESS,
          startTime: now.toISOString(),
          endTime: new Date(now.getTime() + 10000).toISOString(),
          messageCount: 75,
          customerCount: 28,
          details: {
            newMessages: 60,
            updatedMessages: 15,
            newCustomers: 8,
            updatedCustomers: 20,
            errors: []
          }
        };
        
        setSyncHistory([newSyncHistory, ...syncHistory]);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.syncSuccessTitle'),
          message: t('platforms.syncSuccessMessage')
        });
        
        setSyncingPlatform(false);
        return;
      }
      
      const result = await platformService.syncPlatform(platform.id);
      
      if (result.success) {
        // 重新獲取同步歷史記錄
        const historyData = await platformService.getSyncHistory(platform.id);
        setSyncHistory(historyData);
        
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
      setSyncingPlatform(false);
    }
  };
  
  /**
   * 處理查看同步詳細信息
   */
  const handleViewSyncDetails = (syncHistory: SyncHistory) => {
    setSelectedSyncHistory(syncHistory);
    setSyncDetailsDialog(true);
  };
  
  /**
   * 處理關閉同步詳細信息對話框
   */
  const handleCloseSyncDetailsDialog = () => {
    setSyncDetailsDialog(false);
    setSelectedSyncHistory(null);
  };
  
  /**
   * 處理打開取消同步對話框
   */
  const handleOpenCancelSyncDialog = (syncId: string) => {
    setSyncToCancelId(syncId);
    setCancelSyncDialog(true);
  };
  
  /**
   * 處理關閉取消同步對話框
   */
  const handleCloseCancelSyncDialog = () => {
    setCancelSyncDialog(false);
    setSyncToCancelId(null);
  };
  
  /**
   * 處理取消同步
   */
  const handleCancelSync = async () => {
    if (!syncToCancelId) return;
    
    try {
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新同步歷史記錄
        const updatedHistory = syncHistory.map(item => {
          if (item.id === syncToCancelId) {
            return {
              ...item,
              status: SyncStatus.FAILED,
              errorMessage: '同步已取消'
            };
          }
          return item;
        });
        
        setSyncHistory(updatedHistory);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.cancelSyncSuccessTitle'),
          message: t('platforms.cancelSyncSuccessMessage')
        });
        
        handleCloseCancelSyncDialog();
        return;
      }
      
      const result = await platformService.cancelSync(syncToCancelId);
      
      if (result.success) {
        // 重新獲取同步歷史記錄
        const historyData = await platformService.getSyncHistory(platform!.id);
        setSyncHistory(historyData);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.cancelSyncSuccessTitle'),
          message: t('platforms.cancelSyncSuccessMessage')
        });
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.cancelSyncTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('取消同步錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.cancelSyncTitle'),
        message: t('platforms.errors.cancelSyncMessage')
      });
    } finally {
      handleCloseCancelSyncDialog();
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!platform) {
    return (
      <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl">
          <Alert severity="error">
            {t('platforms.errors.notFoundMessage')}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            {t('common.back')}
          </Button>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 }, height: 'calc(100vh - 64px)' }}>
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        {/* 頁面標題 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">
              {platform.name}
            </Typography>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleSyncPlatform}
              disabled={syncingPlatform}
              sx={{ mr: 2 }}
            >
              {syncingPlatform ? (
                <CircularProgress size={24} />
              ) : (
                t('platforms.actions.sync')
              )}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 2 }}
            >
              {t('platforms.actions.edit')}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteConfirm}
            >
              {t('platforms.actions.delete')}
            </Button>
          </Box>
        </Box>
        
        {/* 標籤頁 */}
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
                label={t('platforms.tabs.details')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
              <Tab 
                label={t('platforms.tabs.syncHistory')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {activeTab === 0 ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('platforms.platformDetails')}
                </Typography>
                <Typography variant="body1">
                  {t('platforms.platformDetailsDescription')}
                </Typography>
              </Box>
            ) : (
              <Box>
                {syncHistory.length > 0 ? (
                  <SyncHistoryList 
                    syncHistory={syncHistory} 
                    onViewDetails={handleViewSyncDetails}
                    onCancelSync={handleOpenCancelSyncDialog}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {t('platforms.noSyncHistory')}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={handleSyncPlatform}
                      disabled={syncingPlatform}
                      sx={{ mt: 2 }}
                    >
                      {syncingPlatform ? (
                        <CircularProgress size={24} />
                      ) : (
                        t('platforms.actions.sync')
                      )}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
      
      {/* 同步詳細信息對話框 */}
      <SyncDetailsDialog
        open={syncDetailsDialog}
        onClose={handleCloseSyncDetailsDialog}
        syncHistory={selectedSyncHistory}
      />
      
      {/* 刪除確認對話框 */}
      <Dialog open={confirmDeleteDialog} onClose={handleCloseDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{t('platforms.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('platforms.deleteConfirmation', { name: platform.name })}
          </DialogContentText>
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
      
      {/* 取消同步確認對話框 */}
      <Dialog open={cancelSyncDialog} onClose={handleCloseCancelSyncDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('platforms.confirmCancelSync')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('platforms.cancelSyncConfirmation')}
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('platforms.cancelSyncWarning')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelSyncDialog}>
            {t('common.cancel')}
          </Button>
          <Button color="error" onClick={handleCancelSync}>
            {t('platforms.actions.confirmCancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformDetailPage;
