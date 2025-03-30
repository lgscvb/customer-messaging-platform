import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider, 
  Grid, 
  Paper, 
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon, 
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Person as PersonIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { SyncHistory, SyncStatus } from '../../types/platform';

/**
 * 同步詳細信息對話框屬性接口
 */
interface SyncDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  syncHistory: SyncHistory | null;
}

/**
 * 同步詳細信息對話框組件
 */
const SyncDetailsDialog: React.FC<SyncDetailsDialogProps> = ({
  open,
  onClose,
  syncHistory
}) => {
  const { t } = useTranslation();
  
  if (!syncHistory) return null;
  
  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW });
  };
  
  /**
   * 計算同步持續時間
   */
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
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
  
  /**
   * 獲取同步狀態顏色
   */
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
  
  /**
   * 獲取同步狀態圖標
   */
  const getSyncStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case SyncStatus.FAILED:
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case SyncStatus.PARTIAL:
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case SyncStatus.PENDING:
        return <ScheduleIcon sx={{ color: '#2196f3' }} />;
      default:
        return null;
    }
  };
  
  /**
   * 獲取同步狀態名稱
   */
  const getSyncStatusName = (status: SyncStatus) => {
    return t(`platforms.syncStatus.${status}`);
  };
  
  /**
   * 渲染同步狀態
   */
  const renderSyncStatus = (status: SyncStatus) => {
    const { color, bgColor } = getSyncStatusColor(status);
    
    return (
      <Chip
        icon={getSyncStatusIcon(status)}
        label={getSyncStatusName(status)}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: color,
          fontWeight: 'medium'
        }}
      />
    );
  };
  
  /**
   * 渲染同步詳細信息
   */
  const renderSyncDetails = () => {
    if (!syncHistory.details) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('platforms.noSyncDetails')}
          </Typography>
        </Box>
      );
    }
    
    const { details } = syncHistory;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('platforms.messageSync')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                <Typography variant="body2">
                  {t('platforms.newMessages')}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {details.newMessages}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UpdateIcon fontSize="small" sx={{ mr: 0.5, color: 'info.main' }} />
                <Typography variant="body2">
                  {t('platforms.updatedMessages')}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {details.updatedMessages}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('platforms.customerSync')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                <Typography variant="body2">
                  {t('platforms.newCustomers')}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {details.newCustomers}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UpdateIcon fontSize="small" sx={{ mr: 0.5, color: 'info.main' }} />
                <Typography variant="body2">
                  {t('platforms.updatedCustomers')}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {details.updatedCustomers}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  /**
   * 渲染同步錯誤
   */
  const renderSyncErrors = () => {
    if (!syncHistory.details || !syncHistory.details.errors || syncHistory.details.errors.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {t('platforms.syncErrors')}
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'error.lightest',
            overflow: 'hidden'
          }}
        >
          <List disablePadding>
            {syncHistory.details.errors.map((error, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{ 
                    py: 1.5,
                    px: 2
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="medium">
                        {error.code}: {error.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(error.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                
                {index < syncHistory.details.errors.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {t('platforms.syncDetails')}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {renderSyncStatus(syncHistory.status)}
            
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {t('platforms.syncId')}: {syncHistory.id}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {t('platforms.syncStartTime')}
              </Typography>
              <Typography variant="body1">
                {formatDate(syncHistory.startTime)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {t('platforms.syncEndTime')}
              </Typography>
              <Typography variant="body1">
                {syncHistory.endTime ? formatDate(syncHistory.endTime) : '-'}
              </Typography>
            </Grid>
            
            {syncHistory.endTime && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t('platforms.syncDuration')}
                </Typography>
                <Typography variant="body1">
                  {calculateDuration(syncHistory.startTime, syncHistory.endTime)}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {t('platforms.syncMessageCount')}
              </Typography>
              <Typography variant="body1">
                {syncHistory.messageCount}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {t('platforms.syncCustomerCount')}
              </Typography>
              <Typography variant="body1">
                {syncHistory.customerCount}
              </Typography>
            </Grid>
          </Grid>
          
          {syncHistory.errorMessage && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="error">
                {syncHistory.errorMessage}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('platforms.syncDetailsTitle')}
        </Typography>
        
        {renderSyncDetails()}
        
        {renderSyncErrors()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncDetailsDialog;