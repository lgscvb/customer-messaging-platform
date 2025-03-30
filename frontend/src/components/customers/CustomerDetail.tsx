import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Avatar, 
  Grid, 
  Divider, 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  CalendarToday as CalendarIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

// 客戶平台信息介面
export interface CustomerPlatformInfo {
  platform: string;
  platformId: string;
  displayName?: string;
  profileImage?: string;
  metadata?: Record<string, any>;
}

// 客戶介面
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  platforms: CustomerPlatformInfo[];
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastInteractionAt?: string;
}

// 客戶詳情屬性
interface CustomerDetailProps {
  customer: Customer;
}

/**
 * 客戶詳情組件
 * 顯示客戶的詳細信息
 */
const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer }) => {
  // 格式化時間
  const formatDate = (dateString?: string) => {
    if (!dateString) return '無資料';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 獲取平台圖標顏色
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'line':
        return '#06C755';
      case 'website':
        return '#0078D7';
      case 'meta':
        return '#1877F2';
      case 'shopee':
        return '#EE4D2D';
      default:
        return '#757575';
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Grid container spacing={2}>
          {/* 客戶基本信息 */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar 
                src={customer.platforms[0]?.profileImage} 
                alt={customer.name}
                sx={{ width: 64, height: 64, mr: 2 }}
              >
                {customer.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h2">
                  {customer.name}
                </Typography>
                <Box mt={1}>
                  {customer.tags.map((tag) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      sx={{ mr: 0.5, mb: 0.5 }} 
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 聯絡信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              聯絡信息
            </Typography>
            <List dense>
              {customer.email && (
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="電子郵件" 
                    secondary={customer.email} 
                  />
                </ListItem>
              )}
              {customer.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="電話" 
                    secondary={customer.phone} 
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* 平台信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              平台帳號
            </Typography>
            <List dense>
              {customer.platforms.map((platform) => (
                <ListItem key={`${platform.platform}-${platform.platformId}`}>
                  <ListItemIcon>
                    <ChatIcon sx={{ color: getPlatformColor(platform.platform) }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={platform.platform.toUpperCase()} 
                    secondary={platform.displayName || platform.platformId} 
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* 時間信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              時間信息
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="最後互動時間" 
                  secondary={formatDate(customer.lastInteractionAt)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="建立時間" 
                  secondary={formatDate(customer.createdAt)} 
                />
              </ListItem>
            </List>
          </Grid>

          {/* 額外信息 */}
          {Object.keys(customer.metadata).length > 0 && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" component="h3" gutterBottom>
                  額外信息
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {Object.entries(customer.metadata).map(([key, value]) => (
                    <Typography key={key} variant="body2" color="text.secondary" gutterBottom>
                      <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CustomerDetail;