import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse, IconButton, InputAdornment,
  Tabs, Tab, List, ListItem, ListItemText, Avatar, ListItemAvatar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, Checkbox, FormControlLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Category } from '../types/Category';

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

function generateCategoryColors() {
  const hue = Math.floor(Math.random() * 360);
  return {
    bg: `hsl(${hue}, 80%, 92%)`,
    text: `hsl(${hue}, 85%, 35%)`
  };
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

  // State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
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

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Bulk Delete Projects State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkDeleteProjectsConfirm, setBulkDeleteProjectsConfirm] = useState(false);

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Bulk Delete Categories State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkDeleteCategoriesConfirm, setBulkDeleteCategoriesConfirm] = useState(false);

  const getProjectsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/projects.json`;
  const getCategoriesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/categories.json`;

  const fetchFile = async (url: string) => {
    const getRes = await fetch(url, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (!getRes.ok) {
      if (getRes.status === 404) return { data: [], sha: '' };
      const err = await getRes.json();
      throw new Error(err.message || 'Không thể đọc file từ GitHub.');
    }
    const fileData = await getRes.json();
    const decoded = decodeURIComponent(escape(atob(fileData.content)));
    return { data: JSON.parse(decoded), sha: fileData.sha };
  };

  const commitFile = async (url: string, newContentArray: any[], sha: string, message: string) => {
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(newContentArray, null, 2))));
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, content: newContent, sha: sha || undefined, branch: 'main' })
    });
    if (!putRes.ok) {
      const errorData = await putRes.json();
      throw new Error(errorData.message || 'Lỗi khi commit lên GitHub');
    }
  };

  // Load Categories on mount for Dropdown
  useEffect(() => {
    if (githubToken && githubOwner && githubRepo) {
      fetchFile(getCategoriesApiUrl()).then(res => setCategoriesList(res.data)).catch(err => console.error(err));
    } else {
      fetch(`${import.meta.env.BASE_URL}data/categories.json`)
        .then(res => res.json())
        .then(data => setCategoriesList(data || []))
        .catch(err => console.error(err));
    }
  }, [githubToken, githubOwner, githubRepo]);

  // Load Projects when Tab 1 opens
  useEffect(() => {
    if (tabIndex === 1) {
      if (!githubToken) { setStatus({ type: 'error', message: 'Vui lòng cấu hình GitHub Token trước.' }); return; }
      setLoadingList(true);
      fetchFile(getProjectsApiUrl())
        .then(res => setProjectsList(res.data))
        .catch(err => setStatus({ type: 'error', message: err.message }))
        .finally(() => setLoadingList(false));
    }
  }, [tabIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (value: string) => {
    setFormData({ ...formData, description: value });
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

      setFormData(prev => ({
        ...prev,
        name: title || prev.name,
        thumbnail: thumbnail || prev.thumbnail,
        youtubeUrl: youtubeUrl.trim(),
        teamMembers: teamMembers.length > 0 ? teamMembers.join('\n') : prev.teamMembers,
        description: description || prev.description,
      }));

      setStatus({ type: 'success', message: 'Đã lấy thông tin từ YouTube qua Proxy!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Không thể lấy thông tin video.' });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
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
      const { data, sha } = await fetchFile(getProjectsApiUrl());
      const newData = isEdit ? data.map((p: any) => p.id === formData.id ? projectToSave : p) : [...data, projectToSave];
      await commitFile(getProjectsApiUrl(), newData, sha, `${isEdit ? 'Update' : 'Add'} project: ${projectToSave.name}`);
      
      setStatus({ type: 'success', message: 'Lưu dự án thành công!' });
      resetForm();
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '' });
    setYoutubeUrl('');
  };

  // --- Delete Project(s) Logic ---
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleteConfirmOpen(false);
    setLoadingList(true);
    try {
      const { data, sha } = await fetchFile(getProjectsApiUrl());
      const newData = data.filter((p: any) => p.id !== projectToDelete);
      await commitFile(getProjectsApiUrl(), newData, sha, `Delete project`);
      setStatus({ type: 'success', message: 'Xoá dự án thành công!' });
      setProjectsList(newData);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingList(false);
      setProjectToDelete(null);
    }
  };

  const confirmBulkDeleteProjectsAction = async () => {
    if (selectedProjects.length === 0) return;
    setBulkDeleteProjectsConfirm(false);
    setLoadingList(true);
    try {
      const { data, sha } = await fetchFile(getProjectsApiUrl());
      const newData = data.filter((p: any) => !selectedProjects.includes(p.id));
      await commitFile(getProjectsApiUrl(), newData, sha, `Bulk delete ${selectedProjects.length} projects`);
      setStatus({ type: 'success', message: `Đã xoá ${selectedProjects.length} dự án!` });
      setProjectsList(newData);
      setSelectedProjects([]);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingList(false);
    }
  };

  const handleToggleProject = (id: string) => {
    setSelectedProjects(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleAllProjects = () => {
    if (selectedProjects.length === projectsList.length) setSelectedProjects([]);
    else setSelectedProjects(projectsList.map(p => p.id));
  };

  // --- Add/Delete Category Logic ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !githubToken) return;
    setLoadingCategories(true);
    try {
      const { data, sha } = await fetchFile(getCategoriesApiUrl());
      const colors = generateCategoryColors();
      const newCat: Category = { id: Date.now().toString(), name: newCategoryName.trim(), ...colors };
      const newData = [...data, newCat];
      await commitFile(getCategoriesApiUrl(), newData, sha, `Add category: ${newCat.name}`);
      setCategoriesList(newData);
      setNewCategoryName('');
      setStatus({ type: 'success', message: 'Thêm loại dự án thành công!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingCategories(false);
    }
  };

  const confirmDeleteCategoryHandler = async () => {
    if (!categoryToDelete) return;
    setLoadingCategories(true);
    try {
      const { data, sha } = await fetchFile(getCategoriesApiUrl());
      const newData = data.filter((c: any) => c.id !== categoryToDelete);
      await commitFile(getCategoriesApiUrl(), newData, sha, `Delete category`);
      setCategoriesList(newData);
      setStatus({ type: 'success', message: 'Xoá loại dự án thành công!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingCategories(false);
      setCategoryToDelete(null);
    }
  };

  const confirmBulkDeleteCategoriesAction = async () => {
    if (selectedCategories.length === 0) return;
    setBulkDeleteCategoriesConfirm(false);
    setLoadingCategories(true);
    try {
      const { data, sha } = await fetchFile(getCategoriesApiUrl());
      const newData = data.filter((c: any) => !selectedCategories.includes(c.id));
      await commitFile(getCategoriesApiUrl(), newData, sha, `Bulk delete ${selectedCategories.length} categories`);
      setStatus({ type: 'success', message: `Đã xoá ${selectedCategories.length} loại dự án!` });
      setCategoriesList(newData);
      setSelectedCategories([]);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleAllCategories = () => {
    if (selectedCategories.length === categoriesList.length) setSelectedCategories([]);
    else setSelectedCategories(categoriesList.map(c => c.id));
  };


  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, background: '#EEF2FF', color: '#6366F1' }}>
            <EditNoteIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quản trị Serverless</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Quản Lý <span style={{ color: '#6366F1' }}>Hệ Thống</span>
          </Typography>
          <IconButton onClick={() => setShowSettings(!showSettings)} sx={{ position: 'absolute', top: 0, right: 0, color: showSettings ? '#6366F1' : '#94A3B8' }}>
            <SettingsIcon />
          </IconButton>
        </Box>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 4, background: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Cấu hình GitHub API</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="GitHub Username" value={githubOwner} onChange={e => setGithubOwner(e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="Tên Repository" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth size="small" label="Personal Access Token" type={showPassword ? 'text' : 'password'}
                  value={githubToken} onChange={e => setGithubToken(e.target.value)}
                  slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}><Button variant="outlined" onClick={saveSettings} fullWidth sx={{ mt: 1 }}>Lưu Cấu Hình</Button></Grid>
            </Grid>
          </Paper>
        </Collapse>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} variant="fullWidth">
            <Tab label={formData.id ? "Sửa Dự Án" : "Thêm Dự Án"} sx={{ fontWeight: 700 }} />
            <Tab label="QL Dự Án" sx={{ fontWeight: 700 }} />
            <Tab label="QL Loại Dự Án" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* Tab 0: Add / Edit Form */}
        {tabIndex === 0 && (
          <Box>
            {!formData.id && (
              <Paper elevation={0} sx={{ p: 3, mb: 3, border: '2px dashed #C7D2FE', borderRadius: 4, background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField fullWidth size="small" placeholder="Dán link YouTube để tự động điền..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())} sx={{ '& .MuiOutlinedInput-root': { background: '#FFFFFF' } }} />
                  <Button variant="contained" onClick={handleFetchYoutube} disabled={fetching || !youtubeUrl.trim()} startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />} sx={{ minWidth: 150, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                    {fetching ? 'Đang cào...' : 'Tự động điền'}
                  </Button>
                </Box>
              </Paper>
            )}

            <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF' }}>
              <form onSubmit={handleSubmitProject}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Loại dự án</InputLabel>
                      <Select name="category" value={formData.category} label="Loại dự án" onChange={(e) => setFormData({...formData, category: e.target.value as string})}>
                        {categoriesList.map(cat => (
                          <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                        ))}
                        {categoriesList.length === 0 && <MenuItem disabled value="">Chưa có loại dự án nào</MenuItem>}
                      </Select>
                    </FormControl>
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
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#475569' }}>Mô tả dự án (Không bắt buộc)</Typography>
                    <Box sx={{
                      '.ql-container': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, minHeight: 150, fontSize: '1rem', fontFamily: 'inherit' },
                      '.ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: '#F8FAFC' }
                    }}>
                      <ReactQuill theme="snow" value={formData.description} onChange={handleQuillChange} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    {formData.id && (
                      <Button variant="outlined" size="large" onClick={resetForm} sx={{ py: 1.6, flex: 1, fontWeight: 700 }}>Huỷ</Button>
                    )}
                    <motion.div style={{ flex: 2 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                      <Button type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} disabled={saving} fullWidth sx={{ py: 1.6, fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                        {saving ? 'Đang Commit...' : (formData.id ? 'Cập Nhật Dự Án' : 'Lưu Dự Án')}
                      </Button>
                    </motion.div>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        )}

        {/* Tab 1: Manage Projects List */}
        {tabIndex === 1 && (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF', overflow: 'hidden' }}>
            {loadingList ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#6366F1' }} /></Box>
            ) : projectsList.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có dự án nào.</Typography></Box>
            ) : (
              <>
                {/* Projects Bulk Action Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <FormControlLabel
                    control={<Checkbox checked={selectedProjects.length > 0 && selectedProjects.length === projectsList.length} indeterminate={selectedProjects.length > 0 && selectedProjects.length < projectsList.length} onChange={handleToggleAllProjects} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                    sx={{ ml: 0.5 }}
                  />
                  {selectedProjects.length > 0 && (
                    <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteProjectsConfirm(true)} startIcon={<DeleteIcon />}>
                      Xoá {selectedProjects.length} mục
                    </Button>
                  )}
                </Box>
                <List sx={{ p: 0 }}>
                  {projectsList.map((project, idx) => (
                    <Box key={project.id}>
                      {idx > 0 && <Divider />}
                      <ListItem sx={{ py: 2 }}>
                        <Checkbox 
                          checked={selectedProjects.includes(project.id)} 
                          onChange={() => handleToggleProject(project.id)} 
                          sx={{ mr: 1 }} 
                        />
                        <ListItemAvatar>
                          <Avatar src={project.thumbnail} variant="rounded" sx={{ width: 64, height: 40, mr: 1, border: '1px solid #E2E8F0' }} />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>{project.name}</Typography>}
                          secondary={<Typography variant="caption" sx={{ color: '#64748B' }}>{project.category} • {project.semester}</Typography>}
                        />
                        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                          <IconButton size="small" onClick={() => {
                            setFormData({
                              id: project.id, name: project.name, description: project.description, thumbnail: project.thumbnail,
                              youtubeUrl: project.youtubeUrl || '', category: project.category,
                              teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.join('\n') : project.teamMembers,
                              semester: project.semester,
                            });
                            setTabIndex(0);
                          }} sx={{ color: '#6366F1', bgcolor: '#EEF2FF' }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setProjectToDelete(project.id); setDeleteConfirmOpen(true); }} sx={{ color: '#EF4444', bgcolor: '#FEF2F2' }}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </>
            )}
          </Paper>
        )}

        {/* Tab 2: Manage Categories */}
        {tabIndex === 2 && (
          <Box>
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField fullWidth size="small" label="Tên loại dự án mới" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                <Button variant="contained" onClick={handleAddCategory} disabled={loadingCategories || !newCategoryName.trim()} startIcon={loadingCategories ? <CircularProgress size={18} color="inherit" /> : <AddIcon />} sx={{ minWidth: 150, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                  Thêm Loại
                </Button>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 4, background: '#FFFFFF', overflow: 'hidden' }}>
              {loadingCategories ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#10B981' }} /></Box>
              ) : categoriesList.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có loại dự án nào.</Typography></Box>
              ) : (
                <>
                  {/* Categories Bulk Action Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <FormControlLabel
                      control={<Checkbox checked={selectedCategories.length > 0 && selectedCategories.length === categoriesList.length} indeterminate={selectedCategories.length > 0 && selectedCategories.length < categoriesList.length} onChange={handleToggleAllCategories} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                      sx={{ ml: 0.5 }}
                    />
                    {selectedCategories.length > 0 && (
                      <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteCategoriesConfirm(true)} startIcon={<DeleteIcon />}>
                        Xoá {selectedCategories.length} mục
                      </Button>
                    )}
                  </Box>
                  <List sx={{ p: 0 }}>
                    {categoriesList.map((cat, idx) => (
                      <Box key={cat.id}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ py: 2 }}>
                          <Checkbox 
                            checked={selectedCategories.includes(cat.id)} 
                            onChange={() => handleToggleCategory(cat.id)} 
                            sx={{ mr: 1 }} 
                          />
                          <ListItemText 
                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>{cat.name}</Typography>}
                            secondary={<Chip label="Giao diện nhãn" size="small" sx={{ mt: 1, background: cat.bg, color: cat.text, fontWeight: 700 }} />}
                          />
                          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                            <IconButton size="small" onClick={() => { setCategoryToDelete(cat.id); }} sx={{ color: '#EF4444', bgcolor: '#FEF2F2' }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Box>
        )}

      </motion.div>

      {/* Dialogs */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá dự án</DialogTitle>
        <DialogContent><DialogContentText>Bạn có chắc chắn muốn xoá dự án này không? Thao tác này sẽ cập nhật trực tiếp lên GitHub.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Huỷ</Button>
          <Button onClick={confirmDeleteProject} variant="contained" color="error">Xoá Dự Án</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteProjectsConfirm} onClose={() => setBulkDeleteProjectsConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều dự án</DialogTitle>
        <DialogContent><DialogContentText>Bạn đang xoá {selectedProjects.length} dự án cùng lúc. Bạn có chắc chắn không?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteProjectsConfirm(false)} color="inherit">Huỷ</Button>
          <Button onClick={confirmBulkDeleteProjectsAction} variant="contained" color="error">Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá loại dự án</DialogTitle>
        <DialogContent><DialogContentText>Bạn có chắc chắn muốn xoá loại dự án này? Các dự án cũ dùng loại này sẽ mất màu hiển thị.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCategoryToDelete(null)} color="inherit">Huỷ</Button>
          <Button onClick={confirmDeleteCategoryHandler} variant="contained" color="error">Xoá Loại Dự Án</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteCategoriesConfirm} onClose={() => setBulkDeleteCategoriesConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều loại dự án</DialogTitle>
        <DialogContent><DialogContentText>Bạn đang xoá {selectedCategories.length} loại dự án cùng lúc. Điều này có thể làm mất màu hiển thị của nhiều dự án cũ. Bạn chắc chứ?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteCategoriesConfirm(false)} color="inherit">Huỷ</Button>
          <Button onClick={confirmBulkDeleteCategoriesAction} variant="contained" color="error">Xoá Hàng Loạt</Button>
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
