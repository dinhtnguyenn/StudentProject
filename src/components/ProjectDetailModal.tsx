import type { Project } from '../types/Project';
import { Dialog, DialogContent, Box, Typography, IconButton, Chip, Avatar, useTheme, Grid, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DOMPurify from 'dompurify';
import CommentSection from './CommentSection';
import ImageWithFallback from './ImageWithFallback';

import React from "react";
interface Props {
  project: Project;
  allProjects?: Project[];
  open: boolean;
  onClose: () => void;
  onShare?: (e?: any) => void;
}

const getAvatarLetter = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

export default function ProjectDetailModal({ project, allProjects = [], open, onClose, onShare }: Props) {
  const [activeProject, setActiveProject] = React.useState(project);
  React.useEffect(() => { setActiveProject(project); }, [project]);

  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === 'light';
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = activeProject.youtubeUrl?.match(regExp);
  const youtubeId = (match && match[2].length === 11) ? match[2] : null;

  
  const relatedProjects = React.useMemo(() => {
    const filtered = allProjects.filter((p: Project) => p.id !== activeProject.id && (p.category === activeProject.category || p.major === activeProject.major));
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [allProjects, activeProject]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      sx={{
        backdropFilter: 'blur(20px)',
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0,0,0,0.6)',
        },
        '& .MuiDialog-paper': {
          borderRadius: { xs: 0, md: 6 },
          m: { xs: 0, md: 2 },
          overflow: 'hidden',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      {/* Hero Banner Area */}
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 250, md: 400 }, bgcolor: 'background.default' }}>
        <ImageWithFallback
          src={activeProject.thumbnail}
          alt={activeProject.name}
          fallbackText={activeProject.major}
          height="100%"
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%'
          }}
        />
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
        <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 2 }}>
          {onShare && (
            <IconButton onClick={onShare} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: activeProject.isGoldenTicket ? '#F59E0B' : 'primary.main' }, backdropFilter: 'blur(8px)' }}>
              <ShareIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: 'error.main' }, backdropFilter: 'blur(8px)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <DialogContent sx={{ 
        p: { xs: 2, md: 5 }, 
        pt: { xs: 2, md: 5 }, 
        overflowX: 'hidden',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}>
        <Grid container spacing={5}>
          {/* LEFT COLUMN: Overview, Video, Comments */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              mb: 3, 
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              background: activeProject.isGoldenTicket
                ? 'linear-gradient(90deg, #D97706 0%, #FBBF24 50%, #D97706 100%)'
                : (isLight ? 'linear-gradient(90deg, #1E293B, #2563EB)' : 'linear-gradient(90deg, #F8FAFC, #60A5FA)'),
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: activeProject.isGoldenTicket ? '200% auto' : 'auto',
              animation: activeProject.isGoldenTicket ? 'golden-shine 3s linear infinite' : 'none',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {activeProject.isGoldenTicket && <WorkspacePremiumIcon sx={{ color: '#F59E0B', fontSize: { xs: '1.8rem', md: '2.8rem' }, mr: 1.5, filter: 'drop-shadow(0 0px 8px rgba(245,158,11,0.6))', animation: 'golden-float 3s ease-in-out infinite' }} />}
              {activeProject.name}
            </Typography>

            {activeProject.isGoldenTicket && (
              <Box sx={{ 
                mb: 4, p: 2, borderRadius: 3, 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)', 
                border: '1px solid rgba(245,158,11,0.4)', 
                display: 'flex', alignItems: 'center', gap: 2,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
              }}>
                <Box sx={{
                  position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'golden-shine 4s infinite linear'
                }} />
                <EmojiEventsIcon sx={{ fontSize: '2.5rem', color: '#F59E0B', filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.4))' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#D97706', mb: 0.5 }}>Dự án Đạt <span className="notranslate">Golden Ticket</span></Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>Đây là một trong những DATN xuất sắc, được đánh giá cao về cả giải pháp kỹ thuật lẫn tính ứng dụng.</Typography>
                </Box>
              </Box>
            )}

            {activeProject.description && (activeProject.description.includes('<img') || activeProject.description.includes('<iframe') || activeProject.description.replace(/<[^>]*>?/gm, '').trim().length > 0) && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  Tổng quan dự án
                </Typography>

                <Box
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeProject.description, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }}
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    mb: 4,
                    fontSize: '1.05rem',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'hidden',
                    '& p': { mb: 2, mt: 0 },
                    '& ul, & ol': { mb: 2, mt: 0, paddingLeft: 3 },
                    '& img, & iframe': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2, display: 'block' },
                    '& a': { color: 'primary.main', wordBreak: 'break-all' }
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

            
            {relatedProjects.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  Có thể bạn cũng quan tâm
                </Typography>
                <Grid container spacing={2}>
                  {relatedProjects.map((rp: Project) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={rp.id}>
                      <Box 
                        onClick={() => {
                          const container = document.querySelector('.MuiDialogContent-root');
                          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                          setActiveProject(rp);
                        }}
                        sx={{ 
                          p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                          bgcolor: 'background.default', cursor: 'pointer',
                          transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)' }
                        }}
                      >
                        <Box sx={{ width: '100%', height: 100, borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                          <ImageWithFallback src={rp.thumbnail} alt={rp.name} height={100} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {rp.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            <CommentSection projectId={activeProject.id} />
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
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: activeProject.isGoldenTicket ? '#F59E0B' : 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CalendarTodayIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Học kỳ</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>{activeProject.semester}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: activeProject.major ? 2 : 0 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: activeProject.isGoldenTicket ? '#D97706' : 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CodeIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Danh mục</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>{activeProject.category}</Typography>
                  </Box>
                </Box>
                {activeProject.major && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: activeProject.isGoldenTicket ? 'rgba(245, 158, 11, 0.15)' : 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeProject.isGoldenTicket ? '#F59E0B' : 'info.main', border: activeProject.isGoldenTicket ? '1px solid rgba(245,158,11,0.4)' : 'none' }}>
                      {activeProject.isGoldenTicket ? <AutoAwesomeIcon fontSize="small" /> : <SchoolIcon fontSize="small" />}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Chuyên ngành</Typography>
                      <Typography variant="body2" color={activeProject.isGoldenTicket ? '#F59E0B' : 'text.primary'} sx={{ fontWeight: 700 }}>{activeProject.major}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Tech Stack */}
              {Array.isArray(activeProject.techTags) && activeProject.techTags.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                    Công nghệ sử dụng
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {activeProject.techTags.map((tag: string, i: number) => (
                      <Chip
                        key={i}
                        label={tag}
                        sx={{
                          bgcolor: activeProject.isGoldenTicket ? 'rgba(245, 158, 11, 0.1)' : (isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(96, 165, 250, 0.1)'),
                          color: activeProject.isGoldenTicket ? '#F59E0B' : 'primary.main',
                          fontWeight: 700,
                          borderRadius: 2
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : typeof activeProject.techTags === 'string' && activeProject.techTags ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                    Công nghệ sử dụng
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(activeProject.techTags as string).split(',').map(t=>t.trim()).filter(t=>t).map((tag: string, i: number) => (
                      <Chip
                        key={i}
                        label={tag}
                        sx={{
                          bgcolor: activeProject.isGoldenTicket ? 'rgba(245, 158, 11, 0.1)' : (isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(96, 165, 250, 0.1)'),
                          color: activeProject.isGoldenTicket ? '#F59E0B' : 'primary.main',
                          fontWeight: 700,
                          borderRadius: 2
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : null}

              {/* Team Members */}
              {(() => {
                const safeTeamMembers = Array.isArray(activeProject.teamMembers) 
                  ? activeProject.teamMembers 
                  : (typeof activeProject.teamMembers === 'string' ? (activeProject.teamMembers as string).split('\n').map(m => m.trim()).filter(Boolean) : []);
                if (safeTeamMembers.length === 0) return null;
                return (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                      Team thực hiện ({safeTeamMembers.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {safeTeamMembers.map((member, idx) => (
                        <Box key={idx} sx={{
                          display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                          borderRadius: 3,
                          bgcolor: 'background.default',
                          border: '1px solid', borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: activeProject.isGoldenTicket ? '#F59E0B' : 'primary.main', transform: 'translateX(4px)' }
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
                );
              })()}

            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
