import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Chip, 
  CircularProgress, 
  Alert, 
  AlertTitle,
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  LinearProgress
} from '@mui/material';
import { 
  Link as LinkIcon, 
  LinkOff as LinkOffIcon, 
  Refresh as RefreshIcon, 
  Check as CheckIcon, 
  Error as ErrorIcon, 
  Warning as WarningIcon, 
  Info as InfoIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, formatDistance } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { PlatformConfig, PlatformStatus, PlatformType } from '../../types/platform';
import platformConnectionService, { ConnectionStatus, SyncResult } from '../../services/platformConnectionService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 平台連接屬性接口
 */
interface PlatformConnectionProps {
  platform: PlatformConfig;
  onStatusChange?: (status: PlatformStatus) => void;
}

/**
 * 平台連接組件
 */
const PlatformConnection: React.FC<PlatformConnectionProps> = ({
  platform,
  onStatusChange
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  
  /**
   * 獲取平台連接狀態
   */
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockStatus = platformConnectionService.getMockConnectionStatus(platform.id, platform.type);
          setConnectionStatus(mockStatus);
          
          // 通知狀態變更
          if (onStatusChange) {
            onStatusChange(mockStatus.status);
          }
          
          setLoading(false);
          return;
        }
        
        const status = await platformConnectionService.getConnectionStatus(platform.id);
        setConnectionStatus(status);
        
        // 通知狀態變更
        if (onStatusChange) {
          onStatusChange(status.status);
        }
      } catch (error) {
        console.error('獲取平台連接狀態錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.fetchStatusTitle'),
          message: t('platforms.errors.fetchStatusMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnectionStatus();
  }, [platform.id, platform.type, onStatusChange, addNotification, t]);
  
  /**
   * 處理連接平台
   */
  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockStatus = platformConnectionService.getMockConnectionStatus(platform.id, platform.type);
        mockStatus.status = PlatformStatus.ACTIVE;
        mockStatus.success = true;
        mockStatus.message = '平台已連接';
        
        setConnectionStatus(mockStatus);
        
        // 通知狀態變更
        if (onStatusChange) {
          onStatusChange(mockStatus.status);
        }
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.connectSuccessTitle'),
          message: t('platforms.connectSuccessMessage')
        });
        
        setConnecting(false);
        return;
      }
      
      const result = await platformConnectionService.connectPlatform(platform.id);
      setConnectionStatus(result);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.connectSuccessTitle'),
          message: t('platforms.connectSuccessMessage')
        });
        
        // 通知狀態變更
        if (onStatusChange) {
          onStatusChange(result.status);
        }
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.connectTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('連接平台錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.connectTitle'),
        message: t('platforms.errors.connectMessage')
      });
    } finally {
      setConnecting(false);
    }
  };
  
  /**
   * 處理斷開平台連接
   */
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockStatus = platformConnectionService.getMockConnectionStatus(platform.id, platform.type);
        mockStatus.status = PlatformStatus.INACTIVE;
        mockStatus.success = true;
        mockStatus.message = '平台已斷開連接';
        
        setConnectionStatus(mockStatus);
        
        // 通知狀態變更
        if (onStatusChange) {
          onStatusChange(mockStatus.status);
        }
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.disconnectSuccessTitle'),
          message: t('platforms.disconnectSuccessMessage')
        });
        
        setDisconnecting(false);
        setConfirmDisconnect(false);
        return;
      }
      
      const result = await platformConnectionService.disconnectPlatform(platform.id);
      setConnectionStatus(result);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.disconnectSuccessTitle'),
          message: t('platforms.disconnectSuccessMessage')
        });
        
        // 通知狀態變更
        if (onStatusChange) {
          onStatusChange(result.status);
        }
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.disconnectTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('斷開平台連接錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.disconnectTitle'),
        message: t('platforms.errors.disconnectMessage')
      });
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };
  
  /**
   * 處理同步平台數據
   */
  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockResult = platformConnectionService.getMockSyncResult(platform.type);
        setSyncResult(mockResult);
        
        if (mockResult.success) {
          addNotification({
            type: NotificationType.SUCCESS,
            title: t('platforms.syncSuccessTitle'),
            message: t('platforms.syncSuccessMessage', { count: mockResult.syncedItems })
          });
        } else {
          addNotification({
            type: NotificationType.ERROR,
            title: t('platforms.errors.syncTitle'),
            message: mockResult.message
          });
        }
        
        setSyncing(false);
        return;
      }
      
      const result = await platformConnectionService.syncPlatform(platform.id);
      setSyncResult(result);
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('platforms.syncSuccessTitle'),
          message: t('platforms.syncSuccessMessage', { count: result.syncedItems })
        });
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.syncTitle'),
          message: result.message
        });
      }
    } catch (error) {
      console.error('同步平台數據錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('platforms.errors.syncTitle'),
        message: t('platforms.errors.syncMessage')
      });
    } finally {
      setSyncing(false);
    }
  };
  
  /**
   * 處理測試平台連接
   */
  const handleTest = async () => {
    try {
      setTesting(true);
      
      // 在開發環境中使用模擬數據
      if (process.env.NODE_ENV === 'development') {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockStatus = platformConnectionService.getMockConnectionStatus(platform.id, platform.type);
        
        if (mockStatus.status === PlatformStatus.ACTIVE) {
          addNotification({
            type: NotificationType.SUCCESS,
            title: t('platforms.testSuccessTitle'),
            message: t('platforms.testSuccessMessage')
          });
        } else {
          addNotification({
            type: NotificationType.ERROR,
            title: t('platforms.errors.testTitle'),
            message: mockStatus.message
          });
        }
        
        setTesting(false);
        return;
      }
      
      const result = await platformConnectionService.testConnection(platform.id);
      
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
      setTesting(false);
    }
  };
  
  /**
   * 處理顯示同步歷史
   */
  const handleToggleSyncHistory = async () => {
    if (!showSyncHistory && syncHistory.length === 0) {
      try {
        setLoadingHistory(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          // 模擬延遲
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockHistory = platformConnectionService.getMockSyncHistory(platform.type);
          setSyncHistory(mockHistory);
          
          setLoadingHistory(false);
          setShowSyncHistory(true);
          return;
        }
        
        const history = await platformConnectionService.getSyncHistory(platform.id);
        setSyncHistory(history);
      } catch (error) {
        console.error('獲取同步歷史錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('platforms.errors.fetchHistoryTitle'),
          message: t('platforms.errors.fetchHistoryMessage')
        });
      } finally {
        setLoadingHistory(false);
      }
    }
    
    setShowSyncHistory(!showSyncHistory);
  };
  
  /**
   * 處理確認斷開連接對話框
   */
  const handleOpenDisconnectConfirm = () => {
    setConfirmDisconnect(true);
  };
  
  /**
   * 處理關閉確認斷開連接對話框
   */
  const handleCloseDisconnectConfirm = () => {
    setConfirmDisconnect(false);
  };
  
  /**
   * 獲取平台狀態顏色
   */
  const getStatusColor = (status: PlatformStatus): string => {
    switch (status) {
      case PlatformStatus.ACTIVE:
        return '#4caf50';
      case PlatformStatus.INACTIVE:
        return '#9e9e9e';
      case PlatformStatus.PENDING:
        return '#ff9800';
      case PlatformStatus.ERROR:
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  /**
   * 獲取平台狀態圖標
   */
  const getStatusIcon = (status: PlatformStatus) => {
    switch (status) {
      case PlatformStatus.ACTIVE:
        return <CheckIcon sx={{ color: '#4caf50' }} />;
      case PlatformStatus.INACTIVE:
        return <LinkOffIcon sx={{ color: '#9e9e9e' }} />;
      case PlatformStatus.PENDING:
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case PlatformStatus.ERROR:
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      default:
        return <InfoIcon sx={{ color: '#9e9e9e' }} />;
    }
  };
  
  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm', { locale: zhTW });
  };
  
  /**
   * 格式化相對時間
   */
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true, locale: zhTW });
  };
  
  /**
   * 渲染連接狀態
   */
  const renderConnectionStatus = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>{t('platforms.loadingStatus')}</Typography>
        </Box>
      );
    }
    
    if (!connectionStatus) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('platforms.errors.statusNotAvailable')}
        </Alert>
      );
    }
    
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: `${getStatusColor(connectionStatus.status)}20`,
              mr: 2
            }}
          >
            {getStatusIcon(connectionStatus.status)}
          </Box>
          
          <Box>
            <Typography variant="h6" fontWeight="medium">
              {t(`platforms.status.${connectionStatus.status}`)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {connectionStatus.message}
            </Typography>
          </Box>
        </Box>
        
        {connectionStatus.status === PlatformStatus.ACTIVE && connectionStatus.details && (
          <List dense disablePadding>
            {connectionStatus.details.lastSyncTime && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={t('platforms.lastSyncTime')}
                  secondary={`${formatDate(connectionStatus.details.lastSyncTime)} (${formatRelativeTime(connectionStatus.details.lastSyncTime)})`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            )}
            
            {connectionStatus.details.messageCount !== undefined && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <MessageIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={t('platforms.messageCount')}
                  secondary={connectionStatus.details.messageCount}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            )}
            
            {connectionStatus.details.followers !== undefined && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PersonIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={t('platforms.followers')}
                  secondary={connectionStatus.details.followers}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            )}
            
            {connectionStatus.details.visitors !== undefined && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PersonIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={t('platforms.visitors')}
                  secondary={connectionStatus.details.visitors}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            )}
          </List>
        )}
      </Box>
    );
  };
  
  /**
   * 渲染同步結果
   */
  const renderSyncResult = () => {
    if (!syncResult) return null;
    
    return (
      <Alert 
        severity={syncResult.success ? 'success' : 'error'} 
        sx={{ mt: 2 }}
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={() => setSyncResult(null)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>
          {syncResult.success ? t('platforms.syncSuccess') : t('platforms.syncFailed')}
        </AlertTitle>
        
        <Typography variant="body2" gutterBottom>
          {syncResult.message}
        </Typography>
        
        {syncResult.success && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              {t('platforms.syncedItems')}: {syncResult.syncedItems}
            </Typography>
            
            {syncResult.failedItems > 0 && (
              <Typography variant="body2" color="error">
                {t('platforms.failedItems')}: {syncResult.failedItems}
              </Typography>
            )}
          </Box>
        )}
      </Alert>
    );
  };
  
  /**
   * 渲染同步歷史
   */
  const renderSyncHistory = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          variant="text"
          size="small"
          onClick={handleToggleSyncHistory}
          endIcon={showSyncHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          disabled={loadingHistory}
          startIcon={<HistoryIcon />}
        >
          {t('platforms.syncHistory')}
          {loadingHistory && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Button>
        
        <Collapse in={showSyncHistory}>
          <Paper variant="outlined" sx={{ mt: 1, p: 2 }}>
            {syncHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                {t('platforms.noSyncHistory')}
              </Typography>
            ) : (
              <List dense disablePadding>
                {syncHistory.map((item) => (
                  <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.success ? (
                        <CheckIcon fontSize="small" color="success" />
                      ) : (
                        <ErrorIcon fontSize="small" color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {formatDate(item.timestamp)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.duration.toFixed(1)} {t('platforms.seconds')}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {item.success ? (
                            <Typography variant="body2" color="text.secondary">
                              {t('platforms.syncedItems')}: {item.syncedItems}
                              {item.failedItems > 0 && `, ${t('platforms.failedItems')}: ${item.failedItems}`}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="error">
                              {item.error || t('platforms.syncFailed')}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Collapse>
      </Box>
    );
  };
  
  /**
   * 渲染操作按鈕
   */
  const renderActions = () => {
    const isConnected = connectionStatus?.status === PlatformStatus.ACTIVE;
    const isPending = connectionStatus?.status === PlatformStatus.PENDING;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {!isConnected && !isPending && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LinkIcon />}
            onClick={handleConnect}
            disabled={connecting || !connectionStatus}
          >
            {connecting ? (
              <CircularProgress size={24} />
            ) : (
              t('platforms.connect')
            )}
          </Button>
        )}
        
        {isConnected && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={handleOpenDisconnectConfirm}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <CircularProgress size={24} />
            ) : (
              t('platforms.disconnect')
            )}
          </Button>
        )}
        
        {isConnected && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <CircularProgress size={24} />
            ) : (
              t('platforms.sync')
            )}
          </Button>
        )}
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CheckIcon />}
          onClick={handleTest}
          disabled={testing || !connectionStatus}
        >
          {testing ? (
            <CircularProgress size={24} />
          ) : (
            t('platforms.test')
          )}
        </Button>
      </Box>
    );
  };
  
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.connectionStatus')}
        </Typography>
        
        {renderConnectionStatus()}
        
        <Divider sx={{ my: 2 }} />
        
        {renderActions()}
        
        {renderSyncResult()}
        
        {connectionStatus?.status === PlatformStatus.ACTIVE && renderSyncHistory()}
      </Paper>
      
      {/* 確認斷開連接對話框 */}
      <Dialog open={confirmDisconnect} onClose={handleCloseDisconnectConfirm}>
        <DialogTitle>{t('platforms.confirmDisconnect')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('platforms.disconnectWarning')}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('platforms.disconnectConsequences')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDisconnectConfirm}>
            {t('common.cancel')}
          </Button>
          <Button color="error" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            {t('platforms.disconnect')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformConnection;