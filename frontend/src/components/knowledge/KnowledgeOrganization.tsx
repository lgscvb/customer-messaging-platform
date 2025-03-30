import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Rating,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon,
  Link as LinkIcon,
  School as SchoolIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import knowledgeEnhancementService, {
  KnowledgeOrganizationResult,
  CategorySuggestion,
  TagSuggestion,
  KnowledgeRelation,
} from '../../services/knowledgeEnhancementService';

interface KnowledgeOrganizationProps {
  knowledgeItemId: string;
  onComplete?: () => void;
}

/**
 * 知識組織組件
 * 用於組織知識項目，提供分類、標籤和關聯建議
 */
const KnowledgeOrganization: React.FC<KnowledgeOrganizationProps> = ({
  knowledgeItemId,
  onComplete,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [organizationResult, setOrganizationResult] = useState<KnowledgeOrganizationResult | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    tags: true,
    relations: true,
  });
  const [applyOptions, setApplyOptions] = useState({
    categories: true,
    tags: true,
    relations: true,
  });
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 處理組織知識
   */
  const handleOrganizeKnowledge = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 組織知識項目
      const result = await knowledgeEnhancementService.organizeKnowledgeItem(knowledgeItemId);
      
      setOrganizationResult(result);
      
      // 顯示通知
      if (
        result.suggestedCategories.length > 0 ||
        result.suggestedTags.length > 0 ||
        result.suggestedRelations.length > 0
      ) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.organization.successTitle'),
          message: t('knowledge.organization.successMessage'),
        });
      } else {
        addNotification({
          type: NotificationType.INFO,
          title: t('knowledge.organization.noSuggestionsTitle'),
          message: t('knowledge.organization.noSuggestionsMessage'),
        });
      }
    } catch (error) {
      console.error('組織知識錯誤:', error);
      
      setError(error.message || '組織知識時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.organization.errorTitle'),
        message: t('knowledge.organization.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 處理應用組織結果
   */
  const handleApplyOrganizationResult = async () => {
    if (!organizationResult) return;
    
    try {
      setApplying(true);
      
      // 應用組織結果
      const success = await knowledgeEnhancementService.applyOrganizationResult(
        organizationResult,
        applyOptions.categories,
        applyOptions.tags,
        applyOptions.relations
      );
      
      if (success) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.organization.applySuccessTitle'),
          message: t('knowledge.organization.applySuccessMessage'),
        });
        
        // 調用完成回調
        if (onComplete) {
          onComplete();
        }
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: t('knowledge.organization.applyErrorTitle'),
          message: t('knowledge.organization.applyErrorMessage'),
        });
      }
    } catch (error) {
      console.error('應用組織結果錯誤:', error);
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.organization.applyErrorTitle'),
        message: t('knowledge.organization.applyErrorMessage'),
      });
    } finally {
      setApplying(false);
    }
  };
  
  /**
   * 處理展開/收起部分
   */
  const handleToggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  /**
   * 處理應用選項變更
   */
  const handleApplyOptionChange = (option: keyof typeof applyOptions) => {
    setApplyOptions({
      ...applyOptions,
      [option]: !applyOptions[option],
    });
  };
  
  /**
   * 渲染分類建議
   */
  const renderCategorySuggestions = () => {
    if (!organizationResult || organizationResult.suggestedCategories.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('knowledge.organization.noCategorySuggestions')}
        </Alert>
      );
    }
    
    return (
      <List component={Paper} variant="outlined" sx={{ mt: 2 }}>
        {organizationResult.suggestedCategories.map((category, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="medium">
                      {category.name}
                    </Typography>
                    {category.parentCategory && (
                      <Chip
                        size="small"
                        label={`${t('knowledge.organization.parentCategory')}: ${category.parentCategory}`}
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2">
                      {category.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {t('knowledge.organization.confidence')}:
                      </Typography>
                      <Rating
                        value={category.confidence * 5}
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({Math.round(category.confidence * 100)}%)
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < organizationResult.suggestedCategories.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  /**
   * 渲染標籤建議
   */
  const renderTagSuggestions = () => {
    if (!organizationResult || organizationResult.suggestedTags.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('knowledge.organization.noTagSuggestions')}
        </Alert>
      );
    }
    
    return (
      <List component={Paper} variant="outlined" sx={{ mt: 2 }}>
        {organizationResult.suggestedTags.map((tag, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TagIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="medium">
                      {tag.name}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2">
                      {tag.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {t('knowledge.organization.confidence')}:
                      </Typography>
                      <Rating
                        value={tag.confidence * 5}
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({Math.round(tag.confidence * 100)}%)
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < organizationResult.suggestedTags.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  /**
   * 渲染關聯建議
   */
  const renderRelationSuggestions = () => {
    if (!organizationResult || organizationResult.suggestedRelations.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('knowledge.organization.noRelationSuggestions')}
        </Alert>
      );
    }
    
    return (
      <List component={Paper} variant="outlined" sx={{ mt: 2 }}>
        {organizationResult.suggestedRelations.map((relation, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="medium">
                      {t(`knowledge.organization.relationType.${relation.relationType}`)}
                    </Typography>
                    <Chip
                      size="small"
                      label={`ID: ${relation.targetId}`}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      {t('knowledge.organization.relationStrength')}:
                    </Typography>
                    <Rating
                      value={relation.strength * 5}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({Math.round(relation.strength * 100)}%)
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < organizationResult.suggestedRelations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  /**
   * 渲染應用選項
   */
  const renderApplyOptions = () => {
    if (!organizationResult) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('knowledge.organization.applyOptions')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyOptions.categories}
                  onChange={() => handleApplyOptionChange('categories')}
                  disabled={organizationResult.suggestedCategories.length === 0}
                />
              }
              label={t('knowledge.organization.applyCategories')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyOptions.tags}
                  onChange={() => handleApplyOptionChange('tags')}
                  disabled={organizationResult.suggestedTags.length === 0}
                />
              }
              label={t('knowledge.organization.applyTags')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyOptions.relations}
                  onChange={() => handleApplyOptionChange('relations')}
                  disabled={organizationResult.suggestedRelations.length === 0}
                />
              }
              label={t('knowledge.organization.applyRelations')}
            />
          </Grid>
        </Grid>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyOrganizationResult}
          disabled={
            applying ||
            (!applyOptions.categories && !applyOptions.tags && !applyOptions.relations)
          }
          startIcon={applying ? <CircularProgress size={20} /> : <SaveIcon />}
          fullWidth
          sx={{ mt: 2 }}
        >
          {applying
            ? t('common.processing')
            : t('knowledge.organization.applyChanges')}
        </Button>
      </Box>
    );
  };
  
  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {t('knowledge.organization.title')}
            </Typography>
          </Box>
        }
        subheader={t('knowledge.organization.description')}
      />
      
      <Divider />
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>{t('knowledge.organization.errorTitle')}</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleOrganizeKnowledge}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
          fullWidth
        >
          {loading
            ? t('common.processing')
            : t('knowledge.organization.organizeKnowledge')}
        </Button>
        
        {organizationResult && (
          <Box sx={{ mt: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleSection('categories')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    {t('knowledge.organization.categorySuggestions')}
                    {' '}
                    ({organizationResult.suggestedCategories.length})
                  </Typography>
                </Box>
                
                <IconButton size="small">
                  {expandedSections.categories ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.categories} timeout="auto" unmountOnExit>
                {renderCategorySuggestions()}
              </Collapse>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleSection('tags')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TagIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    {t('knowledge.organization.tagSuggestions')}
                    {' '}
                    ({organizationResult.suggestedTags.length})
                  </Typography>
                </Box>
                
                <IconButton size="small">
                  {expandedSections.tags ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.tags} timeout="auto" unmountOnExit>
                {renderTagSuggestions()}
              </Collapse>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleSection('relations')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    {t('knowledge.organization.relationSuggestions')}
                    {' '}
                    ({organizationResult.suggestedRelations.length})
                  </Typography>
                </Box>
                
                <IconButton size="small">
                  {expandedSections.relations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.relations} timeout="auto" unmountOnExit>
                {renderRelationSuggestions()}
              </Collapse>
            </Paper>
            
            {renderApplyOptions()}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeOrganization;