import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import knowledgeEnhancementService, { KnowledgeStructureAnalysis } from '../../services/knowledgeEnhancementService';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';

/**
 * 知識分析組件
 * 用於顯示知識庫的分析數據
 */
const KnowledgeAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<KnowledgeStructureAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 獲取知識庫分析數據
  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 獲取知識庫分析數據
      const data = await knowledgeEnhancementService.analyzeKnowledgeStructure();
      
      setAnalysis(data);
      
      // 顯示通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('knowledge.analytics.successTitle'),
        message: t('knowledge.analytics.successMessage'),
      });
    } catch (error) {
      console.error('獲取知識庫分析數據錯誤:', error);
      
      setError(error.message || '獲取知識庫分析數據時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.analytics.errorTitle'),
        message: t('knowledge.analytics.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化時獲取知識庫分析數據
  useEffect(() => {
    fetchAnalysis();
  }, []);
  
  // 處理刷新
  const handleRefresh = () => {
    fetchAnalysis();
  };
  
  // 渲染分類分析
  const renderCategoriesAnalysis = () => {
    if (!analysis) return null;
    
    const { categoriesAnalysis } = analysis;
    
    // 準備圓餅圖數據
    const pieData = categoriesAnalysis.categoriesDistribution
      ? Object.entries(categoriesAnalysis.categoriesDistribution).map(([name, count]) => ({
          name,
          value: count,
        }))
      : [];
    
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {t('knowledge.analytics.categoriesAnalysis')}
              </Typography>
            </Box>
          }
          subheader={t('knowledge.analytics.totalCategories', { count: categoriesAnalysis.totalCategories })}
        />
        
        <Divider />
        
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <PieChart
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  colors={['#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39']}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {t('knowledge.analytics.suggestedNewCategories')}
              </Typography>
              
              {categoriesAnalysis.suggestedNewCategories.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('knowledge.analytics.categoryName')}</TableCell>
                        <TableCell>{t('knowledge.analytics.description')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoriesAnalysis.suggestedNewCategories.map((category, index) => (
                        <TableRow key={index}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  {t('knowledge.analytics.noSuggestedCategories')}
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                {t('knowledge.analytics.suggestedMerges')}
              </Typography>
              
              {categoriesAnalysis.suggestedMerges.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('knowledge.analytics.categories')}</TableCell>
                        <TableCell>{t('knowledge.analytics.newCategory')}</TableCell>
                        <TableCell>{t('knowledge.analytics.reason')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoriesAnalysis.suggestedMerges.map((merge, index) => (
                        <TableRow key={index}>
                          <TableCell>{merge.categories.join(', ')}</TableCell>
                          <TableCell>{merge.newCategory}</TableCell>
                          <TableCell>{merge.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  {t('knowledge.analytics.noSuggestedMerges')}
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染標籤分析
  const renderTagsAnalysis = () => {
    if (!analysis) return null;
    
    const { tagsAnalysis } = analysis;
    
    // 準備條形圖數據
    const barData = tagsAnalysis.topTags.map(tag => ({
      name: tag.name,
      value: tag.count,
    }));
    
    return (
      <Card variant="outlined" sx={{ height: '100%', mt: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {t('knowledge.analytics.tagsAnalysis')}
              </Typography>
            </Box>
          }
          subheader={t('knowledge.analytics.totalTags', { count: tagsAnalysis.totalTags })}
        />
        
        <Divider />
        
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <BarChart
                  data={barData}
                  xAxisDataKey="name"
                  bars={[
                    { dataKey: 'value', fill: '#3f51b5', name: t('knowledge.analytics.count') },
                  ]}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {t('knowledge.analytics.suggestedNewTags')}
              </Typography>
              
              {tagsAnalysis.suggestedNewTags.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('knowledge.analytics.tagName')}</TableCell>
                        <TableCell>{t('knowledge.analytics.description')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tagsAnalysis.suggestedNewTags.map((tag, index) => (
                        <TableRow key={index}>
                          <TableCell>{tag.name}</TableCell>
                          <TableCell>{tag.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  {t('knowledge.analytics.noSuggestedTags')}
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                {t('knowledge.analytics.unusedTags')}
              </Typography>
              
              {tagsAnalysis.unusedTags.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tagsAnalysis.unusedTags.map((tag, index) => (
                    <Tooltip key={index} title={t('knowledge.analytics.unusedTagTooltip')}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 'warning.light',
                          color: 'warning.contrastText',
                          fontSize: '0.75rem',
                        }}
                      >
                        {tag}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  {t('knowledge.analytics.noUnusedTags')}
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染關聯分析
  const renderRelationsAnalysis = () => {
    if (!analysis) return null;
    
    const { relationsAnalysis } = analysis;
    
    // 準備圓餅圖數據
    const pieData = relationsAnalysis.relationTypesDistribution
      ? Object.entries(relationsAnalysis.relationTypesDistribution).map(([name, count]) => ({
          name: t(`knowledge.organization.relationType.${name}`),
          value: count,
        }))
      : [];
    
    return (
      <Card variant="outlined" sx={{ height: '100%', mt: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {t('knowledge.analytics.relationsAnalysis')}
              </Typography>
            </Box>
          }
          subheader={t('knowledge.analytics.totalRelations', { count: relationsAnalysis.totalRelations })}
        />
        
        <Divider />
        
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <PieChart
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  colors={['#3f51b5', '#f44336', '#4caf50', '#ff9800', '#9c27b0']}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {t('knowledge.analytics.highlyConnectedItems')}
              </Typography>
              
              {relationsAnalysis.highlyConnectedItems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('knowledge.analytics.itemTitle')}</TableCell>
                        <TableCell align="right">{t('knowledge.analytics.connectionsCount')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relationsAnalysis.highlyConnectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.title}</TableCell>
                          <TableCell align="right">{item.connectionsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  {t('knowledge.analytics.noHighlyConnectedItems')}
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                {t('knowledge.analytics.isolatedItems')}
              </Typography>
              
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body1">
                  {t('knowledge.analytics.isolatedItemsCount')}
                </Typography>
                
                <Typography variant="h5" color={relationsAnalysis.isolatedItems > 0 ? 'warning.main' : 'success.main'}>
                  {relationsAnalysis.isolatedItems}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      {/* 頁面標題 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('knowledge.analytics.title')}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {t('common.refresh')}
        </Button>
      </Box>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>{t('knowledge.analytics.errorTitle')}</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* 加載中 */}
      {loading && !analysis && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* 分析內容 */}
      {analysis && (
        <>
          {renderCategoriesAnalysis()}
          {renderTagsAnalysis()}
          {renderRelationsAnalysis()}
        </>
      )}
    </Box>
  );
};

export default KnowledgeAnalytics;