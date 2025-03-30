import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Forum } from '@mui/icons-material';

/**
 * Logo 屬性接口
 */
interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

/**
 * Logo 組件
 */
const Logo: React.FC<LogoProps> = ({ size = 40, showText = true, color }) => {
  const theme = useTheme();
  const logoColor = color || theme.palette.primary.main;
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Forum
        sx={{
          fontSize: size,
          color: logoColor,
        }}
      />
      
      {showText && (
        <Typography
          variant={size > 30 ? 'h5' : 'h6'}
          component="span"
          sx={{
            fontWeight: 'bold',
            color: logoColor,
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.2,
          }}
        >
          <span>全通路</span>
          <span>客戶訊息平台</span>
        </Typography>
      )}
    </Box>
  );
};

export default Logo;