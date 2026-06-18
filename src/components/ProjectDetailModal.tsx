import type { Project } from '../types/Project';
import { Dialog, DialogContent, Box, Typography, IconButton, Chip, Avatar, useTheme, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DOMPurify from 'dompurify';
import CommentSection from './CommentSection';

interface Props {
  project: Project;
  open: boolean;
  onClose: () => void;
  onShare?: (e?: any) => void;
}

const getAvatarLetter = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

export default function ProjectDetailModal({ project, open, onClose, onShare }: Props) {
  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === 'light';

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = project.youtubeUrl?.match(regExp);
  const youtubeId = (match && match[2].length === 11) ? match[2] : null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        }
      }}
    >
      {/* Hero Banner Area */}
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 200, md: 320 }, bgcolor: 'background.default' }}>
        {project.thumbnail ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${project.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            }}
          />
        )}
        {/* Gradient Overlay for seamless transition */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -1, left: 0, right: 0,
            height: '150px',
            background: `linear-gradient(to top, ${muiTheme.palette.background.paper} 0%, transparent 100%)`,
          }}
        />

        {/* Action Buttons Overlay */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
          {onShare && (
            <IconButton onClick={onShare} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: 'primary.main' }, backdropFilter: 'blur(8px)' }}>
              <ShareIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: 'error.main' }, backdropFilter: 'blur(8px)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <DialogContent sx={{ p: { xs: 2, md: 5 }, pt: { xs: 2, md: 5 }, overflowX: 'hidden' }}>
        <Grid container spacing={5}>
          {/* LEFT COLUMN: Overview, Video, Comments */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              mb: 3, 
              position: 'relative',
              zIndex: 1,
              background: isLight ? 'linear-gradient(90deg, #1E293B, #2563EB)' : 'linear-gradient(90deg, #F8FAFC, #60A5FA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {project.name}
            </Typography>

            {project.description && (project.description.includes('<img') || project.description.includes('<iframe') || project.description.replace(/<[^>]*>?/gm, '').trim().length > 0) && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  Tổng quan dự án
                </Typography>
                
                <Box 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(project.description) }}
                  sx={{ 
                    color: 'text.secondary', 
                    lineHeight: 1.8, 
                    mb: 4, 
                    fontSize: '1.05rem',
                    '& p': { mb: 2, mt: 0 },
                    '& ul, & ol': { mb: 2, mt: 0, paddingLeft: 3 }
                  }}
                />
              </>
            )}

            {youtubeId && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  Video Demo
                </Typography>
                <Box sx={{ 
                  position: 'relative', pt: '56.25%', borderRadius: 4, overflow: 'hidden', 
                  boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              </Box>
            )}

            <CommentSection projectId={project.id} />
          </Grid>

          {/* RIGHT COLUMN: Meta, Tech Stack, Team */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* Project Meta Card */}
              <Box sx={{ p: 3, borderRadius: 4, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                  Thông tin chung
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CalendarTodayIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Học kỳ</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>{project.semester}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CodeIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Danh mục</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>{project.category}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Tech Stack */}
              {project.techTags && project.techTags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                    Công nghệ sử dụng
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {project.techTags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        sx={{ 
                          bgcolor: isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(96, 165, 250, 0.1)', 
                          color: 'primary.main', 
                          fontWeight: 700,
                          borderRadius: 2
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Team Members */}
              {project.teamMembers && project.teamMembers.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                    Team thực hiện ({project.teamMembers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {project.teamMembers.map((member, idx) => (
                      <Box key={idx} sx={{ 
                        display: 'flex', alignItems: 'center', gap: 2, p: 1.5, 
                        borderRadius: 3, 
                        bgcolor: 'background.default',
                        border: '1px solid', borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', transform: 'translateX(4px)' }
                      }}>
                        <Avatar sx={{ 
                          width: 40, height: 40, 
                          fontSize: '1rem', fontWeight: 700, 
                          bgcolor: ['#2563EB', '#EC4899', '#F59E0B', '#10B981'][idx % 4] 
                        }}>
                          {getAvatarLetter(member)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
                          {member}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
