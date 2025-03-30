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
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Message as MessageIcon, 
  Person as PersonIcon,
  Reply as ReplyIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import StatCard from './StatCard';
import LineChart from '../charts/LineChart';
import { LineChartSeries } from '../charts/LineChart';
import dashboardService, { CustomerInteractionData, TimeRange } from '../../services/dashboardService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 客戶互動部分屬性接口
 */
interface CustomerInteractionSectionProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

/**
 * 客戶互動部分組件
 */
const CustomerInteractionSection: React.FC<CustomerInteractionSectionProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [data, setData] = useState<CustomerInteractionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * 獲取客戶互動數據
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockData = dashboardService.getMockCustomerInteractionData();
          setData(mockData);
          setLoading(false);
          return;
        }
        
        const result = await dashboardService.getCustomerInteractionData(timeRange);
        setData(result);
      } catch (error) {
        console.error('獲取客戶互動數據錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('dashboard.errors.fetchDataTitle'),
          message: t('dashboard.errors.fetchDataMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, addNotification, t]);
  
  /**
   * 處理時間範圍變更
   */
  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    onTimeRangeChange(event.target.value as TimeRange);
  };
  
  /**
   * 準備訊息趨勢數據
   */
  const prepareMessagesTrendData = (): LineChartSeries[] => {
    if (!data) return [];
    
    return [{
      name: t('dashboard.messages'),
      data: data.messagesTrend.labels.map((label: string, index: number) => ({
        label,
        value: data.messagesTrend.datasets[0].data[index]
      })),
      color: data.messagesTrend.datasets[0].color || '#2196f3',
      fill: true
    }];
  };
  
  /**
   * 準備回覆趨勢數據
   */
  const prepareRepliesTrendData = (): LineChartSeries[] => {
    if (!data) return [];
    
    return [{
      name: t('dashboard.replies'),
      data: data.repliesTrend.labels.map((label: string, index: number) => ({
        label,
        value: data.repliesTrend.datasets[0].data[index]
      })),
      color: data.repliesTrend.datasets[0].color || '#4caf50',
      fill: true
    }];
  };
  
  /**
   * 準備回覆時間趨勢數據
   */
  const prepareResponseTimeTrendData = (): LineChartSeries[] => {
    if (!data) return [];
    
    return [{
      name: t('dashboard.responseTime'),
      data: data.responseTimeTrend.labels.map((label: string, index: number) => ({
        label,
        value: data.responseTimeTrend.datasets[0].data[index]
      })),
      color: data.responseTimeTrend.datasets[0].color || '#ff9800',
      fill: true
    }];
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
   * 獲取平台圖標
   */
  const getPlatformIcon = (platform: string): React.ReactNode => {
    // 這裡可以根據平台返回不同的圖標
    // 但由於我們沒有特定的平台圖標，所以暫時返回 null
    return null;
  };
  
  /**
   * 計算訊息總數
   */
  const calculateTotalMessages = (): number => {
    if (!data) return 0;
    
    return data.messagesTrend.datasets[0].data.reduce((sum: number, value: number) => sum + value, 0);
  };
  
  /**
   * 計算回覆總數
   */
  const calculateTotalReplies = (): number => {
    if (!data) return 0;
    
    return data.repliesTrend.datasets[0].data.reduce((sum: number, value: number) => sum + value, 0);
  };
  
  /**
   * 計算平均回覆時間
   */
  const calculateAverageResponseTime = (): number => {
    if (!data) return 0;
    
    const values = data.responseTimeTrend.datasets[0].data;
    return values.reduce((sum: number, value: number) => sum + value, 0) / values.length;
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
  
  /**
   * 渲染頂部客戶列表
   */
  const renderTopCustomers = () => {
    if (!data || !data.topCustomers || data.topCustomers.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.noData')}
          </Typography>
        </Box>
      );
    }
    
    return (
      <List disablePadding>
        {data.topCustomers.map((customer: any, index: number) => (
          <ListItem 
            key={customer.id}
            divider={index < data.topCustomers.length - 1}
            sx={{ px: 0 }}
          >
            <ListItemAvatar>
              <Avatar 
                src={customer.avatar} 
                alt={customer.name}
                sx={{ 
                  bgcolor: getPlatformColor(customer.platform) + '20',
                  color: getPlatformColor(customer.platform)
                }}
              >
                {customer.name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">
                    {customer.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={t(`dashboard.platforms.${customer.platform}`)}
                    sx={{
                      ml: 1,
                      bgcolor: getPlatformColor(customer.platform) + '20',
                      color: getPlatformColor(customer.platform),
                      fontWeight: 'medium',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.messageCount')}: {customer.messageCount}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('dashboard.customerInteraction')}
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
            value={calculateTotalMessages()}
            icon={<MessageIcon />}
            color="#2196f3"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.totalReplies')}
            value={calculateTotalReplies()}
            icon={<ReplyIcon />}
            color="#4caf50"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.averageResponseTime')}
            value={formatResponseTime(calculateAverageResponseTime())}
            icon={<TimerIcon />}
            color="#ff9800"
            loading={loading}
          />
        </Grid>
        
        {/* 圖表 */}
        <Grid item xs={12} md={6}>
          <LineChart
            title={t('dashboard.messagesTrend')}
            series={prepareMessagesTrendData()}
            loading={loading}
            height={300}
            yAxisLabel={t('dashboard.messageCount')}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LineChart
            title={t('dashboard.repliesTrend')}
            series={prepareRepliesTrendData()}
            loading={loading}
            height={300}
            yAxisLabel={t('dashboard.replyCount')}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LineChart
            title={t('dashboard.responseTimeTrend')}
            series={prepareResponseTimeTrendData()}
            loading={loading}
            height={300}
            yAxisLabel={t('dashboard.minutes')}
          />
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
              {t('dashboard.topCustomers')}
            </Typography>
            
            <Box sx={{ height: 300, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                renderTopCustomers()
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerInteractionSection;