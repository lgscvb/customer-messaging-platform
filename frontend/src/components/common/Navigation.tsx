import * as React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  Psychology as PsychologyIcon,
  Devices as DevicesIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  BarChart as BarChartIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import Logo from './Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../types/user';

// 抽屜寬度
const drawerWidth = 240;

/**
 * 導航項目接口
 */
interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

/**
 * 導航組件屬性
 */
interface NavigationProps {
  children?: React.ReactNode;
}

/**
 * 導航組件
 */
const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();
  
  // 響應式斷點
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));
  
  // 狀態
  const [open, setOpen] = React.useState(!isMobile && !isTablet);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  
  // 監聽屏幕大小變化，自動調整抽屜狀態
  React.useEffect(() => {
    setOpen(!isMobile && !isTablet);
  }, [isMobile, isTablet]);
  
  // 導航項目
  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      key: 'messages',
      label: t('navigation.messages'),
      icon: <MessageIcon />,
      path: '/messages',
    },
    {
      key: 'knowledge',
      label: t('navigation.knowledge'),
      icon: <PsychologyIcon />,
      path: '/knowledge',
    },
    {
      key: 'knowledge-management',
      label: t('navigation.knowledgeManagement'),
      icon: <BarChartIcon />,
      path: '/knowledge-management',
    },
    {
      key: 'analytics',
      label: t('navigation.analytics'),
      icon: <AnalyticsIcon />,
      path: '/analytics',
    },
    {
      key: 'sales-analytics',
      label: t('navigation.salesAnalytics'),
      icon: <ShoppingCartIcon />,
      path: '/analytics/sales',
    },
    {
      key: 'platforms',
      label: t('navigation.platforms'),
      icon: <DevicesIcon />,
      path: '/platforms',
    },
    {
      key: 'api-settings',
      label: t('navigation.apiSettings'),
      icon: <SettingsIcon />,
      path: '/api-settings',
      adminOnly: true,
    },
  ];
  
  /**
   * 處理抽屜開關
   */
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  /**
   * 處理用戶菜單開關
   */
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  /**
   * 處理用戶菜單關閉
   */
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  /**
   * 處理通知菜單開關
   */
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    // 清除通知計數
    setNotificationCount(0);
  };
  
  /**
   * 處理通知菜單關閉
   */
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };
  
  /**
   * 處理語言菜單開關
   */
  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };
  
  /**
   * 處理語言菜單關閉
   */
  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };
  
  /**
   * 處理登出
   */
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    router.push('/auth/login');
  };
  
  /**
   * 處理導航
   */
  const handleNavigation = (path: string) => {
    router.push(path);
    // 在移動設備上，點擊導航項目後自動收起抽屜
    if (isMobile) {
      setOpen(false);
    }
  };
  
  /**
   * 檢查是否為當前路徑
   */
  const isCurrentPath = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  // 過濾導航項目（根據用戶角色）
  const filteredNavigationItems = navigationItems.filter(
    (item) => !item.adminOnly || (user && user.role === UserRole.ADMIN)
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* 頂部應用欄 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && !isMobile && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar sx={{ 
          pr: { xs: 1, sm: 2 }, // 在小屏幕上減少右側填充
          pl: { xs: 1, sm: 2 }, // 在小屏幕上減少左側填充
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: { xs: 1, sm: 2 } }} // 在小屏幕上減少右側邊距
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }, // 在小屏幕上減小字體大小
            }}
          >
            {isMobile ? t('app.shortTitle') : t('app.title')}
          </Typography>
          
          {/* 主題切換 */}
          <ThemeSwitcher iconOnly={isMobile} />
          
          {/* 語言切換 */}
          <Tooltip title={t('common.language')}>
            <IconButton
              color="inherit"
              onClick={handleLanguageMenuOpen}
              sx={{ ml: { xs: 0.5, sm: 1 } }} // 在小屏幕上減少左側邊距
            >
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={handleLanguageMenuClose}
            onClick={handleLanguageMenuClose}
          >
            <LanguageSwitcher />
          </Menu>
          
          {/* 通知 */}
          <Tooltip title={t('common.notifications')}>
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ ml: { xs: 0.5, sm: 1 } }} // 在小屏幕上減少左側邊距
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            onClick={handleNotificationMenuClose}
          >
            <MenuItem>
              <Typography variant="body2">{t('common.noNotifications')}</Typography>
            </MenuItem>
          </Menu>
          
          {/* 用戶菜單 */}
          <Tooltip title={t('common.account')}>
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ ml: { xs: 0.5, sm: 1 } }} // 在小屏幕上減少左側邊距
            >
              {user?.avatar ? (
                <Avatar
                  alt={user.name || `${user.firstName} ${user.lastName}`}
                  src={user.avatar}
                  sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }} // 在小屏幕上減小頭像大小
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
          >
            <MenuItem onClick={() => handleNavigation('/profile')}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation.profile')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation.settings')}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('navigation.logout')}</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* 側邊抽屜 */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"} // 在移動設備上使用臨時抽屜
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined} // 在移動設備上點擊外部可關閉抽屜
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          ...(open && !isMobile && {
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }),
          ...(!open && !isMobile && {
            '& .MuiDrawer-paper': {
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              overflowX: 'hidden',
              width: (theme) => theme.spacing(7),
            },
          }),
          ...(isMobile && {
            '& .MuiDrawer-paper': {
              width: drawerWidth,
            },
          }),
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: [1],
          }}
        >
          <Logo />
        </Toolbar>
        <Divider />
        <List>
          {filteredNavigationItems.map((item) => (
            <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  backgroundColor: isCurrentPath(item.path)
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'transparent',
                }}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isCurrentPath(item.path) ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: isCurrentPath(item.path) ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* 主要內容 */}
      {children && (
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { xs: '100%', sm: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${muiTheme.spacing(7)})` },
            mt: { xs: '56px', sm: '64px' }, // 在小屏幕上調整頂部邊距
            transition: muiTheme.transitions.create(['width', 'margin'], {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
};

export default Navigation;