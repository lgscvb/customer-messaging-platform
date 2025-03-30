import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  AccountTree as AccountTreeIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import knowledgeService from '../../services/knowledgeService';
import KnowledgeExtraction from '../../components/knowledge/KnowledgeExtraction';
import KnowledgeOrganization from '../../components/knowledge/KnowledgeOrganization';
import KnowledgeGraph from '../../components/knowledge/KnowledgeGraph';
import KnowledgeAnalytics from '../../components/knowledge/KnowledgeAnalytics';

// 定義標籤面板接口
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// 標籤面板組件
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// 獲取標籤屬性
const a11yProps = (index: number) => {
  return {
    id: `knowledge-tab-${index}`,
    'aria-controls': `knowledge-tabpanel-${index}`,
  };
};

/**
 * 知識管理頁面
 * 整合知識提取、知識組織和知識圖譜功能
 */
const KnowledgeManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [selectedKnowledgeItemId, setSelectedKnowledgeItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // 獲取知識項目列表
  const fetchKnowledgeItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 獲取知識項目列表
      const items = await knowledgeService.searchKnowledgeItems({
        limit: 100,
      });
      
      setKnowledgeItems(items);
      
      // 如果有知識項目，選擇第一個
      if (items.length > 0) {
        setSelectedKnowledgeItemId(items[0].id);
      }
      
      // 獲取統計信息
      const statistics = await knowledgeService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('獲取知識項目列表錯誤:', error);
      
      setError(error.message || '獲取知識項目列表時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.management.errorTitle'),
        message: t('knowledge.management.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化時獲取知識項目列表
  useEffect(() => {
    fetchKnowledgeItems();
  }, []);
  
  // 處理標籤變更
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 處理刷新
  const handleRefresh = () => {
    fetchKnowledgeItems();
  };
  
  // 處理知識提取完成
  const handleExtractionComplete = () => {
    // 刷新知識項目列表
    fetchKnowledgeItems();
    
    // 切換到知識組織標籤
    setTabValue(1);
  };
  
  // 處理知識組織完成
  const handleOrganizationComplete = () => {
    // 刷新知識項目列表
    fetchKnowledgeItems();
    
    // 切換到知識圖譜標籤
    setTabValue(2);
  };
  
  // 渲染統計信息
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.totalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('knowledge.management.totalItems')}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.publishedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('knowledge.management.publishedItems')}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.unpublishedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('knowledge.management.unpublishedItems')}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.categories.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('knowledge.management.categories')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 麵包屑導航 */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('common.dashboard')}
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('knowledge.management.title')}
        </Typography>
      </Breadcrumbs>
      
      {/* 頁面標題 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('knowledge.management.title')}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {t('common.refresh')}
        </Button>
      </Box>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>{t('knowledge.management.errorTitle')}</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* 統計信息 */}
      {renderStats()}
      
      {/* 標籤頁 */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="knowledge management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<SchoolIcon />}
            label={t('knowledge.extraction.title')}
            {...a11yProps(0)}
          />
          <Tab
            icon={<CategoryIcon />}
            label={t('knowledge.organization.title')}
            {...a11yProps(1)}
          />
          <Tab
            icon={<AccountTreeIcon />}
            label={t('knowledge.graph.title')}
            {...a11yProps(2)}
          />
          <Tab
            icon={<AnalyticsIcon />}
            label={t('knowledge.analytics.title')}
            {...a11yProps(3)}
          />
        </Tabs>
        
        <Divider />
        
        {/* 知識提取標籤面板 */}
        <TabPanel value={tabValue} index={0}>
          <KnowledgeExtraction
            onComplete={handleExtractionComplete}
          />
        </TabPanel>
        
        {/* 知識組織標籤面板 */}
        <TabPanel value={tabValue} index={1}>
          {selectedKnowledgeItemId ? (
            <KnowledgeOrganization
              knowledgeItemId={selectedKnowledgeItemId}
              onComplete={handleOrganizationComplete}
            />
          ) : (
            <Alert severity="info">
              {t('knowledge.organization.noItemSelected')}
            </Alert>
          )}
        </TabPanel>
        
        {/* 知識圖譜標籤面板 */}
        <TabPanel value={tabValue} index={2}>
          <KnowledgeGraph
            width={1000}
            height={600}
          />
        </TabPanel>
        
        {/* 知識分析標籤面板 */}
        <TabPanel value={tabValue} index={3}>
          <KnowledgeAnalytics />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default KnowledgeManagementPage;