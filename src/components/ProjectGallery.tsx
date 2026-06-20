import { useState, useEffect, useRef } from 'react';
import { Typography, TextField, Box, CircularProgress, InputAdornment, Grid, Chip, Stack, FormControl, Select, MenuItem, InputLabel, useTheme, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ProjectCard from './ProjectCard';
import type { Project } from '../types/Project';
import type { Category } from '../types/Category';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import ProjectDetailModal from './ProjectDetailModal';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
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
  const [currentMajor, setCurrentMajor] = useState('All');
  const [showOnlyGoldenTicket, setShowOnlyGoldenTicket] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [visibleCount, setVisibleCount] = useState(9);
  const [sharedProject, setSharedProject] = useState<Project | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
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
    const localProjectsUrl = `${import.meta.env.BASE_URL}data/projects.json`;
    const localCategoriesUrl = `${import.meta.env.BASE_URL}data/categories.json`;
    const localMajorsUrl = `${import.meta.env.BASE_URL}data/majors.json`;

    // Hàm lấy dữ liệu với chiến lược "API First, Fallback Local"
    const fetchWithFallback = async (apiUrl: string, localUrl: string) => {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API limit reached or error');
        const json = await res.json();
        // GitHub API trả về nội dung mã hoá Base64
        const decoded = decodeURIComponent(escape(atob(json.content)));
        return JSON.parse(decoded);
      } catch (err) {
        // Nếu API lỗi (Hết 60 lượt/giờ), tự động lùi về đọc file tĩnh (chậm 1 chút nhưng an toàn)
        const localRes = await fetch(localUrl);
        if (!localRes.ok) return [];
        return localRes.json();
      }
    };

    let pPromise = fetch(localProjectsUrl).then(res => res.json());
    let cPromise = fetch(localCategoriesUrl).then(res => res.json()).catch(() => []);
    let mPromise = fetch(localMajorsUrl).then(res => res.json()).catch(() => []);

    if (window.location.hostname.includes('.github.io')) {
      const owner = window.location.hostname.split('.')[0];
      const repo = window.location.pathname.split('/')[1];
      if (owner && repo) {
        pPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/projects.json`, localProjectsUrl);
        cPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/categories.json`, localCategoriesUrl);
        mPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/majors.json`, localMajorsUrl);
      }
    }

    Promise.all([pPromise, cPromise, mPromise])
      .then(([projData, catData, majData]) => {
        const categoriesData = catData || [];
        const majorsData = majData || [];
        
        const resolvedProjects = (projData || []).map((p: any) => ({
          ...p,
          category: categoriesData.find((c: any) => c.id === p.category)?.name || p.category,
          major: majorsData.find((m: any) => m.id === p.major)?.name || p.major,
        }));
        
        setProjects(resolvedProjects);
        setCategories(categoriesData);
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

  // Reset Load More and trigger loading when filters change
  useEffect(() => {
    setVisibleCount(9);
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, currentTab, currentSemester, currentMajor, showOnlyGoldenTicket, selectedTags]);

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

  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = { bg: cat.bg, text: cat.text };
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
          p: 3, mb: 5,
        }}>
          {/* Categories Row */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {categoryNames.map(cat => (
                <Chip
                  key={cat}
                  label={`${cat === 'All' ? 'Tất cả' : cat} (${getCategoryCount(cat)})`}
                  onClick={() => setCurrentTab(cat)}
                  variant={currentTab === cat ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', height: 32, px: 0.5,
                    ...(currentTab === cat
                      ? {
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#FFF', border: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      }
                      : {
                        borderColor: 'divider', color: 'text.secondary',
                        '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.hover' },
                      }),
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Filters & Search Row */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Học kỳ</InputLabel>
                <Select
                  value={currentSemester}
                  label="Học kỳ"
                  onChange={e => setCurrentSemester(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'background.default' }}
                >
                  {semesters.map(sem => (
                    <MenuItem key={sem} value={sem}>{sem === 'All' ? 'Tất cả học kỳ' : sem} ({getSemesterCount(sem)})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Chuyên ngành</InputLabel>
                <Select
                  value={currentMajor}
                  label="Chuyên ngành"
                  onChange={e => setCurrentMajor(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'background.default' }}
                >
                  {majors.map(major => (
                    <MenuItem key={major} value={major}>{major === 'All' ? 'Tất cả chuyên ngành' : major} ({getMajorCount(major)})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                Golden Ticket
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
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
                sx={{ bgcolor: 'background.default', borderRadius: 2 }}
              />
            </Grid>
          </Grid>

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

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Hiển thị {filteredProjects.length} dự án
        </Typography>
      </Box>

      {/* Grid */}
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
            <Box ref={lastElementRef} sx={{ textAlign: 'center', mt: 5, py: 2 }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          )}
        </>
      )}

      {/* Shared Project Modal */}
      {sharedProject && (
        <ProjectDetailModal 
          project={sharedProject}
          open={true}
          onClose={closeSharedProject}
        />
      )}
    </Box>
  );
}
