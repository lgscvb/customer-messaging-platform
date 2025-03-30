import * as React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardActionArea,
  Button
} from '@mui/material';
import { 
  BarChart as BarChartIcon,
  ShoppingCart as ShoppingCartIcon,
  Message as MessageIcon,
  SmartToy as SmartToyIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/common/Navigation';

/**
 * 分析卡片屬性
 */
interface AnalyticsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

/**
 * 分析卡片組件
 */
const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, description, icon, path }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(path);
  };
  
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
      <CardActionArea 
        onClick={handleClick}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.main',
                mr: 2
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6">
              {title}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="button" color="primary">
              查看詳情
            </Typography>
            <ArrowForwardIcon fontSize="small" color="primary" sx={{ ml: 0.5 }} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

/**
 * 分析頁面
 */
const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  
  const analyticsCards = [
    {
      title: t('analytics.dashboard'),
      description: t('analytics.dashboardDescription'),
      icon: <BarChartIcon />,
      path: '/dashboard'
    },
    {
      title: t('analytics.customerInteraction'),
      description: t('analytics.customerInteractionDescription'),
      icon: <MessageIcon />,
      path: '/analytics/customer-interaction'
    },
    {
      title: t('analytics.aiEffectiveness'),
      description: t('analytics.aiEffectivenessDescription'),
      icon: <SmartToyIcon />,
      path: '/analytics/ai-effectiveness'
    },
    {
      title: t('analytics.salesConversion'),
      description: t('analytics.salesConversionDescription'),
      icon: <ShoppingCartIcon />,
      path: '/analytics/sales'
    }
  ];
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {t('analytics.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('analytics.description')}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {analyticsCards.map((card, index) => (
            <Grid item xs={12} md={6} key={index}>
              <AnalyticsCard
                title={card.title}
                description={card.description}
                icon={card.icon}
                path={card.path}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;