import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProjectGallery from './components/ProjectGallery';
import SeasonalEffects from './components/SeasonalEffects';
import ArticlesGallery from './components/ArticlesGallery';
import { getCurrentSeason } from './lib/seasonalEngine';
import AdminForm from './components/AdminForm';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, useTheme, Menu, MenuItem, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';

import { useAppTheme } from './ThemeContext';
import confetti from 'canvas-confetti';
import { ASSETS_3D } from './components/SeasonalEffects';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      setClickCount(prev => prev + 1);
    } else {
      navigate('/');
    }
  };

  const season = getCurrentSeason();
  const logoColor = season.id !== 'NONE' ? season.palette.primary : '#2563EB';

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
        <Box component="img" src={`${import.meta.env.BASE_URL}logo.svg?v=5`} alt="Logo" sx={defaultImgStyle} />
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
      <SeasonalEffects />
      {/* Navbar */}
      <Box sx={{ position: 'sticky', top: { xs: 8, md: 16 }, zIndex: 1100, px: { xs: 2, sm: 3, md: 4 } }}>
        <AppBar position="static" elevation={0} sx={{
          background: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          color: 'text.primary',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          maxWidth: '1200px',
          mx: 'auto'
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
                <DashboardIcon sx={{ mr: 1, fontSize: 20 }} /> Quản Trị
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
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Quản Trị</Box>
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
        py: 4, textAlign: 'center',
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} | Một sản phẩm được xây dựng bởi{' '}
          <a 
            href="https://www.facebook.com/tridinhnee/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'inherit', fontWeight: 700, textDecoration: 'none' }}
          >
            DinhNT24
          </a>
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
