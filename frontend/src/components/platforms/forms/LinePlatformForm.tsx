"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  Divider, 
  Switch, 
  FormControlLabel, 
  InputAdornment, 
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar,
  LinearProgress,
  FormHelperText
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, 
  ContentCopy as CopyIcon, 
  Help as HelpIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LinePlatformConfig, PlatformStatus } from '../../../types/platform';
import platformService from '../../../services/platformService';

/**
 * LINE 平台表單屬性接口
 */
interface LinePlatformFormProps {
  initialData?: Partial<LinePlatformConfig>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

/**
 * 密碼強度接口
 */
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

/**
 * LINE 平台表單組件
 */
const LinePlatformForm: React.FC<LinePlatformFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { t } = useTranslation();
  
  // 初始化表單數據
  const defaultValues = platformService.getLineFormInitialValues();
  const [formData, setFormData] = useState({
    name: initialData?.name || defaultValues.name,
    credentials: {
      channelId: initialData?.credentials?.channelId || defaultValues.credentials.channelId,
      channelSecret: initialData?.credentials?.channelSecret || defaultValues.credentials.channelSecret,
      accessToken: initialData?.credentials?.accessToken || defaultValues.credentials.accessToken
    },
    settings: {
      defaultReplyMessage: initialData?.settings?.defaultReplyMessage || defaultValues.settings.defaultReplyMessage,
      autoReply: initialData?.settings?.autoReply !== undefined ? initialData.settings.autoReply : defaultValues.settings.autoReply,
      useAi: initialData?.settings?.useAi !== undefined ? initialData.settings.useAi : defaultValues.settings.useAi
    }
  });
  
  // 狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({
    channelSecret: false,
    accessToken: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [secretStrength, setSecretStrength] = useState<Record<string, PasswordStrength>>({
    channelSecret: { score: 0, label: t('validation.weak'), color: 'error.main' },
    accessToken: { score: 0, label: t('validation.weak'), color: 'error.main' }
  });
  
  /**
   * 處理輸入變更
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    
    // 處理嵌套屬性
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
      
      // 如果是密碼字段，計算強度
      if (field === 'channelSecret' || field === 'accessToken') {
        calculatePasswordStrength(field, value);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // 標記為已觸碰
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // 實時驗證
    validateField(name, type === 'checkbox' ? checked : value);
  };
  
  /**
   * 處理字段失焦
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    
    // 標記為已觸碰
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // 驗證字段
    validateField(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  };
  
  /**
   * 驗證單個字段
   */
  const validateField = (name: string, value: any): boolean => {
    let error = '';
    
    // 根據字段名稱進行驗證
    if (name === 'name') {
      if (!value.trim()) {
        error = t('platforms.errors.nameRequired');
      } else if (value.trim().length < 3) {
        error = t('validation.minLength', { length: 3 });
      } else if (value.trim().length > 50) {
        error = t('validation.maxLength', { length: 50 });
      }
    } else if (name === 'credentials.channelId') {
      if (!value.trim()) {
        error = t('platforms.errors.channelIdRequired');
      } else if (!/^\d+$/.test(value)) {
        error = t('platforms.errors.channelIdFormat');
      }
    } else if (name === 'credentials.channelSecret') {
      if (!value.trim()) {
        error = t('platforms.errors.channelSecretRequired');
      } else if (value.trim().length < 8) {
        error = t('validation.minLength', { length: 8 });
      }
    } else if (name === 'credentials.accessToken') {
      if (!value.trim()) {
        error = t('platforms.errors.accessTokenRequired');
      } else if (value.trim().length < 8) {
        error = t('validation.minLength', { length: 8 });
      }
    } else if (name === 'settings.defaultReplyMessage' && formData.settings.autoReply) {
      if (!value.trim()) {
        error = t('platforms.errors.defaultReplyMessageRequired');
      } else if (value.trim().length > 500) {
        error = t('validation.maxLength', { length: 500 });
      }
    }
    
    // 更新錯誤狀態
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };
  
  /**
   * 計算密碼強度
   */
  const calculatePasswordStrength = (field: string, value: string) => {
    // 簡單的密碼強度計算
    let score = 0;
    
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    
    let label = '';
    let color = '';
    
    switch (score) {
      case 0:
      case 1:
        label = t('validation.weak');
        color = 'error.main';
        break;
      case 2:
        label = t('validation.fair');
        color = 'warning.main';
        break;
      case 3:
        label = t('validation.good');
        color = 'info.main';
        break;
      case 4:
      case 5:
        label = t('validation.strong');
        color = 'success.main';
        break;
    }
    
    setSecretStrength(prev => ({
      ...prev,
      [field]: { score, label, color }
    }));
  };
  
  /**
   * 切換密碼可見性
   */
  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  /**
   * 複製到剪貼板
   */
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    
    // 3秒後重置複製狀態
    setTimeout(() => {
      setCopied(null);
    }, 3000);
    
    // 顯示通知
    setSnackbar({
      open: true,
      message: t('common.copied'),
      severity: 'success'
    });
  };
  
  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    // 驗證所有字段
    const nameValid = validateField('name', formData.name);
    const channelIdValid = validateField('credentials.channelId', formData.credentials.channelId);
    const channelSecretValid = validateField('credentials.channelSecret', formData.credentials.channelSecret);
    const accessTokenValid = validateField('credentials.accessToken', formData.credentials.accessToken);
    
    // 如果啟用了自動回覆，驗證預設回覆訊息
    let defaultReplyMessageValid = true;
    if (formData.settings.autoReply) {
      defaultReplyMessageValid = validateField('settings.defaultReplyMessage', formData.settings.defaultReplyMessage);
    }
    
    // 標記所有字段為已觸碰
    setTouched({
      'name': true,
      'credentials.channelId': true,
      'credentials.channelSecret': true,
      'credentials.accessToken': true,
      'settings.defaultReplyMessage': formData.settings.autoReply
    });
    
    return nameValid && channelIdValid && channelSecretValid && accessTokenValid && defaultReplyMessageValid;
  };
  
  /**
   * 處理提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // 顯示錯誤通知
      setSnackbar({
        open: true,
        message: t('validation.formErrors'),
        severity: 'error'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      await onSubmit(formData);
      
      // 顯示成功通知
      setSnackbar({
        open: true,
        message: isEdit ? t('platforms.updateSuccess') : t('platforms.addSuccess'),
        severity: 'success'
      });
    } catch (error) {
      // 顯示錯誤通知
      setSnackbar({
        open: true,
        message: isEdit ? t('platforms.updateError') : t('platforms.addError'),
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  /**
   * 重置表單
   */
  const handleReset = () => {
    // 重置為初始值或默認值
    setFormData({
      name: initialData?.name || defaultValues.name,
      credentials: {
        channelId: initialData?.credentials?.channelId || defaultValues.credentials.channelId,
        channelSecret: initialData?.credentials?.channelSecret || defaultValues.credentials.channelSecret,
        accessToken: initialData?.credentials?.accessToken || defaultValues.credentials.accessToken
      },
      settings: {
        defaultReplyMessage: initialData?.settings?.defaultReplyMessage || defaultValues.settings.defaultReplyMessage,
        autoReply: initialData?.settings?.autoReply !== undefined ? initialData.settings.autoReply : defaultValues.settings.autoReply,
        useAi: initialData?.settings?.useAi !== undefined ? initialData.settings.useAi : defaultValues.settings.useAi
      }
    });
    
    // 重置錯誤和觸碰狀態
    setErrors({});
    setTouched({});
    
    // 顯示通知
    setSnackbar({
      open: true,
      message: t('common.formReset'),
      severity: 'info'
    });
  };
  
  /**
   * 關閉通知
   */
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  /**
   * 獲取 Webhook URL
   */
  const getWebhookUrl = () => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/webhook/line`;
  };
  
  /**
   * 獲取密碼強度進度條顏色
   */
  const getPasswordStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'error';
      case 2:
        return 'warning';
      case 3:
        return 'info';
      case 4:
      case 5:
        return 'success';
      default:
        return 'error';
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* 基本信息 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.basicInfo')}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.name')}
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              required
              disabled={submitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InfoIcon color="primary" fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <FormHelperText>
              {t('platforms.nameHelp')}
            </FormHelperText>
          </Grid>
        </Grid>
      </Paper>
      
      {/* LINE 憑證 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.lineCredentials')}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('platforms.lineCredentialsInfo')}
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.channelId')}
              name="credentials.channelId"
              value={formData.credentials.channelId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched['credentials.channelId'] && !!errors['credentials.channelId']}
              helperText={touched['credentials.channelId'] && errors['credentials.channelId']}
              required
              disabled={submitting}
              placeholder="1234567890"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InfoIcon color="primary" fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <FormHelperText>
              {t('platforms.channelIdHelp')}
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.channelSecret')}
              name="credentials.channelSecret"
              type={showSecrets.channelSecret ? 'text' : 'password'}
              value={formData.credentials.channelSecret}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched['credentials.channelSecret'] && !!errors['credentials.channelSecret']}
              helperText={touched['credentials.channelSecret'] && errors['credentials.channelSecret']}
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleSecretVisibility('channelSecret')}
                      edge="end"
                    >
                      {showSecrets.channelSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {formData.credentials.channelSecret && (
              <>
                <LinearProgress 
                  variant="determinate" 
                  value={(secretStrength.channelSecret.score / 5) * 100} 
                  color={getPasswordStrengthColor(secretStrength.channelSecret.score) as any}
                  sx={{ mt: 1, mb: 0.5, height: 6, borderRadius: 3 }}
                />
                <FormHelperText sx={{ color: secretStrength.channelSecret.color }}>
                  {t('validation.secretStrength')}: {secretStrength.channelSecret.label}
                </FormHelperText>
              </>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.accessToken')}
              name="credentials.accessToken"
              type={showSecrets.accessToken ? 'text' : 'password'}
              value={formData.credentials.accessToken}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched['credentials.accessToken'] && !!errors['credentials.accessToken']}
              helperText={touched['credentials.accessToken'] && errors['credentials.accessToken']}
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleSecretVisibility('accessToken')}
                      edge="end"
                    >
                      {showSecrets.accessToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {formData.credentials.accessToken && (
              <>
                <LinearProgress 
                  variant="determinate" 
                  value={(secretStrength.accessToken.score / 5) * 100} 
                  color={getPasswordStrengthColor(secretStrength.accessToken.score) as any}
                  sx={{ mt: 1, mb: 0.5, height: 6, borderRadius: 3 }}
                />
                <FormHelperText sx={{ color: secretStrength.accessToken.color }}>
                  {t('validation.secretStrength')}: {secretStrength.accessToken.label}
                </FormHelperText>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Webhook 設定 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.webhookSettings')}
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('platforms.webhookInfo')}
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.webhookUrl')}
              value={getWebhookUrl()}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied === 'webhook' ? t('common.copied') : t('common.copy')}>
                      <IconButton
                        onClick={() => copyToClipboard(getWebhookUrl(), 'webhook')}
                        edge="end"
                        color={copied === 'webhook' ? 'success' : 'inherit'}
                      >
                        {copied === 'webhook' ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
            <FormHelperText>
              {t('platforms.webhookUrlHelp')}
            </FormHelperText>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 回覆設定 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.replySettings')}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="settings.autoReply"
                  checked={formData.settings.autoReply}
                  onChange={handleChange}
                  disabled={submitting}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {t('platforms.autoReply')}
                  <Tooltip title={t('platforms.autoReplyInfo')}>
                    <IconButton size="small">
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <FormHelperText>
              {t('platforms.autoReplyHelp')}
            </FormHelperText>
          </Grid>
          
          {formData.settings.autoReply && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('platforms.defaultReplyMessage')}
                name="settings.defaultReplyMessage"
                value={formData.settings.defaultReplyMessage}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched['settings.defaultReplyMessage'] && !!errors['settings.defaultReplyMessage']}
                helperText={touched['settings.defaultReplyMessage'] && errors['settings.defaultReplyMessage']}
                multiline
                rows={3}
                disabled={submitting}
                placeholder={t('platforms.defaultReplyMessagePlaceholder')}
              />
              <FormHelperText>
                {t('platforms.defaultReplyMessageHelp')}
              </FormHelperText>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="settings.useAi"
                  checked={formData.settings.useAi}
                  onChange={handleChange}
                  disabled={submitting}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {t('platforms.useAi')}
                  <Tooltip title={t('platforms.useAiInfo')}>
                    <IconButton size="small">
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <FormHelperText>
              {t('platforms.useAiHelp')}
            </FormHelperText>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={submitting}
          startIcon={<RefreshIcon />}
          color="secondary"
        >
          {t('common.reset')}
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
            color="primary"
          >
            {isEdit ? t('common.save') : t('common.add')}
          </Button>
        </Box>
      </Box>
      
      {/* 提交中進度條 */}
      {submitting && (
        <LinearProgress sx={{ mt: 2 }} />
      )}
      
      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LinePlatformForm;