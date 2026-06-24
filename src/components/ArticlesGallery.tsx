import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, useTheme, Button } from '@mui/material';
import { motion, useInView } from 'framer-motion';
import type { Article } from '../types/Article';
import ImageWithFallback from './ImageWithFallback';
import { getCurrentSeason } from '../lib/seasonalEngine';
import { getSeasonWatermark } from './SeasonalEffects';
import SearchIcon from '@mui/icons-material/Search';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

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

export default function ArticlesGallery() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [articleMajors, setArticleMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const muiTheme = useTheme();
  const season = getCurrentSeason();
  const watermarkUrl = season.id !== 'NONE' ? getSeasonWatermark(season.id) : null;

  const [search, setSearch] = useState('');
  const [currentType, setCurrentType] = useState('All');
  const [currentMajor, setCurrentMajor] = useState('All');

  const [isFiltering, setIsFiltering] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = (node: HTMLDivElement | null) => {
    if (loading || isFiltering) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 9);
      }
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    setVisibleCount(9);
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 500);
    return () => clearTimeout(timer);
  }, [search, currentType, currentMajor]);

  useEffect(() => {
    const localArticlesUrl = `${import.meta.env.BASE_URL}data/articles.json?t=${Date.now()}`;
    const localTypesUrl = `${import.meta.env.BASE_URL}data/articleTypes.json?t=${Date.now()}`;
    const localMajorsUrl = `${import.meta.env.BASE_URL}data/majors.json?t=${Date.now()}`;

    const fetchWithFallback = async (apiUrl: string, localUrl: string) => {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API limit reached or error');
        const json = await res.json();
        const decoded = decodeURIComponent(escape(atob(json.content)));
        return JSON.parse(decoded);
      } catch {
        const localRes = await fetch(localUrl);
        if (!localRes.ok) return [];
        return localRes.json();
      }
    };

    let pPromise: Promise<any>;
    let tPromise: Promise<any>;
    let mPromise: Promise<any>;

    const githubOwner = 'dinhtnguyenn';
    const githubRepo = 'StudentProject';

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      pPromise = fetch(localArticlesUrl).then(res => res.json());
      tPromise = fetch(localTypesUrl).then(res => res.json()).catch(() => []);
      mPromise = fetch(localMajorsUrl).then(res => res.json()).catch(() => []);
    } else {
      const ref = `?ref=main&t=${Date.now()}`;
      pPromise = fetchWithFallback(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articles.json${ref}`, localArticlesUrl);
      tPromise = fetchWithFallback(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articleTypes.json${ref}`, localTypesUrl);
      mPromise = fetchWithFallback(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/majors.json${ref}`, localMajorsUrl);
    }

    Promise.all([pPromise, tPromise, mPromise])
      .then(([artData, typesData, majorsData]) => {
        const resolvedArticles = (artData || []).map((a: any) => {
          const tObj = (typesData || []).find((t: any) => t.id === a.type);
          const mObj = (majorsData || []).find((m: any) => m.id === a.major);
          return {
            ...a,
            type: tObj?.name || a.type,
            typeBg: tObj?.bg || '#E0E7FF',
            typeText: tObj?.text || '#3730A3',
            major: mObj?.name || a.major,
            majorBg: mObj?.bg || 'transparent',
            majorText: mObj?.text || '#4B5563',
          };
        });
        setArticles(resolvedArticles);
        setArticleTypes(typesData || []);
        setArticleMajors(majorsData || []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('Error fetching articles:', err);
        setError('Không thể tải danh sách bài viết.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const types = ['All', ...Array.from(new Set([...articleTypes.map(t => t.name), ...articles.map(a => a.type).filter(Boolean)]))];
  const majors = ['All', ...Array.from(new Set([...articleMajors.map(m => m.name), ...articles.map(a => a.major).filter(Boolean)]))];

  const getTypeCount = (type: string) => type === 'All' ? articles.length : articles.filter(a => a.type === type).length;
  const getMajorCount = (major: string) => major === 'All' ? articles.length : articles.filter(a => a.major === major).length;

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = currentType === 'All' || a.type === currentType;
    const matchesMajor = currentMajor === 'All' || a.major === currentMajor;
    return matchesSearch && matchesType && matchesMajor;
  });

  const displayedArticles = filteredArticles.slice(0, visibleCount);

  return (
    <Box>
      {/* Hero */}
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
            Tin tức & <span style={{ color: muiTheme.palette.primary.main }}>Bài viết</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7, mb: 4 }}>
            Các bài viết, tin tức và các hoạt động nổi bật của sinh viên
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', maxWidth: 600, mx: 'auto', bgcolor: 'background.paper', borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <AnimatedCounter value={articles.length} label="Bài viết" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={articleTypes.length} label="Chủ đề" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={articleMajors.length} label="Chuyên ngành" />
          </Box>
        </Box>
      </motion.div>

      {/* Main Content Area */}
      <Grid container spacing={{ xs: 3, lg: 4 }} sx={{ alignItems: 'flex-start', position: 'relative' }}>
        
        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ position: { md: 'sticky' }, top: { md: 100 }, zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
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

              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm bài viết..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                  }
                }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Bộ lọc</Typography>
                  {(search || currentType !== 'All' || currentMajor !== 'All') && (
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => { 
                        setSearch(''); 
                        setCurrentType('All'); 
                        setCurrentMajor('All'); 
                      }} 
                      sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem' }}
                    >
                      Xóa tất cả
                    </Button>
                  )}
                </Box>
                <FormControl size="small" fullWidth>
                  <InputLabel>Loại bài viết</InputLabel>
                  <Select
                    value={currentType}
                    label="Loại bài viết"
                    onChange={e => setCurrentType(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {types.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat === 'All' ? 'Tất cả bài viết' : cat} ({getTypeCount(cat)})</MenuItem>
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
                      <MenuItem key={major} value={major}>{(major === 'All' ? 'Tất cả chuyên ngành' : major)} ({getMajorCount(major)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Hiển thị {filteredArticles.length} bài viết
            </Typography>
          </Box>

          {isFiltering ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
              <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
            </Box>
          ) : filteredArticles.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Box sx={{ textAlign: 'center', py: 10, px: 3, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <SentimentDissatisfiedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Không tìm thấy bài viết nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Hãy thử tìm kiếm với từ khoá hoặc phân loại khác.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <>
              <Grid container spacing={4}>
                {displayedArticles.map((article) => (
                  <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }} key={article.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ height: '100%' }}
                    >
                      <Card
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          bgcolor: 'background.paper',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                            transform: 'translateY(-8px)'
                          },
                          '&:hover .card-image': {
                            transform: 'scale(1.05)',
                          }
                        }}
                        component="a"
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Box sx={{ overflow: 'hidden' }}>
                          <ImageWithFallback
                            className="card-image"
                            src={article.imageUrl}
                            alt={article.title}
                            fallbackText={article.type}
                            iconKeyword={article.major}
                            height="auto"
                            sx={{ aspectRatio: '16/9', transition: 'transform 0.5s ease' }}
                          />
                        </Box>
                        <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                          {watermarkUrl && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: -30,
                                width: 200,
                                height: 200,
                                backgroundImage: watermarkUrl,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center right',
                                opacity: muiTheme.palette.mode === 'dark' ? 0.20 : 0.12,
                                pointerEvents: 'none',
                                zIndex: 0,
                                transform: 'translateY(-50%) rotate(-15deg)',
                                WebkitMaskImage: 'radial-gradient(circle at center right, black 30%, transparent 90%)',
                                maskImage: 'radial-gradient(circle at center right, black 30%, transparent 90%)',
                              }}
                            />
                          )}
                          <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                              {article.type && (
                                <Box>
                                  <Chip label={article.type} size="small" sx={{ fontWeight: 700, bgcolor: article.typeBg, color: article.typeText }} />
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {article.major && (
                                  <Chip label={article.major} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: article.majorText !== '#4B5563' ? article.majorText : 'divider', color: article.majorText }} />
                                )}
                                {article.year && (
                                  <Chip label={article.year} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }} />
                                )}
                              </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {article.title}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              {visibleCount < filteredArticles.length && (
                <Box ref={lastElementRef} sx={{ textAlign: 'center', mt: 5, py: 2 }}>
                  <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
