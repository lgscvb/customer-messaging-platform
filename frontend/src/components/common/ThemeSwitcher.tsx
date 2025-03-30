import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * 主題切換組件屬性
 */
interface ThemeSwitcherProps {
  iconOnly?: boolean;
}

/**
 * 主題切換組件
 * 用於切換亮色/暗色主題
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ iconOnly = false }) => {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={mode === 'light' ? t('common.darkMode') : t('common.lightMode')}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label={mode === 'light' ? t('common.darkMode') : t('common.lightMode')}
        sx={{ ml: iconOnly ? 0 : 1 }}
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeSwitcher;