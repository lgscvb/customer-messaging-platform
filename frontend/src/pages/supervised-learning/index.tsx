import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  Home as HomeIcon,
  AutoAwesome as AiIcon
} from '@mui/icons-material';
import SupervisedLearningStats from '../../components/ai/SupervisedLearningStats';

/**
 * 監督式學習頁面
 */
const SupervisedLearningPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('common.home')}
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <AiIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('supervisedLearning.title')}
          </Typography>
        </Breadcrumbs>
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {t('supervisedLearning.title')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('supervisedLearning.description')}
      </Typography>
      
      <Paper elevation={0} sx={{ mt: 4 }}>
        <SupervisedLearningStats />
      </Paper>
    </Container>
  );
};

export default SupervisedLearningPage;