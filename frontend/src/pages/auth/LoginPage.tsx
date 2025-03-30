import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Logo from '../../components/common/Logo';

/**
 * 登入頁面
 */
const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification } = useNotifications();
  
  // 表單狀態
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 處理登入
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!username || !password) {
      setError(t('auth.errors.allFieldsRequired'));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 調用登入 API
      await login(username, password);
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('auth.loginSuccessTitle'),
        message: t('auth.loginSuccess'),
      });
      
      // 導航到儀表板
      navigate('/dashboard');
    } catch (err) {
      console.error('登入錯誤:', err);
      
      // 顯示錯誤
      setError(
        err instanceof Error 
          ? err.message 
          : t('auth.errors.loginFailed')
      );
      
      // 顯示錯誤通知
      addNotification({
        type: NotificationType.ERROR,
        title: t('auth.loginErrorTitle'),
        message: t('auth.errors.loginFailed'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 切換密碼可見性
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Logo size={60} />
            <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
              {t('auth.loginTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {t('auth.loginSubtitle')}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label={t('auth.username')}
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('auth.loginButton')
              )}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link to="/auth/forgot-password">
                  <Typography variant="body2" color="primary">
                    {t('auth.forgotPassword')}
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link to="/auth/register">
                  <Typography variant="body2" color="primary">
                    {t('auth.noAccount')}
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <LanguageSwitcher />
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;