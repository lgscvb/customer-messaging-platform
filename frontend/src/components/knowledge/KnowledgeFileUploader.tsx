import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotifications, NotificationType } from '../../contexts/NotificationContext';
import api from '../../services/api';

// 檔案狀態
enum FileStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 檔案信息接口
interface FileInfo {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  knowledgeItemId?: string;
}

// 檔案類型圖標映射
const fileTypeIcons: Record<string, string> = {
  'application/pdf': '📄',
  'text/plain': '📝',
  'text/csv': '📊',
  'application/json': '📋',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'audio/mpeg': '🎵',
  'audio/wav': '🎵',
  'video/mp4': '🎬',
  'video/webm': '🎬',
  'default': '📁'
};

interface KnowledgeFileUploaderProps {
  onUploadComplete?: (knowledgeItemIds: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number; // 以 MB 為單位
}

/**
 * 知識檔案上傳組件
 * 用於上傳各種類型的檔案到知識庫
 */
const KnowledgeFileUploader: React.FC<KnowledgeFileUploaderProps> = ({
  onUploadComplete,
  maxFiles = 10,
  acceptedFileTypes = '.pdf,.txt,.csv,.json,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.webm',
  maxFileSize = 50 // 默認最大 50MB
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 狀態
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<Record<number, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  
  /**
   * 處理檔案拖放
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    addFiles(droppedFiles);
  };
  
  /**
   * 處理檔案選擇
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      addFiles(selectedFiles);
      
      // 清空檔案輸入，以便可以再次選擇相同的檔案
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  /**
   * 添加檔案
   */
  const addFiles = (newFiles: File[]) => {
    // 檢查檔案數量限制
    if (files.length + newFiles.length > maxFiles) {
      addNotification({
        type: NotificationType.ERROR,
        title: t('common.error'),
        message: t('knowledge.fileUploader.tooManyFiles', { max: maxFiles })
      });
      return;
    }
    
    // 過濾檔案
    const validFiles = newFiles.filter(file => {
      // 檢查檔案大小
      if (file.size > maxFileSize * 1024 * 1024) {
        addNotification({
          type: NotificationType.ERROR,
          title: t('common.error'),
          message: t('knowledge.fileUploader.fileTooLarge', { name: file.name, size: maxFileSize })
        });
        return false;
      }
      
      return true;
    });
    
    // 添加檔案到列表
    setFiles(prevFiles => [
      ...prevFiles,
      ...validFiles.map(file => ({
        file,
        status: FileStatus.PENDING,
        progress: 0
      }))
    ]);
  };
  
  /**
   * 移除檔案
   */
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  /**
   * 上傳單個檔案
   */
  const uploadFile = async (fileInfo: FileInfo, index: number) => {
    // 更新檔案狀態為上傳中
    setFiles(prevFiles => prevFiles.map((f, i) => 
      i === index ? { ...f, status: FileStatus.UPLOADING, progress: 0 } : f
    ));
    
    try {
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      
      const response = await api.post('/file-extraction/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // 更新上傳進度
            setFiles(prevFiles => prevFiles.map((f, i) => 
              i === index ? { ...f, progress } : f
            ));
          }
        }
      });
      
      // 上傳成功
      if (response.data.success) {
        const knowledgeItemId = response.data.data.knowledgeItemId;
        
        // 更新檔案狀態為成功
        setFiles(prevFiles => prevFiles.map((f, i) => 
          i === index ? { 
            ...f, 
            status: FileStatus.SUCCESS, 
            progress: 100,
            knowledgeItemId
          } : f
        ));
        
        return knowledgeItemId;
      } else {
        throw new Error(response.data.message || t('knowledge.fileUploader.uploadFailed'));
      }
    } catch (error) {
      console.error('檔案上傳錯誤:', error);
      
      // 更新檔案狀態為錯誤
      setFiles(prevFiles => prevFiles.map((f, i) => 
        i === index ? { 
          ...f, 
          status: FileStatus.ERROR, 
          error: error instanceof Error ? error.message : t('knowledge.fileUploader.uploadFailed')
        } : f
      ));
      
      return null;
    }
  };
  
  /**
   * 上傳所有檔案
   */
  const uploadAllFiles = async () => {
    if (files.length === 0) {
      addNotification({
        type: NotificationType.WARNING,
        title: t('common.warning'),
        message: t('knowledge.fileUploader.noFiles')
      });
      return;
    }
    
    if (isUploading) {
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const pendingFiles = files.filter(f => f.status === FileStatus.PENDING);
      
      if (pendingFiles.length === 0) {
        addNotification({
          type: NotificationType.WARNING,
          title: t('common.warning'),
          message: t('knowledge.fileUploader.allFilesUploaded')
        });
        setIsUploading(false);
        return;
      }
      
      // 逐個上傳檔案
      const knowledgeItemIds: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        
        if (fileInfo.status === FileStatus.PENDING) {
          const knowledgeItemId = await uploadFile(fileInfo, i);
          
          if (knowledgeItemId) {
            knowledgeItemIds.push(knowledgeItemId);
          }
        }
      }
      
      // 上傳完成後通知
      if (knowledgeItemIds.length > 0) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('common.success'),
          message: t('knowledge.fileUploader.uploadSuccess', { count: knowledgeItemIds.length })
        });
        
        // 調用上傳完成回調
        if (onUploadComplete) {
          onUploadComplete(knowledgeItemIds);
        }
      }
    } catch (error) {
      console.error('批量上傳錯誤:', error);
      
      setError(error instanceof Error ? error.message : '上傳檔案時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('common.error'),
        message: t('knowledge.fileUploader.batchUploadFailed')
      });
    } finally {
      setIsUploading(false);
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
   * 獲取檔案類型圖標
   */
  const getFileTypeIcon = (file: File) => {
    return fileTypeIcons[file.type] || fileTypeIcons.default;
  };
  
  /**
   * 獲取檔案大小顯示
   */
  const getFileSizeDisplay = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  /**
   * 獲取檔案狀態圖標
   */
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.SUCCESS:
        return <CheckIcon color="success" />;
      case FileStatus.ERROR:
        return <CloseIcon color="error" />;
      case FileStatus.UPLOADING:
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };
  
  /**
   * 渲染檔案列表
   */
  const renderFileList = () => {
    if (files.length === 0) {
      return null;
    }
    
    return (
      <List component={Paper} variant="outlined" sx={{ mt: 2 }}>
        {files.map((fileInfo, index) => (
          <React.Fragment key={`${fileInfo.file.name}-${index}`}>
            <ListItem
              button
              onClick={() => handleToggleItem(index)}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(fileInfo.status)}
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={fileInfo.status === FileStatus.UPLOADING}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, fontSize: '24px' }}>
                      {getFileTypeIcon(fileInfo.file)}
                    </Typography>
                    <Typography variant="body2" noWrap title={fileInfo.file.name}>
                      {fileInfo.file.name}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                      {getFileSizeDisplay(fileInfo.file.size)}
                    </Typography>
                    {fileInfo.status === FileStatus.UPLOADING && (
                      <Typography variant="caption" color="primary">
                        {fileInfo.progress}%
                      </Typography>
                    )}
                    {fileInfo.status === FileStatus.ERROR && (
                      <Tooltip title={fileInfo.error || ''}>
                        <Typography variant="caption" color="error">
                          {t('knowledge.fileUploader.error')}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                }
              />
            </ListItem>
            
            {index < files.length - 1 && <Divider />}
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
            <CloudUploadIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {t('knowledge.fileUploader.title', '檔案上傳')}
            </Typography>
          </Box>
        }
        subheader={t('knowledge.fileUploader.description', '上傳各種類型的檔案到知識庫')}
      />
      
      <Divider />
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>{t('common.error')}</AlertTitle>
            {error}
          </Alert>
        )}
        
        {/* 拖放區域 */}
        <Paper
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'background.paper',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {t('knowledge.fileUploader.dragAndDrop', '拖曳檔案到此處')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('knowledge.fileUploader.or', '或')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {t('knowledge.fileUploader.browseFiles', '瀏覽檔案')}
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {t('knowledge.fileUploader.supportedFormats', '支援的格式')}: PDF, TXT, CSV, JSON, JPG, PNG, GIF, MP3, WAV, MP4, WEBM
          </Typography>
          <Typography variant="caption" display="block">
            {t('knowledge.fileUploader.maxFileSize', '最大檔案大小')}: {maxFileSize} MB
          </Typography>
        </Paper>
        
        {/* 檔案列表 */}
        {renderFileList()}
        
        {/* 上傳按鈕 */}
        {files.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={uploadAllFiles}
              disabled={isUploading || files.every(f => f.status !== FileStatus.PENDING)}
              startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
            >
              {isUploading
                ? t('knowledge.fileUploader.uploading', '上傳中...')
                : t('knowledge.fileUploader.uploadAll', '上傳所有檔案')}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeFileUploader;