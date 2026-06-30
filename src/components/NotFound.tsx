import { Box, Button, Container, Typography, useTheme, keyframes } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

export default function NotFound() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* Background Decorative Glow */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: 300, md: 500 },
        height: { xs: 300, md: 500 },
        background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
        animation: `${pulse} 4s ease-in-out infinite`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <Box sx={{ 
        position: 'relative', 
        zIndex: 1, 
        textAlign: 'center',
        animation: `${float} 6s ease-in-out infinite`,
      }}>
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: { xs: '6rem', md: '10rem' }, 
            fontWeight: 900,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
            lineHeight: 1,
            mb: 2
          }}
        >
          404
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
          Lạc đường rồi bạn ơi!
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, maxWidth: 500, mx: 'auto', lineHeight: 1.8 }}>
          Trang bạn đang tìm kiếm dường như không tồn tại, đã bị xóa hoặc tên miền bị thay đổi. Đừng lo, hãy để chúng tôi đưa bạn trở về nơi bắt đầu nhé.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              borderRadius: 50, 
              px: 4, 
              py: 1.5,
              fontWeight: 700,
              boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 12px 32px ${theme.palette.primary.main}60`,
              }
            }}
          >
            Về trang chủ
          </Button>

          <Button 
            variant="outlined" 
            size="large"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/articles')}
            sx={{ 
              borderRadius: 50, 
              px: 4, 
              py: 1.5,
              fontWeight: 700,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-3px)',
                bgcolor: 'action.hover'
              }
            }}
          >
            Xem bài viết
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
