import { Dialog, DialogContent, DialogActions, Button, Typography, Box, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShareIcon from '@mui/icons-material/Share';
import { Helmet } from 'react-helmet-async';
import type { Article } from '../types/Article';
import ImageWithFallback from './ImageWithFallback';
import { toAbsoluteImageUrl } from '../lib/imageUrl';

interface Props {
  article: Article;
  open: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export default function ArticleDetailModal({ article, open, onClose, onShare }: Props) {
  if (!article) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <Helmet>
        <title>{article.title} | UniFolio</title>
        <meta name="description" content={`Bài viết: ${article.title} thuộc chuyên ngành ${article.major}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={`Bài viết: ${article.title} thuộc chuyên ngành ${article.major}`} />
        <meta property="og:image" content={toAbsoluteImageUrl(article.imageUrl, window.location.origin)} />
        <link rel="canonical" href={`${window.location.origin}/article/${article.id}`} />
      </Helmet>

      <Box sx={{ position: 'relative', height: 300 }}>
        <ImageWithFallback
          src={article.imageUrl}
          alt={article.title}
          height="100%"
          priority
        />
        <IconButton 
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {article.type && (
            <Chip label={article.type} size="small" sx={{ bgcolor: article.typeBg || '#E0E7FF', color: article.typeText || '#3730A3', fontWeight: 600 }} />
          )}
          {article.major && (
            <Chip label={article.major} size="small" sx={{ bgcolor: article.majorBg || '#F3F4F6', color: article.majorText || '#4B5563', fontWeight: 600 }} />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
          {article.title}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
        {onShare ? (
          <Button startIcon={<ShareIcon />} onClick={onShare} color="inherit">
            Chia sẻ
          </Button>
        ) : <Box />}
        <Button 
          variant="contained" 
          startIcon={<OpenInNewIcon />} 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ borderRadius: 2 }}
        >
          Đọc bài viết
        </Button>
      </DialogActions>
    </Dialog>
  );
}
