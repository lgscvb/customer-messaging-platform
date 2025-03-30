import * as React from 'react';
import { Box } from '@mui/material';
import SalesAnalytics from '../../components/analytics/SalesAnalytics';
import Navigation from '../../components/common/Navigation';

/**
 * 銷售分析頁面
 */
const SalesAnalyticsPage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <SalesAnalytics />
      </Box>
    </Box>
  );
};

export default SalesAnalyticsPage;