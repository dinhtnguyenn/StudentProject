import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse, IconButton, InputAdornment,
  List, ListItem, ListItemText, Avatar, ListItemAvatar, ListSubheader, ListItemButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, Checkbox, FormControlLabel, useTheme, ListItemIcon
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StarIcon from '@mui/icons-material/Star';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  return { bg: `hsl(${hue}, 80%, 92%)`, text: `hsl(${hue}, 85%, 35%)` };
}

// --- Sortable Item Component ---
function SortableProjectItem({ project, idx, isSelected, onToggle, onEdit, onDelete, categoryName }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const theme = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: isDragging ? theme.palette.action.hover : 'transparent',
  };

  return (
    <Box ref={setNodeRef} style={style}>
      {idx > 0 && <Divider />}
      <ListItem sx={{ py: 2 }}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
          <DragIndicatorIcon />
        </Box>
        <Checkbox checked={isSelected} onChange={() => onToggle(project.id)} sx={{ mr: 1 }} />
        <ListItemAvatar>
          <Avatar src={project.thumbnail} variant="rounded" sx={{ width: 64, height: 40, mr: 1, border: '1px solid', borderColor: 'divider' }} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{project.name}</Typography>
              {project.isGoldenTicket && <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} titleAccess="Golden Ticket" />}
            </Box>
          }
          secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{categoryName || project.category} • {project.semester}</Typography>}
        />
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <IconButton size="small" onClick={() => onEdit(project)} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => onDelete(project.id)} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      </ListItem>
    </Box>
  );
}

// --- Main Component ---
export default function AdminForm() {
  const [tabIndex, setTabIndex] = useState(7);
  const muiTheme = useTheme();

  // Settings / Auth State
  const [githubToken, setGithubToken] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // AI State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isAiLoading, setIsAiLoading] = useState<{ tags: boolean, summary: boolean }>({ tags: false, summary: false });

  const verifyToken = async (token: string, owner: string, repo: string) => {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!res.ok) throw new Error('Token hoặc Repository không hợp lệ');
      const data = await res.json();
      if (!data.permissions?.push) throw new Error('Token không có quyền write (push) vào repository này');
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi kết nối GitHub');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('gh_token') || '';
      const owner = sessionStorage.getItem('gh_owner') || '';
      const repo = sessionStorage.getItem('gh_repo') || '';
      const geminiKey = sessionStorage.getItem('gemini_api_key') || '';
      setGithubToken(token);
      setGithubOwner(owner);
      setGithubRepo(repo);
      setGeminiApiKey(geminiKey);

      if (token && owner && repo) {
        try {
          await verifyToken(token, owner, repo);
          setIsAuthenticated(true);
        } catch (err) {
          console.error(err);
        }
      }
      setIsAuthenticating(false);
    };
    initAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Vui lòng điền đủ thông tin' });
      return;
    }
    setIsAuthenticating(true);
    try {
      await verifyToken(githubToken.trim(), githubOwner.trim(), githubRepo.trim());
      sessionStorage.setItem('gh_token', githubToken.trim());
      sessionStorage.setItem('gh_owner', githubOwner.trim());
      sessionStorage.setItem('gh_repo', githubRepo.trim());
      setIsAuthenticated(true);
      setStatus({ type: 'success', message: 'Đăng nhập thành công!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('gh_token');
    sessionStorage.removeItem('gh_owner');
    sessionStorage.removeItem('gh_repo');
    sessionStorage.removeItem('gemini_api_key');
    setGithubToken('');
    setGithubOwner('');
    setGithubRepo('');
    setIsAuthenticated(false);
    setStatus({ type: 'info', message: 'Đã đăng xuất khỏi hệ thống.' });
  };

  // UI State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '', techTags: '', isGoldenTicket: false, major: '',
  });

  const [articleFormData, setArticleFormData] = useState({
    id: '', title: '', imageUrl: '', link: '', type: '', major: ''
  });
  const [fetchingArticle, setFetchingArticle] = useState(false);

  // Bulk Import State
  const [bulkYoutubeUrl, setBulkYoutubeUrl] = useState('');
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0 });

  // Data State
  const [originalProjects, setOriginalProjects] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectsSha, setProjectsSha] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoriesSha, setCategoriesSha] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [originalMajors, setOriginalMajors] = useState<Category[]>([]);
  const [majorsList, setMajorsList] = useState<Category[]>([]);
  const [majorsSha, setMajorsSha] = useState('');
  const [loadingMajors, setLoadingMajors] = useState(false);

  const [originalArticleTypes, setOriginalArticleTypes] = useState<Category[]>([]);
  const [articleTypesList, setArticleTypesList] = useState<Category[]>([]);
  const [articleTypesSha, setArticleTypesSha] = useState('');
  const [loadingArticleTypes, setLoadingArticleTypes] = useState(false);

  const [originalArticles, setOriginalArticles] = useState<any[]>([]);
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [articlesSha, setArticlesSha] = useState('');
  const [loadingArticles, setLoadingArticles] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Draft State detection
  const isProjectsChanged = JSON.stringify(originalProjects) !== JSON.stringify(projectsList);
  const isCategoriesChanged = JSON.stringify(originalCategories) !== JSON.stringify(categoriesList);
  const isArticlesChanged = JSON.stringify(originalArticles) !== JSON.stringify(articlesList);
  const isMajorsChanged = JSON.stringify(originalMajors) !== JSON.stringify(majorsList);
  const isArticleTypesChanged = JSON.stringify(originalArticleTypes) !== JSON.stringify(articleTypesList);
  const hasUnsavedChanges = isProjectsChanged || isCategoriesChanged || isArticlesChanged || isMajorsChanged || isArticleTypesChanged;
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkDeleteProjectsConfirm, setBulkDeleteProjectsConfirm] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkDeleteCategoriesConfirm, setBulkDeleteCategoriesConfirm] = useState(false);

  const getProjectsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/projects.json`;
  const getCategoriesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/categories.json`;
  const getArticlesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articles.json`;
  const getMajorsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/majors.json`;
  const getArticleTypesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articleTypes.json`;

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
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: newContent, sha: sha || undefined, branch: 'main' })
    });
    if (!putRes.ok) {
      if (putRes.status === 409) {
        throw new Error('CONFLICT_409');
      }
      const errorData = await putRes.json();
      throw new Error(errorData.message || 'Lỗi khi commit lên GitHub');
    }
    const resData = await putRes.json();
    return resData.content.sha; // return new sha
  };

  // Initial Fetch
  useEffect(() => {
    if (isAuthenticated && githubToken && githubOwner && githubRepo) {
      setLoadingCategories(true);
      fetchFile(getCategoriesApiUrl())
        .then(res => { setCategoriesList(res.data); setOriginalCategories(res.data); setCategoriesSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục. Vui lòng không lưu để tránh mất dữ liệu!'); })
        .finally(() => setLoadingCategories(false));

      setLoadingList(true);
      fetchFile(getProjectsApiUrl())
        .then(res => { setProjectsList(res.data); setOriginalProjects(res.data); setProjectsSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh sách dự án. Vui lòng không lưu để tránh mất dữ liệu!'); })
        .finally(() => setLoadingList(false));

      setLoadingArticles(true);
      fetchFile(getArticlesApiUrl())
        .then(res => { setArticlesList(res.data); setOriginalArticles(res.data); setArticlesSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh sách bài viết. Vui lòng không lưu để tránh mất dữ liệu!'); })
        .finally(() => setLoadingArticles(false));

      setLoadingMajors(true);
      fetchFile(getMajorsApiUrl())
        .then(res => { setMajorsList(res.data); setOriginalMajors(res.data); setMajorsSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục chuyên ngành. Vui lòng không lưu!'); })
        .finally(() => setLoadingMajors(false));

      setLoadingArticleTypes(true);
      fetchFile(getArticleTypesApiUrl())
        .then(res => { setArticleTypesList(res.data); setOriginalArticleTypes(res.data); setArticleTypesSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục loại bài viết. Vui lòng không lưu!'); })
        .finally(() => setLoadingArticleTypes(false));
    }
  }, [isAuthenticated, githubToken, githubOwner, githubRepo]);

  // Prevent closing tab if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Form Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleQuillChange = (value: string) => setFormData({ ...formData, description: value });
  const fetchHtmlWithProxy = async (targetUrl: string) => {
    try {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`);
      const html = await res.text();
      if (html.includes('Response exceeds 1MB size limit') || html.includes('{"error":')) {
        throw new Error('corsproxy limit');
      }
      return html;
    } catch (e) {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data && data.contents) return data.contents;
      throw new Error('Lỗi Proxy');
    }
  };

  const fetchSingleVideoData = async (videoId: string, existingData?: any) => {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    let title = '';
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      title = oembedData.title || '';
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const html = await fetchHtmlWithProxy(`https://www.youtube.com/watch?v=${videoId}`);

    let description = '';
    let teamMembers: string[] = [];

    const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s) || html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (playerMatch) {
      try {
        const playerData = JSON.parse(playerMatch[1]);
        description = playerData?.videoDetails?.shortDescription || '';
      } catch { }
    }

    if (!description) {
      const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*?)"\s*\/?>/i);
      if (metaMatch) description = metaMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
    if (description) teamMembers = parseTeamMembers(description);

    return {
      name: title || existingData?.name || '',
      thumbnail: thumbnail || existingData?.thumbnail || '',
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      teamMembers: teamMembers.length > 0 ? teamMembers.join('\n') : (existingData?.teamMembers || ''),
      description: description || existingData?.description || ''
    };
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setFetching(true);
    try {
      const videoId = extractYoutubeId(youtubeUrl.trim());
      if (!videoId) throw new Error('Link YouTube không hợp lệ');

      const data = await fetchSingleVideoData(videoId, formData);
      setFormData(prev => ({ ...prev, ...data }));
      setStatus({ type: 'success', message: 'Đã lấy thông tin từ YouTube qua Proxy!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Không thể lấy thông tin video.' });
    } finally {
      setFetching(false);
    }
  };

  const handleFetchArticle = async () => {
    if (!articleFormData.link.trim()) return;
    setFetchingArticle(true);
    try {
      const html = await fetchHtmlWithProxy(articleFormData.link.trim());
      if (!html || html.includes('Just a moment...') || html.includes('Cloudflare') || html.includes('challenge-error-text')) {
        throw new Error('Trang web chặn Bot (Cloudflare). Vui lòng điền thủ công!');
      }
      let title = '';
      let imageUrl = '';

      // Parse Open Graph Meta
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i) || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/i);
      if (ogTitleMatch) title = ogTitleMatch[1];
      else {
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) title = titleMatch[1];
      }

      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/i);
      if (ogImageMatch) imageUrl = ogImageMatch[1];

      // Decode entities
      title = title.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

      setArticleFormData(prev => ({
        ...prev,
        title: title || prev.title,
        imageUrl: imageUrl || prev.imageUrl
      }));

      setStatus({ type: 'success', message: 'Đã trích xuất thông tin bài viết!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Lỗi lấy dữ liệu bài viết.' });
    } finally {
      setFetchingArticle(false);
    }
  };

  const handleFetchBulkYoutube = async () => {
    if (!bulkYoutubeUrl) return;
    setIsBulkFetching(true);
    setStatus({ type: 'info', message: 'Đang lấy danh sách video từ Playlist...' });
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(bulkYoutubeUrl)}`);
      const data = await res.json();
      if (!data.contents) throw new Error('Cannot fetch playlist content');

      const doc = new DOMParser().parseFromString(data.contents, 'text/html');
      const scriptTags = Array.from(doc.querySelectorAll('script'));
      const ytInitialDataScript = scriptTags.find(s => s.textContent?.includes('var ytInitialData = '));

      if (!ytInitialDataScript || !ytInitialDataScript.textContent) throw new Error('Không tìm thấy dữ liệu playlist.');

      const jsonText = ytInitialDataScript.textContent.replace('var ytInitialData = ', '').replace(/;$/, '');
      const ytData = JSON.parse(jsonText);

      const tabs = ytData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      const playlistTab = tabs.find((t: any) => t.tabRenderer?.content?.sectionListRenderer);
      const items = playlistTab?.tabRenderer?.content?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents[0]?.playlistVideoListRenderer?.contents || [];

      const videos = items.filter((item: any) => item.playlistVideoRenderer).map((item: any) => item.playlistVideoRenderer);

      if (videos.length === 0) {
        throw new Error('Không tìm thấy video nào. Đảm bảo Playlist ở trạng thái Công khai (Public).');
      }

      setBulkProgress({ current: 0, total: videos.length });
      const newProjects: any[] = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        try {
          const videoId = video.videoId;
          const title = video.title?.runs?.[0]?.text || 'No title';
          const thumbnail = video.thumbnail?.thumbnails?.pop()?.url || '';

          if (!projectsList.some(p => p.id === videoId)) {
            newProjects.push({
              id: videoId,
              name: title,
              description: '',
              thumbnail: thumbnail,
              youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
              category: '',
              teamMembers: [],
              semester: '',
              major: '',
              techTags: ''
            });
          }
        } catch (e) {
          console.warn('Lỗi cào 1 video trong playlist', e);
        }

        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      }

      if (newProjects.length > 0) {
        setProjectsList(prev => [...newProjects, ...prev]);
        setStatus({ type: 'success', message: `Đã nhập nháp thành công ${newProjects.length} dự án từ Playlist!` });
        setTabIndex(1);
      } else {
        setStatus({ type: 'info', message: 'Tất cả video trong Playlist đã tồn tại trong hệ thống.' });
      }
      setBulkYoutubeUrl('');
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Lỗi khi cào Playlist' });
    } finally {
      setIsBulkFetching(false);
      setBulkProgress({ total: 0, current: 0 });
    }
  };

  // Draft Actions (No direct commit)
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
      setIsAuthenticated(false);
      return;
    }

    const isEdit = !!formData.id;
    const projectToSave = {
      ...formData,
      id: isEdit ? formData.id : Date.now().toString(),
      teamMembers: formData.teamMembers.split('\n').map(m => m.trim()).filter(m => m),
      techTags: formData.techTags.split(',').map(m => m.trim()).filter(m => m),
    };

    setProjectsList(prev => isEdit ? prev.map(p => p.id === formData.id ? projectToSave : p) : [...prev, projectToSave]);
    setStatus({ type: 'success', message: `Đã lưu nháp dự án ${isEdit ? '(Cập nhật)' : '(Mới)'}!` });
    resetForm();
    if (!isEdit) setTabIndex(1);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '', techTags: '', isGoldenTicket: false, major: '' });
    setYoutubeUrl('');
  };

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Phiên đăng nhập không hợp lệ.' });
      return;
    }
    const isEdit = !!articleFormData.id;
    const articleToSave = {
      ...articleFormData,
      id: isEdit ? articleFormData.id : Date.now().toString(),
    };
    setArticlesList(prev => isEdit ? prev.map(a => a.id === articleFormData.id ? articleToSave : a) : [...prev, articleToSave]);
    setStatus({ type: 'success', message: `Đã lưu nháp bài viết ${isEdit ? '(Cập nhật)' : '(Mới)'}!` });
    resetArticleForm();
    if (!isEdit) setTabIndex(4);
  };

  const resetArticleForm = () => {
    setArticleFormData({ id: '', title: '', imageUrl: '', link: '', type: '', major: '' });
  };

  // Projects Draft Actions
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setProjectsList((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    setProjectsList(prev => prev.filter(p => p.id !== projectToDelete));
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá dự án khỏi bản nháp.' });
  };

  const confirmBulkDeleteProjectsAction = () => {
    if (selectedProjects.length === 0) return;
    setProjectsList(prev => prev.filter(p => !selectedProjects.includes(p.id)));
    setSelectedProjects([]);
    setBulkDeleteProjectsConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedProjects.length} dự án.` });
  };

  const handleToggleProject = (id: string) => setSelectedProjects(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllProjects = () => setSelectedProjects(selectedProjects.length === projectsList.length ? [] : projectsList.map(p => p.id));

  // Categories Draft Actions
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const colors = generateCategoryColors();
    const newCat: Category = { id: Date.now().toString(), name: newCategoryName.trim(), ...colors };
    setCategoriesList(prev => [...prev, newCat]);
    setNewCategoryName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp loại dự án mới!' });
  };

  const confirmDeleteCategoryHandler = () => {
    if (!categoryToDelete) return;
    setCategoriesList(prev => prev.filter(c => c.id !== categoryToDelete));
    setCategoryToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá loại dự án khỏi bản nháp.' });
  };

  const confirmBulkDeleteCategoriesAction = () => {
    if (selectedCategories.length === 0) return;
    setCategoriesList(prev => prev.filter(c => !selectedCategories.includes(c.id)));
    setSelectedCategories([]);
    setBulkDeleteCategoriesConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedCategories.length} loại dự án.` });
  };

  const handleToggleCategory = (id: string) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllCategories = () => setSelectedCategories(selectedCategories.length === categoriesList.length ? [] : categoriesList.map(c => c.id));

  const moveItem = <T,>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    if (direction === 'up' && index > 0) {
      const newList = [...list];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList;
    }
    if (direction === 'down' && index < list.length - 1) {
      const newList = [...list];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList;
    }
    return list;
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    setCategoriesList(prev => moveItem(prev, index, direction));
  };

  // Majors Draft Actions
  const [newMajorName, setNewMajorName] = useState('');
  const [majorToDelete, setMajorToDelete] = useState<string | null>(null);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [bulkDeleteMajorsConfirm, setBulkDeleteMajorsConfirm] = useState(false);

  const handleAddMajor = () => {
    if (!newMajorName.trim()) return;
    const colors = generateCategoryColors();
    const newMajor: Category = { id: Date.now().toString(), name: newMajorName.trim(), ...colors };
    setMajorsList(prev => [...prev, newMajor]);
    setNewMajorName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp chuyên ngành mới!' });
  };

  const confirmDeleteMajorHandler = () => {
    if (!majorToDelete) return;
    setMajorsList(prev => prev.filter(c => c.id !== majorToDelete));
    setMajorToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá chuyên ngành khỏi bản nháp.' });
  };

  const confirmBulkDeleteMajorsAction = () => {
    if (selectedMajors.length === 0) return;
    setMajorsList(prev => prev.filter(c => !selectedMajors.includes(c.id)));
    setSelectedMajors([]);
    setBulkDeleteMajorsConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedMajors.length} chuyên ngành.` });
  };

  const handleToggleMajor = (id: string) => setSelectedMajors(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllMajors = () => setSelectedMajors(selectedMajors.length === majorsList.length ? [] : majorsList.map(c => c.id));

  const handleMoveMajor = (index: number, direction: 'up' | 'down') => {
    setMajorsList(prev => moveItem(prev, index, direction));
  };

  // ArticleTypes Draft Actions
  const [newArticleTypeName, setNewArticleTypeName] = useState('');
  const [articleTypeToDelete, setArticleTypeToDelete] = useState<string | null>(null);
  const [selectedArticleTypes, setSelectedArticleTypes] = useState<string[]>([]);
  const [bulkDeleteArticleTypesConfirm, setBulkDeleteArticleTypesConfirm] = useState(false);

  // --- AI Functions ---
  const handleGenerateTags = async () => {
    if (!geminiApiKey) { setStatus({ type: 'error', message: 'Vui lòng cấu hình Gemini API Key ở mục Cài Đặt AI' }); return; }
    if (!formData.description) { setStatus({ type: 'error', message: 'Vui lòng nhập mô tả dự án để AI phân tích' }); return; }
    setIsAiLoading(prev => ({ ...prev, tags: true }));
    try {
      const prompt = `Dựa vào mô tả đồ án sau, hãy liệt kê tối đa 5 công nghệ cốt lõi được sử dụng, cách nhau bằng dấu phẩy. Trả về đúng định dạng text ngăn cách bằng dấu phẩy, KHÔNG viết dài dòng. Mô tả: ${formData.description}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) throw new Error('Lỗi gọi API');
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setFormData(prev => ({ ...prev, techTags: text.trim().replace(/\.$/, '') }));
      setStatus({ type: 'success', message: 'AI đã điền Tech Tags thành công!' });
    } catch (err: any) { setStatus({ type: 'error', message: 'Lỗi AI: ' + err.message }); }
    finally { setIsAiLoading(prev => ({ ...prev, tags: false })); }
  };

  const handleGenerateSummary = async () => {
    if (!geminiApiKey) { setStatus({ type: 'error', message: 'Vui lòng cấu hình Gemini API Key ở mục Cài Đặt AI' }); return; }
    if (!formData.description) { setStatus({ type: 'error', message: 'Cần có ít nhất một đoạn văn để tóm tắt' }); return; }
    setIsAiLoading(prev => ({ ...prev, summary: true }));
    try {
      const prompt = `Dựa vào văn bản sau, hãy viết một đoạn mở bài tóm tắt khoảng 2-3 câu thật hấp dẫn, chuyên nghiệp. Không dùng định dạng markdown, chỉ trả về text thuần. Văn bản gốc: ${formData.description}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) throw new Error('Lỗi gọi API');
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setFormData(prev => ({ ...prev, description: text.trim() + '<br><br>' + prev.description }));
      setStatus({ type: 'success', message: 'AI đã tạo phần tóm tắt mở bài!' });
    } catch (err: any) { setStatus({ type: 'error', message: 'Lỗi AI: ' + err.message }); }
    finally { setIsAiLoading(prev => ({ ...prev, summary: false })); }
  };

  const handleAddArticleType = () => {
    if (!newArticleTypeName.trim()) return;
    const colors = generateCategoryColors();
    const newCat: Category = { id: Date.now().toString(), name: newArticleTypeName.trim(), ...colors };
    setArticleTypesList(prev => [...prev, newCat]);
    setNewArticleTypeName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp loại bài viết mới!' });
  };

  // --- Category / Major / ArticleType Edit State ---
  const [editCategoryItem, setEditCategoryItem] = useState<Category | null>(null);
  const [editCategoryType, setEditCategoryType] = useState<'category' | 'major' | 'articleType'>('category');

  const handleSaveCategoryEdit = () => {
    if (!editCategoryItem) return;
    if (editCategoryType === 'category') {
      setCategoriesList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    } else if (editCategoryType === 'major') {
      setMajorsList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    } else {
      setArticleTypesList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    }
    setEditCategoryItem(null);
    setStatus({ type: 'success', message: 'Đã lưu chỉnh sửa!' });
  };

  const confirmDeleteArticleTypeHandler = () => {
    if (!articleTypeToDelete) return;
    setArticleTypesList(prev => prev.filter(c => c.id !== articleTypeToDelete));
    setArticleTypeToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá loại bài viết khỏi bản nháp.' });
  };

  const confirmBulkDeleteArticleTypesAction = () => {
    if (selectedArticleTypes.length === 0) return;
    setArticleTypesList(prev => prev.filter(c => !selectedArticleTypes.includes(c.id)));
    setSelectedArticleTypes([]);
    setBulkDeleteArticleTypesConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedArticleTypes.length} loại bài viết.` });
  };

  const handleToggleArticleType = (id: string) => setSelectedArticleTypes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllArticleTypes = () => setSelectedArticleTypes(selectedArticleTypes.length === articleTypesList.length ? [] : articleTypesList.map(c => c.id));

  const handleMoveArticleType = (index: number, direction: 'up' | 'down') => {
    setArticleTypesList(prev => moveItem(prev, index, direction));
  };

  const autoMergeData = (remoteData: any[], localData: any[]) => {
    const map = new Map();
    remoteData.forEach(item => map.set(item.id, item));
    localData.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  // Global Save
  const saveAllChangesToGithub = async () => {
    if (fetchError) {
      setStatus({ type: 'error', message: 'Hệ thống đang lỗi tải dữ liệu. Không thể lưu để bảo vệ dữ liệu cũ.' });
      return;
    }
    if (!githubToken || !githubOwner || !githubRepo) {
      setStatus({ type: 'error', message: 'Cấu hình GitHub chưa hợp lệ.' });
      return;
    }
    setIsSavingAll(true);
    let successCount = 0;

    try {
      if (isCategoriesChanged) {
        const newSha = await commitFile(getCategoriesApiUrl(), categoriesList, categoriesSha, `Update categories (Bulk save) [skip ci]`);
        setOriginalCategories(categoriesList);
        setCategoriesSha(newSha);
        successCount++;
      }
      if (isProjectsChanged) {
        const newSha = await commitFile(getProjectsApiUrl(), projectsList, projectsSha, `Update projects (Bulk save) [skip ci]`);
        setOriginalProjects(projectsList);
        setProjectsSha(newSha);
        successCount++;
      }
      if (isArticlesChanged) {
        const newSha = await commitFile(getArticlesApiUrl(), articlesList, articlesSha, `Update articles (Bulk save) [skip ci]`);
        setOriginalArticles(articlesList);
        setArticlesSha(newSha);
        successCount++;
      }
      if (isMajorsChanged) {
        const newSha = await commitFile(getMajorsApiUrl(), majorsList, majorsSha, `Update majors (Bulk save) [skip ci]`);
        setOriginalMajors(majorsList);
        setMajorsSha(newSha);
        successCount++;
      }
      if (isArticleTypesChanged) {
        const newSha = await commitFile(getArticleTypesApiUrl(), articleTypesList, articleTypesSha, `Update article types (Bulk save) [skip ci]`);
        setOriginalArticleTypes(articleTypesList);
        setArticleTypesSha(newSha);
        successCount++;
      }

      setStatus({ type: 'success', message: `Commit thành công ${successCount} file lên GitHub! Quá trình build sẽ tự động chạy.` });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'CONFLICT_409') {
        setStatus({ type: 'info', message: 'Phát hiện xung đột dữ liệu từ máy chủ! Đang tiến hành tự động gộp (Auto-merge)...' });
        try {
          if (isCategoriesChanged) {
            const remote = await fetchFile(getCategoriesApiUrl());
            const merged = autoMergeData(remote.data, categoriesList);
            const newSha = await commitFile(getCategoriesApiUrl(), merged, remote.sha, `Merge & Update categories [skip ci]`);
            setCategoriesList(merged); setOriginalCategories(merged); setCategoriesSha(newSha);
          }
          if (isProjectsChanged) {
            const remote = await fetchFile(getProjectsApiUrl());
            const merged = autoMergeData(remote.data, projectsList);
            const newSha = await commitFile(getProjectsApiUrl(), merged, remote.sha, `Merge & Update projects [skip ci]`);
            setProjectsList(merged); setOriginalProjects(merged); setProjectsSha(newSha);
          }
          if (isArticlesChanged) {
            const remote = await fetchFile(getArticlesApiUrl());
            const merged = autoMergeData(remote.data, articlesList);
            const newSha = await commitFile(getArticlesApiUrl(), merged, remote.sha, `Merge & Update articles [skip ci]`);
            setArticlesList(merged); setOriginalArticles(merged); setArticlesSha(newSha);
          }
          if (isMajorsChanged) {
            const remote = await fetchFile(getMajorsApiUrl());
            const merged = autoMergeData(remote.data, majorsList);
            const newSha = await commitFile(getMajorsApiUrl(), merged, remote.sha, `Merge & Update majors [skip ci]`);
            setMajorsList(merged); setOriginalMajors(merged); setMajorsSha(newSha);
          }
          if (isArticleTypesChanged) {
            const remote = await fetchFile(getArticleTypesApiUrl());
            const merged = autoMergeData(remote.data, articleTypesList);
            const newSha = await commitFile(getArticleTypesApiUrl(), merged, remote.sha, `Merge & Update article types [skip ci]`);
            setArticleTypesList(merged); setOriginalArticleTypes(merged); setArticleTypesSha(newSha);
          }
          setStatus({ type: 'success', message: `Gộp dữ liệu và Commit thành công lên GitHub! Quá trình build sẽ tự động chạy.` });
        } catch (mergeErr: any) {
          console.error(mergeErr);
          setStatus({ type: 'error', message: 'Tự động gộp thất bại. Vui lòng F5 Tải Lại Trang để tránh mất dữ liệu: ' + mergeErr.message });
        }
      } else {
        setStatus({ type: 'error', message: err.message || 'Lỗi khi commit lên GitHub' });
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  if (isAuthenticating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Đang kiểm tra quyền truy cập...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8, pb: 10, px: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.75, borderRadius: 100, bgcolor: 'action.hover', color: 'primary.main' }}>
              <LockIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Dừng lại!!!</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              Đăng Nhập <span style={{ color: muiTheme.palette.primary.main }}>Hệ Thống</span>
            </Typography>
            <Typography color="text.secondary">Vui lòng cung cấp GitHub Token để tiếp tục.</Typography>
          </Box>

          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <form onSubmit={handleLogin}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="GitHub Username" value={githubOwner} onChange={e => setGithubOwner(e.target.value)} required />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Tên Repository" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} required />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Personal Access Token" type={showPassword ? 'text' : 'password'} required
                    value={githubToken} onChange={e => setGithubToken(e.target.value)}
                    slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '1rem', py: 1.5, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)' }}>
                    Truy Cập Quản Trị
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </motion.div>

        <Snackbar open={!!status} autoHideDuration={6000} onClose={() => setStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setStatus(null)} severity={status?.type} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
            {status?.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4, lg: 6 }, pt: 4, pb: 10 }}>
      {/* Unsaved Changes Banner */}
      <Collapse in={hasUnsavedChanges}>
        <Paper elevation={3} sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 2, p: 2, px: 3, borderRadius: 100, bgcolor: 'warning.light', color: 'warning.contrastText', border: '1px solid', borderColor: 'warning.main', minWidth: 320, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Bạn có thay đổi chưa lưu!</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {hasUnsavedChanges && (
              <Button variant="outlined" color="secondary" onClick={() => { setProjectsList(originalProjects); setCategoriesList(originalCategories); setArticlesList(originalArticles); }} sx={{ borderRadius: 100, fontWeight: 700 }}>Huỷ Thay Đổi</Button>
            )}
            <Button variant="contained" color="warning" onClick={saveAllChangesToGithub} disabled={isSavingAll || !!fetchError} startIcon={isSavingAll ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />} sx={{ borderRadius: 100, fontWeight: 700, px: 3, '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
              {isSavingAll ? 'Đang Gửi...' : 'Lưu Lên GitHub'}
            </Button>
          </Box>
        </Paper>
      </Collapse>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1, px: 2, py: 0.5, borderRadius: 100, bgcolor: 'action.hover', color: 'primary.main' }}>
              <EditNoteIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quản trị Serverless</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Hệ Thống <span style={{ color: muiTheme.palette.primary.main }}>Quản Lý</span>
            </Typography>
          </Box>
          <IconButton onClick={handleLogout} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.light' } }} title="Đăng xuất">
            <LogoutIcon />
          </IconButton>
        </Box>

        <Paper elevation={0} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, border: '1px solid', borderColor: 'divider', borderRadius: 6, minHeight: 650, overflow: 'hidden', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.08)' }}>
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, borderRight: { xs: 'none', md: '1px solid' }, borderBottom: { xs: '1px solid', md: 'none' }, borderColor: 'divider', bgcolor: 'background.default', p: 2 }}>
            {/* Groups */}
            <List sx={{ pt: 0, '& .MuiListItemButton-root': { borderRadius: 3, mb: 0.5, py: 1.2, transition: 'all 0.2s ease', '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', '& .MuiTypography-root': { color: 'primary.contrastText' }, '&:hover': { bgcolor: 'primary.dark' } } } }}>

              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'primary.main', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <DashboardIcon fontSize="small" /> TỔNG QUAN
              </ListSubheader>
              <ListItemButton selected={tabIndex === 7} onClick={() => setTabIndex(7)} sx={{ mb: 2 }}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 7 ? 700 : 500, fontSize: '0.9rem' }}>Dashboard</Typography>} />
              </ListItemButton>

              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'primary.main', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <FolderIcon fontSize="small" /> NHÓM DỰ ÁN
              </ListSubheader>
              <ListItemButton selected={tabIndex === 1} onClick={() => setTabIndex(1)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 1 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Dự Án</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 0} onClick={() => setTabIndex(0)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 0 ? 700 : 500, fontSize: '0.9rem' }}>{formData.id ? "Sửa Dự Án" : "Thêm Dự Án"}</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 2} onClick={() => setTabIndex(2)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 2 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Loại Dự Án</Typography>} />
              </ListItemButton>

              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'secondary.main', fontSize: '0.75rem', letterSpacing: '0.05em', mt: 1 }}>
                <ArticleIcon fontSize="small" /> NHÓM BÀI VIẾT
              </ListSubheader>
              <ListItemButton selected={tabIndex === 4} onClick={() => setTabIndex(4)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 4 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Bài Viết</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 3} onClick={() => setTabIndex(3)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 3 ? 700 : 500, fontSize: '0.9rem' }}>{articleFormData.id ? "Sửa Bài Viết" : "Thêm Bài Viết"}</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 6} onClick={() => setTabIndex(6)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 6 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Loại Bài Viết</Typography>} />
              </ListItemButton>

              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'info.main', fontSize: '0.75rem', letterSpacing: '0.05em', mt: 1 }}>
                <SettingsIcon fontSize="small" /> QUẢN LÝ CHUNG
              </ListSubheader>
              <ListItemButton selected={tabIndex === 5} onClick={() => setTabIndex(5)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 5 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Chuyên Ngành</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 8} onClick={() => setTabIndex(8)} sx={{ mt: 1, bgcolor: tabIndex === 8 ? 'primary.main' : 'rgba(168, 85, 247, 0.05)', borderRadius: 3, '&:hover': { bgcolor: tabIndex === 8 ? 'primary.dark' : 'rgba(168, 85, 247, 0.15)' } }}>
                <ListItemIcon sx={{ minWidth: 32 }}><AutoAwesomeIcon fontSize="small" sx={{ color: tabIndex === 8 ? '#fff' : '#A855F7' }} /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 8 ? 800 : 700, fontSize: '0.9rem', color: tabIndex === 8 ? '#fff' : '#A855F7' }}>Cài Đặt AI</Typography>} />
              </ListItemButton>

            </List>
          </Box>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 }, bgcolor: 'background.paper', overflowY: 'auto' }}>
            {/* Tab 7: Dashboard */}
            {tabIndex === 7 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DashboardIcon sx={{ color: 'primary.main', fontSize: 32 }} /> Tổng Quan Hệ Thống
                </Typography>
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#1E3A8A', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <FolderIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <FolderIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TỔNG SỐ DỰ ÁN</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{projectsList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', color: '#92400E', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <WorkspacePremiumIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <WorkspacePremiumIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>GOLDEN TICKET</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{projectsList.filter(p => p.isGoldenTicket).length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)', color: '#6B21A8', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <ArticleIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <ArticleIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TỔNG SỐ BÀI VIẾT</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{articlesList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#065F46', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <SchoolIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <SchoolIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>CHUYÊN NGÀNH</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{majorsList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>Dự Án</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      {majorsList.length === 0 ? (
                        <Typography color="text.secondary">Chưa có dữ liệu chuyên ngành.</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {majorsList.map(major => {
                            const count = projectsList.filter(p => p.major === major.id).length;
                            const percentage = projectsList.length > 0 ? (count / projectsList.length) * 100 : 0;
                            return (
                              <Box key={major.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 100, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{major.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 12, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: major.bg !== 'transparent' ? major.bg : 'primary.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 30, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>Bài Viết</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      {articleTypesList.length === 0 ? (
                        <Typography color="text.secondary">Chưa có dữ liệu loại bài viết.</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {articleTypesList.map(type => {
                            const count = articlesList.filter(a => a.type === type.id).length;
                            const percentage = articlesList.length > 0 ? (count / articlesList.length) * 100 : 0;
                            return (
                              <Box key={type.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 150, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{type.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 12, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: type.bg !== 'transparent' ? type.bg : 'secondary.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 30, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 8: AI Settings */}
            {tabIndex === 8 && (
              <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)', border: '1px solid', borderColor: '#E9D5FF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 40, color: '#9333EA' }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#6B21A8' }}>Cài Đặt Trợ Lý AI</Typography>
                      <Typography variant="body2" sx={{ color: '#7E22CE', opacity: 0.8 }}>Tích hợp Google Gemini để tự động hoá nội dung</Typography>
                    </Box>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#4C1D95' }}>
                    Nhập mã Gemini API Key của bạn để sử dụng các tính năng:
                    <br />- Tự động phân tích và tạo Tech Tags
                    <br />- Tự động tóm tắt mô tả đồ án thành đoạn mở bài hấp dẫn
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Gemini API Key"
                      value={geminiApiKey}
                      onChange={e => setGeminiApiKey(e.target.value)}
                      sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => {
                        sessionStorage.setItem('gemini_api_key', geminiApiKey);
                        setStatus({ type: 'success', message: 'Đã lưu cấu hình AI!' });
                      }}
                      sx={{ minWidth: 120, bgcolor: '#9333EA', '&:hover': { bgcolor: '#7E22CE' }, fontWeight: 700, borderRadius: 2 }}
                    >
                      Lưu Lại
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Tab 0: Add / Edit Form */}
            {tabIndex === 0 && (
              <Box>
                {!formData.id && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Nhập một Video</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField fullWidth size="small" placeholder="Dán link YouTube để tự động điền..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                        <Button variant="contained" onClick={handleFetchYoutube} disabled={fetching || !youtubeUrl.trim()} startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />} sx={{ minWidth: 150, whiteSpace: 'nowrap', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                          {fetching ? 'Đang cào...' : 'Tự động điền'}
                        </Button>
                      </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, border: `2px dashed ${muiTheme.palette.secondary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Nhập hàng loạt từ Playlist</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField fullWidth size="small" placeholder="Dán link Playlist YouTube..." value={bulkYoutubeUrl} onChange={e => setBulkYoutubeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchBulkYoutube())} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                        <Button variant="contained" color="secondary" onClick={handleFetchBulkYoutube} disabled={isBulkFetching || !bulkYoutubeUrl.trim()} startIcon={isBulkFetching ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />} sx={{ minWidth: 150, whiteSpace: 'nowrap', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(156, 39, 176, 0.39)', background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                          {isBulkFetching ? `Đang cào (${bulkProgress.current}/${bulkProgress.total})...` : 'Nhập Playlist'}
                        </Button>
                      </Box>
                      {isBulkFetching && bulkProgress.total > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ flex: 1, height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, height: '100%', bgcolor: 'secondary.main', transition: 'width 0.3s ease' }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )}

                <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
                  <form onSubmit={handleSubmitProject}>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Loại dự án</InputLabel>
                          <Select name="category" value={formData.category} label="Loại dự án" onChange={(e) => setFormData({ ...formData, category: e.target.value as string })}>
                            {categoriesList.map(cat => (
                              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                            {categoriesList.length === 0 && <MenuItem disabled value="">Chưa có loại dự án nào</MenuItem>}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Học kỳ" name="semester" value={formData.semester} onChange={handleChange} required />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Chuyên ngành</InputLabel>
                          <Select name="major" value={formData.major} label="Chuyên ngành" onChange={(e) => setFormData({ ...formData, major: e.target.value as string })}>
                            {majorsList.map(major => (
                              <MenuItem key={major.id} value={major.id}>{major.name}</MenuItem>
                            ))}
                            {majorsList.length === 0 && <MenuItem disabled value="">Chưa có chuyên ngành nào</MenuItem>}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>Tag công nghệ</Typography>
                          <Button size="small" variant="text" onClick={handleGenerateTags} disabled={isAiLoading.tags} startIcon={isAiLoading.tags ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: 'none', fontWeight: 700, color: '#A855F7', '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.1)' } }}>
                            AI Tự Điền Tags
                          </Button>
                        </Box>
                        <TextField fullWidth name="techTags" value={formData.techTags} onChange={handleChange} placeholder="React, Node, AI..." />
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>Mô tả dự án (Không bắt buộc)</Typography>
                          <Button size="small" variant="text" onClick={handleGenerateSummary} disabled={isAiLoading.summary} startIcon={isAiLoading.summary ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: 'none', fontWeight: 700, color: '#A855F7', '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.1)' } }}>
                            AI Tóm Tắt Mở Bài
                          </Button>
                        </Box>
                        <Box sx={{
                          '.ql-container': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, minHeight: 150, fontSize: '1rem', fontFamily: 'inherit', color: 'text.primary' },
                          '.ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: 'background.default' },
                          '.ql-stroke': { stroke: muiTheme.palette.text.primary },
                          '.ql-fill': { fill: muiTheme.palette.text.primary },
                          '.ql-picker': { color: muiTheme.palette.text.primary },
                        }}>
                          <ReactQuill theme="snow" value={formData.description} onChange={handleQuillChange} />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.isGoldenTicket} onChange={(e) => setFormData({ ...formData, isGoldenTicket: e.target.checked })} sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <WorkspacePremiumIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#B45309' }}>Golden Ticket (Dự án xuất sắc)</Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }} sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        {formData.id && (
                          <Button variant="outlined" size="large" onClick={resetForm} sx={{ py: 1.6, flex: 1, fontWeight: 700, borderRadius: 3, textTransform: 'none', borderWidth: 2, color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'text.primary', color: 'text.primary', borderWidth: 2 } }}>Huỷ</Button>
                        )}
                        <motion.div style={{ flex: 2 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                          <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} fullWidth sx={{ py: 1.6, fontSize: '1rem', fontWeight: 700, borderRadius: 3, textTransform: 'none', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                            {formData.id ? 'Cập Nhật Nháp' : 'Lưu Nháp Dự Án'}
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
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                {loadingList ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: 'primary.main' }} /></Box>
                ) : projectsList.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có dự án nào.</Typography></Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedProjects.length > 0 && selectedProjects.length === projectsList.length} indeterminate={selectedProjects.length > 0 && selectedProjects.length < projectsList.length} onChange={handleToggleAllProjects} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                      </Box>
                      {selectedProjects.length > 0 && (
                        <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteProjectsConfirm(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                          Xoá {selectedProjects.length} mục
                        </Button>
                      )}
                    </Box>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={projectsList.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <List sx={{ p: 0 }}>
                          {projectsList.map((project, idx) => (
                            <SortableProjectItem
                              key={project.id}
                              id={project.id}
                              project={project}
                              idx={idx}
                              isSelected={selectedProjects.includes(project.id)}
                              onToggle={handleToggleProject}
                              categoryName={categoriesList.find(c => c.id === project.category)?.name || project.category}
                              onEdit={(p: any) => {
                                setFormData({
                                  id: p.id, name: p.name, description: p.description, thumbnail: p.thumbnail,
                                  youtubeUrl: p.youtubeUrl || '', category: p.category,
                                  teamMembers: Array.isArray(p.teamMembers) ? p.teamMembers.join('\n') : p.teamMembers,
                                  semester: p.semester,
                                  techTags: Array.isArray(p.techTags) ? p.techTags.join(', ') : (p.techTags || ''),
                                  isGoldenTicket: !!p.isGoldenTicket,
                                  major: p.major || '',
                                });
                                setTabIndex(0);
                              }}
                              onDelete={(id: string) => { setProjectToDelete(id); setDeleteConfirmOpen(true); }}
                            />
                          ))}
                        </List>
                      </SortableContext>
                    </DndContext>
                  </>
                )}
              </Paper>
            )}

            {/* Tab 2: Manage Categories */}
            {tabIndex === 2 && (
              <Box>
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên loại dự án mới" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                    <Button variant="contained" onClick={handleAddCategory} disabled={!newCategoryName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                  {loadingCategories ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#10B981' }} /></Box>
                  ) : categoriesList.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có loại dự án nào.</Typography></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedCategories.length > 0 && selectedCategories.length === categoriesList.length} indeterminate={selectedCategories.length > 0 && selectedCategories.length < categoriesList.length} onChange={handleToggleAllCategories} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                        {selectedCategories.length > 0 && (
                          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteCategoriesConfirm(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            Xoá {selectedCategories.length} mục
                          </Button>
                        )}
                      </Box>
                      <List sx={{ p: 0 }}>
                        {categoriesList.map((cat, idx) => (
                          <Box key={cat.id}>
                            {idx > 0 && <Divider />}
                            <ListItem sx={{ py: 2 }}>
                              <Checkbox checked={selectedCategories.includes(cat.id)} onChange={() => handleToggleCategory(cat.id)} sx={{ mr: 1 }} />
                              <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{cat.name}</Typography>}
                                secondary={<Box sx={{ mt: 1 }}><Chip label="Giao diện nhãn" size="small" sx={{ background: cat.bg, color: cat.text, fontWeight: 700 }} /></Box>}
                                disableTypography
                              />
                              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <IconButton size="small" onClick={() => handleMoveCategory(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleMoveCategory(idx, 'down')} disabled={idx === categoriesList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setEditCategoryType('category'); setEditCategoryItem(cat); }} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setCategoryToDelete(cat.id); setDeleteConfirmOpen(true); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
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

            {/* Tab 3: Add / Edit Article Form */}
            {tabIndex === 3 && (
              <Box>
                {!articleFormData.id && (
                  <Paper elevation={0} sx={{ p: 3, mb: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Tự động lấy thông tin bài viết</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <TextField fullWidth size="small" placeholder="Dán link bài viết..." value={articleFormData.link} onChange={e => setArticleFormData({ ...articleFormData, link: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchArticle())} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                      <Button variant="contained" onClick={handleFetchArticle} disabled={fetchingArticle || !articleFormData.link.trim()} startIcon={fetchingArticle ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />} sx={{ minWidth: 150, whiteSpace: 'nowrap', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                        {fetchingArticle ? 'Đang cào...' : 'Tự động điền'}
                      </Button>
                    </Box>
                  </Paper>
                )}

                <Paper elevation={0} sx={{ p: { xs: 3, md: 4.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
                  <form onSubmit={handleSubmitArticle}>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Link gốc bài viết" value={articleFormData.link} onChange={e => setArticleFormData({ ...articleFormData, link: e.target.value })} required />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Tên bài viết" value={articleFormData.title} onChange={e => setArticleFormData({ ...articleFormData, title: e.target.value })} required />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Link ảnh bài viết (Không bắt buộc)" value={articleFormData.imageUrl} onChange={e => setArticleFormData({ ...articleFormData, imageUrl: e.target.value })} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Loại bài viết</InputLabel>
                          <Select value={articleFormData.type} label="Loại bài viết" onChange={e => setArticleFormData({ ...articleFormData, type: e.target.value as string })}>
                            {articleTypesList.map(type => (
                              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                            ))}
                            {articleTypesList.length === 0 && <MenuItem disabled value="">Chưa có loại bài viết nào</MenuItem>}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Chuyên ngành</InputLabel>
                          <Select value={articleFormData.major} label="Chuyên ngành" onChange={e => setArticleFormData({ ...articleFormData, major: e.target.value as string })}>
                            {majorsList.map(major => (
                              <MenuItem key={major.id} value={major.id}>{major.name}</MenuItem>
                            ))}
                            {majorsList.length === 0 && <MenuItem disabled value="">Chưa có chuyên ngành nào</MenuItem>}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }} sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        {articleFormData.id && (
                          <Button variant="outlined" size="large" onClick={resetArticleForm} sx={{ py: 1.6, flex: 1, fontWeight: 700, borderRadius: 3, textTransform: 'none', borderWidth: 2, color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'text.primary', color: 'text.primary', borderWidth: 2 } }}>Huỷ</Button>
                        )}
                        <motion.div style={{ flex: 2 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                          <Button type="submit" variant="contained" size="large" fullWidth startIcon={<SaveIcon />} sx={{ py: 1.6, borderRadius: 3, textTransform: 'none', fontWeight: 800, fontSize: '1.05rem', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)' }}>
                            {articleFormData.id ? 'Cập Nhật Nháp' : 'Lưu Nháp Mới'}
                          </Button>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
              </Box>
            )}

            {/* Tab 4: Manage Articles */}
            {tabIndex === 4 && (
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                {loadingArticles ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
                ) : articlesList.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có bài viết nào.</Typography></Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {articlesList.map((article, idx) => (
                      <Box key={article.id}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ py: 2 }}>
                          <ListItemAvatar>
                            <Avatar src={article.imageUrl} variant="rounded" sx={{ width: 80, height: 50, mr: 2, border: '1px solid', borderColor: 'divider' }} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{article.title}</Typography>}
                            secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{articleTypesList.find(t => t.id === article.type)?.name || article.type} • {majorsList.find(m => m.id === article.major)?.name || article.major}</Typography>}
                          />
                          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                            <IconButton size="small" onClick={() => { setArticleFormData(article); setTabIndex(3); }} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => setArticlesList(prev => prev.filter(a => a.id !== article.id))} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            )}

            {/* Tab 5: QL Chuyên Ngành */}
            {tabIndex === 5 && (
              <Box>
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Thêm Chuyên Ngành Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên chuyên ngành mới" value={newMajorName} onChange={e => setNewMajorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMajor())} />
                    <Button variant="contained" onClick={handleAddMajor} disabled={!newMajorName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                  {loadingMajors ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#10B981' }} /></Box>
                  ) : majorsList.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có chuyên ngành nào.</Typography></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedMajors.length > 0 && selectedMajors.length === majorsList.length} indeterminate={selectedMajors.length > 0 && selectedMajors.length < majorsList.length} onChange={handleToggleAllMajors} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                        {selectedMajors.length > 0 && (
                          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteMajorsConfirm(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            Xoá {selectedMajors.length} mục
                          </Button>
                        )}
                      </Box>
                      <List sx={{ p: 0 }}>
                        {majorsList.map((cat, idx) => (
                          <Box key={cat.id}>
                            {idx > 0 && <Divider />}
                            <ListItem sx={{ py: 2 }}>
                              <Checkbox checked={selectedMajors.includes(cat.id)} onChange={() => handleToggleMajor(cat.id)} sx={{ mr: 1 }} />
                              <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{cat.name}</Typography>}
                                secondary={<Box sx={{ mt: 1 }}><Chip label="Giao diện nhãn" size="small" sx={{ background: cat.bg, color: cat.text, fontWeight: 700 }} /></Box>}
                                disableTypography
                              />
                              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <IconButton size="small" onClick={() => handleMoveMajor(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleMoveMajor(idx, 'down')} disabled={idx === majorsList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setEditCategoryType('major'); setEditCategoryItem(cat); }} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setMajorToDelete(cat.id); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
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

            {/* Tab 6: QL Loại Bài Viết */}
            {tabIndex === 6 && (
              <Box>
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Thêm Loại Bài Viết Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên loại bài viết mới" value={newArticleTypeName} onChange={e => setNewArticleTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddArticleType())} />
                    <Button variant="contained" onClick={handleAddArticleType} disabled={!newArticleTypeName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                  {loadingArticleTypes ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#10B981' }} /></Box>
                  ) : articleTypesList.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có loại bài viết nào.</Typography></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedArticleTypes.length > 0 && selectedArticleTypes.length === articleTypesList.length} indeterminate={selectedArticleTypes.length > 0 && selectedArticleTypes.length < articleTypesList.length} onChange={handleToggleAllArticleTypes} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                        {selectedArticleTypes.length > 0 && (
                          <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteArticleTypesConfirm(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            Xoá {selectedArticleTypes.length} mục
                          </Button>
                        )}
                      </Box>
                      <List sx={{ p: 0 }}>
                        {articleTypesList.map((cat, idx) => (
                          <Box key={cat.id}>
                            {idx > 0 && <Divider />}
                            <ListItem sx={{ py: 2 }}>
                              <Checkbox checked={selectedArticleTypes.includes(cat.id)} onChange={() => handleToggleArticleType(cat.id)} sx={{ mr: 1 }} />
                              <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{cat.name}</Typography>}
                                secondary={<Box sx={{ mt: 1 }}><Chip label="Giao diện nhãn" size="small" sx={{ background: cat.bg, color: cat.text, fontWeight: 700 }} /></Box>}
                                disableTypography
                              />
                              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <IconButton size="small" onClick={() => handleMoveArticleType(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleMoveArticleType(idx, 'down')} disabled={idx === articleTypesList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setEditCategoryType('articleType'); setEditCategoryItem(cat); }} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => { setArticleTypeToDelete(cat.id); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
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

          </Box>
        </Paper>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá dự án</DialogTitle>
        <DialogContent><DialogContentText>Dự án này sẽ bị xoá khỏi bản nháp hiện tại của bạn.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteProject} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteProjectsConfirm} onClose={() => setBulkDeleteProjectsConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều dự án</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedProjects.length} dự án khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteProjectsConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteProjectsAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá loại dự án</DialogTitle>
        <DialogContent><DialogContentText>Xoá loại dự án này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCategoryToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteCategoryHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteCategoriesConfirm} onClose={() => setBulkDeleteCategoriesConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều loại dự án</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedCategories.length} loại dự án khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteCategoriesConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteCategoriesAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      {/* Majors Dialogs */}
      <Dialog open={!!majorToDelete} onClose={() => setMajorToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá chuyên ngành</DialogTitle>
        <DialogContent><DialogContentText>Xoá chuyên ngành này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setMajorToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteMajorHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteMajorsConfirm} onClose={() => setBulkDeleteMajorsConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều chuyên ngành</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedMajors.length} chuyên ngành khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteMajorsConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteMajorsAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      {/* ArticleTypes Dialogs */}
      <Dialog open={!!articleTypeToDelete} onClose={() => setArticleTypeToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá loại bài viết</DialogTitle>
        <DialogContent><DialogContentText>Xoá loại bài viết này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setArticleTypeToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteArticleTypeHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteArticleTypesConfirm} onClose={() => setBulkDeleteArticleTypesConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều loại bài viết</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedArticleTypes.length} loại bài viết khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteArticleTypesConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteArticleTypesAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!status} autoHideDuration={6000} onClose={() => setStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setStatus(null)} severity={status?.type} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {status?.message}
        </Alert>
      </Snackbar>

      {/* Edit Category/Major Dialog */}
      <Dialog open={!!editCategoryItem} onClose={() => setEditCategoryItem(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Chỉnh Sửa Thuộc Tính</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {editCategoryItem && (
            <>
              <TextField
                label="Tên"
                fullWidth
                size="small"
                value={editCategoryItem.name}
                onChange={e => setEditCategoryItem({ ...editCategoryItem, name: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Màu Nền (Mã Hex hoặc Tên màu)"
                  fullWidth
                  size="small"
                  value={editCategoryItem.bg}
                  onChange={e => setEditCategoryItem({ ...editCategoryItem, bg: e.target.value })}
                />
                <input
                  type="color"
                  value={editCategoryItem.bg.startsWith('#') && editCategoryItem.bg.length === 7 ? editCategoryItem.bg : '#ffffff'}
                  onChange={e => setEditCategoryItem({ ...editCategoryItem, bg: e.target.value })}
                  style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
                  title="Chọn Màu Nền"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Màu Chữ (Mã Hex hoặc Tên màu)"
                  fullWidth
                  size="small"
                  value={editCategoryItem.text}
                  onChange={e => setEditCategoryItem({ ...editCategoryItem, text: e.target.value })}
                />
                <input
                  type="color"
                  value={editCategoryItem.text.startsWith('#') && editCategoryItem.text.length === 7 ? editCategoryItem.text : '#000000'}
                  onChange={e => setEditCategoryItem({ ...editCategoryItem, text: e.target.value })}
                  style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
                  title="Chọn Màu Chữ"
                />
              </Box>
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={editCategoryItem.name || 'Xem Trước'}
                  sx={{ background: editCategoryItem.bg, color: editCategoryItem.text, fontWeight: 700 }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditCategoryItem(null)} color="inherit" sx={{ fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={handleSaveCategoryEdit} variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>Lưu Thay Đổi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
