import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Grid, 
  Box, 
  Typography, 
  Paper, 
  FormControl, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { 
  Message as MessageIcon, 
  Person as PersonIcon, 
  Reply as ReplyIcon, 
  SmartToy as AiIcon, 
  Forum as ConversationIcon, 
  Timer as TimerIcon 
} from '@mui/icons-material';
import StatCard from './StatCard';
import { PieChart } from '../charts/PieChart';
import { BarChart } from '../charts/BarChart';
import dashboardService, { OverviewStats, TimeRange } from '../../services/dashboardService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 概覽部分屬性接口
 */
interface OverviewSectionProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

/**
 * 概覽部分組件
 */
const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * 獲取概覽統計
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockStats = dashboardService.getMockOverviewStats();
          setStats(mockStats);
          setLoading(false);
          return;
        }
        
        const data = await dashboardService.getOverviewStats(timeRange);
        setStats(data);
      } catch (error) {
        console.error('獲取概覽統計錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('dashboard.errors.fetchStatsTitle'),
          message: t('dashboard.errors.fetchStatsMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [timeRange, addNotification, t]);
  
  /**
   * 處理時間範圍變更
   */
  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    onTimeRangeChange(event.target.value as TimeRange);
  };
  
  /**
   * 準備平台分佈數據
   */
  const preparePlatformData = () => {
    if (!stats) return [];
    
    const platformData = Object.entries(stats.messagesByPlatform).map(([platform, count]) => ({
      name: t(`dashboard.platforms.${platform}`),
      value: count,
      color: getPlatformColor(platform)
    }));
    
    return platformData;
  };
  
  /**
   * 準備狀態分佈數據
   */
  const prepareStatusData = () => {
    if (!stats) return [];
    
    const statusData = Object.entries(stats.messagesByStatus).map(([status, count]) => ({
      name: t(`dashboard.status.${status}`),
      value: count,
      color: getStatusColor(status)
    }));
    
    return statusData;
  };
  
  /**
   * 獲取平台顏色
   */
  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'line':
        return '#06C755';
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E4405F';
      case 'website':
        return '#FF6B00';
      default:
        return '#888888';
    }
  };
  
  /**
   * 獲取狀態顏色
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new':
        return '#FF5722';
      case 'pending':
        return '#FFC107';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#9E9E9E';
      default:
        return '#888888';
    }
  };
  
  /**
   * 格式化回覆時間
   */
  const formatResponseTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} ${t('dashboard.seconds')}`;
    }
    
    return `${minutes.toFixed(1)} ${t('dashboard.minutes')}`;
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('dashboard.overview')}
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            displayEmpty
          >
            <MenuItem value="today">{t('dashboard.timeRanges.today')}</MenuItem>
            <MenuItem value="yesterday">{t('dashboard.timeRanges.yesterday')}</MenuItem>
            <MenuItem value="week">{t('dashboard.timeRanges.week')}</MenuItem>
            <MenuItem value="month">{t('dashboard.timeRanges.month')}</MenuItem>
            <MenuItem value="year">{t('dashboard.timeRanges.year')}</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Grid container spacing={3}>
        {/* 關鍵指標 */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.totalMessages')}
            value={stats?.totalMessages || 0}
            icon={<MessageIcon />}
            color="#2196f3"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.totalCustomers')}
            value={stats?.totalCustomers || 0}
            icon={<PersonIcon />}
            color="#ff9800"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.totalReplies')}
            value={stats?.totalReplies || 0}
            icon={<ReplyIcon />}
            color="#4caf50"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.aiReplies')}
            value={stats ? `${Math.round((stats.totalAiReplies / stats.totalReplies) * 100)}%` : '0%'}
            subtitle={t('dashboard.ofTotalReplies')}
            icon={<AiIcon />}
            color="#8c6eff"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.activeConversations')}
            value={stats?.activeConversations || 0}
            icon={<ConversationIcon />}
            color="#e91e63"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.averageResponseTime')}
            value={stats ? formatResponseTime(stats.averageResponseTime) : '0 min'}
            icon={<TimerIcon />}
            color="#607d8b"
            loading={loading}
          />
        </Grid>
        
        {/* 圖表 */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              {t('dashboard.messagesByPlatform')}
            </Typography>
            
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {loading ? (
                <Typography color="text.secondary">
                  {t('dashboard.loading')}
                </Typography>
              ) : (
                <PieChart data={preparePlatformData()} />
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              {t('dashboard.messagesByStatus')}
            </Typography>
            
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {loading ? (
                <Typography color="text.secondary">
                  {t('dashboard.loading')}
                </Typography>
              ) : (
                <BarChart 
                  data={prepareStatusData()} 
                  horizontal={true}
                  showValues={true}
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewSection;