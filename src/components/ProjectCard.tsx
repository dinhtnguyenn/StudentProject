import { useState } from 'react';
import {
  Card, CardContent, Typography, CardActions, Button, Chip,
  Box, Dialog, DialogTitle, DialogContent, IconButton, Avatar, Snackbar, Alert, useTheme
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Project } from '../types/Project';
import { motion } from 'framer-motion';
import ImageWithFallback from './ImageWithFallback';
import { getCurrentSeason } from '../lib/seasonalEngine';
import { getSeasonWatermark } from './SeasonalEffects';

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

import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project, categoryColors = {} }: Props) {
  const navigate = useNavigate();
  const [openVideo, setOpenVideo] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const muiTheme = useTheme();
  const youtubeId = getYoutubeId(project.youtubeUrl);
  const colors = categoryColors[project.category] || defaultColor;
  const season = getCurrentSeason();
  const primaryColor = season.id !== 'NONE' ? season.palette.primary : '#2563EB';
  const goldenColor = season.id !== 'NONE' ? season.palette.goldenTicket : '#F59E0B';
  const watermarkUrl = getSeasonWatermark(season.id);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const shareText = `Dự án: ${project.name}\nXem tại: ${baseUrl}/project/${project.id}`;
    navigator.clipboard.writeText(shareText);
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
          border: project.isGoldenTicket ? '2px solid' : '1px solid',
          borderColor: project.isGoldenTicket ? goldenColor : 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: project.isGoldenTicket 
              ? `0 16px 48px ${goldenColor}66`
              : (muiTheme.palette.mode === 'light' ? '0 16px 48px rgba(99, 102, 241, 0.12)' : '0 16px 48px rgba(99, 102, 241, 0.25)'),
            borderColor: project.isGoldenTicket ? goldenColor : primaryColor,
            animation: project.isGoldenTicket ? 'golden-pulse 2s infinite' : 'none',
          },
          '&:hover .card-image': {
            transform: 'scale(1.05)',
          },
        }}>
          <Box onClick={() => navigate(`/project/${project.id}`)} sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {/* Image */}
            <Box sx={{ overflow: 'hidden', position: 'relative' }}>
            <ImageWithFallback
              className="card-image"
              src={project.thumbnail}
              alt={project.name}
              fallbackText={project.major}
              height="auto"
              sx={{ aspectRatio: '16/9', transition: 'transform 0.5s ease' }}
            />

            <IconButton 
              onClick={handleShare}
              size="small" 
              sx={{ 
                position: 'absolute', top: 12, right: 12, 
                bgcolor: 'rgba(255, 255, 255, 0.8)', color: project.isGoldenTicket ? goldenColor : primaryColor,
                '&:hover': { bgcolor: project.isGoldenTicket ? goldenColor : primaryColor, color: '#FFF' }, backdropFilter: 'blur(4px)'
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, pt: 2, position: 'relative' }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, zIndex: 1, position: 'relative' }}>
              {project.isGoldenTicket && (
                <Box>
                  <Chip
                    icon={<WorkspacePremiumIcon sx={{ fontSize: '14px !important' }} />}
                    className="notranslate"
                    label="GOLDEN TICKET"
                    size="small"
                    sx={{
                      background: `linear-gradient(135deg, ${goldenColor} 0%, ${goldenColor}dd 100%)`,
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      height: 24,
                      boxShadow: `0 2px 8px ${goldenColor}66`,
                      '& .MuiChip-icon': { color: '#FFF' }
                    }}
                  />
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                <Chip
                  label={project.category}
                  size="small"
                  sx={{
                    background: project.isGoldenTicket ? `${goldenColor}1A` : colors.bg,
                    color: project.isGoldenTicket ? goldenColor : colors.text,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
                {project.major && (
                  <Chip
                    icon={project.isGoldenTicket ? <AutoAwesomeIcon sx={{ fontSize: '12px !important' }} /> : <SchoolIcon sx={{ fontSize: '12px !important' }} />}
                    label={project.major}
                    size="small"
                    sx={{
                      background: project.isGoldenTicket ? `linear-gradient(135deg, ${goldenColor}1A 0%, ${goldenColor}0A 100%)` : 'rgba(0, 0, 0, 0.04)',
                      color: project.isGoldenTicket ? goldenColor : 'text.primary',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 24,
                      border: 'none',
                      '& .MuiChip-icon': { color: project.isGoldenTicket ? goldenColor : 'text.secondary' }
                    }}
                  />
                )}
              </Box>
            </Box>
            <Typography variant="h6" component="h2" sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              lineHeight: 1.4,
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
            {Array.isArray(project.techTags) && project.techTags.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                {project.techTags.slice(0, 3).map((tag, i) => (
                  <Chip key={i} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderColor: 'divider', color: 'text.secondary' }} />
                ))}
                {project.techTags.length > 3 && (
                  <Chip label={`+${project.techTags.length - 3}`} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'action.hover' }} />
                )}
              </Box>
            ) : typeof project.techTags === 'string' && project.techTags ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                {(project.techTags as string).split(',').map(t=>t.trim()).filter(t=>t).slice(0, 3).map((tag, i) => (
                  <Chip key={i} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderColor: 'divider', color: 'text.secondary' }} />
                ))}
                {(project.techTags as string).split(',').filter(t=>t.trim()).length > 3 && (
                  <Chip label={`+${(project.techTags as string).split(',').filter(t=>t.trim()).length - 3}`} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'action.hover' }} />
                )}
              </Box>
            ) : null}

            {/* Team preview */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Box sx={{ display: 'flex' }}>
                {(() => {
                  const safeTeamMembers = Array.isArray(project.teamMembers) 
                    ? project.teamMembers 
                    : (typeof project.teamMembers === 'string' ? (project.teamMembers as string).split('\n').map(m => m.trim()).filter(m => m) : []);
                  return (
                    <>
                      {safeTeamMembers.slice(0, 3).map((member, idx) => (
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
                    </>
                  );
                })()}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {(() => {
                  const count = Array.isArray(project.teamMembers) 
                    ? project.teamMembers.length 
                    : (typeof project.teamMembers === 'string' ? (project.teamMembers as string).split('\n').filter(m => m.trim()).length : 0);
                  return count > 0 ? `${count} thành viên` : 'Đang cập nhật';
                })()}
              </Typography>
            </Box>
          </CardContent>
          </Box>

          {/* Actions */}
          <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0.5, justifyContent: 'space-between' }}>
            <Button
              size="small"
              startIcon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={() => navigate(`/project/${project.id}`)}
              sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: project.isGoldenTicket ? goldenColor : primaryColor, bgcolor: project.isGoldenTicket ? `${goldenColor}1A` : 'action.hover' } }}
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
                  color: '#FFF',
                  background: project.isGoldenTicket ? goldenColor : primaryColor,
                  '&:hover': {
                    background: project.isGoldenTicket ? goldenColor : primaryColor,
                    opacity: 0.9,
                    boxShadow: project.isGoldenTicket ? `0 4px 12px ${goldenColor}66` : `0 4px 12px ${primaryColor}66`,
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

      <Snackbar open={shareSuccess} autoHideDuration={3000} onClose={() => setShareSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShareSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã copy link dự án!
        </Alert>
      </Snackbar>
    </>
  );
}
