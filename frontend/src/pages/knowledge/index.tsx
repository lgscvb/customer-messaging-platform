import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Chip, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  FilterList as FilterIcon, 
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  School as KnowledgeIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import api from '../../services/api';

/**
 * 知識項目接口
 */
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 知識庫頁面
 */
const KnowledgePage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit' | 'delete'>('add');
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    source: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  /**
   * 獲取知識項目
   */
  useEffect(() => {
    const fetchKnowledgeItems = async () => {
      try {
        setLoading(true);
        const response = await api.get('/knowledge');
        setKnowledgeItems(response.data);
        setFilteredItems(response.data);
        
        // 提取類別和標籤
        const allCategories = [...new Set(response.data.map((item: KnowledgeItem) => item.category))];
        setCategories(allCategories);
        
        const allTags = [...new Set(response.data.flatMap((item: KnowledgeItem) => item.tags))];
        setTags(allTags);
      } catch (error) {
        console.error('獲取知識項目錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('knowledge.errors.fetchTitle'),
          message: t('knowledge.errors.fetchMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchKnowledgeItems();
  }, [addNotification, t]);
  
  /**
   * 過濾知識項目
   */
  useEffect(() => {
    let filtered = [...knowledgeItems];
    
    // 根據搜索查詢過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 根據類別過濾
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // 根據標籤過濾
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => 
        selectedTags.every(tag => item.tags.includes(tag))
      );
    }
    
    // 根據標籤過濾
    if (activeTab === 1) {
      filtered = filtered.filter(item => item.isActive);
    } else if (activeTab === 2) {
      filtered = filtered.filter(item => !item.isActive);
    }
    
    setFilteredItems(filtered);
    setPage(0);
  }, [knowledgeItems, searchQuery, selectedCategory, selectedTags, activeTab]);
  
  /**
   * 處理搜索變更
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * 處理類別變更
   */
  const handleCategoryChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCategory(e.target.value as string);
  };
  
  /**
   * 處理標籤變更
   */
  const handleTagChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTags(e.target.value as string[]);
  };
  
  /**
   * 處理標籤頁變更
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * 處理頁面變更
   */
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  /**
   * 處理每頁行數變更
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  /**
   * 處理刷新
   */
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await api.get('/knowledge');
      setKnowledgeItems(response.data);
      
      // 提取類別和標籤
      const allCategories = [...new Set(response.data.map((item: KnowledgeItem) => item.category))];
      setCategories(allCategories);
      
      const allTags = [...new Set(response.data.flatMap((item: KnowledgeItem) => item.tags))];
      setTags(allTags);
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('knowledge.refreshSuccessTitle'),
        message: t('knowledge.refreshSuccessMessage')
      });
    } catch (error) {
      console.error('刷新知識項目錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.errors.refreshTitle'),
        message: t('knowledge.errors.refreshMessage')
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 處理添加知識項目
   */
  const handleAddItem = () => {
    setDialogType('add');
    setCurrentItem(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      source: '',
      isActive: true
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  /**
   * 處理編輯知識項目
   */
  const handleEditItem = (item: KnowledgeItem) => {
    setDialogType('edit');
    setCurrentItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source: item.source,
      isActive: item.isActive
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  /**
   * 處理刪除知識項目
   */
  const handleDeleteItem = (item: KnowledgeItem) => {
    setDialogType('delete');
    setCurrentItem(item);
    setOpenDialog(true);
  };
  
  /**
   * 處理對話框關閉
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  /**
   * 處理表單變更
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // 清除錯誤
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: ''
        });
      }
    }
  };
  
  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = t('knowledge.errors.titleRequired');
    }
    
    if (!formData.content.trim()) {
      errors.content = t('knowledge.errors.contentRequired');
    }
    
    if (!formData.category.trim()) {
      errors.category = t('knowledge.errors.categoryRequired');
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  /**
   * 處理提交
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (dialogType === 'add') {
        // 添加知識項目
        const response = await api.post('/knowledge', formData);
        
        // 更新知識項目列表
        setKnowledgeItems([...knowledgeItems, response.data]);
        
        // 更新類別和標籤
        if (!categories.includes(formData.category)) {
          setCategories([...categories, formData.category]);
        }
        
        const newTags = formData.tags.filter(tag => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags([...tags, ...newTags]);
        }
        
        // 顯示成功通知
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.addSuccessTitle'),
          message: t('knowledge.addSuccessMessage')
        });
      } else if (dialogType === 'edit' && currentItem) {
        // 編輯知識項目
        const response = await api.put(`/knowledge/${currentItem.id}`, formData);
        
        // 更新知識項目列表
        setKnowledgeItems(knowledgeItems.map(item => 
          item.id === currentItem.id ? response.data : item
        ));
        
        // 更新類別和標籤
        if (!categories.includes(formData.category)) {
          setCategories([...categories, formData.category]);
        }
        
        const newTags = formData.tags.filter(tag => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags([...tags, ...newTags]);
        }
        
        // 顯示成功通知
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.editSuccessTitle'),
          message: t('knowledge.editSuccessMessage')
        });
      } else if (dialogType === 'delete' && currentItem) {
        // 刪除知識項目
        await api.delete(`/knowledge/${currentItem.id}`);
        
        // 更新知識項目列表
        setKnowledgeItems(knowledgeItems.filter(item => item.id !== currentItem.id));
        
        // 顯示成功通知
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.deleteSuccessTitle'),
          message: t('knowledge.deleteSuccessMessage')
        });
      }
      
      // 關閉對話框
      setOpenDialog(false);
    } catch (error) {
      console.error('提交知識項目錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t(`knowledge.errors.${dialogType}Title`),
        message: t(`knowledge.errors.${dialogType}Message`)
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  /**
   * 格式化日期
   */
  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: zhTW });
  };
  
  /**
   * 渲染對話框內容
   */
  const renderDialogContent = () => {
    if (dialogType === 'delete' && currentItem) {
      return (
        <>
          <DialogContent>
            <Typography>
              {t('knowledge.deleteConfirmation', { title: currentItem.title })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button 
              color="error" 
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : null}
            >
              {t('common.delete')}
            </Button>
          </DialogActions>
        </>
      );
    }
    
    return (
      <>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('knowledge.title')}
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                disabled={submitting}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('knowledge.content')}
                name="content"
                value={formData.content}
                onChange={handleFormChange}
                error={!!formErrors.content}
                helperText={formErrors.content}
                disabled={submitting}
                required
                multiline
                rows={6}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>{t('knowledge.category')}</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  disabled={submitting}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                  <MenuItem value="other">{t('knowledge.other')}</MenuItem>
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error">
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('knowledge.tags')}</InputLabel>
                <Select
                  multiple
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  disabled={submitting}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('knowledge.source')}
                name="source"
                value={formData.source}
                onChange={handleFormChange}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {dialogType === 'add' ? t('common.add') : t('common.save')}
          </Button>
        </DialogActions>
      </>
    );
  };
  
  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 頭部 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              <KnowledgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('knowledge.title')}
            </Typography>
            
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                {t('common.refresh')}
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                {t('knowledge.addItem')}
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('knowledge.search')}
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('knowledge.filterByCategory')}</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label={t('knowledge.filterByCategory')}
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">{t('knowledge.allCategories')}</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('knowledge.filterByTags')}</InputLabel>
                <Select
                  multiple
                  value={selectedTags}
                  onChange={handleTagChange}
                  label={t('knowledge.filterByTags')}
                  startAdornment={
                    <InputAdornment position="start">
                      <TagIcon />
                    </InputAdornment>
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mt: 2 }}
          >
            <Tab label={t('knowledge.tabs.all')} />
            <Tab label={t('knowledge.tabs.active')} />
            <Tab label={t('knowledge.tabs.inactive')} />
          </Tabs>
        </Box>
        
        {/* 表格 */}
        <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('knowledge.title')}</TableCell>
                <TableCell>{t('knowledge.category')}</TableCell>
                <TableCell>{t('knowledge.tags')}</TableCell>
                <TableCell>{t('knowledge.status')}</TableCell>
                <TableCell>{t('knowledge.updatedAt')}</TableCell>
                <TableCell align="right">{t('knowledge.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      {searchQuery || selectedCategory || selectedTags.length > 0
                        ? t('knowledge.noSearchResults')
                        : t('knowledge.noItems')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {item.content.length > 100 
                            ? item.content.substring(0, 100) + '...' 
                            : item.content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.category} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.tags.map((tag) => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.isActive ? t('knowledge.active') : t('knowledge.inactive')} 
                          size="small"
                          color={item.isActive ? 'success' : 'default'}
                          variant={item.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(item.updatedAt)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={() => handleEditItem(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" onClick={() => handleDeleteItem(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* 分頁 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </Paper>
      
      {/* 對話框 */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'add' 
            ? t('knowledge.addItem') 
            : dialogType === 'edit' 
              ? t('knowledge.editItem') 
              : t('knowledge.deleteItem')}
        </DialogTitle>
        {renderDialogContent()}
      </Dialog>
    </Box>
  );
};

export default KnowledgePage;