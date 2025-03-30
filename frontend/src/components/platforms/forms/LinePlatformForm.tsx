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
  Help as HelpIcon 
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
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({
    channelSecret: false,
    accessToken: false
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
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 驗證名稱
    if (!formData.name.trim()) {
      newErrors['name'] = t('platforms.errors.nameRequired');
    }
    
    // 驗證 Channel ID
    if (!formData.credentials.channelId.trim()) {
      newErrors['credentials.channelId'] = t('platforms.errors.channelIdRequired');
    }
    
    // 驗證 Channel Secret
    if (!formData.credentials.channelSecret.trim()) {
      newErrors['credentials.channelSecret'] = t('platforms.errors.channelSecretRequired');
    }
    
    // 驗證 Access Token
    if (!formData.credentials.accessToken.trim()) {
      newErrors['credentials.accessToken'] = t('platforms.errors.accessTokenRequired');
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
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/webhook/line`;
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
              error={!!errors['credentials.channelId']}
              helperText={errors['credentials.channelId']}
              required
              disabled={submitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.channelSecret')}
              name="credentials.channelSecret"
              type={showSecrets.channelSecret ? 'text' : 'password'}
              value={formData.credentials.channelSecret}
              onChange={handleChange}
              error={!!errors['credentials.channelSecret']}
              helperText={errors['credentials.channelSecret']}
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
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('platforms.accessToken')}
              name="credentials.accessToken"
              type={showSecrets.accessToken ? 'text' : 'password'}
              value={formData.credentials.accessToken}
              onChange={handleChange}
              error={!!errors['credentials.accessToken']}
              helperText={errors['credentials.accessToken']}
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
          </Grid>
        </Grid>
      </Paper>
      
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

export default LinePlatformForm;