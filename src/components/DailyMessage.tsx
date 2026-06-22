import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Dialog, Button, Tooltip } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useAppTheme } from '../ThemeContext';
import { DAILY_QUOTES } from '../data/quotes';
import confetti from 'canvas-confetti';

const DailyMessage = () => {
  const { mode } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [todaysQuote, setTodaysQuote] = useState("");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const lastOpened = localStorage.getItem("dailyMessageDate");
    const today = new Date().toDateString();
    
    if (lastOpened === today) {
      const savedQuote = localStorage.getItem("dailyMessageQuote") || DAILY_QUOTES[0];
      setTodaysQuote(savedQuote);
      setIsNew(false);
    } else {
      const randomQuote = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
      setTodaysQuote(randomQuote);
      setIsNew(true);
    }
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (isNew) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#60A5FA', '#F59E0B', '#10B981', '#F43F5E'],
          zIndex: 1400 // Ensures confetti is in front of the Dialog
        });
      }, 300);
      
      const today = new Date().toDateString();
      localStorage.setItem("dailyMessageDate", today);
      localStorage.setItem("dailyMessageQuote", todaysQuote);
      setIsNew(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip 
        title={isNew ? "Bạn có một thông điệp mới hôm nay!" : "Xem lại thông điệp hôm nay"} 
        placement="right"
      >
        <IconButton
          onClick={handleOpen}
          sx={{
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            bottom: { xs: 20, md: 40 },
            left: { xs: 20, md: 40 },
            zIndex: 1200,
            bgcolor: mode === 'light' ? '#FFFFFF' : '#000000',
            color: isNew ? '#F43F5E' : 'text.secondary',
            border: '1px solid', borderColor: 'divider',
            boxShadow: isNew ? '0 0 20px rgba(244, 63, 94, 0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
            '&:hover': { 
              bgcolor: isNew ? '#F43F5E' : 'background.paper', 
              color: isNew ? '#fff' : 'text.primary',
              transform: 'translateY(-4px)',
              boxShadow: isNew ? '0 8px 24px rgba(244, 63, 94, 0.6)' : '0 8px 24px rgba(0,0,0,0.1)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(isNew && {
              animation: 'pulseGift 2s infinite',
              '@keyframes pulseGift': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1) rotate(5deg)' },
                '100%': { transform: 'scale(1)' }
              }
            })
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            width: { xs: '28px', md: '32px' }, 
            height: { xs: '28px', md: '32px' },
            filter: isNew ? 'drop-shadow(0 0 12px rgba(244,63,94,0.8))' : 'grayscale(100%) opacity(0.4)',
            transition: 'all 0.3s ease'
          }}>
            <img 
              src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png" 
              alt="Gift Box" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </Box>
        </IconButton>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: mode === 'light' ? '0 12px 40px rgba(0,0,0,0.1)' : '0 12px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 4, position: 'relative', textAlign: 'center' }}>
          <IconButton 
            onClick={handleClose}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'inline-flex', 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: mode === 'light' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.2)',
              color: '#F43F5E',
              mb: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                width: '64px', 
                height: '64px',
                filter: 'drop-shadow(0 8px 16px rgba(244,63,94,0.4))'
              }}>
                <img 
                  src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png" 
                  alt="Gift Box" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Thông Điệp Của Bạn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Mỗi ngày một dòng năng lượng tích cực
            </Typography>
          </Box>

          <Box sx={{ 
            position: 'relative', 
            bgcolor: mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
            borderRadius: 3, 
            p: 4, 
            mb: 3,
            border: '1px solid', borderColor: 'divider'
          }}>
            <FormatQuoteIcon sx={{ position: 'absolute', top: 10, left: 10, fontSize: '2.5rem', color: 'primary.main', opacity: 0.1 }} />
            <FormatQuoteIcon sx={{ position: 'absolute', bottom: 10, right: 10, fontSize: '2.5rem', color: 'secondary.main', opacity: 0.1, transform: 'rotate(180deg)' }} />
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              fontStyle: 'italic', 
              color: 'text.primary',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1
            }}>
              "{todaysQuote}"
            </Typography>
          </Box>

          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleClose}
            sx={{ 
              borderRadius: 2, 
              py: 1.5, 
              fontWeight: 700,
              bgcolor: '#F43F5E',
              '&:hover': { bgcolor: '#E11D48' }
            }}
          >
            Tuyệt Vời!
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            Thông điệp mới sẽ được gửi vào ngày mai.
          </Typography>
        </Box>
      </Dialog>
    </>
  );
};

export default DailyMessage;
