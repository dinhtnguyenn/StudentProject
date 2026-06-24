import { useEffect, useState } from 'react';
import { MenuItem, Menu, Button, Box, useTheme } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const theme = useTheme();
  const [lang, setLang] = useState('vi');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/.*?\/(.*?)(;|$)/);
    if (match && match[1]) {
      setLang(match[1]);
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code: string) => {
    setLang(code);
    setAnchorEl(null);
    
    // Lưu cookie cho Google Translate
    document.cookie = `googtrans=/vi/${code}; path=/;`;
    if (window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=/vi/${code}; path=/; domain=.${window.location.hostname};`;
    }

    const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (googleSelect) {
      googleSelect.value = code;
      // Google Translate sử dụng Event Delegation, nên bắt buộc event phải có bubbles: true
      googleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback: Nếu không tìm thấy thẻ (do mạng chậm), tải lại trang để áp dụng Cookie
      window.location.reload();
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <Box sx={{ ml: 1 }}>
      <Button
        onClick={handleClick}
        sx={{
          display: { xs: 'none', sm: 'flex' },
          height: 36,
          px: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          color: 'text.primary',
          bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
          fontWeight: 600,
          '&:hover': {
            bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
          }
        }}
      >
        <TranslateIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
        <span style={{ marginRight: 6 }}>{currentLang.flag}</span>
        {currentLang.label}
      </Button>
      <Button
        onClick={handleClick}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          minWidth: 'auto',
          p: 1,
          borderRadius: 2,
          color: 'text.primary',
          bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <TranslateIcon sx={{ fontSize: 20 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 140,
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            }
          }
        }}
      >
        {LANGUAGES.map((l) => (
          <MenuItem 
            key={l.code} 
            onClick={() => handleSelect(l.code)}
            selected={l.code === lang}
            sx={{ fontSize: '0.875rem', py: 1 }}
          >
            <span style={{ marginRight: 8 }}>{l.flag}</span> {l.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
