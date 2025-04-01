import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

/**
 * 語言選項介面
 */
interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

/**
 * 語言切換器組件
 * 允許用戶在不同語言之間切換
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // 支持的語言列表
  const languages: LanguageOption[] = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  // 獲取當前語言
  const getCurrentLanguage = (): LanguageOption => {
    const currentLangCode = i18n.language;
    return languages.find(lang => lang.code === currentLangCode) || languages[0];
  };

  // 處理菜單打開
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // 處理菜單關閉
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 處理語言變更
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    handleClose();
  };

  const currentLang = getCurrentLanguage();

  return (
    <div>
      <Button
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{ 
          textTransform: 'none',
          minWidth: '120px',
          justifyContent: 'flex-start'
        }}
      >
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px' }}>{currentLang.flag}</span>
          {currentLang.name}
        </Typography>
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {languages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === i18n.language}
          >
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
            </ListItemIcon>
            <ListItemText>{lang.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default LanguageSwitcher;