import { useState } from 'react';
import {
  Card, CardMedia, CardContent, Typography, CardActions, Button, Chip,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, Avatar, Snackbar, Alert, useTheme
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import type { Project } from '../types/Project';
import { motion } from 'framer-motion';

interface Props {
  project: Project;
  categoryColors?: Record<string, { bg: string; text: string }>;
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const defaultColor = { bg: '#EEF2FF', text: '#2563EB' };

const getAvatarLetter = (name: string) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  const lastWord = words[words.length - 1];
  return lastWord.charAt(0).toUpperCase();
};

export default function ProjectCard({ project, categoryColors = {} }: Props) {
  const [openVideo, setOpenVideo] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const muiTheme = useTheme();
  const youtubeId = getYoutubeId(project.youtubeUrl);
  const colors = categoryColors[project.category] || defaultColor;

  const handleShare = () => {
    // Generate URL like: http://domain.com/#/?project=123
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#/?project=${project.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareSuccess(true);
  };

  return (
    <>
      <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} style={{ height: '100%' }}>
        <Card sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: muiTheme.palette.mode === 'light' ? '0 16px 48px rgba(99, 102, 241, 0.12)' : '0 16px 48px rgba(99, 102, 241, 0.25)',
            borderColor: 'primary.light',
          },
          '&:hover .card-image': {
            transform: 'scale(1.05)',
          },
        }}>
          {/* Image */}
          <Box sx={{ overflow: 'hidden', position: 'relative' }}>
            <CardMedia
              className="card-image"
              component="img"
              height="200"
              image={project.thumbnail || 'https://via.placeholder.com/400x200?text=No+Image'}
              alt={project.name}
              sx={{ transition: 'transform 0.5s ease', objectFit: 'cover' }}
            />
            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
              <Chip
                label={project.category}
                size="small"
                sx={{
                  background: colors.bg,
                  color: colors.text,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 26,
                  backdropFilter: 'blur(8px)',
                }}
              />
            </Box>
            <IconButton 
              onClick={handleShare}
              size="small" 
              sx={{ 
                position: 'absolute', top: 12, right: 12, 
                bgcolor: 'rgba(255, 255, 255, 0.8)', color: '#2563EB',
                '&:hover': { bgcolor: '#2563EB', color: '#FFF' }, backdropFilter: 'blur(4px)'
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
            <Typography variant="h6" component="h2" sx={{
              fontWeight: 700,
              fontSize: '1.05rem',
              lineHeight: 1.35,
              color: 'text.primary',
              mb: 1,
            }}>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5 }} />
              {project.semester}
            </Typography>

            {/* Tech Tags */}
            {project.techTags && project.techTags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                {project.techTags.slice(0, 3).map((tag, i) => (
                  <Chip key={i} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderColor: 'divider', color: 'text.secondary' }} />
                ))}
                {project.techTags.length > 3 && (
                  <Chip label={`+${project.techTags.length - 3}`} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'action.hover' }} />
                )}
              </Box>
            )}

            <Box
              dangerouslySetInnerHTML={{ __html: project.description }}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'text.secondary',
                lineHeight: 1.6,
                mb: 2,
                minHeight: '3.2em',
                fontSize: '0.875rem',
                '& p': { margin: 0 },
                '& ul, & ol': { margin: 0, paddingLeft: 2 }
              }}
            />

            {/* Team preview */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Box sx={{ display: 'flex' }}>
                {project.teamMembers.slice(0, 3).map((member, idx) => (
                  <Avatar
                    key={idx}
                    sx={{
                      width: 26, height: 26,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: ['#2563EB', '#EC4899', '#F59E0B'][idx % 3],
                      border: '2px solid',
                      borderColor: 'background.paper',
                      ml: idx > 0 ? -0.8 : 0,
                    }}
                  >
                    {getAvatarLetter(member)}
                  </Avatar>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {project.teamMembers.length} thành viên
              </Typography>
            </Box>
          </CardContent>

          {/* Actions */}
          <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0.5, justifyContent: 'space-between' }}>
            <Button
              size="small"
              startIcon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setOpenDetail(true)}
              sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
            >
              Chi tiết
            </Button>
            {youtubeId && (
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayCircleOutlineIcon sx={{ fontSize: 18 }} />}
                onClick={() => setOpenVideo(true)}
                sx={{
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  },
                }}
              >
                Video
              </Button>
            )}
          </CardActions>
        </Card>
      </motion.div>

      {/* Video Modal */}
      <Dialog open={openVideo} onClose={() => setOpenVideo(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{project.name}</Typography>
          <IconButton onClick={() => setOpenVideo(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '60vh', borderColor: 'divider' }}>
          {youtubeId && (
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title="YouTube video" frameBorder="0" allowFullScreen
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Chi tiết dự án
          </Typography>
          <Box>
            <IconButton onClick={handleShare} size="small" sx={{ color: 'text.secondary', mr: 1 }}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={() => setOpenDetail(false)} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
            {project.name}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.text, ml: 0.5 }} />}
              label={project.category}
              size="small"
              sx={{ background: colors.bg, color: colors.text, fontWeight: 600 }}
            />
            <Chip
              icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
              label={project.semester}
              size="small"
              variant="outlined"
              sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }}
            />
            {project.techTags && project.techTags.map((tag, i) => (
              <Chip
                key={i}
                icon={<CodeIcon sx={{ fontSize: 14 }} />}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }}
              />
            ))}
          </Box>

          {/* Description */}
          <Box 
            dangerouslySetInnerHTML={{ __html: project.description }}
            sx={{ 
              color: 'text.primary', 
              lineHeight: 1.8, 
              mb: 3, 
              fontSize: '1rem',
              '& p': { mb: 1.5, mt: 0 },
              '& ul, & ol': { mb: 1.5, mt: 0, paddingLeft: 3 }
            }}
          />

          {/* Video */}
          {youtubeId && (
            <Box sx={{ position: 'relative', pt: '56.25%', mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </Box>
          )}

          {/* Team */}
          <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <GroupsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Team thực hiện
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {project.teamMembers.map((member, idx) => (
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
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenDetail(false)} variant="outlined" sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={shareSuccess} autoHideDuration={3000} onClose={() => setShareSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShareSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã copy link dự án!
        </Alert>
      </Snackbar>
    </>
  );
}
