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
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import { UserRole } from '../../types/user';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Logo from '../../components/common/Logo';

/**
 * 註冊頁面
 */
const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addNotification } = useNotifications();
  
  // 表單狀態
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: UserRole.AGENT,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  /**
   * 處理輸入變更
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      setFormData({
        ...formData,
        [name]: value,
      });
      
      // 清除錯誤
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: '',
        });
      }
    }
  };
  
  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 驗證用戶名
    if (!formData.username) {
      newErrors.username = t('auth.errors.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('auth.errors.usernameLength');
    }
    
    // 驗證郵箱
    if (!formData.email) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }
    
    // 驗證密碼
    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordLength');
    }
    
    // 驗證確認密碼
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordsDoNotMatch');
    }
    
    // 驗證名字
    if (!formData.firstName) {
      newErrors.firstName = t('auth.errors.firstNameRequired');
    }
    
    // 驗證姓氏
    if (!formData.lastName) {
      newErrors.lastName = t('auth.errors.lastNameRequired');
    }
    
    // 設置錯誤
    setErrors(newErrors);
    
    // 返回是否有錯誤
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * 處理註冊
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setGeneralError(null);
      
      // 調用註冊 API
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('auth.registerSuccessTitle'),
        message: t('auth.registerSuccess'),
      });
      
      // 導航到儀表板
      navigate('/dashboard');
    } catch (err) {
      console.error('註冊錯誤:', err);
      
      // 顯示錯誤
      setGeneralError(
        err instanceof Error 
          ? err.message 
          : t('auth.errors.registerFailed')
      );
      
      // 顯示錯誤通知
      addNotification({
        type: NotificationType.ERROR,
        title: t('auth.registerErrorTitle'),
        message: t('auth.errors.registerFailed'),
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
  
  /**
   * 切換確認密碼可見性
   */
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <Container component="main" maxWidth="md">
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
              {t('auth.registerTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {t('auth.registerSubtitle')}
            </Typography>
          </Box>
          
          {generalError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {generalError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleRegister} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label={t('auth.firstName')}
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label={t('auth.lastName')}
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label={t('auth.username')}
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label={t('auth.email')}
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label={t('auth.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-label">{t('auth.role')}</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label={t('auth.role')}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value={UserRole.ADMIN}>{t('auth.roles.admin')}</MenuItem>
                    <MenuItem value={UserRole.MANAGER}>{t('auth.roles.manager')}</MenuItem>
                    <MenuItem value={UserRole.AGENT}>{t('auth.roles.agent')}</MenuItem>
                    <MenuItem value={UserRole.VIEWER}>{t('auth.roles.viewer')}</MenuItem>
                  </Select>
                  <FormHelperText>{t('auth.roleHelperText')}</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            
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
                t('auth.registerButton')
              )}
            </Button>
            
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/auth/login">
                  <Typography variant="body2" color="primary">
                    {t('auth.alreadyHaveAccount')}
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

export default RegisterPage;