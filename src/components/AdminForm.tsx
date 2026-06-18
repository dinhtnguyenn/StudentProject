import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse, IconButton, InputAdornment,
  Tabs, Tab, List, ListItem, ListItemText, Avatar, ListItemAvatar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { motion } from 'framer-motion';

// --- Types & Helpers ---

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
  const [tabIndex, setTabIndex] = useState(0);

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

  const [formData, setFormData] = useState({
    id: '', // Empty if new
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

  // List Management State
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setFetching(true);

    try {
      const videoId = extractYoutubeId(youtubeUrl.trim());
      if (!videoId) throw new Error('Link YouTube không hợp lệ');

      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      let title = '';
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || '';
      }

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
        } catch { /* ignore */ }
      }

      if (!description) {
        const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*?)"\s*\/?>/i);
        if (metaMatch) {
          description = metaMatch[1]
            .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }
      }

      if (description) {
        teamMembers = parseTeamMembers(description);
      }

      const data = { title, thumbnail, description, teamMembers, videoId };

      setFormData(prev => ({
        ...prev,
        name: data.title || prev.name,
        thumbnail: data.thumbnail || prev.thumbnail,
        youtubeUrl: youtubeUrl.trim(),
        teamMembers: data.teamMembers?.length > 0 ? data.teamMembers.join('\n') : prev.teamMembers,
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

  const getGitHubFileApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/projects.json`;

  const fetchCurrentFile = async () => {
    const getRes = await fetch(getGitHubFileApiUrl(), {
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
      const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
      data = JSON.parse(decodedContent);
    } else if (getRes.status !== 404) {
      const err = await getRes.json();
      throw new Error(err.message || 'Không thể đọc file hiện tại từ GitHub.');
    }
    return { data, sha };
  };

  const commitToGitHub = async (newContentArray: any[], sha: string, message: string) => {
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(newContentArray, null, 2))));
    const putRes = await fetch(getGitHubFileApiUrl(), {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: newContent,
        sha: sha || undefined,
        branch: 'main'
      })
    });

    if (!putRes.ok) {
      const errorData = await putRes.json();
      throw new Error(errorData.message || 'Lỗi khi commit lên GitHub');
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
    const isEdit = !!formData.id;
    const projectToSave = {
      ...formData,
      id: isEdit ? formData.id : Date.now().toString(),
      teamMembers: formData.teamMembers.split('\n').map(m => m.trim()).filter(m => m),
    };

    try {
      const { data, sha } = await fetchCurrentFile();

      let newData;
      if (isEdit) {
        newData = data.map(p => p.id === formData.id ? projectToSave : p);
      } else {
        newData = [...data, projectToSave];
      }

      await commitToGitHub(newData, sha, `${isEdit ? 'Update' : 'Add'} project: ${projectToSave.name}`);

      setStatus({ type: 'success', message: 'Lưu dự án thành công! GitHub đang tự động Deploy lại website.' });
      resetForm();
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Lỗi không xác định.' });
    } finally {
      setSaving(false);
    }
  };

  const loadProjectsList = async () => {
    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Vui lòng cấu hình GitHub Token trước khi quản lý dự án.' });
      return;
    }
    setLoadingList(true);
    try {
      const { data } = await fetchCurrentFile();
      setProjectsList(data);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (tabIndex === 1) {
      loadProjectsList();
    }
  }, [tabIndex]);

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '' });
    setYoutubeUrl('');
  };

  const handleEditClick = (project: any) => {
    setFormData({
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnail: project.thumbnail,
      youtubeUrl: project.youtubeUrl || '',
      category: project.category,
      teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.join('\n') : project.teamMembers,
      semester: project.semester,
    });
    setTabIndex(0);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleteConfirmOpen(false);
    setLoadingList(true);
    
    try {
      const { data, sha } = await fetchCurrentFile();
      const projectDetails = data.find(p => p.id === projectToDelete);
      const newData = data.filter(p => p.id !== projectToDelete);
      
      await commitToGitHub(newData, sha, `Delete project: ${projectDetails?.name || projectToDelete}`);
      
      setStatus({ type: 'success', message: 'Xoá dự án thành công!' });
      setProjectsList(newData);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingList(false);
      setProjectToDelete(null);
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
            Quản Lý <span style={{ color: '#6366F1' }}>Dự Án</span>
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
              Ứng dụng dùng GitHub PAT (Personal Access Token) để đọc/ghi file trực tiếp lên kho chứa thay vì cần backend.
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} centered>
            <Tab label={formData.id ? "Sửa Dự Án" : "Thêm Dự Án"} sx={{ fontWeight: 700 }} />
            <Tab label="Danh Sách Quản Lý" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* Tab 0: Add / Edit Form */}
        {tabIndex === 0 && (
          <Box>
            {!formData.id && (
              <Paper elevation={0} sx={{ p: 3, mb: 3, border: '2px dashed #C7D2FE', borderRadius: 4, background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <YouTubeIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Nhập nhanh qua Proxy
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    fullWidth size="small" placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())}
                    sx={{ '& .MuiOutlinedInput-root': { background: '#FFFFFF' } }}
                  />
                  <Button
                    variant="contained" onClick={handleFetchYoutube} disabled={fetching || !youtubeUrl.trim()}
                    startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
                    sx={{ minWidth: 180, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                  >
                    {fetching ? 'Đang cào...' : 'Tự động điền'}
                  </Button>
                </Box>
              </Paper>
            )}

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
                    <TextField fullWidth label="Thành viên" name="teamMembers" value={formData.teamMembers} onChange={handleChange} multiline rows={4} required placeholder="Mỗi người 1 dòng&#10;Nguyễn Văn A&#10;Trần Thị B" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Mô tả dự án" name="description" value={formData.description} onChange={handleChange} multiline rows={4} required />
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    {formData.id && (
                      <Button variant="outlined" size="large" onClick={resetForm} sx={{ py: 1.6, flex: 1, fontWeight: 700 }}>Huỷ</Button>
                    )}
                    <motion.div style={{ flex: 2 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
                        disabled={saving} fullWidth
                        sx={{ py: 1.6, fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                      >
                        {saving ? 'Đang Commit...' : (formData.id ? 'Cập Nhật Dự Án' : 'Lưu Dự Án')}
                      </Button>
                    </motion.div>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        )}

        {/* Tab 1: Manage List */}
        {tabIndex === 1 && (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF', overflow: 'hidden' }}>
            {loadingList ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress sx={{ color: '#6366F1' }} />
              </Box>
            ) : projectsList.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Chưa có dự án nào hoặc chưa lấy được dữ liệu.</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {projectsList.map((project, idx) => (
                  <Box key={project.id}>
                    {idx > 0 && <Divider />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar src={project.thumbnail} variant="rounded" sx={{ width: 64, height: 40, mr: 1, border: '1px solid #E2E8F0' }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>{project.name}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: '#64748B' }}>{project.category} • {project.semester}</Typography>}
                      />
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <IconButton size="small" onClick={() => handleEditClick(project)} sx={{ color: '#6366F1', bgcolor: '#EEF2FF' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setProjectToDelete(project.id); setDeleteConfirmOpen(true); }} sx={{ color: '#EF4444', bgcolor: '#FEF2F2' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá dự án</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá dự án này không? Thao tác này sẽ tự động tạo một commit xoá trên GitHub và không thể hoàn tác qua giao diện này.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Huỷ</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" autoFocus>
            Xoá Dự Án
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!status} autoHideDuration={6000} onClose={() => setStatus(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setStatus(null)} severity={status?.type} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {status?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
