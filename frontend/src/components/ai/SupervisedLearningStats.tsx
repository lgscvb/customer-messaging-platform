import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import supervisedLearningService, { LearningStats } from '../../services/supervisedLearningService';

/**
 * 監督式學習統計組件屬性接口
 */
interface SupervisedLearningStatsProps {
  refreshInterval?: number; // 刷新間隔（毫秒）
}

/**
 * 監督式學習統計組件
 * 顯示監督式學習的統計信息和歷史記錄
 */
const SupervisedLearningStats: React.FC<SupervisedLearningStatsProps> = ({
  refreshInterval = 60000, // 默認每分鐘刷新一次
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  /**
   * 獲取學習統計信息
   */
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supervisedLearningService.getLearningStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || t('supervisedLearning.errors.fetchStatsFailed'));
        addNotification({
          type: NotificationType.ERROR,
          title: t('supervisedLearning.errors.fetchStatsTitle'),
          message: response.message || t('supervisedLearning.errors.fetchStatsMessage'),
        });
      }
    } catch (error) {
      console.error('獲取學習統計信息錯誤:', error);
      setError(t('supervisedLearning.errors.fetchStatsFailed'));
      addNotification({
        type: NotificationType.ERROR,
        title: t('supervisedLearning.errors.fetchStatsTitle'),
        message: t('supervisedLearning.errors.fetchStatsMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 獲取學習歷史
   */
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      
      const response = await supervisedLearningService.getLearningHistory(
        historyPage + 1,
        historyLimit
      );
      
      if (response.success && response.data) {
        setHistoryItems(response.data.items);
        setHistoryTotal(response.data.total);
      } else {
        setHistoryError(response.message || t('supervisedLearning.errors.fetchHistoryFailed'));
        addNotification({
          type: NotificationType.ERROR,
          title: t('supervisedLearning.errors.fetchHistoryTitle'),
          message: response.message || t('supervisedLearning.errors.fetchHistoryMessage'),
        });
      }
    } catch (error) {
      console.error('獲取學習歷史錯誤:', error);
      setHistoryError(t('supervisedLearning.errors.fetchHistoryFailed'));
      addNotification({
        type: NotificationType.ERROR,
        title: t('supervisedLearning.errors.fetchHistoryTitle'),
        message: t('supervisedLearning.errors.fetchHistoryMessage'),
      });
    } finally {
      setHistoryLoading(false);
    }
  };
  
  /**
   * 刷新數據
   */
  const refreshData = () => {
    fetchStats();
    fetchHistory();
  };
  
  /**
   * 處理頁碼變更
   */
  const handleChangePage = (event: unknown, newPage: number) => {
    setHistoryPage(newPage);
  };
  
  /**
   * 處理每頁數量變更
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryLimit(parseInt(event.target.value, 10));
    setHistoryPage(0);
  };
  
  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };
  
  /**
   * 初始化和定時刷新
   */
  useEffect(() => {
    refreshData();
    
    // 設置定時刷新
    const intervalId = setInterval(refreshData, refreshInterval);
    
    // 清理定時器
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  /**
   * 頁碼或每頁數量變更時重新獲取歷史
   */
  useEffect(() => {
    fetchHistory();
  }, [historyPage, historyLimit]);
  
  /**
   * 渲染統計卡片
   */
  const renderStatCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    description?: string,
    color: string = 'primary.main'
  ) => {
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: `${color}20`,
              color: color,
              borderRadius: '50%',
              width: 40,
              height: 40,
              mr: 2
            }}>
              {icon}
            </Box>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>
          
          <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
            {value}
          </Typography>
          
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };
  
  /**
   * 渲染學習點標籤
   */
  const renderLearningPoints = (points: string[]) => {
    if (!points || points.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          {t('supervisedLearning.noLearningPoints')}
        </Typography>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {points.map((point, index) => (
          <Chip
            key={index}
            label={point}
            size="small"
            sx={{ 
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontSize: '0.75rem'
            }}
          />
        ))}
      </Box>
    );
  };
  
  /**
   * 渲染相似度進度條
   */
  const renderSimilarityProgress = (similarity: number) => {
    let color = 'success.main';
    
    if (similarity < 0.5) {
      color = 'error.main';
    } else if (similarity < 0.7) {
      color = 'warning.main';
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={similarity * 100}
            sx={{ 
              height: 8, 
              borderRadius: 1,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: color
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">
            {Math.round(similarity * 100)}%
          </Typography>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          {t('supervisedLearning.statsTitle')}
        </Typography>
        
        <Tooltip title={t('supervisedLearning.refresh')}>
          <IconButton onClick={refreshData} disabled={loading || historyLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              {renderStatCard(
                t('supervisedLearning.totalSamples'),
                stats.totalSamples.toString(),
                <AiIcon />,
                t('supervisedLearning.totalSamplesDesc'),
                'primary.main'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderStatCard(
                t('supervisedLearning.successfulSamples'),
                stats.successfulSamples.toString(),
                <LightbulbIcon />,
                t('supervisedLearning.successfulSamplesDesc'),
                'success.main'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderStatCard(
                t('supervisedLearning.averageSimilarity'),
                `${Math.round(stats.averageSimilarity * 100)}%`,
                <InfoIcon />,
                t('supervisedLearning.averageSimilarityDesc'),
                'info.main'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderStatCard(
                t('supervisedLearning.knowledgeItemsGenerated'),
                stats.knowledgeItemsGenerated.toString(),
                <SchoolIcon />,
                t('supervisedLearning.knowledgeItemsGeneratedDesc'),
                'secondary.main'
              )}
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('supervisedLearning.topLearningPoints')}
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            {stats.topLearningPoints.length > 0 ? (
              <Grid container spacing={1}>
                {stats.topLearningPoints.map((point, index) => (
                  <Grid item key={index}>
                    <Chip
                      label={point}
                      sx={{ 
                        bgcolor: 'primary.light',
                        color: 'primary.dark'
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                {t('supervisedLearning.noTopLearningPoints')}
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('supervisedLearning.noStatsAvailable')}
        </Alert>
      )}
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h5" component="h2" fontWeight="bold">
          {t('supervisedLearning.historyTitle')}
        </Typography>
      </Box>
      
      {historyError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {historyError}
        </Alert>
      )}
      
      {historyLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : historyItems.length > 0 ? (
        <Paper variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('supervisedLearning.customerId')}</TableCell>
                  <TableCell>{t('supervisedLearning.similarity')}</TableCell>
                  <TableCell>{t('supervisedLearning.learningPoints')}</TableCell>
                  <TableCell>{t('supervisedLearning.createdAt')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.customerId}</TableCell>
                    <TableCell>{renderSimilarityProgress(item.similarity)}</TableCell>
                    <TableCell>{renderLearningPoints(item.learningPoints)}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={historyTotal}
            page={historyPage}
            onPageChange={handleChangePage}
            rowsPerPage={historyLimit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t('common.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} ${t('common.of')} ${count}`
            }
          />
        </Paper>
      ) : (
        <Alert severity="info">
          {t('supervisedLearning.noHistoryAvailable')}
        </Alert>
      )}
    </Box>
  );
};

export default SupervisedLearningStats;