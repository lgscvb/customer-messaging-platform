import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, 
  ContentCopy as CopyIcon, 
  Help as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { FacebookPlatformConfig, PlatformStatus } from '../../../types/platform';
import platformService from '../../../services/platformService';

/**
 * Facebook 平台表單屬性接口
 */
interface FacebookPlatformFormProps {
  initialData?: Partial<FacebookPlatformConfig>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

/**
 * Facebook 平台表單組件
 */
const FacebookPlatformForm: React.FC<FacebookPlatformFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { t } = useTranslation();
  
  // 初始化表單數據
  const defaultValues = platformService.getFacebookFormInitialValues();
  const [formData, setFormData] = useState({
    name: initialData?.name || defaultValues.name,
    credentials: {
      pageId: initialData?.credentials?.pageId || defaultValues.credentials.pageId,
      appId: initialData?.credentials?.appId || defaultValues.credentials.appId,
      appSecret: initialData?.credentials?.appSecret || defaultValues.credentials.appSecret,
      pageAccessToken: initialData?.credentials?.pageAccessToken || defaultValues.credentials.pageAccessToken,
      verifyToken: initialData?.credentials?.verifyToken || defaultValues.credentials.verifyToken
    },
    settings: {
      defaultReplyMessage: initialData?.settings?.defaultReplyMessage || defaultValues.settings.defaultReplyMessage,
      autoReply: initialData?.settings?.autoReply !== undefined ? initialData.settings.autoReply : defaultValues.settings.autoReply,
      useAi: initialData?.settings?.useAi !== undefined ? initialData.settings.useAi : defaultValues.settings.useAi
    }
  });
  
  // 狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({
    appSecret: false,
    pageAccessToken: false,
    verifyToken: false
  });
  const [submitting, setSubmitting] = useState(false);
  
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // 清除錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  /**
   * 生成隨機驗證令牌
   */
  const generateVerifyToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        verifyToken: token
      }
    }));
  };
  
  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 驗證名稱
    if (!formData.name.trim()) {
      newErrors['name'] = t('platforms.errors.nameRequired');
    }
    
    // 驗證 Page ID
    if (!formData.credentials.pageId.trim()) {
      newErrors['credentials.pageId'] = t('platforms.errors.pageIdRequired');
    }
    
    // 驗證 App ID
    if (!formData.credentials.appId.trim()) {
      newErrors['credentials.appId'] = t('platforms.errors.appIdRequired');
    }
    
    // 驗證 App Secret
    if (!formData.credentials.appSecret.trim()) {
      newErrors['credentials.appSecret'] = t('platforms.errors.appSecretRequired');
    }
    
    // 驗證 Page Access Token
    if (!formData.credentials.pageAccessToken.trim()) {
      newErrors['credentials.pageAccessToken'] = t('platforms.errors.pageAccessTokenRequired');
    }
    
    // 驗證 Verify Token
    if (!formData.credentials.verifyToken.trim()) {
      newErrors['credentials.verifyToken'] = t('platforms.errors.verifyTokenRequired');
    }
    
    // 驗證預設回覆訊息
    if (formData.settings.autoReply && !formData.settings.defaultReplyMessage.trim()) {
      newErrors['settings.defaultReplyMessage'] = t('platforms.errors.defaultReplyMessageRequired');
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * 處理提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };
  
  /**
   * 獲取 Webhook URL
   */
  const getWebhookUrl = () => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/webhook/facebook`;
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
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
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={submitting}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.facebookCredentials')}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('platforms.facebookCredentialsInfo')}
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('platforms.pageId')}
              name="credentials.pageId"
              value={formData.credentials.pageId}
              onChange={handleChange}
              error={!!errors['credentials.pageId']}
              helperText={errors['credentials.pageId']}
              required
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('platforms.appId')}
              name="credentials.appId"
              value={formData.credentials.appId}
              onChange={handleChange}
              error={!!errors['credentials.appId']}
              helperText={errors['credentials.appId']}
              required
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.appSecret')}
              name="credentials.appSecret"
              type={showSecrets.appSecret ? 'text' : 'password'}
              value={formData.credentials.appSecret}
              onChange={handleChange}
              error={!!errors['credentials.appSecret']}
              helperText={errors['credentials.appSecret']}
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleSecretVisibility('appSecret')}
                      edge="end"
                    >
                      {showSecrets.appSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.pageAccessToken')}
              name="credentials.pageAccessToken"
              type={showSecrets.pageAccessToken ? 'text' : 'password'}
              value={formData.credentials.pageAccessToken}
              onChange={handleChange}
              error={!!errors['credentials.pageAccessToken']}
              helperText={errors['credentials.pageAccessToken']}
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleSecretVisibility('pageAccessToken')}
                      edge="end"
                    >
                      {showSecrets.pageAccessToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('platforms.webhookSettings')}
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('platforms.facebookWebhookInfo')}
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
                    <IconButton
                      onClick={() => copyToClipboard(getWebhookUrl())}
                      edge="end"
                    >
                      <CopyIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.verifyToken')}
              name="credentials.verifyToken"
              type={showSecrets.verifyToken ? 'text' : 'password'}
              value={formData.credentials.verifyToken}
              onChange={handleChange}
              error={!!errors['credentials.verifyToken']}
              helperText={errors['credentials.verifyToken'] || t('platforms.verifyTokenHelp')}
              required
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex' }}>
                      <IconButton
                        onClick={() => toggleSecretVisibility('verifyToken')}
                        edge="end"
                      >
                        {showSecrets.verifyToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      <Tooltip title={t('platforms.generateToken')}>
                        <IconButton
                          onClick={generateVerifyToken}
                          edge="end"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
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
          </Grid>
          
          {formData.settings.autoReply && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('platforms.defaultReplyMessage')}
                name="settings.defaultReplyMessage"
                value={formData.settings.defaultReplyMessage}
                onChange={handleChange}
                error={!!errors['settings.defaultReplyMessage']}
                helperText={errors['settings.defaultReplyMessage']}
                multiline
                rows={3}
                disabled={submitting}
              />
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
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
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
        >
          {isEdit ? t('common.save') : t('common.add')}
        </Button>
      </Box>
    </Box>
  );
};

export default FacebookPlatformForm;