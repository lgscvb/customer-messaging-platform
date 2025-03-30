import * as React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  SelectChangeEvent
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Percent as PercentIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LineChart, { LineChartSeries } from '../charts/LineChart';
import PieChart, { PieChartDataItem } from '../charts/PieChart';
import BarChart, { BarChartSeries } from '../charts/BarChart';
import analyticsService from '../../services/analytics-service';
import { formatDate, formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { TimeRange, SalesConversionAnalytics } from '../../types/analytics';

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
 * 產品表格屬性
 */
interface ProductTableProps {
  products: Array<{
    productId: string;
    productName: string;
    count: number;
    totalAmount: number;
  }>;
  loading: boolean;
}

/**
 * 產品表格組件
 */
const ProductTable: React.FC<ProductTableProps> = ({ products, loading }) => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('analytics.topProducts')}
      </Typography>
      
      <TableContainer sx={{ flexGrow: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('analytics.productName')}</TableCell>
              <TableCell align="right">{t('analytics.salesCount')}</TableCell>
              <TableCell align="right">{t('analytics.salesAmount')}</TableCell>
              <TableCell align="right">{t('analytics.averagePrice')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              products
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell align="right">{formatNumber(product.count)}</TableCell>
                    <TableCell align="right">{formatCurrency(product.totalAmount)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(product.totalAmount / product.count)}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={products.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('common.rowsPerPage')}
      />
    </Paper>
  );
};

/**
 * 銷售分析組件
 */
const SalesAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('month');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // 數據狀態
  const [salesStats, setSalesStats] = React.useState<SalesConversionAnalytics | null>(null);
  const [salesTimeSeries, setSalesTimeSeries] = React.useState<LineChartSeries[]>([]);
  const [productDistribution, setProductDistribution] = React.useState<PieChartDataItem[]>([]);
  const [productBarChart, setProductBarChart] = React.useState<BarChartSeries[]>([]);
  
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
      // 獲取銷售轉化率分析數據
      const salesData = await analyticsService.getSalesStats({
        timeRange: {
          range: timeRange
        }
      });
      
      setSalesStats(salesData);
      
      // 處理銷售時間序列數據
      if (salesData.salesTrend) {
        const salesCountSeries: LineChartSeries = {
          name: t('analytics.salesCount'),
          data: salesData.salesTrend.map((item) => ({
            label: formatDate(new Date(item.date)),
            value: item.count
          })),
          color: '#FF9800'
        };
        
        const salesAmountSeries: LineChartSeries = {
          name: t('analytics.salesAmount'),
          data: salesData.salesTrend.map((item) => ({
            label: formatDate(new Date(item.date)),
            value: item.amount
          })),
          color: '#F44336'
        };
        
        setSalesTimeSeries([salesCountSeries, salesAmountSeries]);
      }
      
      // 處理產品分佈數據
      if (salesData.topProducts) {
        const pieData: PieChartDataItem[] = salesData.topProducts
          .slice(0, 5)
          .map((product) => ({
            label: product.productName,
            value: product.totalAmount
          }));
        
        setProductDistribution(pieData);
        
        // 處理產品柱狀圖數據
        const barSeries: BarChartSeries = {
          name: t('analytics.salesAmount'),
          data: salesData.topProducts
            .slice(0, 10)
            .map((product) => ({
              label: product.productName,
              value: product.totalAmount
            })),
          color: '#4CAF50'
        };
        
        setProductBarChart([barSeries]);
      }
      
    } catch (err) {
      console.error('加載銷售分析數據錯誤:', err);
      setError('加載銷售分析數據時發生錯誤。請稍後再試。');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加載和時間範圍變更時加載數據
  React.useEffect(() => {
    loadData();
  }, [timeRange]);
  
  // 模擬數據（實際應用中應從 API 獲取）
  const mockData = {
    conversionRate: 5.8,
    recommendationRate: 32.5,
    averagePurchaseAmount: 1250,
    conversionRateChange: 0.7,
    recommendationRateChange: 2.3,
    averagePurchaseAmountChange: -1.2
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('analytics.salesAnalytics')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('analytics.salesAnalyticsDescription')}
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
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('analytics.conversionRate')}
            value={`${salesStats?.conversionRate ? 
              Math.round(salesStats.conversionRate * 10) / 10 : 
              mockData.conversionRate}%`}
            icon={<ShoppingCartIcon />}
            change={mockData.conversionRateChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('analytics.recommendationRate')}
            value={`${salesStats?.recommendationRate ? 
              Math.round(salesStats.recommendationRate * 10) / 10 : 
              mockData.recommendationRate}%`}
            icon={<PercentIcon />}
            change={mockData.recommendationRateChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('analytics.averagePurchaseAmount')}
            value={salesStats?.averagePurchaseAmount ? 
              formatCurrency(salesStats.averagePurchaseAmount) : 
              formatCurrency(mockData.averagePurchaseAmount)}
            icon={<AttachMoneyIcon />}
            change={mockData.averagePurchaseAmountChange}
            changeText={t('analytics.comparedToPrevious')}
            loading={loading}
            color="primary"
          />
        </Grid>
      </Grid>
      
      {/* 圖表 - 第一行 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <LineChart
            title={t('analytics.salesTrend')}
            series={salesTimeSeries}
            height={400}
            loading={loading}
            error={error || undefined}
            yAxisLabel={t('analytics.amount')}
            xAxisLabel={t('analytics.date')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PieChart
            title={t('analytics.productDistribution')}
            data={productDistribution}
            height={400}
            loading={loading}
            error={error || undefined}
            donut={true}
          />
        </Grid>
      </Grid>
      
      {/* 圖表 - 第二行 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <BarChart
            title={t('analytics.topProductsByRevenue')}
            series={productBarChart}
            height={400}
            loading={loading}
            error={error || undefined}
            yAxisLabel={t('analytics.revenue')}
            horizontal={true}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProductTable 
            products={salesStats?.topProducts || []}
            loading={loading}
          />
        </Grid>
      </Grid>
      
      {/* 轉化漏斗說明 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          border: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('analytics.conversionFunnel')}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  mr: 1
                }} 
              />
              <Typography variant="body1">
                {t('analytics.totalConversations')}
              </Typography>
            </Box>
            <Typography variant="h4">
              {salesStats?.totalConversations ? 
                formatNumber(salesStats.totalConversations) : 
                formatNumber(1000)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: 'info.main',
                  mr: 1
                }} 
              />
              <Typography variant="body1">
                {t('analytics.conversationsWithRecommendations')}
              </Typography>
            </Box>
            <Typography variant="h4">
              {salesStats?.conversationsWithRecommendations ? 
                formatNumber(salesStats.conversationsWithRecommendations) : 
                formatNumber(325)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {salesStats?.recommendationRate ? 
                `${Math.round(salesStats.recommendationRate * 10) / 10}%` : 
                '32.5%'} {t('analytics.ofTotalConversations')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main',
                  mr: 1
                }} 
              />
              <Typography variant="body1">
                {t('analytics.conversationsWithPurchase')}
              </Typography>
            </Box>
            <Typography variant="h4">
              {salesStats?.conversationsWithPurchase ? 
                formatNumber(salesStats.conversationsWithPurchase) : 
                formatNumber(58)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {salesStats?.conversionRate ? 
                `${Math.round(salesStats.conversionRate * 10) / 10}%` : 
                '5.8%'} {t('analytics.ofTotalConversations')}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" gutterBottom>
            {t('analytics.conversionFunnelDescription')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('analytics.conversionFunnelTips')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesAnalytics;