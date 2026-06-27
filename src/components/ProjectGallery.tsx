import { useState, useEffect, useRef, useMemo } from 'react';
import { Typography, TextField, Box, CircularProgress, InputAdornment, Grid, Chip, FormControl, Select, MenuItem, InputLabel, useTheme, Button, Divider, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HubIcon from '@mui/icons-material/Hub';
import ProjectCard from './ProjectCard';
import TechNetworkGraph from './TechNetworkGraph';
import type { Project } from '../types/Project';
import type { Category } from '../types/Category';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectDetailModal from './ProjectDetailModal';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import ImageWithFallback from './ImageWithFallback';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { IconButton } from '@mui/material';
import StudentMotivation from './StudentMotivation';



const AnimatedCounter = ({ value, label }: { value: number, label: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;
      const duration = 1500;
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setCount(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [value, isInView]);

  return (
    <Box ref={ref} sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, flex: 1 }}>
      <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, fontSize: { xs: '1.75rem', sm: '3rem' } }}>
        {count}+
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: { xs: 0, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
        {label}
      </Typography>
    </Box>
  );
};

const MiniGoldenCard = ({ project, allProjects, majorColor }: { project: Project; allProjects: Project[]; majorColor?: { bg: string, text: string } }) => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <Box onClick={() => setModalOpen(true)} sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        bgcolor: 'background.paper', borderRadius: 3, p: 1.5,
        border: '1px solid', borderColor: 'divider',
        cursor: 'pointer', transition: 'all 0.2s', width: { xs: 280, sm: 320 }, flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: '#F59E0B' }
      }}>
        <Box sx={{ width: 90, height: 64, borderRadius: 2, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
          <ImageWithFallback src={project.thumbnail} alt={project.name} height="100%" sx={{ width: '100%', height: '100%' }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
          <Typography variant="subtitle2" sx={{
            fontWeight: 700, mb: 0.5, color: 'text.primary',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {project.name}
          </Typography>
          <Typography variant="caption" sx={{
            fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            px: 1, py: 0.25, borderRadius: 1,
            bgcolor: majorColor ? majorColor.bg : 'action.hover',
            color: majorColor ? majorColor.text : 'text.secondary'
          }}>
            {project.major}
          </Typography>
        </Box>
      </Box>
      <ProjectDetailModal project={project} open={modalOpen} onClose={() => setModalOpen(false)} allProjects={allProjects} />
    </>
  );
};

import { Helmet } from 'react-helmet-async';

export default function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allMajors, setAllMajors] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [currentSemester, setCurrentSemester] = useState('All');
  const [currentMajor, setCurrentMajor] = useState('All');
  const [showOnlyGoldenTicket, setShowOnlyGoldenTicket] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [visibleCount, setVisibleCount] = useState(9);
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = () => {
    if (sharedProject) {
      const shareText = `Dự án: ${sharedProject.name}\nXem tại: ${window.location.origin}/project/${sharedProject.id}`;
      navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
    }
  };

  const navigate = useNavigate();
  const { projectId } = useParams();
  const muiTheme = useTheme();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = (node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 9);
      }
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    const localProjectsUrl = `${import.meta.env.BASE_URL}data/projects.json?t=${Date.now()}`;
    const localCategoriesUrl = `${import.meta.env.BASE_URL}data/categories.json?t=${Date.now()}`;
    const localMajorsUrl = `${import.meta.env.BASE_URL}data/majors.json?t=${Date.now()}`;




    const pPromise = fetch(localProjectsUrl).then(res => res.ok ? res.json() : []);
    const cPromise = fetch(localCategoriesUrl).then(res => res.ok ? res.json() : []);
    const mPromise = fetch(localMajorsUrl).then(res => res.ok ? res.json() : []);

    Promise.all([pPromise, cPromise, mPromise])
      .then(([projData, catData, majData]) => {
        const categoriesData = catData || [];
        const majorsData = majData || [];

        const resolvedProjects = (projData || []).map((p: any) => ({
          ...p,
          category: categoriesData.find((c: any) => c.id === p.category)?.name || p.category,
          major: majorsData.find((m: any) => m.id === p.major)?.name || p.major,
          teamMembers: Array.isArray(p.teamMembers) ? p.teamMembers : (typeof p.teamMembers === 'string' ? p.teamMembers.split('\n').map((m: string) => m.trim()).filter(Boolean) : []),
          techTags: Array.isArray(p.techTags) ? p.techTags : (typeof p.techTags === 'string' ? p.techTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
        }));

        setProjects(resolvedProjects);
        setCategories(categoriesData);
        setAllMajors(majorsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const p = projects.find(x => x.id === projectId);
      if (p) setSharedProject(p);
    } else {
      setSharedProject(null);
    }
  }, [projectId, projects]);

  const closeSharedProject = () => {
    setSharedProject(null);
    navigate('/', { replace: true });
  };

  useEffect(() => {
    setVisibleCount(9);
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, currentTab, currentSemester, currentMajor, showOnlyGoldenTicket, selectedTags]);

  const randomizedGoldenTickets = useMemo(() => {
    return projects.filter(p => p.isGoldenTicket).sort(() => Math.random() - 0.5);
  }, [projects]);

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
  const majors = ['All', ...Array.from(new Set(projects.map(p => p.major).filter(Boolean)))];
  const allTags = Array.from(new Set(projects.flatMap(p => p.techTags || [])));

  const getCategoryCount = (cat: string | undefined) => cat === 'All' ? projects.length : projects.filter(p => p.category === cat).length;
  const getSemesterCount = (sem: string | undefined) => sem === 'All' ? projects.length : projects.filter(p => p.semester === sem).length;
  const getMajorCount = (major: string | undefined) => major === 'All' ? projects.length : projects.filter(p => p.major === major).length;

  const totalStudents = new Set(projects.flatMap(p => p.teamMembers || [])).size;

  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = { bg: cat.bg, text: cat.text };
    return acc;
  }, {} as Record<string, { bg: string; text: string }>);

  const majorColors = allMajors.reduce((acc, maj) => {
    acc[maj.name] = { bg: maj.bg, text: maj.text };
    return acc;
  }, {} as Record<string, { bg: string; text: string }>);

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchesTab = currentTab === 'All' || p.category === currentTab;
    const matchesSemester = currentSemester === 'All' || p.semester === currentSemester;
    const matchesMajor = currentMajor === 'All' || p.major === currentMajor;
    const matchesGolden = showOnlyGoldenTicket ? p.isGoldenTicket : true;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => (p.techTags || []).includes(t));
    return matchesSearch && matchesTab && matchesSemester && matchesMajor && matchesGolden && matchesTags;
  });

  const isDefaultView = search === '' && currentTab === 'All' && currentSemester === 'All' && currentMajor === 'All' && selectedTags.length === 0 && !showOnlyGoldenTicket;

  const duplicatedGoldenTickets = Array(12).fill(randomizedGoldenTickets).flat();

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  return (
    <Box>
      <Helmet>
        <title>Dự án sinh viên | UniFolio</title>
        <meta name="description" content="Khám phá các dự án sinh viên xuất sắc nhất tại UniFolio." />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ 
          mb: 5, textAlign: 'center', mt: 2, position: 'relative',
          '@keyframes pulseGlow': {
            '0%': { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' },
            '100%': { opacity: 0.8, transform: 'translate(-50%, -50%) scale(1.15)' }
          },
          '&::before': {
            content: '""', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '100%', maxWidth: 800, height: '150%',
            background: `radial-gradient(ellipse at center, ${muiTheme.palette.primary.main}20 0%, ${muiTheme.palette.secondary.main}15 40%, transparent 70%)`,
            filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none',
            animation: 'pulseGlow 4s ease-in-out infinite alternate',
          }
        }}>
          <Typography variant="h3" component="h1" sx={{ mb: 1.5, fontWeight: 800, color: 'text.primary', fontSize: { xs: '2.25rem', sm: '3rem' } }}>
            Dự án <span style={{ color: muiTheme.palette.primary.main }}>tiêu biểu</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7, mb: 4 }}>
            Khám phá các dự án tiêu biểu và những giải pháp công nghệ sáng tạo được phát triển bởi các sinh viên tài năng
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', maxWidth: 600, mx: 'auto', bgcolor: 'background.paper', borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <AnimatedCounter value={projects.length} label="Dự án" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={totalStudents} label="Sinh viên" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={majors.length - 1} label="Chuyên ngành" />
          </Box>
        </Box>
      </motion.div>

      <StudentMotivation />

      {isDefaultView && randomizedGoldenTickets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" className="notranslate" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#F59E0B' }}>
              <WorkspacePremiumIcon sx={{ color: '#F59E0B' }} /> Golden Ticket
            </Typography>
            <Box sx={{
              overflowX: 'hidden', overflowY: 'visible', display: 'flex', position: 'relative',
              '&:hover .marquee-content': { animationPlayState: 'paused' },
              mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 },
              py: 2, mt: -2,
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}>
              <Box className="marquee-content" sx={{
                display: 'flex', gap: 2,
                animation: 'marquee 400s linear infinite',
                width: 'max-content',
                '@keyframes marquee': {
                  '0%': { transform: 'translateX(0)' },
                  '100%': { transform: 'translateX(calc(-50% - 8px))' }
                }
              }}>
                {duplicatedGoldenTickets.map((project, idx) => (
                  <MiniGoldenCard
                    key={`${project.id}-${idx}`}
                    project={project}
                    allProjects={projects}
                    majorColor={project.major ? majorColors[project.major] : undefined}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}

      
      <Grid container spacing={{ xs: 3, lg: 4 }} sx={{ alignItems: 'flex-start', position: 'relative' }}>
        <Grid size={{ xs: 12, md: 3 }} sx={{ position: { md: 'sticky' }, top: { md: 100 }, zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <Box sx={{
              background: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid', borderColor: 'divider', borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              p: { xs: 2.5, sm: 3 },
              display: 'flex', flexDirection: 'column', gap: 2.5,
              maxHeight: { md: 'calc(100vh - 120px)' },
              overflowY: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -1 }}>Khám phá</Typography>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm dự án..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                    '&:hover': { bgcolor: 'background.paper' },
                    transition: 'all 0.3s'
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                fullWidth
                variant={showOnlyGoldenTicket ? 'contained' : 'outlined'}
                onClick={() => setShowOnlyGoldenTicket(!showOnlyGoldenTicket)}
                startIcon={<WorkspacePremiumIcon />}
                sx={{
                  height: 40,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderWidth: '1.5px',
                  ...(showOnlyGoldenTicket
                    ? {
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFF',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      }
                    }
                    : {
                      borderColor: '#F59E0B',
                      color: '#F59E0B',
                      bgcolor: 'transparent',
                      '&:hover': {
                        borderColor: '#D97706',
                        bgcolor: 'rgba(245,158,11,0.08)',
                        borderWidth: '1.5px',
                      }
                    }),
                }}
              >
                <span className="notranslate">Golden Ticket</span>
              </Button>

              <Divider />

              {/* Filters Box */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Bộ lọc</Typography>
                  {(search || currentTab !== 'All' || currentSemester !== 'All' || currentMajor !== 'All' || selectedTags.length > 0 || showOnlyGoldenTicket) && (
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => { 
                        setSearch(''); 
                        setCurrentTab('All'); 
                        setCurrentSemester('All'); 
                        setCurrentMajor('All'); 
                        setSelectedTags([]); 
                        setShowOnlyGoldenTicket(false); 
                      }} 
                      sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem' }}
                    >
                      Xóa tất cả
                    </Button>
                  )}
                </Box>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại dự án</InputLabel>
                  <Select
                    value={currentTab}
                    label="Loại dự án"
                    onChange={e => setCurrentTab(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {categoryNames.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat === 'All' ? 'Tất cả danh mục' : cat} ({getCategoryCount(cat)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Học kỳ</InputLabel>
                  <Select
                    value={currentSemester}
                    label="Học kỳ"
                    onChange={e => setCurrentSemester(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {semesters.map(sem => (
                      <MenuItem key={sem} value={sem}>{sem === 'All' ? 'Tất cả học kỳ' : sem} ({getSemesterCount(sem)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Chuyên ngành</InputLabel>
                  <Select
                    value={currentMajor}
                    label="Chuyên ngành"
                    onChange={e => setCurrentMajor(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {majors.map(major => (
                      <MenuItem key={major} value={major}>{major === 'All' ? 'Tất cả chuyên ngành' : major} ({getMajorCount(major)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {allTags.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Công nghệ</Typography>
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => setIsGraphOpen(true)} 
                      startIcon={<HubIcon fontSize="small" />}
                      sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem' }}
                    >
                      Sơ đồ
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                </Box>
              )}
            </Box>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Hiển thị {filteredProjects.length} dự án
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'grid' ? 'action.selected' : 'transparent' }}>
            <ViewModuleIcon />
          </IconButton>
          <IconButton onClick={() => setViewMode('timeline')} color={viewMode === 'timeline' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'timeline' ? 'action.selected' : 'transparent' }}>
            <ViewStreamIcon />
          </IconButton>
        </Box>
      </Box>

      {isFiltering ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
          <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
        </Box>
      ) : filteredProjects.length === 0 ? (
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
          <Box>
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {displayedProjects.map(project => (
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }} key={project.id}>
                      <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ height: '100%' }}
                      >
                        <ProjectCard project={project} categoryColors={categoryColors} />
                      </motion.div>
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            ) : (
              <Box sx={{ position: 'relative', pl: { xs: 2, md: 0 } }}>
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: { xs: 8, md: '50%' }, width: 2, bgcolor: 'divider', transform: { md: 'translateX(-50%)' } }} />
                <AnimatePresence>
                  {displayedProjects.map((project, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <motion.div 
                        key={project.id} 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ position: 'relative', marginBottom: '3rem' }}
                      >
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: isEven ? 'row-reverse' : 'row' },
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%'
                        }}>
                          <Box sx={{
                            position: 'absolute', left: { xs: -24, md: '50%' }, top: 24,
                            width: 16, height: 16, borderRadius: '50%',
                            bgcolor: project.isGoldenTicket ? '#F59E0B' : 'primary.main',
                            transform: { xs: 'none', md: 'translateX(-50%)' },
                            zIndex: 1, border: '4px solid', borderColor: 'background.paper'
                          }} />

                          <Box sx={{ width: { xs: '100%', md: '45%' }, px: { xs: 2, md: 4 } }}>
                            <ProjectCard project={project} categoryColors={categoryColors} />
                          </Box>

                          <Box sx={{ display: { xs: 'none', md: 'block' }, width: '45%' }} />
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Box>
            )}
          </Box>

          {visibleCount < filteredProjects.length && (
            <Box ref={lastElementRef} sx={{ textAlign: 'center', mt: 5, py: 2 }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          )}
        </>
      )}
        </Grid>
      </Grid>

      {sharedProject && (
        <ProjectDetailModal
          project={sharedProject}
          allProjects={projects}
          open={true}
          onClose={closeSharedProject}
          onShare={handleShare}
        />
      )}

      <Snackbar open={shareSuccess} autoHideDuration={3000} onClose={() => setShareSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShareSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã copy link dự án!
        </Alert>
      </Snackbar>

      {/* Tech Network Graph Modal */}
      {isGraphOpen && (
        <Box sx={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.8)', zIndex: 1300, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }
        }}>
          <Box sx={{ 
            width: '100%', height: '100%', maxWidth: 1200, maxHeight: 800, 
            bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <TechNetworkGraph 
              projects={projects} 
              onClose={() => setIsGraphOpen(false)} 
              onTechClick={(tech) => {
                if (!selectedTags.includes(tech)) {
                  setSelectedTags(prev => [...prev, tech]);
                }
                setIsGraphOpen(false);
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
