import { useState } from 'react';
import {
  Card, CardMedia, CardContent, Typography, CardActions, Button, Chip,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, Avatar,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import type { Project } from '../types/Project';
import { motion } from 'framer-motion';

interface Props {
  project: Project;
  categoryColors?: Record<string, { bg: string; text: string }>;
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const defaultColor = { bg: '#EEF2FF', text: '#6366F1' };

export default function ProjectCard({ project, categoryColors = {} }: Props) {
  const [openVideo, setOpenVideo] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const youtubeId = getYoutubeId(project.youtubeUrl);
  const colors = categoryColors[project.category] || defaultColor;

  return (
    <>
      <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} style={{ height: '100%' }}>
        <Card sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#FFFFFF',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 16px 48px rgba(99, 102, 241, 0.12)',
            borderColor: '#C7D2FE',
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
          </Box>

          {/* Content */}
          <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
            <Typography variant="h6" component="h2" sx={{
              fontWeight: 700,
              fontSize: '1.05rem',
              lineHeight: 1.35,
              color: '#0F172A',
              mb: 1,
            }}>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#64748B', fontWeight: 600 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5 }} />
              {project.semester}
            </Typography>
            <Typography variant="body2" sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
              color: '#64748B',
              fontSize: '0.825rem',
            }}>
              {project.description}
            </Typography>

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
                      bgcolor: ['#6366F1', '#EC4899', '#F59E0B'][idx % 3],
                      border: '2px solid #FFF',
                      ml: idx > 0 ? -0.8 : 0,
                    }}
                  >
                    {member.charAt(0)}
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
              sx={{ color: '#64748B', fontSize: '0.8rem', '&:hover': { color: '#6366F1', background: '#F5F3FF' } }}
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
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{project.name}</Typography>
          <IconButton onClick={() => setOpenVideo(false)} size="small" sx={{ color: '#94A3B8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '60vh', borderColor: '#E2E8F0' }}>
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
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#6366F1' }}>
            Chi tiết dự án
          </Typography>
          <IconButton onClick={() => setOpenDetail(false)} size="small" sx={{ color: '#94A3B8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
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
              sx={{ borderColor: '#E2E8F0', color: '#64748B', fontWeight: 500 }}
            />
          </Box>

          {/* Description */}
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: '#334155' }}>
            {project.description}
          </Typography>

          {/* Team */}
          <Box sx={{ p: 2.5, borderRadius: 3, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <GroupsIcon sx={{ color: '#6366F1', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Team thực hiện
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {project.teamMembers.map((member, idx) => (
                <Grid size={{ xs: 12 }} key={idx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, '&:hover': { background: '#EEF2FF' } }}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700, bgcolor: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'][idx % 4] }}>
                      {member.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                      {member}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setOpenDetail(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#64748B', '&:hover': { borderColor: '#6366F1', color: '#6366F1' } }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
