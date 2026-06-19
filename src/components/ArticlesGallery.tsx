import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import type { Article } from '../types/Article';

export default function ArticlesGallery() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const localArticlesUrl = `${import.meta.env.BASE_URL}data/articles.json`;

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

    if (window.location.hostname.includes('.github.io')) {
      const owner = window.location.hostname.split('.')[0];
      const repo = window.location.pathname.split('/')[1];
      if (owner && repo) {
        pPromise = fetchWithFallback(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/articles.json`, localArticlesUrl);
      }
    }

    pPromise
      .then((data: any) => {
        setArticles(data || []);
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

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Tin tức & Bài viết
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Các bài viết chuyên sâu, tin tức và các hoạt động nổi bật của sinh viên và giảng viên.
        </Typography>
      </Box>

      {articles.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Hiện chưa có bài viết nào.</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {articles.map((article, index) => (
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
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.imageUrl || 'https://placehold.co/400x200?text=No+Image'}
                    alt={article.title}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x200?text=No+Image'; }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {article.type && (
                        <Chip label={article.type} size="small" sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.dark' }} />
                      )}
                      {article.major && (
                        <Chip label={article.major} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4, color: 'text.primary' }}>
                      {article.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
