import React from 'react';
import { Box, Button, Typography, Paper, CircularProgress, IconButton, Tooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTranslation } from 'react-i18next';
import { useNotifications, NotificationType } from '../../contexts/NotificationContext';
import api from '../../services/api';

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

interface FileUploaderProps {
  onUploadComplete?: (knowledgeItemIds: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number; // 以 MB 為單位
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  maxFiles = 10,
  acceptedFileTypes = '.pdf,.txt,.csv,.json,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.webm',
  maxFileSize = 50 // 默認最大 50MB
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 添加檔案
  const addFiles = React.useCallback((newFiles: File[]) => {
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
  }, [files.length, maxFiles, maxFileSize, addNotification, t]);

  // 處理檔案拖放
  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  // 處理檔案選擇
  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      
      // 清空檔案輸入，以便可以再次選擇相同的檔案
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [addFiles, fileInputRef]);


  // 移除檔案
  const removeFile = React.useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);
// 上傳單個檔案
  // 上傳單個檔案
  const uploadFile = React.useCallback(async (fileInfo: FileInfo, index: number) => {
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
  }, [t]);

  // 上傳所有檔案
  const uploadAllFiles = React.useCallback(async () => {
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
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('common.error'),
        message: t('knowledge.fileUploader.batchUploadFailed')
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, addNotification, t, uploadFile, onUploadComplete]);

  // 獲取檔案類型圖標
  const getFileTypeIcon = (file: File) => {
    return fileTypeIcons[file.type] || fileTypeIcons.default;
  };

  // 獲取檔案大小顯示
  const getFileSizeDisplay = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // 獲取檔案狀態圖標
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.SUCCESS:
        return <CheckCircleIcon color="success" />;
      case FileStatus.ERROR:
        return <ErrorIcon color="error" />;
      case FileStatus.UPLOADING:
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
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
          mb: 2
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
          {t('knowledge.fileUploader.dragAndDrop')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('knowledge.fileUploader.or')}
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
          {t('knowledge.fileUploader.browseFiles')}
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          {t('knowledge.fileUploader.supportedFormats')}: PDF, TXT, CSV, JSON, JPG, PNG, GIF, MP3, WAV, MP4, WEBM
        </Typography>
        <Typography variant="caption" display="block">
          {t('knowledge.fileUploader.maxFileSize')}: {maxFileSize} MB
        </Typography>
      </Paper>

      {/* 檔案列表 */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('knowledge.fileUploader.selectedFiles')} ({files.length})
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            {files.map((fileInfo, index) => (
              <Box
                key={`${fileInfo.file.name}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  borderBottom: index < files.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ mr: 2, fontSize: '24px' }}>
                  {getFileTypeIcon(fileInfo.file)}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" noWrap title={fileInfo.file.name}>
                    {fileInfo.file.name}
                  </Typography>
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
                </Box>
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(fileInfo.status)}
                  <IconButton
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
              </Box>
            ))}
          </Paper>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={uploadAllFiles}
              disabled={isUploading || files.every(f => f.status !== FileStatus.PENDING)}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {isUploading
                ? t('knowledge.fileUploader.uploading')
                : t('knowledge.fileUploader.uploadAll')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;