import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';

interface YouTubeInfo {
  title: string;
  thumbnail: string;
  description: string;
  teamMembers: string[];
  videoId: string;
}

export default function AdminForm() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedInfo, setFetchedInfo] = useState<YouTubeInfo | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnail: '',
    youtubeUrl: '',
    category: '',
    teamMembers: '',
    semester: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fetch YouTube info and auto-fill
  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setFetching(true);
    setFetchedInfo(null);

    try {
      const res = await fetch('/api/youtube-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Không thể lấy thông tin video.' });
        setFetching(false);
        return;
      }

      setFetchedInfo(data);

      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        name: data.title || prev.name,
        thumbnail: data.thumbnail || prev.thumbnail,
        youtubeUrl: youtubeUrl.trim(),
        teamMembers: data.teamMembers?.length > 0
          ? data.teamMembers.join(', ')
          : prev.teamMembers,
        description: data.description || prev.description,
      }));

      setStatus({ type: 'success', message: 'Đã tự động điền thông tin từ YouTube!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Lỗi kết nối. Hãy đảm bảo đang chạy npm run dev.' });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newProject = {
      ...formData,
      teamMembers: formData.teamMembers.split(',').map(m => m.trim()).filter(m => m),
    };

    try {
      const response = await fetch('/api/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Lưu dự án thành công!' });
        setFormData({ name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '' });
        setYoutubeUrl('');
        setFetchedInfo(null);
      } else {
        const errorData = await response.json();
        setStatus({ type: 'error', message: `Lỗi: ${errorData.error || 'Không thể lưu'}` });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Hãy đảm bảo bạn đang chạy npm run dev trên máy cá nhân.' });
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, background: '#EEF2FF', color: '#6366F1' }}>
            <EditNoteIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quản trị dự án</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Thêm Dự Án <span style={{ color: '#6366F1' }}>Mới</span>
          </Typography>
        </Box>

        {/* YouTube Auto-Fill Card */}
        <Paper elevation={0} sx={{
          p: 3, mb: 3,
          border: '2px dashed #C7D2FE',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <YouTubeIcon sx={{ color: '#EF4444', fontSize: 24 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Nhập nhanh từ YouTube
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Dán link video YouTube để tự động lấy tên dự án, hình ảnh thumbnail, và danh sách thành viên từ mô tả video.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#FFFFFF',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleFetchYoutube}
              disabled={fetching || !youtubeUrl.trim()}
              startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
              sx={{
                minWidth: 180,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                },
                '&.Mui-disabled': {
                  background: '#CBD5E1',
                  color: '#FFF',
                },
              }}
            >
              {fetching ? 'Đang lấy...' : 'Tự động điền'}
            </Button>
          </Box>

          {/* Preview fetched info */}
          <Collapse in={!!fetchedInfo}>
            {fetchedInfo && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 3, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                    Đã lấy thông tin thành công
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    component="img"
                    src={fetchedInfo.thumbnail}
                    alt="Thumbnail"
                    sx={{ width: 120, height: 68, borderRadius: 2, objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fetchedInfo.title}
                    </Typography>
                    {fetchedInfo.teamMembers.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        👥 {fetchedInfo.teamMembers.join(', ')}
                      </Typography>
                    )}
                    {fetchedInfo.teamMembers.length === 0 && (
                      <Typography variant="caption" sx={{ color: '#F59E0B' }}>
                        ⚠ Không tìm thấy thành viên trong mô tả. Hãy nhập thủ công.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </Collapse>
        </Paper>

        {/* Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Thông tin dự án
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        {/* Form Card */}
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 4.5 },
          border: '1px solid #E2E8F0',
          borderRadius: 4,
          background: '#FFFFFF',
        }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Loại dự án" name="category" value={formData.category} onChange={handleChange} required placeholder="VD: Web App, Mobile App" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Học kỳ" name="semester" value={formData.semester} onChange={handleChange} required placeholder="VD: Học kỳ 1 - 2025" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Link ảnh Thumbnail" name="thumbnail" value={formData.thumbnail} onChange={handleChange} required placeholder="https://..." />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Link YouTube" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Thành viên" name="teamMembers" value={formData.teamMembers} onChange={handleChange} required placeholder="Nguyễn Văn A, Trần Thị B" helperText="Cách nhau bằng dấu phẩy. Tự động điền khi lấy từ YouTube." />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Mô tả dự án" name="description" value={formData.description} onChange={handleChange} multiline rows={4} required />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                  <Button
                    type="submit" variant="contained" size="large" startIcon={<SaveIcon />} fullWidth
                    sx={{
                      py: 1.6,
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                      },
                    }}
                  >
                    Lưu Dự Án
                  </Button>
                </motion.div>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5, textAlign: 'center' }}>
                  Dữ liệu sẽ được lưu vào tệp cục bộ khi chạy ở chế độ Dev.
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      <Snackbar open={!!status} autoHideDuration={5000} onClose={() => setStatus(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setStatus(null)} severity={status?.type} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {status?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
