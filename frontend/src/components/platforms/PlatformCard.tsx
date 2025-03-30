import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Tooltip,
  Button,
  Skeleton
} from '@mui/material';
import { 
  MoreVert as MoreIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon, 
  Settings as SettingsIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { PlatformConfig, PlatformStatus, PlatformType } from '../../types/platform';

/**
 * 平台圖標映射
 */
const PlatformIcons: Record<PlatformType, React.ReactNode> = {
  [PlatformType.LINE]: (
    <Box 
      component="img" 
      src="/images/platforms/line.svg" 
      alt="LINE" 
      sx={{ width: 24, height: 24 }} 
    />
  ),
  [PlatformType.FACEBOOK]: (
    <Box 
      component="img" 
      src="/images/platforms/facebook.svg" 
      alt="Facebook" 
      sx={{ width: 24, height: 24 }} 
    />
  ),
  [PlatformType.INSTAGRAM]: (
    <Box 
      component="img" 
      src="/images/platforms/instagram.svg" 
      alt="Instagram" 
      sx={{ width: 24, height: 24 }} 
    />
  ),
  [PlatformType.WEBSITE]: (
    <Box 
      component="img" 
      src="/images/platforms/website.svg" 
      alt="Website" 
      sx={{ width: 24, height: 24 }} 
    />
  ),
  [PlatformType.OTHER]: (
    <Box 
      component="img" 
      src="/images/platforms/other.svg" 
      alt="Other" 
      sx={{ width: 24, height: 24 }} 
    />
  )
};

/**
 * 平台狀態顏色映射
 */
const StatusColors: Record<PlatformStatus, { color: string; bgColor: string }> = {
  [PlatformStatus.ACTIVE]: { color: '#4caf50', bgColor: '#4caf5020' },
  [PlatformStatus.INACTIVE]: { color: '#9e9e9e', bgColor: '#9e9e9e20' },
  [PlatformStatus.PENDING]: { color: '#ff9800', bgColor: '#ff980020' },
  [PlatformStatus.ERROR]: { color: '#f44336', bgColor: '#f4433620' }
};

/**
 * 平台卡片屬性接口
 */
interface PlatformCardProps {
  platform: PlatformConfig;
  loading?: boolean;
  onEdit?: (platform: PlatformConfig) => void;
  onDelete?: (platform: PlatformConfig) => void;
  onSync?: (platform: PlatformConfig) => void;
  onTest?: (platform: PlatformConfig) => void;
  onView?: (platform: PlatformConfig) => void;
}

/**
 * 平台卡片組件
 */
const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  loading = false,
  onEdit,
  onDelete,
  onSync,
  onTest,
  onView
}) => {
  const { t } = useTranslation();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  
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
   * 處理編輯
   */
  const handleEdit = () => {
    if (onEdit) {
      onEdit(platform);
    }
    handleMenuClose();
  };
  
  /**
   * 處理刪除
   */
  const handleDelete = () => {
    if (onDelete) {
      onDelete(platform);
    }
    handleMenuClose();
  };
  
  /**
   * 處理同步
   */
  const handleSync = () => {
    if (onSync) {
      onSync(platform);
    }
    handleMenuClose();
  };
  
  /**
   * 處理測試
   */
  const handleTest = () => {
    if (onTest) {
      onTest(platform);
    }
    handleMenuClose();
  };
  
  /**
   * 處理查看
   */
  const handleView = () => {
    if (onView) {
      onView(platform);
    }
    handleMenuClose();
  };
  
  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm', { locale: zhTW });
  };
  
  /**
   * 獲取平台類型名稱
   */
  const getPlatformTypeName = (type: PlatformType) => {
    return t(`platforms.types.${type}`);
  };
  
  /**
   * 獲取平台狀態名稱
   */
  const getPlatformStatusName = (status: PlatformStatus) => {
    return t(`platforms.status.${status}`);
  };
  
  /**
   * 渲染平台圖標
   */
  const renderPlatformIcon = (type: PlatformType) => {
    return PlatformIcons[type] || PlatformIcons[PlatformType.OTHER];
  };
  
  /**
   * 渲染平台狀態
   */
  const renderPlatformStatus = (status: PlatformStatus) => {
    const { color, bgColor } = StatusColors[status] || StatusColors[PlatformStatus.INACTIVE];
    
    return (
      <Chip
        label={getPlatformStatusName(status)}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: color,
          fontWeight: 'medium',
          height: 24
        }}
      />
    );
  };
  
  /**
   * 渲染平台元數據
   */
  const renderPlatformMetadata = () => {
    switch (platform.type) {
      case PlatformType.LINE:
        return (
          <Typography variant="body2" color="text.secondary">
            {t('platforms.followers')}: {platform.metadata.followers || 0}
          </Typography>
        );
      case PlatformType.FACEBOOK:
        return (
          <Typography variant="body2" color="text.secondary">
            {t('platforms.followers')}: {platform.metadata.followers || 0}
          </Typography>
        );
      case PlatformType.INSTAGRAM:
        return (
          <Typography variant="body2" color="text.secondary">
            {t('platforms.followers')}: {platform.metadata.followers || 0}
          </Typography>
        );
      case PlatformType.WEBSITE:
        return (
          <Typography variant="body2" color="text.secondary">
            {t('platforms.visitors')}: {platform.metadata.visitors || 0}
          </Typography>
        );
      default:
        return null;
    }
  };
  
  /**
   * 渲染載入中狀態
   */
  const renderLoading = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2 }} />
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        {renderLoading()}
      </Card>
    );
  }
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: 'action.hover',
              mb: 2
            }}
          >
            {renderPlatformIcon(platform.type)}
          </Box>
          
          <Box>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleView}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('platforms.actions.view')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('platforms.actions.edit')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleSync}>
                <ListItemIcon>
                  <RefreshIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('platforms.actions.sync')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleTest}>
                <ListItemIcon>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('platforms.actions.test')}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDelete}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>
                  {t('platforms.actions.delete')}
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {platform.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {getPlatformTypeName(platform.type)}
        </Typography>
        
        {renderPlatformMetadata()}
        
        <Box sx={{ mt: 2 }}>
          {renderPlatformStatus(platform.status)}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {t('platforms.lastUpdated')}: {formatDate(platform.updatedAt)}
        </Typography>
      </CardContent>
      
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip title={platform.status === PlatformStatus.ACTIVE ? t('platforms.connected') : t('platforms.disconnected')}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {platform.status === PlatformStatus.ACTIVE ? (
              <LinkIcon fontSize="small" color="success" />
            ) : (
              <LinkOffIcon fontSize="small" color="action" />
            )}
          </Box>
        </Tooltip>
        
        <Button 
          size="small" 
          variant="outlined"
          onClick={handleView}
        >
          {t('platforms.actions.manage')}
        </Button>
      </Box>
    </Card>
  );
};

export default PlatformCard;