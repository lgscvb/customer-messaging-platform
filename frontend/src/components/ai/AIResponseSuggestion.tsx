import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  CircularProgress, 
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  SmartToy as AIIcon, 
  Edit as EditIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// 知識來源介面
interface KnowledgeSource {
  id: string;
  title: string;
  relevanceScore: number;
}

// AI 回覆建議屬性
interface AIResponseSuggestionProps {
  messageContent: string;
  isLoading?: boolean;
  aiResponse?: string;
  confidenceScore?: number;
  knowledgeSources?: KnowledgeSource[];
  onAccept?: (response: string) => void;
  onEdit?: (response: string) => void;
  onRegenerate?: () => void;
}

/**
 * AI 回覆建議組件
 * 顯示 AI 生成的回覆建議，並允許客服人員接受、編輯或重新生成
 */
const AIResponseSuggestion: React.FC<AIResponseSuggestionProps> = ({
  messageContent,
  isLoading = false,
  aiResponse = '',
  confidenceScore = 0,
  knowledgeSources = [],
  onAccept,
  onEdit,
  onRegenerate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');
  const [showSources, setShowSources] = useState(false);
  
  // 處理編輯按鈕點擊
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedResponse(aiResponse);
  };
  
  // 處理保存編輯
  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editedResponse);
    }
  };
  
  // 處理取消編輯
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedResponse('');
  };
  
  // 獲取信心分數顏色
  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'error';
  };
  
  // 獲取信心分數標籤
  const getConfidenceLabel = (score: number) => {
    if (score >= 0.7) return '高';
    if (score >= 0.4) return '中';
    return '低';
  };

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AIIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            AI 輔助回覆
          </Typography>
          {!isLoading && confidenceScore > 0 && (
            <Chip 
              label={`信心: ${getConfidenceLabel(confidenceScore)}`}
              color={getConfidenceColor(confidenceScore)}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        {isLoading ? (
          <Box sx={{ width: '100%', textAlign: 'center', py: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              正在生成回覆...
            </Typography>
          </Box>
        ) : (
          <>
            {/* 顯示信心分數進度條 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                信心分數:
              </Typography>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={confidenceScore * 100} 
                  color={getConfidenceColor(confidenceScore)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {Math.round(confidenceScore * 100)}%
              </Typography>
            </Box>
            
            {/* 回覆內容 */}
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={6}
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography 
                variant="body1" 
                component="div" 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                  borderRadius: 1,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {aiResponse || '無法生成回覆。'}
              </Typography>
            )}
            
            {/* 操作按鈕 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                {isEditing ? (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveEdit}
                      startIcon={<CheckIcon />}
                      sx={{ mr: 1 }}
                    >
                      保存
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={handleCancelEdit}
                    >
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => onAccept && onAccept(aiResponse)}
                      startIcon={<CheckIcon />}
                      sx={{ mr: 1 }}
                      disabled={!aiResponse}
                    >
                      使用此回覆
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={handleEditClick}
                      startIcon={<EditIcon />}
                      sx={{ mr: 1 }}
                      disabled={!aiResponse}
                    >
                      編輯
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={onRegenerate}
                    >
                      重新生成
                    </Button>
                  </>
                )}
              </Box>
              
              {knowledgeSources.length > 0 && (
                <Tooltip title="顯示知識來源">
                  <IconButton onClick={() => setShowSources(!showSources)}>
                    {showSources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {/* 知識來源 */}
            {knowledgeSources.length > 0 && (
              <Collapse in={showSources}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                  知識來源
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {knowledgeSources.map((source) => (
                    <Box key={source.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {source.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        相關度: {Math.round(source.relevanceScore * 100)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIResponseSuggestion;