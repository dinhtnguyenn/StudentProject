import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse, IconButton, InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';

// --- Types & Helpers ---
interface YouTubeInfo {
  title: string;
  thumbnail: string;
  description: string;
  teamMembers: string[];
  videoId: string;
}

const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

function parseTeamMembers(desc: string): string[] {
  const members: string[] = [];
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
  const inlinePattern = /(?:th[àa]nh\s*vi[êe]n|team|nh[oó]m|members?)\s*[:：]\s*(.+)/i;
  for (const line of lines) {
    const match = line.match(inlinePattern);
    if (match) {
      const names = match[1].split(/[,;，、]/).map(n => n.trim()).filter(n => n.length > 1 && n.length < 50);
      if (names.length > 0) return names;
    }
  }
  const headerPattern = /^(?:th[àa]nh\s*vi[êe]n|team|nh[oó]m\s*th[ưự]c\s*hi[eệ]n|members?|sinh\s*vi[êe]n)/i;
  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i])) {
      for (let j = i + 1; j < lines.length; j++) {
        const bulletMatch = lines[j].match(/^[\-\•\*\+▪→►]\s*(.+)/);
        if (bulletMatch) {
          const name = bulletMatch[1].replace(/\s*[-–—:：].*$/, '').trim();
          if (name.length > 1 && name.length < 50) members.push(name);
        } else if (lines[j].match(headerPattern) || lines[j] === '') {
          break;
        } else {
          const name = lines[j].replace(/^\d+[.)]\s*/, '').replace(/\s*[-–—:：].*$/, '').trim();
          if (name.length > 1 && name.length < 50 && !name.includes('http')) members.push(name);
        }
      }
      if (members.length > 0) return members;
    }
  }
  return members;
}

// --- Component ---
export default function AdminForm() {
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load settings
  useEffect(() => {
    setGithubToken(localStorage.getItem('gh_token') || '');
    setGithubOwner(localStorage.getItem('gh_owner') || '');
    setGithubRepo(localStorage.getItem('gh_repo') || '');
  }, []);

  const saveSettings = () => {
    localStorage.setItem('gh_token', githubToken.trim());
    localStorage.setItem('gh_owner', githubOwner.trim());
    localStorage.setItem('gh_repo', githubRepo.trim());
    setStatus({ type: 'success', message: 'Đã lưu cấu hình GitHub!' });
    setShowSettings(false);
  };

  // YouTube & Form State
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
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setFetching(true);
    setFetchedInfo(null);

    try {
      const videoId = extractYoutubeId(youtubeUrl.trim());
      if (!videoId) throw new Error('Link YouTube không hợp lệ');

      // 1. Fetch title via oEmbed
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      let title = '';
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || '';
      }

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      // 2. Fetch page HTML via CORS proxy to get description
      // Using allorigins as a free public proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
      const pageRes = await fetch(proxyUrl);
      const proxyData = await pageRes.json();
      const html = proxyData.contents;

      let description = '';
      let teamMembers: string[] = [];

      const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s)
        || html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);

      if (playerMatch) {
        try {
          const playerData = JSON.parse(playerMatch[1]);
          description = playerData?.videoDetails?.shortDescription || '';
        } catch { /* ignore parse error */ }
      }

      if (!description) {
        const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*?)"\s*\/?>/i);
        if (metaMatch) {
          description = metaMatch[1]
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        }
      }

      if (description) {
        teamMembers = parseTeamMembers(description);
      }

      const data = { title, thumbnail, description, teamMembers, videoId };
      setFetchedInfo(data);

      setFormData(prev => ({
        ...prev,
        name: data.title || prev.name,
        thumbnail: data.thumbnail || prev.thumbnail,
        youtubeUrl: youtubeUrl.trim(),
        teamMembers: data.teamMembers?.length > 0 ? data.teamMembers.join(', ') : prev.teamMembers,
        description: data.description || prev.description,
      }));

      setStatus({ type: 'success', message: 'Đã lấy thông tin từ YouTube qua Proxy!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Không thể lấy thông tin video.' });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Vui lòng cấu hình GitHub Token & Repo ở nút Settings góc trên.' });
      setShowSettings(true);
      return;
    }

    setSaving(true);
    const newProject = {
      ...formData,
      id: Date.now().toString(),
      teamMembers: formData.teamMembers.split(',').map(m => m.trim()).filter(m => m),
    };

    try {
      const filePath = 'public/data/projects.json';
      const apiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
      
      // 1. Get current file and SHA
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      let data: any[] = [];
      let sha = '';
      
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
        // Content is base64 encoded
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        data = JSON.parse(decodedContent);
      } else if (getRes.status !== 404) {
        throw new Error('Không thể đọc file hiện tại từ GitHub. Hãy kiểm tra lại Token hoặc Repo.');
      }

      // 2. Append new project
      data.push(newProject);
      const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

      // 3. Commit back
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add new project: ${newProject.name}`,
          content: newContent,
          sha: sha || undefined,
          branch: 'main'
        })
      });

      if (putRes.ok) {
        setStatus({ type: 'success', message: 'Lưu dự án thành công! GitHub đang tự động Deploy lại website.' });
        setFormData({ name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '' });
        setYoutubeUrl('');
        setFetchedInfo(null);
      } else {
        const errorData = await putRes.json();
        throw new Error(errorData.message || 'Lỗi khi commit lên GitHub');
      }

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Lỗi không xác định.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        
        {/* Header with Settings Toggle */}
        <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, background: '#EEF2FF', color: '#6366F1' }}>
            <EditNoteIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quản trị Serverless</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Thêm Dự Án <span style={{ color: '#6366F1' }}>Mới</span>
          </Typography>
          <IconButton 
            onClick={() => setShowSettings(!showSettings)}
            sx={{ position: 'absolute', top: 0, right: 0, color: showSettings ? '#6366F1' : '#94A3B8' }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 4, background: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Cấu hình GitHub API</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ứng dụng dùng GitHub PAT (Personal Access Token) để lưu file trực tiếp lên kho chứa thay vì cần backend.
              Token chỉ lưu trên trình duyệt của bạn.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="GitHub Username" value={githubOwner} onChange={e => setGithubOwner(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Tên Repository" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} placeholder="VD: StudentProject" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth size="small" label="Personal Access Token" 
                  type={showPassword ? 'text' : 'password'}
                  value={githubToken} onChange={e => setGithubToken(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="outlined" onClick={saveSettings} fullWidth sx={{ mt: 1 }}>
                  Lưu Cấu Hình
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

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
              Nhập nhanh qua Proxy
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())}
              sx={{ '& .MuiOutlinedInput-root': { background: '#FFFFFF' } }}
            />
            <Button
              variant="contained"
              onClick={handleFetchYoutube}
              disabled={fetching || !youtubeUrl.trim()}
              startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
              sx={{ minWidth: 180, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
            >
              {fetching ? 'Đang cào...' : 'Tự động điền'}
            </Button>
          </Box>

          <Collapse in={!!fetchedInfo}>
            {fetchedInfo && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 3, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box component="img" src={fetchedInfo.thumbnail} alt="Thumbnail" sx={{ width: 120, height: 68, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>{fetchedInfo.title}</Typography>
                    {fetchedInfo.teamMembers.length > 0 && <Typography variant="caption" color="text.secondary">👥 {fetchedInfo.teamMembers.join(', ')}</Typography>}
                  </Box>
                </Box>
              </Box>
            )}
          </Collapse>
        </Paper>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Thông tin dự án</Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Loại dự án" name="category" value={formData.category} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Học kỳ" name="semester" value={formData.semester} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Link ảnh Thumbnail" name="thumbnail" value={formData.thumbnail} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Link YouTube" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Thành viên" name="teamMembers" value={formData.teamMembers} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Mô tả dự án" name="description" value={formData.description} onChange={handleChange} multiline rows={4} required />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                  <Button
                    type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
                    disabled={saving} fullWidth
                    sx={{ py: 1.6, fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                  >
                    {saving ? 'Đang Commit lên GitHub...' : 'Lưu Dự Án'}
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      <Snackbar open={!!status} autoHideDuration={6000} onClose={() => setStatus(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setStatus(null)} severity={status?.type} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {status?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
