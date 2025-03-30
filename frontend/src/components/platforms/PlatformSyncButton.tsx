import React from 'react';
import { Button, Tooltip, ButtonProps } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotifications, NotificationType } from '../../contexts/NotificationContext';
import platformConnectionService from '../../services/platformConnectionService';
import SyncProgressDialog from './SyncProgressDialog';
import { PlatformType } from '../../types/platform';

interface PlatformSyncButtonProps {
  platformId: string;
  platformType: PlatformType;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  onSyncComplete?: () => void;
}

/**
 * 平台同步按鈕組件
 * 用於觸發平台數據同步並顯示同步進度對話框
 */
const PlatformSyncButton: React.FC<PlatformSyncButtonProps> = ({
  platformId,
  platformType,
  disabled = false,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  onSyncComplete
}) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [syncDialogOpen, setSyncDialogOpen] = React.useState<boolean>(false);
  const [syncId, setSyncId] = React.useState<string>('');

  // 開始同步
  const handleSync = async () => {
    setLoading(true);
    
    try {
      // 在生產環境中使用真實的同步 API
      // 在開發環境中使用模擬數據
      const result = process.env.NODE_ENV === 'production'
        ? await platformConnectionService.syncPlatform(platformId)
        : platformConnectionService.getMockSyncResult(platformType);
      
      if (result.success && result.syncId) {
        setSyncId(result.syncId);
        setSyncDialogOpen(true);
        addNotification({
          type: NotificationType.INFO,
          title: '同步開始',
          message: '平台數據同步已開始，請稍候...'
        });
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: '同步失敗',
          message: result.message || '無法開始同步，請稍後再試'
        });
      }
    } catch (error) {
      console.error('同步錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: '同步錯誤',
        message: '發生錯誤，無法開始同步'
      });
    } finally {
      setLoading(false);
    }
  };

  // 關閉同步對話框
  const handleCloseDialog = () => {
    setSyncDialogOpen(false);
    
    // 通知父組件同步已完成
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <>
      <Tooltip title="同步平台數據">
        <span>
          <Button
            variant={variant as ButtonProps['variant']}
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleSync}
            disabled={disabled || loading}
            size={size as ButtonProps['size']}
            fullWidth={fullWidth}
          >
            {loading ? '同步中...' : '同步數據'}
          </Button>
        </span>
      </Tooltip>
      
      {syncDialogOpen && (
        <SyncProgressDialog
          open={syncDialogOpen}
          onClose={handleCloseDialog}
          platformId={platformId}
          syncId={syncId}
        />
      )}
    </>
  );
};

export default PlatformSyncButton;