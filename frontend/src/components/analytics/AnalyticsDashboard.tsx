import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  SmartToy as SmartToyIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LineChart, { LineChartSeries } from '../charts/LineChart';
import PieChart, { PieChartDataItem } from '../charts/PieChart';
import analyticsService from '../../services/analytics-service';
import { formatDate } from '../../lib/utils';

/**
 * 時間範圍類型
 */
type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * 統計卡片屬性
 */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  changeText?: string;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * 統計卡片組件
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changeText,
  loading = false,
  color = 'primary'
}) => {
  // 確定變化圖標和顏色
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const changeIcon = isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
  const changeColor = isPositive ? 'success.main' : 'error.main';
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
            </Typography>
            
            {(change !== undefined || changeText) && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {change !== undefined && (
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: changeColor,
                      mr: 1
                    }}
                  >
                    {changeIcon}
                    <Typography 
                      variant="body2" 
                      component="span" 
                      sx={{ ml: 0.5, color: changeColor }}
                    >
                      {Math.abs(change)}%
                    </Typography>
                  </Box>
                )}
                
                {changeText && (
                  <Typography variant="caption" color="text.secondary">
                    {changeText}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 分析儀表板組件
 */
const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 數據狀態
  const [messageStats, setMessageStats] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [aiStats, setAIStats] = useState<any>(null);
  const [platformDistribution, setPlatformDistribution] = useState<PieChartDataItem[]>([]);
  const [messageTimeSeries, setMessageTimeSeries] = useState<LineChartSeries[]>([]);
  
  // 處理時間範圍變更
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as TimeRange);
  };
  
  // 獲取時間範圍文本
  const getTimeRangeText = (): string => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        return `${formatDate(startDate)} - ${formatDate(now)}`;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        return `${formatDate(startDate)} - ${formatDate(now)}`;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        return `${formatDate(startDate)} - ${formatDate(now)}`;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        return `${formatDate(startDate)} - ${formatDate(now)}`;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        return `${formatDate(startDate)} - ${formatDate(now)}`;
      default:
        return '';
    }
  };
  
  // 加載數據
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 創建時間範圍參數
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      }
      
      // 創建過濾器
      const filter = {
        timeRange: {
          range: timeRange,
          startDate,
          endDate: now
        }
      };
      
      // 並行獲取數據
      const [messageStatsData, customerStatsData, aiStatsData] = await Promise.all([
        analyticsService.getMessageStats(filter),
        analyticsService.getCustomerStats(filter),
        analyticsService.getAIStats(filter)
      ]);
      
      // 更新狀態
      setMessageStats(messageStatsData);
      setCustomerStats(customerStatsData);
      setAIStats(aiStatsData);
      
      // 處理平台分佈數據
      const platformData: PieChartDataItem[] = Object.entries(messageStatsData.byPlatform).map(
        ([platform, count]) => ({
          label: platform,
          value: count as number
        })
      );
      setPlatformDistribution(platformData);
      
      // 處理消息時間序列數據
      const inboundSeries: LineChartSeries = {
        name: t('analytics.inboundMessages'),
        data: messageStatsData.byDay ? messageStatsData.byDay.map((value: number, index: number) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          return {
            label: formatDate(date),
            value
          };
        }) : [],
        color: '#4CAF50'
      };
      
      const outboundSeries: LineChartSeries = {
        name: t('analytics.outboundMessages'),
        data: messageStatsData.byDay ? messageStatsData.byDay.map((value: number, index: number) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          return {
            label: formatDate(date),
            value: Math.floor(value * 0.8) // 模擬數據
          };
        }) : [],
        color: '#2196F3'
      };
      
      setMessageTimeSeries([inboundSeries, outboundSeries]);
      
    } catch (err) {
      console.error('加載分析數據錯誤:', err);
      setError('加載分析數據時發生錯誤。請稍後再試。');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加載和時間範圍變更時加載數據
  useEffect(() => {
    loadData();
  }, [timeRange]);
  
  // 模擬數據（實際應用中應從 API 獲取）
  const mockData = {
    totalMessages: 1248,
    totalCustomers: 356,
    activeCustomers: 189,
    aiAccuracy: 87,
    messageChange: 12.5,
    customerChange: 8.3,
    activeCustomerChange: 15.2,
    aiAccuracyChange: 3.7
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('analytics.dashboard')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('analytics.dashboardDescription')}
        </Typography>
      </Box>
      
      {/* 過濾器 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="subtitle1">
            {getTimeRangeText()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">{t('analytics.timeRange')}</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range-select"
              value={timeRange}
              label={t('analytics.timeRange')}
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="day">{t('analytics.day')}</MenuItem>
              <MenuItem value="week">{t('analytics.week')}</MenuItem>
              <MenuItem value="month">{t('analytics.month')}</MenuItem>
              <MenuItem value="quarter">{t('analytics.quarter')}</MenuItem>
              <MenuItem value="year">{t('analytics.year')}</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={loadData}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t('common.refresh')}
          </Button>
        </Box>
      </Paper>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <AlertTitle>{t('common.error')}</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('analytics.totalMessages')}
            value={messageStats?.total || mockData.totalMessages}
            icon={<MessageIcon />}
            change={mockData.messageChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('analytics.totalCustomers')}
            value={customerStats?.total || mockData.totalCustomers}
            icon={<PersonIcon />}
            change={mockData.customerChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('analytics.activeCustomers')}
            value={customerStats?.active || mockData.activeCustomers}
            icon={<PersonIcon />}
            change={mockData.activeCustomerChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('analytics.aiAccuracy')}
            value={`${aiStats?.confidenceDistribution ? 
              Math.round(aiStats.confidenceDistribution.reduce((a: number, b: number) => a + b, 0) / 
              aiStats.confidenceDistribution.length) : 
              mockData.aiAccuracy}%`}
            icon={<SmartToyIcon />}
            change={mockData.aiAccuracyChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="info"
          />
        </Grid>
      </Grid>
      
      {/* 圖表 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <LineChart
            title={t('analytics.messageActivity')}
            series={messageTimeSeries}
            height={400}
            loading={loading}
            error={error || undefined}
            yAxisLabel={t('analytics.messageCount')}
            xAxisLabel={t('analytics.date')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PieChart
            title={t('analytics.platformDistribution')}
            data={platformDistribution}
            height={400}
            loading={loading}
            error={error || undefined}
            donut={true}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;