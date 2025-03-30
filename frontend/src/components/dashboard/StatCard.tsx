import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Skeleton,
  Tooltip,
  IconButton
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

/**
 * 統計卡片屬性接口
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  tooltip?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

/**
 * 統計卡片組件
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  loading = false,
  tooltip,
  trend
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: color,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="medium" color="text.secondary">
              {title}
            </Typography>
            
            {tooltip && (
              <Tooltip title={tooltip} arrow placement="top">
                <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {loading ? (
            <Skeleton variant="text" width={120} height={40} />
          ) : (
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          )}
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
          
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: trend.positive ? 'success.light' : 'error.light',
                  mr: 1
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: trend.positive ? '6px solid #4caf50' : 'none',
                    borderTop: !trend.positive ? '6px solid #f44336' : 'none',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: trend.positive ? 'success.main' : 'error.main',
                  fontWeight: 'medium'
                }}
              >
                {trend.value}% {trend.label}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: `${color}20`,
            color: color
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

export default StatCard;