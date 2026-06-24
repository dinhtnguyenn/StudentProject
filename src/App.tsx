import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProjectGallery from './components/ProjectGallery';
import SeasonalEffects from './components/SeasonalEffects';
import ArticlesGallery from './components/ArticlesGallery';
import DailyMessage from './components/DailyMessage';
import { getCurrentSeason } from './lib/seasonalEngine';
import AdminForm from './components/AdminForm';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, useTheme, Menu, MenuItem, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { useAppTheme } from './ThemeContext';
import confetti from 'canvas-confetti';
import { ASSETS_3D } from './components/SeasonalEffects';
import UIEasterEggs from './components/UIEasterEggs';
import CommandPalette from './components/CommandPalette';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      setClickCount(prev => prev + 1);
    } else {
      navigate('/');
    }
  };

  const season = getCurrentSeason();
  const logoColor = season.id !== 'NONE' ? season.palette.primary : (theme.palette.mode === 'dark' ? '#60A5FA' : '#2563EB');

  const getLogoIcon = () => {
    const defaultImgStyle = { width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', display: 'block' };
    let decorationUrl = null;

    if (season.id === 'XMAS') decorationUrl = ASSETS_3D.SNOWFLAKE;
    else if (season.id === 'TET') decorationUrl = ASSETS_3D.CHERRY_BLOSSOM;
    else if (season.id === 'HALLOWEEN') decorationUrl = ASSETS_3D.BAT;
    else if (season.id === 'MID_AUTUMN') decorationUrl = ASSETS_3D.LANTERN;
    else if (season.id === 'TEACHER') decorationUrl = ASSETS_3D.GRADUATION_CAP;
    else if (season.id === 'CULTURE') decorationUrl = ASSETS_3D.LOTUS;
    else if (season.id === 'HUNG_KING') decorationUrl = ASSETS_3D.WATERMELON;

    return (
      <Box sx={{ position: 'relative', mr: { xs: 1, sm: 1.5 } }}>
        <Box sx={defaultImgStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="10 15 80 80" width="100%" height="100%">
            {/* U-shape (Base) */}
            <path d="M 30 42 L 30 65 A 20 20 0 0 0 70 65 L 70 42" fill="none" stroke={theme.palette.mode === 'dark' ? '#FFFFFF' : '#0F172A'} strokeWidth="8" strokeLinecap="round" />
            {/* Diamond (Top) */}
            <path d="M 50 20 L 85 35 L 50 50 L 15 35 Z" fill={logoColor} stroke={logoColor} strokeWidth="4" strokeLinejoin="round" />
            {/* Elegant Tassel */}
            <line x1="85" y1="35" x2="85" y2="55" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="85" cy="55" r="4" fill="#F59E0B" />
          </svg>
        </Box>
        {decorationUrl && (
          <Box sx={{
            position: 'absolute',
            top: -12,
            right: -14,
            width: 24,
            height: 24,
            backgroundImage: decorationUrl,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))',
            zIndex: 2,
            transform: 'rotate(15deg)'
          }} />
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (clickCount >= 3) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setClickCount(0);
    }
  }, [clickCount]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>

      <DailyMessage />

      {/* Floating Back To Top Button */}
      <IconButton
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, md: 40 },
          right: { xs: 20, md: 40 },
          zIndex: 1200,
          opacity: showTopBtn ? 1 : 0,
          transform: showTopBtn ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showTopBtn ? 'auto' : 'none',
          bgcolor: theme.palette.mode === 'light' ? '#FFFFFF' : '#0A0A0A',
          color: logoColor,
          border: '1px solid', borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: logoColor,
            color: '#fff',
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 28px ${logoColor}50`
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <KeyboardArrowUpIcon />
      </IconButton>

      <SeasonalEffects />
      {/* Navbar */}
      <Box sx={{
        position: 'sticky',
        top: isScrolled ? 0 : { xs: 8, md: 16 },
        zIndex: 1100,
        px: isScrolled ? 0 : { xs: 2, sm: 3, md: 4 },
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <AppBar position="static" elevation={0} sx={{
          background: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderWidth: isScrolled ? '0 0 1px 0' : '1px',
          borderColor: 'divider',
          borderRadius: isScrolled ? 0 : 4,
          color: 'text.primary',
          boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : '0 8px 32px rgba(0,0,0,0.08)',
          maxWidth: isScrolled ? '100%' : '1200px',
          mx: 'auto',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ gap: 1 }}>
              {/* Logo dynamically changing with season */}
              <Typography
                variant="h6" component="div"
                sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, userSelect: 'none', display: 'flex', alignItems: 'center' }}
                onClick={handleLogoClick}
              >
                {getLogoIcon()}
                Uni<span style={{ color: logoColor }}>Folio</span>
              </Typography>

              {/* Mobile Menu */}
              <IconButton
                sx={{ display: { xs: 'flex', sm: 'none' }, color: 'text.secondary' }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                sx={{ display: { xs: 'block', sm: 'none' }, mt: 1, '& .MuiPaper-root': { borderRadius: 3, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}
              >
                <MenuItem onClick={() => { navigate('/'); setAnchorEl(null); }} sx={{ fontWeight: location.pathname === '/' ? 700 : 500, color: location.pathname === '/' ? 'primary.main' : 'text.primary', py: 1.5 }}>
                  Dự án
                </MenuItem>
                <MenuItem onClick={() => { navigate('/articles'); setAnchorEl(null); }} sx={{ fontWeight: location.pathname === '/articles' ? 700 : 500, color: location.pathname === '/articles' ? 'primary.main' : 'text.primary', py: 1.5 }}>
                  Bài viết
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null); }} sx={{ fontWeight: location.pathname === '/admin' ? 700 : 500, color: location.pathname === '/admin' ? 'primary.main' : 'text.primary', py: 1.5 }}>
                  <DashboardIcon sx={{ mr: 1, fontSize: 20 }} /> Quản trị
                </MenuItem>
              </Menu>

              {/* Desktop Navigation */}
              <Button
                onClick={() => navigate('/')}
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  color: location.pathname === '/' ? 'primary.main' : 'text.secondary',
                  fontWeight: location.pathname === '/' ? 700 : 500,
                  '&:hover': { background: theme.palette.action.hover },
                }}
              >
                Dự án
              </Button>
              <Button
                onClick={() => navigate('/articles')}
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  color: location.pathname === '/articles' ? 'primary.main' : 'text.secondary',
                  fontWeight: location.pathname === '/articles' ? 700 : 500,
                  '&:hover': { background: theme.palette.action.hover },
                }}
              >
                Bài viết
              </Button>
              <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary', ml: 1 }}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <Button
                variant="contained"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  ml: 1,
                  minWidth: { xs: '40px', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                }}
                onClick={() => navigate('/admin')}
              >
                <DashboardIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Quản trị</Box>
              </Button>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<ProjectGallery />} />
            <Route path="/articles" element={<ArticlesGallery />} />
            <Route path="/admin" element={<AdminForm />} />
          </Routes>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{
        mt: 'auto',
        pt: 6, pb: 4,
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow for footer */}
        <Box sx={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: { xs: 300, md: 600 }, height: 200,
          background: `radial-gradient(ellipse, ${logoColor}25 0%, transparent 70%)`,
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none'
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3
          }}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1 }}>
                {getLogoIcon()}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Uni<span style={{ color: logoColor }}>Folio</span>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Lưu giữ đam mê, lan toả tri thức. Nơi tôn vinh các dự án xuất sắc.
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                © {new Date().getFullYear()} Bản quyền thuộc về{' '}
                <a
                  href="https://www.facebook.com/tridinhnee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: logoColor, fontWeight: 700, textDecoration: 'none' }}
                >
                  DinhNT24
                </a>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', opacity: 0.3, display: 'block', mt: 0.5, userSelect: 'none' }}>
                Secrets: matrix, retro, gravity, roll, reset
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <UIEasterEggs />
      <CommandPalette />
    </Box>
  );
}

export default App;
