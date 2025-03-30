import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { SyncStatus } from '../../types/platform';
import platformConnectionService from '../../services/platformConnectionService';
import { useNotifications, NotificationType } from '../../contexts/NotificationContext';

// 模擬 i18n 翻譯函數
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'common.error': '錯誤',
    'common.success': '成功',
    'common.close': '關閉',
    'platforms.syncStatus.fetchError': '獲取同步狀態失敗',
    'platforms.syncStatus.cancelSuccess': '取消同步成功',
    'platforms.syncStatus.cancelError': '取消同步失敗',
    'platforms.syncProgress.title': '同步進度',
    'platforms.syncProgress.cancel': '取消同步',
    'platforms.syncProgress.inProgress': '同步進行中...',
    'platforms.syncProgress.startTime': '開始時間',
    'platforms.syncProgress.endTime': '結束時間',
    'platforms.syncProgress.duration': '持續時間',
    'platforms.syncProgress.syncId': '同步 ID',
    'platforms.syncProgress.summary': '同步摘要',
    'platforms.syncProgress.messageCount': '訊息數量',
    'platforms.syncProgress.customerCount': '客戶數量',
    'platforms.syncProgress.newMessages': '新訊息',
    'platforms.syncProgress.newCustomers': '新客戶',
    'platforms.syncProgress.error': '錯誤訊息',
    'platforms.syncProgress.notFound': '找不到同步任務',
    'platforms.syncProgress.done': '完成',
    'platforms.syncStatus.success': '成功',
    'platforms.syncStatus.failed': '失敗',
    'platforms.syncStatus.partial': '部分成功',
    'platforms.syncStatus.pending': '進行中'
  };
  
  return translations[key] || key;
};

interface SyncProgressDialogProps {
  open: boolean;
  onClose: () => void;
  platformId: string;
  syncId: string;
}

const SyncProgressDialog: React.FC<SyncProgressDialogProps> = ({
  open,
  onClose,
  platformId,
  syncId
}) => {
  const { addNotification } = useNotifications();
  const [syncStatus, setSyncStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [progress, setProgress] = React.useState<number>(0);
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null);

  // 獲取同步狀態
  const fetchSyncStatus = async () => {
    try {
      const status = await platformConnectionService.getSyncStatus(platformId, syncId);
      setSyncStatus(status);
      
      // 計算進度
      if (status.status === SyncStatus.PENDING) {
        // 如果還在進行中，設置一個模擬進度
        const elapsedTime = new Date().getTime() - new Date(status.startTime).getTime();
        const estimatedProgress = Math.min(Math.floor((elapsedTime / 30000) * 100), 95);
        setProgress(estimatedProgress);
      } else if (status.status === SyncStatus.SUCCESS || status.status === SyncStatus.PARTIAL) {
        setProgress(100);
        // 如果同步完成，停止輪詢
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else if (status.status === SyncStatus.FAILED) {
        // 如果同步失敗，停止輪詢
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('獲取同步狀態錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('common.error'),
        message: t('platforms.syncStatus.fetchError')
      });
      setLoading(false);
    }
  };

  // 取消同步
  const handleCancelSync = async () => {
    try {
      const result = await platformConnectionService.cancelSync(platformId, syncId);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('common.success'),
          message: t('platforms.syncStatus.cancelSuccess')
        });
        fetchSyncStatus();
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('common.error'),
          message: t('platforms.syncStatus.cancelError')
        });
      }
    } catch (error) {
      console.error('取消同步錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('common.error'),
        message: t('platforms.syncStatus.cancelError')
      });
    }
  };

  // 組件掛載時開始輪詢同步狀態
  React.useEffect(() => {
    if (open && syncId) {
      fetchSyncStatus();
      
      // 每 3 秒輪詢一次同步狀態
      const interval = setInterval(() => {
        fetchSyncStatus();
      }, 3000);
      
      setPollingInterval(interval);
      
      // 組件卸載時清除輪詢
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [open, syncId]);

  // 關閉對話框時清除輪詢
  const handleClose = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    onClose();
  };

  // 獲取同步狀態圖標
  const getSyncStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case SyncStatus.FAILED:
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case SyncStatus.PARTIAL:
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case SyncStatus.PENDING:
        return <RefreshIcon sx={{ color: '#2196f3' }} />;
      default:
        return null;
    }
  };

  // 獲取同步狀態顏色
  const getSyncStatusColor = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return { color: '#4caf50', bgColor: '#4caf5020' };
      case SyncStatus.FAILED:
        return { color: '#f44336', bgColor: '#f4433620' };
      case SyncStatus.PARTIAL:
        return { color: '#ff9800', bgColor: '#ff980020' };
      case SyncStatus.PENDING:
        return { color: '#2196f3', bgColor: '#2196f320' };
      default:
        return { color: '#9e9e9e', bgColor: '#9e9e9e20' };
    }
  };

  // 獲取同步狀態名稱
  const getSyncStatusName = (status: SyncStatus) => {
    return t(`platforms.syncStatus.${status}`);
  };

  // 渲染同步狀態
  const renderSyncStatus = (status: SyncStatus) => {
    const { color, bgColor } = getSyncStatusColor(status);
    
    return (
      <Chip
        icon={getSyncStatusIcon(status)}
        label={getSyncStatusName(status)}
        size="medium"
        sx={{
          backgroundColor: bgColor,
          color: color,
          fontWeight: 'medium',
          fontSize: '0.9rem',
          py: 1
        }}
      />
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 計算持續時間
  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}毫秒`;
    } else if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}秒`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.round((durationMs % 60000) / 1000);
      return `${minutes}分${seconds}秒`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {t('platforms.syncProgress.title')}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : syncStatus ? (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {renderSyncStatus(syncStatus.status)}
              
              {syncStatus.status === SyncStatus.PENDING && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleCancelSync}
                  size="small"
                >
                  {t('platforms.syncProgress.cancel')}
                </Button>
              )}
            </Box>
            
            {syncStatus.status === SyncStatus.PENDING && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('platforms.syncProgress.inProgress')}
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
                  {progress}%
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('platforms.syncProgress.startTime')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(syncStatus.startTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('platforms.syncProgress.endTime')}
                </Typography>
                <Typography variant="body1">
                  {syncStatus.endTime ? formatDate(syncStatus.endTime) : '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('platforms.syncProgress.duration')}
                </Typography>
                <Typography variant="body1">
                  {calculateDuration(syncStatus.startTime, syncStatus.endTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('platforms.syncProgress.syncId')}
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {syncStatus.id}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('platforms.syncProgress.summary')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('platforms.syncProgress.messageCount')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {syncStatus.messageCount || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('platforms.syncProgress.customerCount')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {syncStatus.customerCount || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('platforms.syncProgress.newMessages')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {syncStatus.details?.newMessages || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('platforms.syncProgress.newCustomers')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {syncStatus.details?.newCustomers || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {syncStatus.errorMessage && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#fff4f4', borderRadius: 2, border: '1px solid #ffcdd2' }}>
                <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                  {t('platforms.syncProgress.error')}
                </Typography>
                <Typography variant="body2" color="error.dark">
                  {syncStatus.errorMessage}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {t('platforms.syncProgress.notFound')}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          {t('common.close')}
        </Button>
        
        {syncStatus && syncStatus.status !== SyncStatus.PENDING && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleClose}
          >
            {t('platforms.syncProgress.done')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SyncProgressDialog;