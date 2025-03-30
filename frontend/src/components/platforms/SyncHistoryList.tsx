import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  IconButton, 
  Tooltip,
  Divider,
  Button
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format, formatDistance } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { SyncHistory, SyncStatus } from '../../types/platform';

/**
 * 同步歷史記錄列表屬性接口
 */
interface SyncHistoryListProps {
  syncHistory: SyncHistory[];
  onViewDetails: (syncHistory: SyncHistory) => void;
  onCancelSync: (syncId: string) => void;
}

/**
 * 同步歷史記錄列表組件
 */
const SyncHistoryList: React.FC<SyncHistoryListProps> = ({
  syncHistory,
  onViewDetails,
  onCancelSync
}) => {
  const { t } = useTranslation();
  
  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW });
  };
  
  /**
   * 格式化相對時間
   */
  const formatRelativeTime = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { 
      addSuffix: true,
      locale: zhTW
    });
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
   * 處理查看詳細信息
   */
  const handleViewDetails = (syncHistory: SyncHistory) => {
    onViewDetails(syncHistory);
  };
  
  /**
   * 處理取消同步
   */
  const handleCancelSync = (syncId: string) => {
    onCancelSync(syncId);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="medium">
          {t('platforms.syncHistory')}
        </Typography>
      </Box>
      
      <List disablePadding>
        {syncHistory.map((item, index) => (
          <React.Fragment key={item.id}>
            <ListItem
              sx={{ 
                py: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {renderSyncStatus(item.status)}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      {formatRelativeTime(item.startTime)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('platforms.syncStartTime')}: {formatDate(item.startTime)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {t('platforms.syncEndTime')}: {item.endTime ? formatDate(item.endTime) : '-'}
                      </Typography>
                      
                      {item.endTime && (
                        <Typography variant="body2" color="text.secondary">
                          {t('platforms.syncDuration')}: {calculateDuration(item.startTime, item.endTime)}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="body2">
                        {t('platforms.syncMessageCount')}: {item.messageCount}
                      </Typography>
                      
                      <Typography variant="body2">
                        {t('platforms.syncCustomerCount')}: {item.customerCount}
                      </Typography>
                    </Box>
                    
                    {item.errorMessage && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {item.errorMessage}
                      </Typography>
                    )}
                  </Box>
                }
              />
              
              <Box>
                {item.status === SyncStatus.PENDING && (
                  <Tooltip title={t('platforms.actions.cancelSync')}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleCancelSync(item.id)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title={t('platforms.actions.viewDetails')}>
                  <IconButton 
                    onClick={() => handleViewDetails(item)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
            
            {index < syncHistory.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SyncHistoryList;