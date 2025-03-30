import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

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
      id={`preview-tabpanel-${index}`}
      aria-labelledby={`preview-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// 獲取標籤屬性
const a11yProps = (index: number) => {
  return {
    id: `preview-tab-${index}`,
    'aria-controls': `preview-tabpanel-${index}`,
  };
};

interface FilePreviewProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
}

/**
 * 檔案預覽組件
 * 支持預覽各種類型的檔案
 */
const FilePreview: React.FC<FilePreviewProps> = ({ file, open, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tabValue, setTabValue] = React.useState(0);
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);

  // 處理標籤變更
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 獲取檔案類型圖標
  const getFileTypeEmoji = () => {
    if (!file) return '📄';

    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📑';
    } else if (fileType.startsWith('audio/')) {
      return '🎵';
    } else if (fileType.startsWith('video/')) {
      return '🎬';
    } else if (fileType === 'text/plain' || fileType === 'text/csv' || fileType === 'application/json') {
      return '📝';
    } else if (fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css')) {
      return '💻';
    } else {
      return '📄';
    }
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

  // 讀取檔案內容
  React.useEffect(() => {
    if (!file || !open) {
      setFileContent(null);
      setFileUrl(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // 創建檔案 URL
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // 如果是文本檔案，讀取內容
    if (
      file.type === 'text/plain' ||
      file.type === 'text/csv' ||
      file.type === 'application/json' ||
      file.type.includes('javascript') ||
      file.type.includes('html') ||
      file.type.includes('css') ||
      file.type.includes('xml') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.css') ||
      file.name.endsWith('.xml')
    ) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setFileContent(content);
          setLoading(false);
        } catch (error) {
          console.error('讀取檔案錯誤:', error);
          setError(t('knowledge.filePreview.readError', '讀取檔案時發生錯誤'));
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError(t('knowledge.filePreview.readError', '讀取檔案時發生錯誤'));
        setLoading(false);
      };
      
      reader.readAsText(file);
    } else {
      // 非文本檔案，直接顯示
      setLoading(false);
    }

    // 清理函數
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, open, t]);

  // 如果沒有檔案，不顯示
  if (!file) {
    return null;
  }

  // 渲染檔案內容
  const renderFileContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    // 根據檔案類型渲染不同的預覽
    const fileType = file.type;

    // 圖片預覽
    if (fileType.startsWith('image/')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <img
            src={fileUrl || ''}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </Box>
      );
    }
    
    // PDF 預覽
    if (fileType === 'application/pdf') {
      return (
        <Box sx={{ height: '100%' }}>
          <iframe
            src={fileUrl || ''}
            title={file.name}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }
    
    // 音頻預覽
    if (fileType.startsWith('audio/')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <audio controls src={fileUrl || ''} style={{ width: '100%' }}>
            {t('knowledge.filePreview.audioNotSupported', '您的瀏覽器不支持音頻預覽')}
          </audio>
        </Box>
      );
    }
    
    // 視頻預覽
    if (fileType.startsWith('video/')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <video controls src={fileUrl || ''} style={{ maxWidth: '100%', maxHeight: '100%' }}>
            {t('knowledge.filePreview.videoNotSupported', '您的瀏覽器不支持視頻預覽')}
          </video>
        </Box>
      );
    }
    
    // 文本預覽
    if (fileContent !== null) {
      return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {fileContent}
          </pre>
        </Box>
      );
    }
    
    // 不支持的檔案類型
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <Typography variant="body1" gutterBottom>
          {t('knowledge.filePreview.previewNotAvailable', '無法預覽此類型的檔案')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href={fileUrl || ''}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('knowledge.filePreview.download', '下載檔案')}
        </Button>
      </Box>
    );
  };

  // 渲染檔案信息
  const renderFileInfo = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('knowledge.filePreview.fileInfo', '檔案信息')}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {t('knowledge.filePreview.fileName', '檔案名稱')}:
          </Typography>
          <Typography variant="body1">{file.name}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {t('knowledge.filePreview.fileType', '檔案類型')}:
          </Typography>
          <Typography variant="body1">{file.type || t('knowledge.filePreview.unknown', '未知')}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {t('knowledge.filePreview.fileSize', '檔案大小')}:
          </Typography>
          <Typography variant="body1">{getFileSizeDisplay(file.size)}</Typography>
        </Box>
        
        <Box>
          <Typography variant="body2" color="textSecondary">
            {t('knowledge.filePreview.lastModified', '最後修改時間')}:
          </Typography>
          <Typography variant="body1">
            {new Date(file.lastModified).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mr: 1, fontSize: '24px' }}>
              {getFileTypeEmoji()}
            </Typography>
            <Typography variant="h6">
              {file.name}
            </Typography>
          </Box>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="file preview tabs"
            variant="fullWidth"
          >
            <Tab
              label={t('knowledge.filePreview.preview', '預覽')}
              {...a11yProps(0)}
            />
            <Tab
              label={t('knowledge.filePreview.info', '信息')}
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            {renderFileContent()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderFileInfo()}
          </TabPanel>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.close', '關閉')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreview;