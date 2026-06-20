import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, IconButton, Chip, CircularProgress, Alert, Stack, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { motion } from 'framer-motion';
import type { Article } from '../types/Article';
import ImageWithFallback from './ImageWithFallback';
import SearchIcon from '@mui/icons-material/Search';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ArticlesGallery() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [articleMajors, setArticleMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const localArticlesUrl = `${import.meta.env.BASE_URL}data/articles.json`;
    const localTypesUrl = `${import.meta.env.BASE_URL}data/articleTypes.json`;
    const localMajorsUrl = `${import.meta.env.BASE_URL}data/majors.json`;

    const fetchWithFallback = async (apiUrl: string, localUrl: string) => {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API limit reached or error');
        const json = await res.json();
        const decoded = decodeURIComponent(escape(atob(json.content)));
        return JSON.parse(decoded);
      } catch (err) {
        const localRes = await fetch(localUrl);
        if (!localRes.ok) return [];
        return localRes.json();
      }
    };

    let pPromise = fetch(localArticlesUrl).then(res => res.json());
    let tPromise = fetch(localTypesUrl).then(res => res.json()).catch(() => []);
    let mPromise = fetch(localMajorsUrl).then(res => res.json()).catch(() => []);

    if (window.location.hostname.includes('.github.io')) {
      const owner = window.location.hostname.split('.')[0];
      const repo = window.location.pathname.split('/')[1];
      if (owner && repo) {
        pPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/articles.json`, localArticlesUrl);
        tPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/articleTypes.json`, localTypesUrl);
        mPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/majors.json`, localMajorsUrl);
      }
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
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Tin tức & Bài viết
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Các bài viết, tin tức và các hoạt động nổi bật của sinh viên.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{
          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 1,
          p: 3, mb: 5,
        }}>
          {/* Types Row */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {types.map(cat => (
                <Chip
                  key={cat}
                  label={`${cat === 'All' ? 'Tất cả loại bài' : cat} (${getTypeCount(cat)})`}
                  onClick={() => setCurrentType(cat)}
                  variant={currentType === cat ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', height: 32, px: 0.5,
                    ...(currentType === cat
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Chuyên ngành</InputLabel>
                <Select
                  value={currentMajor}
                  label="Chuyên ngành"
                  onChange={e => setCurrentMajor(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'background.default' }}
                >
                  {majors.map(major => (
                    <MenuItem key={major} value={major}>{(major === 'All' ? 'Tất cả chuyên ngành' : major)} ({getMajorCount(major)})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm bài viết..."
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
                    sx: { borderRadius: 2, bgcolor: 'background.default' }
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Hiển thị {filteredArticles.length} bài viết
        </Typography>
      </Box>

      {/* Grid */}
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
            {displayedArticles.map((article, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
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
                  }}
                  component="a"
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ImageWithFallback
                    src={article.imageUrl}
                    alt={article.title}
                    fallbackText={article.type}
                    height={200}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {article.type && (
                        <Chip label={article.type} size="small" sx={{ fontWeight: 700, bgcolor: article.typeBg, color: article.typeText }} />
                      )}
                      {article.major && (
                        <Chip label={article.major} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: article.majorText !== '#4B5563' ? article.majorText : 'divider', color: article.majorText }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4, color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </Typography>
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
    </Box>
  );
}
