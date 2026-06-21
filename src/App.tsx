import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ProjectGallery from './components/ProjectGallery';
import ArticlesGallery from './components/ArticlesGallery';
import AdminForm from './components/AdminForm';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, useTheme, Menu, MenuItem, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import { useAppTheme } from './ThemeContext';
import confetti from 'canvas-confetti';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    navigate('/');
    setClickCount(prev => prev + 1);
    if (clickCount >= 2) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setClickCount(0);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{
        background: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <Box component="img" src={`${import.meta.env.BASE_URL}logo.svg?v=5`} alt="UniFolio Logo" sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, mr: { xs: 0.5, sm: 0.75 }, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', cursor: 'pointer' }} onClick={handleLogoClick} />
            <Typography
              variant="h6" component="div"
              sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, userSelect: 'none' }}
              onClick={handleLogoClick}
            >
              Uni<span style={{ color: '#2563EB' }}>Folio</span>
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
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                },
              }}
              onClick={() => navigate('/admin')}
            >
              <DashboardIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Quản Trị</Box>
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

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
