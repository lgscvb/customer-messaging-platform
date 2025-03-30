import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  CircularProgress, 
  Collapse, 
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardActions,
  Skeleton,
  Rating
} from '@mui/material';
import { 
  AutoAwesome as AiIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  History as HistoryIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { AiReplySuggestion, AiReplySource, Message } from '../../types/message';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import api from '../../services/api';

/**
 * AI 回覆建議屬性接口
 */
interface AiReplySuggestionsProps {
  message?: Message;
  onSelectSuggestion: (suggestion: AiReplySuggestion) => void;
  selectedSuggestionId?: string;
}

/**
 * AI 回覆建議組件
 */
const AiReplySuggestions: React.FC<AiReplySuggestionsProps> = ({ 
  message, 
  onSelectSuggestion,
  selectedSuggestionId
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // 狀態
  const [suggestions, setSuggestions] = useState<AiReplySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [regenerating, setRegenerating] = useState(false);
  
  /**
   * 獲取 AI 回覆建議
   */
  useEffect(() => {
    if (!message) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/ai/suggestions?messageId=${message.id}`);
        setSuggestions(response.data);
        
        // 初始化展開狀態
        const sourcesState: Record<string, boolean> = {};
        response.data.forEach((suggestion: AiReplySuggestion) => {
          sourcesState[suggestion.id] = false;
        });
        setExpandedSources(sourcesState);
      } catch (error) {
        console.error('獲取 AI 回覆建議錯誤:', error);
        addNotification({
          type: NotificationType.ERROR,
          title: t('ai.errors.fetchSuggestionsTitle'),
          message: t('ai.errors.fetchSuggestionsMessage')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [message, addNotification, t]);
  
  /**
   * 重新生成建議
   */
  const handleRegenerate = async () => {
    if (!message) return;
    
    try {
      setRegenerating(true);
      const response = await api.post(`/ai/suggestions/regenerate`, { messageId: message.id });
      setSuggestions(response.data);
      
      // 初始化展開狀態
      const sourcesState: Record<string, boolean> = {};
      response.data.forEach((suggestion: AiReplySuggestion) => {
        sourcesState[suggestion.id] = false;
      });
      setExpandedSources(sourcesState);
      
      // 顯示成功通知
      addNotification({
        type: NotificationType.SUCCESS,
        title: t('ai.regenerateSuccessTitle'),
        message: t('ai.regenerateSuccessMessage')
      });
    } catch (error) {
      console.error('重新生成 AI 回覆建議錯誤:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: t('ai.errors.regenerateTitle'),
        message: t('ai.errors.regenerateMessage')
      });
    } finally {
      setRegenerating(false);
    }
  };
  
  /**
   * 切換展開/收起
   */
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  /**
   * 切換來源展開/收起
   */
  const toggleSourceExpanded = (suggestionId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
  };
  
  /**
   * 處理選擇建議
   */
  const handleSelectSuggestion = (suggestion: AiReplySuggestion) => {
    onSelectSuggestion(suggestion);
  };
  
  /**
   * 複製建議
   */
  const handleCopySuggestion = (suggestion: AiReplySuggestion) => {
    navigator.clipboard.writeText(suggestion.content);
    
    // 顯示成功通知
    addNotification({
      type: NotificationType.SUCCESS,
      title: t('ai.copiedTitle'),
      message: t('ai.copiedMessage')
    });
  };
  
  /**
   * 獲取來源圖標
   */
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'knowledge':
        return <SchoolIcon fontSize="small" />;
      case 'conversation':
        return <HistoryIcon fontSize="small" />;
      case 'external':
        return <LightbulbIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };
  
  /**
   * 渲染來源
   */
  const renderSources = (suggestion: AiReplySuggestion) => {
    if (!suggestion.sources || suggestion.sources.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          {t('ai.noSources')}
        </Typography>
      );
    }
    
    return (
      <List dense disablePadding>
        {suggestion.sources.map((source: AiReplySource) => (
          <ListItem key={source.id} disablePadding sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getSourceIcon(source.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight="medium">
                  {source.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {source.content.length > 100 
                    ? source.content.substring(0, 100) + '...' 
                    : source.content}
                </Typography>
              }
            />
            <Chip 
              size="small" 
              label={`${Math.round(source.relevance * 100)}%`}
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                backgroundColor: source.relevance > 0.7 ? '#4CAF5020' : '#FFC10720',
                color: source.relevance > 0.7 ? '#4CAF50' : '#FFC107',
              }}
            />
          </ListItem>
        ))}
      </List>
    );
  };
  
  /**
   * 渲染建議卡片
   */
  const renderSuggestionCard = (suggestion: AiReplySuggestion) => {
    const isSelected = selectedSuggestionId === suggestion.id;
    
    return (
      <Card 
        key={suggestion.id} 
        variant="outlined"
        sx={{ 
          mb: 2,
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderWidth: isSelected ? 2 : 1,
          backgroundColor: isSelected ? 'primary.light' : 'background.paper',
          '&:hover': {
            borderColor: isSelected ? 'primary.main' : 'primary.light',
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AiIcon fontSize="small" sx={{ color: '#8C6EFF', mr: 0.5 }} />
              <Typography variant="subtitle2" fontWeight="medium" color={isSelected ? 'primary.dark' : 'text.primary'}>
                {t('ai.suggestion')} #{suggestions.indexOf(suggestion) + 1}
              </Typography>
            </Box>
            <Rating 
              value={suggestion.confidence * 5} 
              precision={0.5} 
              readOnly 
              size="small"
            />
          </Box>
          
          <Typography 
            variant="body2" 
            color={isSelected ? 'primary.dark' : 'text.primary'}
            sx={{ whiteSpace: 'pre-wrap' }}
          >
            {suggestion.content}
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              startIcon={<InfoIcon fontSize="small" />}
              onClick={() => toggleSourceExpanded(suggestion.id)}
              sx={{ textTransform: 'none' }}
            >
              {expandedSources[suggestion.id] ? t('ai.hideSources') : t('ai.showSources')}
              {expandedSources[suggestion.id] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Button>
            
            <Collapse in={expandedSources[suggestion.id]}>
              <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                {renderSources(suggestion)}
              </Box>
            </Collapse>
          </Box>
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
          <Tooltip title={t('ai.copy')}>
            <IconButton size="small" onClick={() => handleCopySuggestion(suggestion)}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('ai.edit')}>
            <IconButton size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Button
            size="small"
            variant={isSelected ? "contained" : "outlined"}
            color="primary"
            startIcon={isSelected ? <CheckIcon /> : null}
            onClick={() => handleSelectSuggestion(suggestion)}
            sx={{ ml: 1 }}
          >
            {isSelected ? t('ai.selected') : t('ai.use')}
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  /**
   * 渲染載入中狀態
   */
  const renderLoading = () => {
    return (
      <>
        {[1, 2].map((item) => (
          <Card key={item} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Skeleton width={100} height={24} />
                <Skeleton width={100} height={24} />
              </Box>
              <Skeleton width="100%" height={20} />
              <Skeleton width="100%" height={20} />
              <Skeleton width="80%" height={20} />
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
              <Skeleton width={100} height={36} />
            </CardActions>
          </Card>
        ))}
      </>
    );
  };
  
  // 如果沒有選擇消息，顯示空白狀態
  if (!message) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <AiIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary" align="center">
          {t('ai.noMessageSelected')}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* 頭部 */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AiIcon sx={{ color: '#8C6EFF', mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {t('ai.replySuggestions')}
          </Typography>
        </Box>
        
        <Box>
          <Button
            size="small"
            startIcon={regenerating ? <CircularProgress size={16} /> : null}
            onClick={handleRegenerate}
            disabled={regenerating || loading}
          >
            {t('ai.regenerate')}
          </Button>
          <IconButton size="small" onClick={toggleExpanded}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* 內容 */}
      <Collapse in={expanded} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          {loading ? (
            renderLoading()
          ) : suggestions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {t('ai.noSuggestions')}
              </Typography>
              <Button
                variant="outlined"
                startIcon={regenerating ? <CircularProgress size={16} /> : <AiIcon />}
                onClick={handleRegenerate}
                disabled={regenerating}
                sx={{ mt: 2 }}
              >
                {t('ai.generateSuggestions')}
              </Button>
            </Box>
          ) : (
            suggestions.map(renderSuggestionCard)
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AiReplySuggestions;