import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Breadcrumbs,
  Alert,
  Snackbar,
} from '@mui/material';
import { Link } from '@mui/material';
import DialogContentText from '@mui/material/DialogContentText';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import apiConfigService, { ApiConfig, ApiConfigType, CreateApiConfigDTO, UpdateApiConfigDTO } from '../../services/apiConfigService';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import Navigation from '../../components/common/Navigation';

// 定義標籤面板接口
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// 標籤面板組件
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-settings-tabpanel-${index}`}
      aria-labelledby={`api-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// 獲取標籤屬性
const a11yProps = (index: number) => {
  return {
    id: `api-settings-tab-${index}`,
    'aria-controls': `api-settings-tabpanel-${index}`,
  };
};

/**
 * API 設定管理頁面
 */
const ApiSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [loading, setLoading] = React.useState(false);
  const [apiConfigs, setApiConfigs] = React.useState<ApiConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = React.useState<ApiConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = React.useState<ApiConfig | null>(null);
  const [tabValue, setTabValue] = React.useState(0);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | 'delete'>('create');
  const [formData, setFormData] = React.useState<CreateApiConfigDTO | UpdateApiConfigDTO>({
    name: '',
    key: '',
    value: '',
    type: ApiConfigType.OTHER,
    isEncrypted: true,
    description: '',
    isActive: true,
    metadata: {},
  });
  const [showValue, setShowValue] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // 獲取 API 設定列表
  const fetchApiConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const configs = await apiConfigService.getAllApiConfigs();
      setApiConfigs(configs);
      filterConfigsByType(configs, tabValue);
      
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('apiSettings.fetchSuccess'),
        message: t('apiSettings.fetchSuccessMessage', { count: configs.length }),
      });
    } catch (error) {
      console.error('獲取 API 設定列表錯誤:', error);
      
      setError(t('apiSettings.fetchError'));
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('apiSettings.fetchError'),
        message: t('apiSettings.fetchErrorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化時獲取 API 設定列表
  React.useEffect(() => {
    fetchApiConfigs();
  }, []);
  
  // 根據類型過濾 API 設定
  const filterConfigsByType = (configs: ApiConfig[], tabIndex: number) => {
    const types = apiConfigService.getApiConfigTypes();
    
    if (tabIndex === 0) {
      // 全部
      setFilteredConfigs(configs);
    } else {
      // 根據類型過濾
      const type = types[tabIndex - 1];
      setFilteredConfigs(configs.filter(config => config.type === type));
    }
  };
  
  // 處理標籤變更
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    filterConfigsByType(apiConfigs, newValue);
  };
  
  // 處理刷新
  const handleRefresh = () => {
    fetchApiConfigs();
  };
  
  // 處理打開對話框
  const handleOpenDialog = (mode: 'create' | 'edit' | 'delete', config?: ApiConfig) => {
    setDialogMode(mode);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        key: '',
        value: '',
        type: ApiConfigType.OTHER,
        isEncrypted: true,
        description: '',
        isActive: true,
        metadata: {},
      });
      setSelectedConfig(null);
    } else if (config) {
      if (mode === 'edit') {
        setFormData({
          name: config.name,
          value: config.value,
          type: config.type,
          isEncrypted: config.isEncrypted,
          description: config.description,
          isActive: config.isActive,
          metadata: config.metadata,
        });
      }
      setSelectedConfig(config);
    }
    
    setOpenDialog(true);
  };
  
  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowValue(false);
  };
  
  // 處理表單變更
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // 處理選擇變更
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });
  };
  
  // 處理開關變更
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  // 處理提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (dialogMode === 'create') {
        // 創建 API 設定
        const createData = formData as CreateApiConfigDTO;
        
        // 驗證必要字段
        if (!createData.name || !createData.key || !createData.value || !createData.type) {
          addNotification({
            type: NotificationType.ERROR,
            title: t('apiSettings.validationError'),
            message: t('apiSettings.validationErrorMessage'),
          });
          return;
        }
        
        await apiConfigService.createApiConfig(createData);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('apiSettings.createSuccess'),
          message: t('apiSettings.createSuccessMessage', { name: createData.name }),
        });
      } else if (dialogMode === 'edit' && selectedConfig) {
        // 更新 API 設定
        const updateData = formData as UpdateApiConfigDTO;
        
        await apiConfigService.updateApiConfig(selectedConfig.id, updateData);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('apiSettings.updateSuccess'),
          message: t('apiSettings.updateSuccessMessage', { name: selectedConfig.name }),
        });
      } else if (dialogMode === 'delete' && selectedConfig) {
        // 刪除 API 設定
        await apiConfigService.deleteApiConfig(selectedConfig.id);
        
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('apiSettings.deleteSuccess'),
          message: t('apiSettings.deleteSuccessMessage', { name: selectedConfig.name }),
        });
      }
      
      // 關閉對話框
      handleCloseDialog();
      
      // 重新獲取 API 設定列表
      fetchApiConfigs();
    } catch (error) {
      console.error('操作 API 設定錯誤:', error);
      
      addNotification({
        type: NotificationType.ERROR,
        title: t(`apiSettings.${dialogMode}Error`),
        message: t(`apiSettings.${dialogMode}ErrorMessage`),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染對話框
  const renderDialog = () => {
    if (dialogMode === 'delete' && selectedConfig) {
      // 刪除確認對話框
      return (
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{t('apiSettings.deleteConfirmTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('apiSettings.deleteConfirmMessage', { name: selectedConfig.name, key: selectedConfig.key })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} color="error" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }
    
    // 創建/編輯對話框
    return (
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? t('apiSettings.createTitle') : t('apiSettings.editTitle', { name: selectedConfig?.name })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label={t('apiSettings.name')}
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            
            {dialogMode === 'create' && (
              <TextField
                name="key"
                label={t('apiSettings.key')}
                value={(formData as CreateApiConfigDTO).key}
                onChange={handleFormChange}
                fullWidth
                required
                helperText={t('apiSettings.keyHelp')}
              />
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                name="value"
                label={t('apiSettings.value')}
                value={formData.value}
                onChange={handleFormChange}
                fullWidth
                required
                type={showValue ? 'text' : 'password'}
              />
              
              <IconButton onClick={() => setShowValue(!showValue)}>
                {showValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>{t('apiSettings.type')}</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                label={t('apiSettings.type')}
              >
                {apiConfigService.getApiConfigTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {apiConfigService.getApiConfigTypeName(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              name="description"
              label={t('apiSettings.description')}
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="isEncrypted"
                    checked={formData.isEncrypted}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label={t('apiSettings.isEncrypted')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label={t('apiSettings.isActive')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (dialogMode === 'create' ? t('common.create') : t('common.save'))}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // 頁面內容
  const pageContent = (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 麵包屑導航 */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('common.dashboard')}
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('apiSettings.title')}
        </Typography>
      </Breadcrumbs>
      
      {/* 頁面標題 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('apiSettings.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            disabled={loading}
          >
            {t('apiSettings.addNew')}
          </Button>
        </Box>
      </Box>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 標籤頁 */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="api settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('apiSettings.all')} {...a11yProps(0)} />
          {apiConfigService.getApiConfigTypes().map((type, index) => (
            <Tab
              key={type}
              label={apiConfigService.getApiConfigTypeName(type)}
              {...a11yProps(index + 1)}
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* 數據表格 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="api settings table">
            <TableHead>
              <TableRow>
                <TableCell>{t('apiSettings.name')}</TableCell>
                <TableCell>{t('apiSettings.key')}</TableCell>
                <TableCell>{t('apiSettings.value')}</TableCell>
                <TableCell>{t('apiSettings.type')}</TableCell>
                <TableCell>{t('apiSettings.status')}</TableCell>
                <TableCell>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && filteredConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {t('apiSettings.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredConfigs.map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell>
                      <Tooltip title={config.description || ''}>
                        <Typography variant="body2">{config.name}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {config.key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {config.isEncrypted ? '••••••••' : config.value}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apiConfigService.getApiConfigTypeName(config.type)}
                        size="small"
                        color={
                          config.type === ApiConfigType.AI
                            ? 'primary'
                            : config.type === ApiConfigType.PLATFORM
                            ? 'secondary'
                            : config.type === ApiConfigType.INTEGRATION
                            ? 'info'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.isActive ? t('common.active') : t('common.inactive')}
                        size="small"
                        color={config.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog('edit', config)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog('delete', config)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* 對話框 */}
      {renderDialog()}
    </Container>
  );
  
  return (
    <Navigation>
      {pageContent}
    </Navigation>
  );
};

export default ApiSettingsPage;