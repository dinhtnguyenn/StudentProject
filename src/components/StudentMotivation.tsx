import { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useAppTheme } from '../ThemeContext';

import { MOTIVATIONAL_QUOTES } from '../data/quotes';

const StudentMotivation = () => {
  const { mode } = useAppTheme();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Random initial quote
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));

    // Change quote every 10 seconds
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setShow(true);
      }, 500); // Wait for fade out
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  
  // Tính toán kích thước chữ tự động dựa trên độ dài câu nói
  const getFontSize = (length: number) => {
    if (length < 80) return { xs: '1.05rem', sm: '1.2rem' };
    if (length < 140) return { xs: '0.95rem', sm: '1.05rem' };
    if (length < 200) return { xs: '0.85rem', sm: '0.95rem' };
    return { xs: '0.8rem', sm: '0.85rem' };
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      mb: 6, 
      mt: 2 
    }}>
      <Box sx={{
        position: 'relative',
        maxWidth: 600,
        width: '100%',
        bgcolor: mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: 4,
        py: { xs: 3, sm: 4 },
        px: { xs: 3, sm: 6 },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: mode === 'light' ? '0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: { xs: 130, sm: 150 }, // Use strict height instead of minHeight
        boxSizing: 'border-box'
      }}>
        <FormatQuoteIcon sx={{ 
          position: 'absolute', top: { xs: 10, sm: 20 }, left: { xs: 10, sm: 20 }, 
          fontSize: '4rem', color: 'primary.main', opacity: 0.05 
        }} />
        <FormatQuoteIcon sx={{ 
          position: 'absolute', bottom: { xs: 10, sm: 20 }, right: { xs: 10, sm: 20 }, 
          fontSize: '4rem', color: 'secondary.main', opacity: 0.05, transform: 'rotate(180deg)' 
        }} />
        
        <Box sx={{ 
          width: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1
        }}>
          <Fade in={show} timeout={500}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                fontSize: getFontSize(currentQuote.length),
                color: 'text.primary',
                fontStyle: 'italic',
                textAlign: 'center',
                width: '100%',
                transition: 'font-size 0.3s ease'
              }}
            >
              "{currentQuote}"
            </Typography>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentMotivation;
