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
  Tooltip,
  Tabs,
  Tab,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Slider,
  Stack
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, 
  ContentCopy as CopyIcon, 
  Help as HelpIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { WebsitePlatformConfig, PlatformStatus } from '../../../types/platform';
import platformService from '../../../services/platformService';

/**
 * 網站平台表單屬性接口
 */
interface WebsitePlatformFormProps {
  initialData?: Partial<WebsitePlatformConfig>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

/**
 * 網站平台表單組件
 */
const WebsitePlatformForm: React.FC<WebsitePlatformFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { t } = useTranslation();
  
  // 初始化表單數據
  const defaultValues = platformService.getWebsiteFormInitialValues();
  const [formData, setFormData] = useState({
    name: initialData?.name || defaultValues.name,
    credentials: {
      apiKey: initialData?.credentials?.apiKey || defaultValues.credentials.apiKey
    },
    settings: {
      defaultReplyMessage: initialData?.settings?.defaultReplyMessage || defaultValues.settings.defaultReplyMessage,
      autoReply: initialData?.settings?.autoReply !== undefined ? initialData.settings.autoReply : defaultValues.settings.autoReply,
      useAi: initialData?.settings?.useAi !== undefined ? initialData.settings.useAi : defaultValues.settings.useAi,
      widgetColor: initialData?.settings?.widgetColor || defaultValues.settings.widgetColor,
      widgetPosition: initialData?.settings?.widgetPosition || defaultValues.settings.widgetPosition,
      widgetTitle: initialData?.settings?.widgetTitle || defaultValues.settings.widgetTitle,
      widgetSubtitle: initialData?.settings?.widgetSubtitle || defaultValues.settings.widgetSubtitle
    }
  });
  
  // 狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({
    apiKey: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [previewColor, setPreviewColor] = useState(formData.settings.widgetColor);
  
  /**
   * 處理標籤變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
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
      
      // 更新預覽顏色
      if (name === 'settings.widgetColor') {
        setPreviewColor(value);
      }
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
   * 處理顏色變更
   */
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        widgetColor: value
      }
    }));
    
    setPreviewColor(value);
  };
  
  /**
   * 處理位置變更
   */
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        widgetPosition: value as 'left' | 'right'
      }
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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  /**
   * 生成隨機 API 金鑰
   */
  const generateApiKey = () => {
    const key = 'ws_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        apiKey: key
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
    
    // 驗證 API 金鑰
    if (!formData.credentials.apiKey.trim()) {
      newErrors['credentials.apiKey'] = t('platforms.errors.apiKeyRequired');
    }
    
    // 驗證預設回覆訊息
    if (formData.settings.autoReply && !formData.settings.defaultReplyMessage.trim()) {
      newErrors['settings.defaultReplyMessage'] = t('platforms.errors.defaultReplyMessageRequired');
    }
    
    // 驗證小工具標題
    if (!formData.settings.widgetTitle.trim()) {
      newErrors['settings.widgetTitle'] = t('platforms.errors.widgetTitleRequired');
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
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/webhook/website`;
  };
  
  /**
   * 獲取嵌入代碼
   */
  const getEmbedCode = () => {
    return `<script src="${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/widget.js" data-api-key="${formData.credentials.apiKey}"></script>`;
  };
  
  /**
   * 渲染基本設定
   */
  const renderBasicSettings = () => {
    return (
      <>
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
            {t('platforms.websiteCredentials')}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('platforms.websiteCredentialsInfo')}
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('platforms.apiKey')}
                name="credentials.apiKey"
                type={showSecrets.apiKey ? 'text' : 'password'}
                value={formData.credentials.apiKey}
                onChange={handleChange}
                error={!!errors['credentials.apiKey']}
                helperText={errors['credentials.apiKey']}
                required
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ display: 'flex' }}>
                        <IconButton
                          onClick={() => toggleSecretVisibility('apiKey')}
                          edge="end"
                        >
                          {showSecrets.apiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <Tooltip title={t('platforms.generateApiKey')}>
                          <IconButton
                            onClick={generateApiKey}
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
            {t('platforms.webhookSettings')}
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('platforms.websiteWebhookInfo')}
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
            {t('platforms.embedCode')}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('platforms.embedCodeInfo')}
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('platforms.embedCode')}
                value={getEmbedCode()}
                multiline
                rows={2}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => copyToClipboard(getEmbedCode())}
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
      </>
    );
  };
  
  /**
   * 渲染回覆設定
   */
  const renderReplySettings = () => {
    return (
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
    );
  };
  
  /**
   * 渲染外觀設定
   */
  const renderAppearanceSettings = () => {
    return (
      <>
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {t('platforms.widgetSettings')}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('platforms.widgetTitle')}
                name="settings.widgetTitle"
                value={formData.settings.widgetTitle}
                onChange={handleChange}
                error={!!errors['settings.widgetTitle']}
                helperText={errors['settings.widgetTitle']}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('platforms.widgetSubtitle')}
                name="settings.widgetSubtitle"
                value={formData.settings.widgetSubtitle}
                onChange={handleChange}
                error={!!errors['settings.widgetSubtitle']}
                helperText={errors['settings.widgetSubtitle']}
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('platforms.widgetPosition')}</FormLabel>
                <RadioGroup
                  row
                  name="settings.widgetPosition"
                  value={formData.settings.widgetPosition}
                  onChange={handlePositionChange}
                >
                  <FormControlLabel 
                    value="right" 
                    control={<Radio />} 
                    label={t('platforms.positions.right')} 
                    disabled={submitting}
                  />
                  <FormControlLabel 
                    value="left" 
                    control={<Radio />} 
                    label={t('platforms.positions.left')} 
                    disabled={submitting}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel component="legend">{t('platforms.widgetColor')}</FormLabel>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      backgroundColor: previewColor,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <TextField
                    fullWidth
                    type="color"
                    value={formData.settings.widgetColor}
                    onChange={handleColorChange}
                    disabled={submitting}
                    sx={{ 
                      '& input': { 
                        cursor: 'pointer',
                        height: 48
                      } 
                    }}
                  />
                </Stack>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {t('platforms.widgetPreview')}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Box
              sx={{
                width: 320,
                height: 400,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 3
              }}
            >
              <Box
                sx={{
                  backgroundColor: previewColor,
                  color: '#ffffff',
                  p: 2
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {formData.settings.widgetTitle}
                </Typography>
                <Typography variant="body2">
                  {formData.settings.widgetSubtitle}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  flexGrow: 1,
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}
              >
                <Box
                  sx={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '18px',
                    p: 1,
                    px: 2,
                    mb: 1,
                    maxWidth: '80%'
                  }}
                >
                  <Typography variant="body2">
                    {t('platforms.previewMessage1')}
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    alignSelf: 'flex-end',
                    backgroundColor: previewColor,
                    color: '#ffffff',
                    borderRadius: '18px',
                    p: 1,
                    px: 2,
                    mb: 1,
                    maxWidth: '80%'
                  }}
                >
                  <Typography variant="body2">
                    {t('platforms.previewMessage2')}
                  </Typography>
                </Box>
              </Box>
              
              <Box
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  backgroundColor: '#ffffff',
                  display: 'flex'
                }}
              >
                <TextField
                  fullWidth
                  placeholder={t('platforms.typeMessage')}
                  size="small"
                  disabled
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{ backgroundColor: previewColor }}
                  disabled
                >
                  {t('platforms.send')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </>
    );
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={t('platforms.tabs.basic')} />
        <Tab label={t('platforms.tabs.reply')} />
        <Tab label={t('platforms.tabs.appearance')} />
      </Tabs>
      
      {activeTab === 0 && renderBasicSettings()}
      {activeTab === 1 && renderReplySettings()}
      {activeTab === 2 && renderAppearanceSettings()}
      
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

export default WebsitePlatformForm;