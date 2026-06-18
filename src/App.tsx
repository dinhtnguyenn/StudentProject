import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProjectGallery from './components/ProjectGallery';
import AdminForm from './components/AdminForm';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{
        background: 'rgba(255, 255, 255, 0.85)',
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
              Student<span style={{ color: '#6366F1' }}> Projects</span>
            </Typography>
            <Button
              onClick={() => navigate('/')}
              sx={{
                color: location.pathname === '/' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/' ? 700 : 500,
                '&:hover': { background: '#F1F5F9' },
              }}
            >
              Khám phá
            </Button>
            {import.meta.env.DEV && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  ml: 1,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
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
        background: 'var(--bg-white)',
      }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Một sản phẩm được xây dựng bởi DinhNT24
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
