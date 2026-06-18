import { useState, useEffect } from 'react';
import { Typography, TextField, Box, CircularProgress, InputAdornment, Grid, Chip, Stack, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import ProjectCard from './ProjectCard';
import type { Project } from '../types/Project';
import type { Category } from '../types/Category';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

export default function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('All');
  const [currentSemester, setCurrentSemester] = useState('All');

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/projects.json`).then(res => res.json()),
      fetch(`${import.meta.env.BASE_URL}data/categories.json`).then(res => res.json()).catch(() => [])
    ])
      .then(([projData, catData]) => {
        setProjects(projData || []);
        setCategories(catData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 12, gap: 2 }}>
        <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography color="text.secondary">Đang tải dự án...</Typography>
      </Box>
    );
  }

  const categoryNames = ['All', ...Array.from(new Set([...categories.map(c => c.name), ...projects.map(p => p.category)]))];
  const semesters = ['All', ...Array.from(new Set(projects.map(p => p.semester)))];
  
  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = { bg: cat.bg, text: cat.text };
    return acc;
  }, {} as Record<string, { bg: string; text: string }>);

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchesTab = currentTab === 'All' || p.category === currentTab;
    const matchesSemester = currentSemester === 'All' || p.semester === currentSemester;
    return matchesSearch && matchesTab && matchesSemester;
  });

  return (
    <Box>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 5, textAlign: 'center', mt: 2 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, background: '#EEF2FF', color: '#6366F1' }}>
            <RocketLaunchIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Bộ sưu tập đồ án sinh viên
            </Typography>
          </Box>
          <Typography variant="h3" component="h1" sx={{ mb: 1.5, fontWeight: 800, color: 'text.primary' }}>
            Đồ Án <span style={{ color: '#6366F1' }}>Xuất Sắc</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
            Khám phá những sản phẩm sáng tạo, giải pháp công nghệ ấn tượng được phát triển bởi sinh viên của chúng tôi.
          </Typography>
        </Box>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Box className="toolbar-panel" sx={{ 
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', 
          mb: 5, gap: 2, p: 2, px: 3,
        }}>
          {/* Category Chips */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, flex: 1 }}>
            {categoryNames.map(cat => (
              <Chip
                key={cat}
                label={cat === 'All' ? 'Tất cả' : cat}
                onClick={() => setCurrentTab(cat)}
                variant={currentTab === cat ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  ...(currentTab === cat
                    ? {
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        color: '#FFF',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                      }
                    : {
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                        '&:hover': { borderColor: '#6366F1', color: '#6366F1', background: '#F5F3FF' },
                      }),
                }}
              />
            ))}
          </Stack>

          {/* Filters: Semester & Search */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={currentSemester}
                label="Học kỳ"
                onChange={e => setCurrentSemester(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: '#FFF' }}
              >
                {semesters.map(sem => (
                  <MenuItem key={sem} value={sem}>{sem === 'All' ? 'Tất cả học kỳ' : sem}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              placeholder="Tìm kiếm dự án..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { xs: '100%', sm: '280px' }, bgcolor: '#FFF', borderRadius: 2 }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Box sx={{ textAlign: 'center', py: 10, px: 3, background: '#FFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <SentimentDissatisfiedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              Không tìm thấy dự án nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Hãy thử tìm kiếm với từ khoá khác hoặc chọn danh mục khác.
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <Grid container spacing={3}>
            <AnimatePresence>
              {filteredProjects.map(project => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                  <motion.div variants={itemVariants} style={{ height: '100%' }}>
                    <ProjectCard project={project} categoryColors={categoryColors} />
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </motion.div>
      )}
    </Box>
  );
}
