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
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon,
  Info as InfoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import knowledgeEnhancementService, { KnowledgeExtractionResult } from '../../services/knowledgeEnhancementService';
import { Conversation } from '../../types/message';

interface KnowledgeExtractionProps {
  conversation?: Conversation;
  originalResponse?: string;
  modifiedResponse?: string;
  messageContext?: string[];
  conversationId?: string;
  onComplete?: () => void;
}

/**
 * 知識提取組件
 * 用於從對話或修改的 AI 回覆中提取知識
 */
const KnowledgeExtraction: React.FC<KnowledgeExtractionProps> = ({
  conversation,
  originalResponse,
  modifiedResponse,
  messageContext = [],
  conversationId,
  onComplete,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [loading, setLoading] = useState(false);
  const [extractionResults, setExtractionResults] = useState<KnowledgeExtractionResult[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 處理提取知識
   */
  const handleExtractKnowledge = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (conversation) {
        // 從對話中提取知識
        result = await knowledgeEnhancementService.extractFromConversation(conversation);
      } else if (originalResponse && modifiedResponse && conversationId) {
        // 從修改的 AI 回覆中提取知識
        result = await knowledgeEnhancementService.extractFromModifiedResponse(
          originalResponse,
          modifiedResponse,
          messageContext,
          conversationId
        );
      } else {
        throw new Error('缺少必要的數據');
      }
      
      setExtractionResults(result.extractionResults);
      setSavedIds(result.savedIds);
      
      // 顯示通知
      if (result.extractedCount > 0) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.extraction.successTitle'),
          message: t('knowledge.extraction.successMessage', {
            count: result.extractedCount,
            savedCount: result.savedIds.length,
          }),
        });
      } else {
        addNotification({
          type: NotificationType.INFO,
          title: t('knowledge.extraction.noResultsTitle'),
          message: t('knowledge.extraction.noResultsMessage'),
        });
      }
      
      // 調用完成回調
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('提取知識錯誤:', error);
      
      setError(error.message || '提取知識時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.extraction.errorTitle'),
        message: t('knowledge.extraction.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 處理展開/收起項目
   */
  const handleToggleItem = (index: number) => {
    setExpandedItems({
      ...expandedItems,
      [index]: !expandedItems[index],
    });
  };
  
  /**
   * 渲染提取結果
   */
  const renderExtractionResults = () => {
    if (extractionResults.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>{t('knowledge.extraction.noResultsTitle')}</AlertTitle>
          {t('knowledge.extraction.noResultsMessage')}
        </Alert>
      );
    }
    
    return (
      <List component={Paper} variant="outlined" sx={{ mt: 2 }}>
        {extractionResults.map((result, index) => (
          <React.Fragment key={index}>
            <ListItem
              button
              onClick={() => handleToggleItem(index)}
              secondaryAction={
                <Tooltip title={expandedItems[index] ? t('common.collapse') : t('common.expand')}>
                  <IconButton edge="end" size="small">
                    {expandedItems[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="medium">
                      {result.title}
                    </Typography>
                    {savedIds.includes(result.extractedFrom.conversationId) && (
                      <Chip
                        size="small"
                        color="success"
                        icon={<CheckIcon />}
                        label={t('knowledge.extraction.saved')}
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Chip
                      size="small"
                      icon={<CategoryIcon />}
                      label={result.category}
                      sx={{ mr: 1 }}
                    />
                    <Tooltip title={t('knowledge.extraction.confidenceScore')}>
                      <Chip
                        size="small"
                        icon={<InfoIcon />}
                        label={`${Math.round(result.confidence * 100)}%`}
                        color={result.confidence > 0.7 ? 'success' : result.confidence > 0.5 ? 'warning' : 'error'}
                      />
                    </Tooltip>
                  </Box>
                }
              />
            </ListItem>
            
            <Collapse in={expandedItems[index]} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.content}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {result.tags.map((tag) => (
                    <Chip
                      key={tag}
                      size="small"
                      icon={<TagIcon />}
                      label={tag}
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('knowledge.extraction.source')}: {result.source}
                  </Typography>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={savedIds.includes(result.extractedFrom.conversationId)}
                  >
                    {t('knowledge.extraction.addToKnowledgeBase')}
                  </Button>
                </Box>
              </Box>
            </Collapse>
            
            {index < extractionResults.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {t('knowledge.extraction.title')}
            </Typography>
          </Box>
        }
        subheader={t('knowledge.extraction.description')}
      />
      
      <Divider />
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>{t('knowledge.extraction.errorTitle')}</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleExtractKnowledge}
          disabled={loading || (!conversation && (!originalResponse || !modifiedResponse || !conversationId))}
          startIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
          fullWidth
        >
          {loading
            ? t('common.processing')
            : conversation
              ? t('knowledge.extraction.extractFromConversation')
              : t('knowledge.extraction.extractFromModifiedResponse')}
        </Button>
        
        {(extractionResults.length > 0 || loading) && renderExtractionResults()}
      </CardContent>
    </Card>
  );
};

export default KnowledgeExtraction;