import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProjectGallery from './components/ProjectGallery';
import AdminForm from './components/AdminForm';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAppTheme } from './ThemeContext';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();

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
            <AutoAwesomeIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography
              variant="h6" component="div"
              sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 800, fontSize: '1.15rem' }}
              onClick={() => navigate('/')}
            >
              Student<span style={{ color: '#0EA5E9' }}> Projects</span>
            </Typography>
            <Button
              onClick={() => navigate('/')}
              sx={{
                color: location.pathname === '/' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/' ? 700 : 500,
                '&:hover': { background: theme.palette.action.hover },
              }}
            >
              Khám phá
            </Button>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary', ml: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            {import.meta.env.DEV && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  ml: 1,
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
                  },
                }}
              >
                Thêm Dự Án
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<ProjectGallery />} />
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
          © {new Date().getFullYear()} Một sản phẩm được xây dựng bởi DinhNT24
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
