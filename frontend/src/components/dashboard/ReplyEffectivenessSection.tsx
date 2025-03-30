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
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  SmartToy as AiIcon, 
  TrendingUp as TrendingUpIcon, 
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import StatCard from './StatCard';
import LineChart from '../charts/LineChart';
import { LineChartSeries } from '../charts/LineChart';
import PieChart from '../charts/PieChart';
import dashboardService, { ReplyEffectivenessData, TimeRange } from '../../services/dashboardService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';

/**
 * 回覆效果評估部分屬性接口
 */
interface ReplyEffectivenessSectionProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

/**
 * 回覆效果評估部分組件
 */
const ReplyEffectivenessSection: React.FC<ReplyEffectivenessSectionProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [data, setData] = useState<ReplyEffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * 獲取回覆效果評估數據
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 在開發環境中使用模擬數據
        if (process.env.NODE_ENV === 'development') {
          const mockData = dashboardService.getMockReplyEffectivenessData();
          setData(mockData);
          setLoading(false);
          return;
        }
        
        const result = await dashboardService.getReplyEffectivenessData(timeRange);
        setData(result);
      } catch (error) {
        console.error('獲取回覆效果評估數據錯誤:', error);
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
   * 準備 AI 回覆百分比趨勢數據
   */
  const prepareAiRepliesTrendData = (): LineChartSeries[] => {
    if (!data) return [];
    
    return [{
      name: t('dashboard.aiRepliesPercentage'),
      data: data.aiRepliesTrend.labels.map((label, index) => ({
        label,
        value: data.aiRepliesTrend.datasets[0].data[index]
      })),
      color: data.aiRepliesTrend.datasets[0].color || '#8c6eff',
      fill: true
    }];
  };
  
  /**
   * 準備 AI 信心分佈數據
   */
  const prepareAiConfidenceData = () => {
    if (!data) return [];
    
    return data.aiConfidenceDistribution.map(item => ({
      name: item.label,
      value: item.value,
      color: item.color
    }));
  };
  
  /**
   * 獲取信心級別顏色
   */
  const getConfidenceLevelColor = (level: string): string => {
    switch (level) {
      case '高信心 (>80%)':
        return '#4caf50';
      case '中信心 (50-80%)':
        return '#ff9800';
      case '低信心 (<50%)':
        return '#f44336';
      default:
        return '#888888';
    }
  };
  
  /**
   * 獲取信心級別圖標
   */
  const getConfidenceLevelIcon = (level: string): React.ReactNode => {
    switch (level) {
      case '高信心 (>80%)':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case '中信心 (50-80%)':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case '低信心 (<50%)':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      default:
        return null;
    }
  };
  
  /**
   * 渲染頂部類別列表
   */
  const renderTopCategories = () => {
    if (!data || !data.topCategories || data.topCategories.length === 0) {
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
        {data.topCategories.map((category, index) => (
          <ListItem 
            key={category.category}
            divider={index < data.topCategories.length - 1}
            sx={{ px: 0 }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {category.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.count} ({category.percentage}%)
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ width: '100%' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={category.percentage} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#8c6eff'
                      }
                    }} 
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };
  
  /**
   * 渲染 AI 信心分佈
   */
  const renderAiConfidenceDistribution = () => {
    if (!data || !data.aiConfidenceDistribution || data.aiConfidenceDistribution.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.noData')}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <PieChart data={prepareAiConfidenceData()} />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <List disablePadding>
            {data.aiConfidenceDistribution.map((item) => (
              <ListItem 
                key={item.label}
                sx={{ px: 0 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {item.label}
                  </Typography>
                  <Chip 
                    label={`${item.value}%`} 
                    size="small"
                    sx={{ 
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      fontWeight: 'medium'
                    }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('dashboard.replyEffectiveness')}
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
            title={t('dashboard.aiRepliesPercentage')}
            value={`${data?.aiRepliesPercentage || 0}%`}
            icon={<AiIcon />}
            color="#8c6eff"
            loading={loading}
            tooltip={t('dashboard.aiRepliesPercentageInfo')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.highConfidenceReplies')}
            value={data ? `${data.aiConfidenceDistribution[0].value}%` : '0%'}
            icon={<CheckCircleIcon />}
            color="#4caf50"
            loading={loading}
            tooltip={t('dashboard.highConfidenceRepliesInfo')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.topCategory')}
            value={data?.topCategories[0]?.category || '-'}
            subtitle={data ? `${data.topCategories[0]?.percentage}% ${t('dashboard.ofTotalReplies')}` : ''}
            icon={<CategoryIcon />}
            color="#ff9800"
            loading={loading}
          />
        </Grid>
        
        {/* 圖表 */}
        <Grid item xs={12} md={6}>
          <LineChart
            title={t('dashboard.aiRepliesTrend')}
            series={prepareAiRepliesTrendData()}
            loading={loading}
            height={300}
            yAxisLabel={t('dashboard.percentage')}
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
              {t('dashboard.aiConfidenceDistribution')}
            </Typography>
            
            <Box sx={{ height: 300, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                renderAiConfidenceDistribution()
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
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
              {t('dashboard.topCategories')}
            </Typography>
            
            <Box sx={{ height: 300, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                renderTopCategories()
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReplyEffectivenessSection;