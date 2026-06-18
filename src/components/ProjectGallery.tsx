import { useState, useEffect } from 'react';
import { Typography, TextField, Box, CircularProgress, InputAdornment, Grid, Chip, Stack, FormControl, Select, MenuItem, InputLabel, Button, Dialog, DialogTitle, IconButton, DialogContent, Avatar, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import CodeIcon from '@mui/icons-material/Code';
import ProjectCard from './ProjectCard';
import type { Project } from '../types/Project';
import type { Category } from '../types/Category';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const defaultColor = { bg: '#EEF2FF', text: '#2563EB' };

const getAvatarLetter = (name: string) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  const lastWord = words[words.length - 1];
  return lastWord.charAt(0).toUpperCase();
};

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('All');
  const [currentSemester, setCurrentSemester] = useState('All');
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [visibleCount, setVisibleCount] = useState(9);
  const [sharedProject, setSharedProject] = useState<Project | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();

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

  // Handle Shared Link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    if (projectId && projects.length > 0) {
      const p = projects.find(x => x.id === projectId);
      if (p) setSharedProject(p);
    } else {
      setSharedProject(null);
    }
  }, [location.search, projects]);

  const closeSharedProject = () => {
    setSharedProject(null);
    const params = new URLSearchParams(location.search);
    params.delete('project');
    navigate({ search: params.toString() }, { replace: true });
  };

  // Reset Load More when filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [search, currentTab, currentSemester, selectedTags]);

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
  const allTags = Array.from(new Set(projects.flatMap(p => p.techTags || [])));

  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = { bg: cat.bg, text: cat.text };
    return acc;
  }, {} as Record<string, { bg: string; text: string }>);

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchesTab = currentTab === 'All' || p.category === currentTab;
    const matchesSemester = currentSemester === 'All' || p.semester === currentSemester;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => (p.techTags || []).includes(t));
    return matchesSearch && matchesTab && matchesSemester && matchesTags;
  });

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  return (
    <Box>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 5, textAlign: 'center', mt: 2 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, bgcolor: 'action.hover', color: 'primary.main' }}>
            <RocketLaunchIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Bộ sưu tập
            </Typography>
          </Box>
          <Typography variant="h3" component="h1" sx={{ mb: 1.5, fontWeight: 800, color: 'text.primary' }}>
            Dự Án <span style={{ color: muiTheme.palette.primary.main }}>Xuất Sắc</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
            Khám phá những dự án xuất sắc, giải pháp công nghệ ấn tượng được phát triển bởi sinh viên của tớ ❤️.
          </Typography>
        </Box>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Box sx={{
          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 1,
          display: 'flex', flexDirection: 'column', gap: 2, p: 2, px: 3, mb: 5,
        }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, flex: 1 }}>
              {categoryNames.map(cat => (
                <Chip
                  key={cat}
                  label={cat === 'All' ? 'Tất cả' : cat}
                  onClick={() => setCurrentTab(cat)}
                  variant={currentTab === cat ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    ...(currentTab === cat
                      ? {
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#FFF', border: 'none', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                      }
                      : {
                        borderColor: 'divider', color: 'text.secondary',
                        '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.hover' },
                      }),
                  }}
                />
              ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Học kỳ</InputLabel>
                <Select
                  value={currentSemester}
                  label="Học kỳ"
                  onChange={e => setCurrentSemester(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
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
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: { xs: '100%', sm: '280px' }, bgcolor: 'background.paper', borderRadius: 2 }}
              />
            </Box>
          </Box>

          {/* Tech Tags Filter */}
          {allTags.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mr: 1 }}>Công nghệ:</Typography>
              {allTags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  sx={{ 
                    fontSize: '0.75rem', 
                    ...(selectedTags.includes(tag) ? { bgcolor: 'primary.main', color: '#FFF' } : { borderColor: 'divider', color: 'text.secondary' }) 
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </motion.div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Box sx={{ textAlign: 'center', py: 10, px: 3, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <SentimentDissatisfiedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              Không tìm thấy dự án nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Hãy thử tìm kiếm với từ khoá hoặc tag công nghệ khác.
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <Grid container spacing={3}>
              <AnimatePresence>
                {displayedProjects.map(project => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                    <motion.div variants={itemVariants} style={{ height: '100%' }}>
                      <ProjectCard project={project} categoryColors={categoryColors} />
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          </motion.div>
          
          {visibleCount < filteredProjects.length && (
            <Box sx={{ textAlign: 'center', mt: 5 }}>
              <Button 
                variant="outlined" 
                onClick={() => setVisibleCount(prev => prev + 9)}
                sx={{ 
                  borderRadius: 100, 
                  px: 4, 
                  py: 1.5, 
                  borderWidth: 2, 
                  borderColor: 'primary.main', 
                  color: 'primary.main',
                  '&:hover': { borderWidth: 2 } 
                }}
              >
                Tải thêm ({filteredProjects.length - visibleCount} dự án)
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Shared Project Modal */}
      {sharedProject && (
        <Dialog open={true} onClose={closeSharedProject} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              Chi tiết dự án
            </Typography>
            <IconButton onClick={closeSharedProject} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {sharedProject.name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: categoryColors[sharedProject.category]?.text || defaultColor.text, ml: 0.5 }} />}
                label={sharedProject.category}
                size="small"
                sx={{ background: categoryColors[sharedProject.category]?.bg || defaultColor.bg, color: categoryColors[sharedProject.category]?.text || defaultColor.text, fontWeight: 600 }}
              />
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
                label={sharedProject.semester}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }}
              />
              {sharedProject.techTags && sharedProject.techTags.map((tag, i) => (
                <Chip key={i} icon={<CodeIcon sx={{ fontSize: 14 }} />} label={tag} size="small" variant="outlined" sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }} />
              ))}
            </Box>

            <Box 
              dangerouslySetInnerHTML={{ __html: sharedProject.description }}
              sx={{ color: 'text.primary', lineHeight: 1.8, mb: 3, fontSize: '1rem', '& p': { mb: 1.5, mt: 0 }, '& ul, & ol': { mb: 1.5, mt: 0, paddingLeft: 3 } }}
            />

            {sharedProject.youtubeUrl && extractYoutubeId(sharedProject.youtubeUrl) && (
              <Box sx={{ position: 'relative', pt: '56.25%', mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  src={`https://www.youtube.com/embed/${extractYoutubeId(sharedProject.youtubeUrl)}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </Box>
            )}

            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Team thực hiện
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                {sharedProject.teamMembers.map((member, idx) => (
                  <Grid size={{ xs: 12 }} key={idx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700, bgcolor: ['#2563EB', '#EC4899', '#F59E0B', '#10B981'][idx % 4] }}>
                        {getAvatarLetter(member)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.825rem' }}>
                        {member}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
