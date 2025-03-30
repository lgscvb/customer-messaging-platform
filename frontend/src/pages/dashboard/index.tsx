import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Paper, 
  Typography, 
  Divider,
  Button,
  Grid
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import OverviewSection from '../../components/dashboard/OverviewSection';
import { TimeRange } from '../../services/dashboardService';

/**
 * 儀表板頁面
 */
const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  
  // 狀態
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [refreshKey, setRefreshKey] = useState(0);
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 處理時間範圍變更
   */
  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  };
  
  /**
   * 處理刷新
   */
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  /**
   * 渲染標籤內容
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <OverviewSection 
            key={`overview-${refreshKey}`}
            timeRange={timeRange} 
            onTimeRangeChange={handleTimeRangeChange} 
          />
        );
      case 1:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('dashboard.customerInteractionComingSoon')}
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('dashboard.replyEffectivenessComingSoon')}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 }, height: 'calc(100vh - 64px)' }}>
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              {t('dashboard.title')}
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            {t('dashboard.refresh')}
          </Button>
        </Box>
        
        <Paper 
          elevation={0} 
          sx={{ 
            height: 'calc(100% - 60px)', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ px: 2 }}
            >
              <Tab 
                label={t('dashboard.tabs.overview')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
              <Tab 
                label={t('dashboard.tabs.customerInteraction')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
              <Tab 
                label={t('dashboard.tabs.replyEffectiveness')} 
                sx={{ textTransform: 'none', py: 2 }} 
              />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {renderTabContent()}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage;