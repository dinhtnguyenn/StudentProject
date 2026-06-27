import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import {
  Box,
  Pagination, Typography, TextField, Button, Paper, Snackbar, Alert, Grid,
  CircularProgress, Divider, Collapse, IconButton, InputAdornment,
  List, ListItem, ListItemText, Avatar, ListSubheader, ListItemButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, Checkbox, FormControlLabel, useTheme, ListItemIcon, Autocomplete, InputBase,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
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
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StarIcon from '@mui/icons-material/Star';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CategoryIcon from '@mui/icons-material/Category';
import StorageIcon from '@mui/icons-material/Storage';
import SendIcon from '@mui/icons-material/Send';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Category } from '../types/Category';
import { getAssetImagePath, getUploadedImagePath } from '../lib/imageUrl';
import UserManagement from './UserManagement';

// --- Types & Helpers ---
const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

function getSemesterFromDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  if (month >= 1 && month <= 4) return `SPRING ${year}`;
  if (month >= 5 && month <= 8) return `SUMMER ${year}`;
  return `FALL ${year}`;
}

function normalizeSemester(sem: string) {
  if (!sem) return '';
  const s = sem.toUpperCase().trim();
  const yearMatch = s.match(/\d{2,4}/);
  if (!yearMatch) return s;
  let yearStr = yearMatch[0];
  if (yearStr.length === 2) yearStr = '20' + yearStr;

  if (s.includes('FA') || s.includes('FALL')) return `FALL ${yearStr}`;
  if (s.includes('SP') || s.includes('SPRING')) return `SPRING ${yearStr}`;
  if (s.includes('SU') || s.includes('SUMMER')) return `SUMMER ${yearStr}`;
  return s;
}

function getSemesterWeight(sem: string) {
  const norm = normalizeSemester(sem);
  const parts = norm.split(' ');
  if (parts.length !== 2) return 0;
  const term = parts[0];
  const year = parseInt(parts[1], 10);
  if (isNaN(year)) return 0;
  let termWeight = 0;
  if (term === 'SPRING') termWeight = 1;
  else if (term === 'SUMMER') termWeight = 2;
  else if (term === 'FALL') termWeight = 3;
  return year * 10 + termWeight;
}

function compareSemesters(a: string, b: string) {
  return getSemesterWeight(b) - getSemesterWeight(a); // descending
}

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
function SortableProjectItem({ project, canEdit, canDelete, onDelete, onToggle, isSelected, categoriesList, majorsList, allTags, onUpdateTechTags, onInlineEdit, onImageUpload, isUploadingImage }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: project.isNewItem ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : (project.isNewItem ? 'success.main' : 'divider'),
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: project.isNewItem ? 'success.light' : 'primary.light',
          }
        }}
      >
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? 'grab' : 'not-allowed', mr: 1, mt: 1, display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
            <DragIndicatorIcon fontSize="small" />
          </Box>
          {canDelete && <Checkbox size="small" checked={isSelected} onChange={() => onToggle(project.id)} sx={{ mr: 1, mt: 0.5 }} />}
          {!canDelete && <Box sx={{ width: 42 }} />}

          <Avatar src={project.thumbnail} variant="rounded" sx={{ width: 44, height: 44, mr: 2, mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InputBase disabled={!canEdit} 
                value={project.name}
                placeholder="Tên dự án..."
                onChange={(e) => onInlineEdit(project.id, 'name', e.target.value)}
                sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary', fontSize: '1.05rem', '& input': { p: 0 } }}
              />
              <IconButton disabled={!canEdit}
                size="small"
                onClick={() => onInlineEdit(project.id, 'isGoldenTicket', !project.isGoldenTicket)}
                sx={{ p: 0.5 }}
                title={project.isGoldenTicket ? "Bỏ Golden Ticket" : "Đánh dấu Golden Ticket"}
              >
                <StarIcon sx={{ color: project.isGoldenTicket ? '#F59E0B' : 'action.disabled', fontSize: 20 }} />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {/* Semester */}
              <InputBase disabled={!canEdit} 
                value={project.semester}
                placeholder="Kỳ (VD: FA24)"
                onChange={(e) => onInlineEdit(project.id, 'semester', e.target.value)}
                sx={{ width: 120, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& input': { p: 0, textAlign: 'center' } }}
              />

              {/* Major */}
              <Select disabled={!canEdit} 
                variant="standard"
                disableUnderline
                displayEmpty
                value={project.major || ''}
                onChange={(e) => onInlineEdit(project.id, 'major', e.target.value as string)}
                sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' } }}
              >
                <MenuItem value="" disabled>Chọn ngành</MenuItem>
                {majorsList?.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </Select>

              {/* Category */}
              <Select disabled={!canEdit} 
                variant="standard"
                disableUnderline
                displayEmpty
                value={project.category || ''}
                onChange={(e) => onInlineEdit(project.id, 'category', e.target.value as string)}
                sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' } }}
              >
                <MenuItem value="" disabled>Chọn loại</MenuItem>
                {categoriesList?.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, ml: 2, alignItems: 'center', mt: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ bgcolor: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isExpanded ? 'primary.main' : 'text.secondary', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'primary.main' } }}
            >
              {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
            {canDelete && (
            <IconButton size="small" onClick={() => onDelete(project.id)} sx={{ color: 'text.disabled', transition: 'all 0.2s', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            )}
          </Box>
        </Box>

        {/* Expandable Body */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField disabled={!canEdit} 
                    fullWidth size="small" label="Link Thumbnail (Ảnh)"
                    value={project.thumbnail}
                    onChange={(e) => onInlineEdit(project.id, 'thumbnail', e.target.value)}
                  />
                  <IconButton disabled={!canEdit || isUploadingImage} component="label" sx={{ bgcolor: 'action.hover' }} title="Tải ảnh từ máy">
                    {isUploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon fontSize="small" />}
                    <input type="file" hidden accept="image/*" onChange={(e) => onImageUpload(e, false, project.id)} />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField disabled={!canEdit} 
                    fullWidth size="small" label="Link YouTube"
                    value={project.youtubeUrl || ''}
                    onChange={(e) => onInlineEdit(project.id, 'youtubeUrl', e.target.value)}
                  />
                  {project.youtubeUrl && (
                    <IconButton size="small" onClick={() => window.open(project.youtubeUrl, '_blank')} sx={{ color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }}>
                      <OpenInNewIcon />
                    </IconButton>
                  )}
                </Box>
                <Autocomplete disabled={!canEdit} 
                  multiple freeSolo size="small"
                  options={allTags}
                  value={Array.isArray(project.techTags) ? project.techTags : (typeof project.techTags === 'string' && project.techTags ? (project.techTags as string).split(',').map(t => t.trim()) : [])}
                  onChange={(_, newValue) => onUpdateTechTags(project.id, newValue as string[])}
                  renderInput={(params) => <TextField {...params} label="Công nghệ sử dụng" placeholder="+ Thêm..." />}
                />
              </Box>
            </Grid>

            {/* Right Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField disabled={!canEdit} 
                fullWidth size="small" multiline rows={6}
                label="Thành viên nhóm (Mỗi người 1 dòng)"
                value={Array.isArray(project.teamMembers) ? project.teamMembers.join('\n') : project.teamMembers}
                onChange={(e) => onInlineEdit(project.id, 'teamMembers', e.target.value)}
              />
            </Grid>

            {/* Description - Full Width */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>Mô tả dự án</Typography>
              <Box sx={{
                '.ql-container': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, minHeight: 120, fontSize: '0.9rem', fontFamily: 'inherit', color: 'text.primary' },
                '.ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: 'background.default' },
                '.ql-stroke': { stroke: theme.palette.text.primary },
                '.ql-fill': { fill: theme.palette.text.primary },
                '.ql-picker': { color: theme.palette.text.primary },
              }}>
                <ReactQuill
                  theme="snow"
                  value={project.description || ''}
                  onChange={(val) => onInlineEdit(project.id, 'description', val)}
                />
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    </Box>
  );
}

// --- Sortable Article Item
// --- Sortable Article Item Component ---
function SortableArticleItem({ article, canEdit, canDelete, onDelete, onInlineEdit, articleTypesList, majorsList, onImageUpload, isUploadingImage }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: article.id });
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.light',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? 'grab' : 'not-allowed', mr: 1, mt: 1, display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
            <DragIndicatorIcon fontSize="small" />
          </Box>

          <Avatar src={article.imageUrl} variant="rounded" sx={{ width: 64, height: 44, mr: 2, mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InputBase disabled={!canEdit} 
                value={article.title}
                placeholder="Tên bài viết..."
                onChange={(e) => onInlineEdit(article.id, 'title', e.target.value)}
                sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary', fontSize: '1.05rem', '& input': { p: 0 } }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <InputBase disabled={!canEdit} 
                placeholder="Năm..."
                value={article.year || ''}
                onChange={(e) => onInlineEdit(article.id, 'year', e.target.value)}
                sx={{ width: 60, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& input': { p: 0, textAlign: 'center' } }}
              />
              <Select disabled={!canEdit} 
                variant="standard"
                disableUnderline
                displayEmpty
                value={article.major || ''}
                onChange={(e) => onInlineEdit(article.id, 'major', e.target.value as string)}
                sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' } }}
              >
                <MenuItem value="" disabled>Chọn ngành</MenuItem>
                {majorsList?.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </Select>
              <Select disabled={!canEdit} 
                variant="standard"
                disableUnderline
                displayEmpty
                value={article.type || ''}
                onChange={(e) => onInlineEdit(article.id, 'type', e.target.value as string)}
                sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' } }}
              >
                <MenuItem value="" disabled>Chọn loại</MenuItem>
                {articleTypesList?.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, ml: 2, alignItems: 'center', mt: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ bgcolor: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isExpanded ? 'primary.main' : 'text.secondary', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'primary.main' } }}
            >
              {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
            {canDelete && (
            <IconButton size="small" onClick={() => onDelete(article.id)} sx={{ color: 'text.disabled', transition: 'all 0.2s', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            )}
          </Box>
        </Box>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField disabled={!canEdit}  fullWidth size="small" label="Link Ảnh" value={article.imageUrl || ''} onChange={(e) => onInlineEdit(article.id, 'imageUrl', e.target.value)} />
                <IconButton disabled={!canEdit || isUploadingImage} component="label" sx={{ bgcolor: 'action.hover' }} title="Tải ảnh từ máy">
                  {isUploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon fontSize="small" />}
                  <input type="file" hidden accept="image/*" onChange={(e) => onImageUpload(e, true, article.id)} />
                </IconButton>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField disabled={!canEdit}  fullWidth size="small" label="Link Bài Viết" value={article.link || ''} onChange={(e) => onInlineEdit(article.id, 'link', e.target.value)} />
                {article.link && (
                  <IconButton size="small" onClick={() => window.open(article.link, '_blank')} sx={{ color: 'info.main', bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
                    <OpenInNewIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    </Box>
  );
}

// --- Sortable Unity Asset Item
// --- Sortable Unity Asset Item Component ---
function SortableUnityAssetItem({ asset, canEdit, canDelete, onDelete, onInlineEdit, assetTypesList, assetSourcesList, onImageUpload, isUploadingImage, isSelected, onToggle }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: asset.id });
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.8 : 1 };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1.5 }}>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: isSelected ? 'primary.main' : 'divider', bgcolor: isDragging ? 'action.hover' : 'background.paper', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.light' } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? 'grab' : 'not-allowed', mr: 1, mt: 1, display: 'flex', alignItems: 'center', color: canEdit ? 'text.disabled' : 'text.disabled', opacity: canEdit ? 1 : 0.3 }}><DragIndicatorIcon fontSize="small" /></Box>
          {canDelete && <Checkbox size="small" checked={isSelected} onChange={() => onToggle(asset.id)} sx={{ mr: 1, mt: 0.5 }} />}
          {!canDelete && <Box sx={{ width: 42 }} />}
          <Avatar src={asset.imageUrl} variant="rounded" sx={{ width: 64, height: 44, mr: 2, mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InputBase disabled={!canEdit} value={asset.name} placeholder="Tên tài nguyên..." onChange={(e) => onInlineEdit(asset.id, 'name', e.target.value)} sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary', fontSize: '1.05rem', '& input': { p: 0 }, WebkitTextFillColor: canEdit ? 'inherit' : 'text.primary' }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap', width: '100%' }}>
              <InputBase disabled={!canEdit} placeholder="Tác giả..." value={asset.owner || ''} onChange={(e) => onInlineEdit(asset.id, 'owner', e.target.value)} sx={{ width: 100, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& input': { p: 0, textAlign: 'center' }, WebkitTextFillColor: canEdit ? 'inherit' : 'text.secondary' }} />
              <Select disabled={!canEdit} variant="standard" disableUnderline displayEmpty value={asset.assetType || ''} onChange={(e) => onInlineEdit(asset.id, 'assetType', e.target.value as string)} sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' }, WebkitTextFillColor: canEdit ? 'inherit' : 'text.secondary' }}>
                <MenuItem value="" disabled>Chọn loại</MenuItem>
                {assetTypesList?.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
              <Select disabled={!canEdit} variant="standard" disableUnderline displayEmpty value={asset.sourceId || ''} onChange={(e) => onInlineEdit(asset.id, 'sourceId', e.target.value as string)} sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', px: 1.5, py: 0.3, borderRadius: 5, '& .MuiSelect-select': { p: 0, pb: 0, minHeight: 'auto' }, WebkitTextFillColor: canEdit ? 'inherit' : 'text.secondary' }}>
                <MenuItem value="" disabled>Chọn nguồn</MenuItem>
                {assetSourcesList?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
              {asset.createdAt && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, ml: 'auto', mr: 1 }}>
                  {new Date(typeof asset.createdAt === 'number' && asset.createdAt < 100000 ? Math.round((asset.createdAt - 25569) * 86400 * 1000) : asset.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2, alignItems: 'center', mt: 0.5 }}>
            <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)} sx={{ bgcolor: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isExpanded ? 'primary.main' : 'text.secondary', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'primary.main' } }}>
              {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
            {canDelete && <IconButton size="small" onClick={() => onDelete(asset.id)} sx={{ color: 'text.disabled', transition: 'all 0.2s', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>}
          </Box>
        </Box>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField fullWidth size="small" label="Link Ảnh" disabled={!canEdit} value={asset.imageUrl || ''} onChange={(e) => onInlineEdit(asset.id, 'imageUrl', e.target.value)} />
                  <IconButton disabled={!canEdit || isUploadingImage} component="label" sx={{ bgcolor: 'action.hover', display: canEdit ? 'inline-flex' : 'none' }} title="Tải ảnh từ máy">
                    {isUploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon fontSize="small" />}
                    <input type="file" hidden accept="image/*" onChange={(e) => onImageUpload(e, asset.id)} />
                  </IconButton>
                </Box>
                <TextField disabled={!canEdit}  
                  fullWidth 
                  size="small" 
                  label="Ngày Tạo" 
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={asset.createdAt ? new Date(typeof asset.createdAt === 'number' && asset.createdAt < 100000 ? Math.round((asset.createdAt - 25569) * 86400 * 1000) : asset.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                  onChange={e => onInlineEdit(asset.id, 'createdAt', e.target.value ? new Date(e.target.value).getTime() : Date.now())} 
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField disabled={!canEdit}  fullWidth size="small" label="Link Nguồn" value={asset.originalLink || ''} onChange={(e) => onInlineEdit(asset.id, 'originalLink', e.target.value)} />
                  {asset.originalLink && <IconButton size="small" onClick={() => window.open(asset.originalLink, '_blank')} sx={{ color: 'info.main', bgcolor: 'rgba(59, 130, 246, 0.1)' }}><OpenInNewIcon /></IconButton>}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField disabled={!canEdit}  fullWidth size="small" label="Link Drive" value={asset.driveLink || ''} onChange={(e) => onInlineEdit(asset.id, 'driveLink', e.target.value)} />
                  {asset.driveLink && <IconButton size="small" onClick={() => window.open(asset.driveLink, '_blank')} sx={{ color: 'success.main', bgcolor: 'rgba(16, 185, 129, 0.1)' }}><OpenInNewIcon /></IconButton>}
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField disabled={!canEdit}  fullWidth size="small" multiline rows={3} label="Mô tả chi tiết" value={asset.description || ''} onChange={(e) => onInlineEdit(asset.id, 'description', e.target.value)} />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    </Box>
  );
}

// --- Sortable Preview Item (For Modal) ---
function SortablePreviewItem({ project, idx }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.8 : 1 };
  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1 }}>
      <Paper elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDragging ? 'action.hover' : 'background.paper' }}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.disabled' }}><DragIndicatorIcon fontSize="small" /></Box>
        <Typography variant="body2" sx={{ fontWeight: 700, width: 30, color: 'text.secondary' }}>#{idx + 1}</Typography>
        <Avatar src={project.thumbnail} variant="rounded" sx={{ width: 44, height: 44 }} />
        <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 700 }}>{project.name}</Typography>
        <Chip label={project.semester || 'N/A'} size="small" color={project.isNewItem ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
      </Paper>
    </Box>
  );
}

// --- Main Component ---
export default function AdminForm() {
  const [tabIndex, setTabIndex] = useState(7);
  const [visibleUnityAssetsCount, setVisibleUnityAssetsCount] = useState(20);
  const muiTheme = useTheme();


  // Settings / Auth State
  const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://unifolio-backend.nguyendinhteki.workers.dev';
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = sessionStorage.getItem('unifolio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [forceProfileOpen, setForceProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsSearch, setProjectsSearch] = useState('');
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesSearch, setArticlesSearch] = useState('');
  const [unityAssetsPage, setUnityAssetsPage] = useState(1);
  const [unityAssetsSearch, setUnityAssetsSearch] = useState('');
  const [unityAssetsDriveFilter, setUnityAssetsDriveFilter] = useState(false);
  const itemsPerPage = 20;

  // Fake constants to prevent breaking existing GitHub API URL builders
  const githubOwner = 'dinhtnguyenn';
  const githubRepo = 'StudentProject';
  const githubToken = '';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const hasPerm = (module: string, action: 'view' | 'add' | 'edit' | 'delete', itemOwner?: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPERADMIN') return true;
    const perms = currentUser.permissions?.[module];
    if (!perms) return false;
    const p = perms[action];
    if (action === 'view' || action === 'add') return !!p;
    if (p === 'ALL') return true;
    // OWN: if itemOwner is provided, compare; if not provided (e.g. checking tab access), allow if has OWN perm
    if (p === 'OWN') {
      if (itemOwner === undefined) return true; // trust caller context
      return itemOwner === currentUser.username;
    }
    return false;
  };

  // AI State & API Keys
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
  const [isAiLoading, setIsAiLoading] = useState<{ tags: boolean, summary: boolean }>({ tags: false, summary: false });

  useEffect(() => {
    const initAuth = () => {
      const user = sessionStorage.getItem('unifolio_user');
      const pass = sessionStorage.getItem('unifolio_pass');
      const geminiKey = sessionStorage.getItem('gemini_api_key') || '';
      setGeminiApiKey(geminiKey);
      if (user && pass) {
        setIsAuthenticated(true);
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
        setLoginPassword(pass);
        if (parsedUser.mustChangePassword || !parsedUser.email) setForceProfileOpen(true);
      }
      setIsAuthenticating(false);
    };
    initAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (!res.ok) throw new Error('Sai tài khoản hoặc mật khẩu');
      const user = await res.json();
      setCurrentUser(user);
      sessionStorage.setItem('unifolio_user', JSON.stringify(user));
      sessionStorage.setItem('unifolio_pass', loginPassword);
      setIsAuthenticated(true);
      if (user.mustChangePassword || !user.email) setForceProfileOpen(true);
      setStatus({ type: 'success', message: 'Đăng nhập thành công!' });
    } catch (err: any) {
      setLoginError(err.message);
      setStatus({ type: 'error', message: err.message || loginError });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('unifolio_user');
    sessionStorage.removeItem('unifolio_pass');
    sessionStorage.removeItem('gemini_api_key');
    setCurrentUser(null);
    setLoginPassword('');
    setLoginUsername('');
    setIsAuthenticated(false);
    setStatus({ type: 'info', message: 'Đã đăng xuất khỏi hệ thống.' });
  };

  // UI State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleSaveProfile = async (isForced = false) => {
    if (!profileEmail) { setStatus({ type: 'error', message: 'Vui lòng nhập Email' }); return; }
    
    // Only validate password if the user typed one, or if they are strictly required to change it
    if (newPassword || currentUser?.mustChangePassword) {
      if (newPassword.length < 6) { setStatus({ type: 'error', message: 'Mật khẩu phải từ 6 ký tự trở lên' }); return; }
      if (newPassword !== confirmNewPassword) { setStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp' }); return; }
    }
    
    setChangingPassword(true);
    try {
      const basicAuth = `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}`;
      
      // Update email
      const resProfile = await fetch(`${WORKER_URL}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': basicAuth },
        body: JSON.stringify({ email: profileEmail })
      });
      if (!resProfile.ok) throw new Error('Có lỗi xảy ra khi cập nhật email');
      
      let updatedUser = { ...currentUser, email: profileEmail };
      
      // Update password if provided
      let changedPass = false;
      if (newPassword) {
        const resPass = await fetch(`${WORKER_URL}/api/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': basicAuth },
          body: JSON.stringify({ newPassword })
        });
        if (!resPass.ok) throw new Error('Có lỗi xảy ra khi đổi mật khẩu');
        changedPass = true;
      }
      
      updatedUser.mustChangePassword = false;
      setCurrentUser(updatedUser);
      sessionStorage.setItem('unifolio_user', JSON.stringify(updatedUser));
      
      setStatus({ type: 'success', message: changedPass ? 'Cập nhật thành công! Vui lòng đăng nhập lại.' : 'Cập nhật hồ sơ thành công!' });
      
      if (isForced) setForceProfileOpen(false);
      else setChangePasswordOpen(false);
      
      if (changedPass) {
        setTimeout(() => handleLogout(), 2000);
      }
    } catch (err: any) { setStatus({ type: 'error', message: err.message }); }
    finally { setChangingPassword(false); }
  };

  // Form State
  const [formData, setFormData] = useState({
    id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '', techTags: [] as string[], isGoldenTicket: false, major: '',
  });

  const [articleFormData, setArticleFormData] = useState({
    id: '', title: '', imageUrl: '', link: '', type: '', major: '', year: ''
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

  const [driveAccessCodes, setDriveAccessCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeFormData, setCodeFormData] = useState({ resourceId: '', email: '', durationDays: 1, maxUses: 0, driveLink: '' });
  const [driveAccessLogs, setDriveAccessLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logTabValue, setLogTabValue] = useState(0);

  const [driveAccessRequests, setDriveAccessRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approveFormData, setApproveFormData] = useState({ id: '', resourceId: '', durationDays: 1, maxUses: 0, open: false });
  const [reqTabValue, setReqTabValue] = useState(0);


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

  const [originalUnityAssets, setOriginalUnityAssets] = useState<any[]>([]);
  const [unityAssetsList, setUnityAssetsList] = useState<any[]>([]);
  const [unityAssetsSha, setUnityAssetsSha] = useState('');

  const [originalAssetSources, setOriginalAssetSources] = useState<Category[]>([]);
  const [assetSourcesList, setAssetSourcesList] = useState<Category[]>([]);
  const [assetSourcesSha, setAssetSourcesSha] = useState('');

  const [originalAssetTypes, setOriginalAssetTypes] = useState<Category[]>([]);
  const [assetTypesList, setAssetTypesList] = useState<Category[]>([]);
  const [assetTypesSha, setAssetTypesSha] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unityAssetFormData, setUnityAssetFormData] = useState<any>({
    id: '', name: '', description: '', imageUrl: '', assetType: 'GOOGLE_DRIVE', originalLink: '', driveLink: '', owner: '', sourceId: ''
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Draft State detection
  const isProjectsChanged = JSON.stringify(originalProjects) !== JSON.stringify(projectsList);
  const isCategoriesChanged = JSON.stringify(originalCategories) !== JSON.stringify(categoriesList);
  const isArticlesChanged = JSON.stringify(originalArticles) !== JSON.stringify(articlesList);
  const isMajorsChanged = JSON.stringify(originalMajors) !== JSON.stringify(majorsList);
  const isArticleTypesChanged = JSON.stringify(originalArticleTypes) !== JSON.stringify(articleTypesList);
  const isUnityAssetsChanged = JSON.stringify(originalUnityAssets) !== JSON.stringify(unityAssetsList);
  const isAssetSourcesChanged = JSON.stringify(originalAssetSources) !== JSON.stringify(assetSourcesList);
  const isAssetTypesChanged = JSON.stringify(originalAssetTypes) !== JSON.stringify(assetTypesList);
  const hasUnsavedChanges = isProjectsChanged || isCategoriesChanged || isArticlesChanged || isMajorsChanged || isArticleTypesChanged || isUnityAssetsChanged || isAssetSourcesChanged || isAssetTypesChanged;
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);

  // Modal States
  const [showSortPreview, setShowSortPreview] = useState(false);
  const [sortedProjectsPreview, setSortedProjectsPreview] = useState<any[]>([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkDeleteProjectsConfirm, setBulkDeleteProjectsConfirm] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkDeleteCategoriesConfirm, setBulkDeleteCategoriesConfirm] = useState(false);

  const [unityAssetToDelete, setUnityAssetToDelete] = useState<string | null>(null);
  const [selectedUnityAssets, setSelectedUnityAssets] = useState<string[]>([]);
  const [bulkDeleteUnityAssetsConfirm, setBulkDeleteUnityAssetsConfirm] = useState(false);

  const getProjectsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/projects.json`;
  const getCategoriesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/categories.json`;
  const getArticlesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articles.json`;
  const getMajorsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/majors.json`;
  const getArticleTypesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/articleTypes.json`;
  const getUnityAssetsApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/unity-assets.json`;
  const getAssetSourcesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/asset-sources.json`;
  const getAssetTypesApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/asset-types.json`;
  const getTriggerApiUrl = () => `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/data/trigger.json`;

  const fetchFile = async (url: string) => {
    let path = url;
    if (url.includes('api.github.com')) {
      const match = url.match(/contents\/(.*)$/);
      if (match) path = match[1];
    }
    const getRes = await fetch(`${WORKER_URL}/api/content?path=${encodeURIComponent(path)}`);
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
    let path = url;
    if (url.includes('api.github.com')) {
      const match = url.match(/contents\/(.*)$/);
      if (match) path = match[1];
    }
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(newContentArray, null, 2))));
    const putRes = await fetch(`${WORKER_URL}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser?.username, password: loginPassword, path, content: newContent, sha: sha || undefined, message, branch: 'main' })
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
    if (isAuthenticated) {
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

      fetchFile(getUnityAssetsApiUrl())
        .then(async res => { 
          let normalized = res.data.map((a: any) => ({ ...a, assetType: a.assetType ? String(a.assetType) : '', sourceId: a.sourceId ? String(a.sourceId) : '' }));
          
          // Decrypt driveLinks if needed
          try {
            const user = sessionStorage.getItem('unifolio_user');
            const pass = sessionStorage.getItem('unifolio_pass');
            if (user && pass) {
              const decryptRes = await fetch(`${WORKER_URL}/api/drive-access/decrypt-assets`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${btoa(JSON.parse(user).username + ':' + pass)}`
                },
                body: JSON.stringify(normalized)
              });
              if (decryptRes.ok) {
                normalized = await decryptRes.json();
              }
            }
          } catch (e) {
            console.error('Lỗi giải mã link Drive', e);
          }

          setUnityAssetsList(normalized); 
          setOriginalUnityAssets(normalized); 
          setUnityAssetsSha(res.sha); 
        })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục tài nguyên. Vui lòng không lưu!'); });

      fetchFile(getAssetSourcesApiUrl())
        .then(res => { setAssetSourcesList(res.data); setOriginalAssetSources(res.data); setAssetSourcesSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục Nguồn Asset. Vui lòng không lưu!'); });

      fetchFile(getAssetTypesApiUrl())
        .then(res => { setAssetTypesList(res.data); setOriginalAssetTypes(res.data); setAssetTypesSha(res.sha); })
        .catch(err => { console.error(err); setFetchError('Lỗi tải danh mục Loại Asset. Vui lòng không lưu!'); });
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleQuillChange = (value: string) => setFormData(prev => ({ ...prev, description: value }));
  const fetchHtmlWithProxy = async (targetUrl: string) => {
    try {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`);
      const html = await res.text();
      if (html.includes('Response exceeds 1MB size limit') || html.includes('{"error":')) {
        throw new Error('corsproxy limit');
      }
      return html;
    } catch {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data && data.contents) return data.contents;
      throw new Error('Lỗi Proxy');
    }
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    if (!youtubeApiKey) {
      setStatus({ type: 'error', message: 'Vui lòng cấu hình YouTube API Key ở mục Cấu Hình trước.' });
      return;
    }
    setFetching(true);
    try {
      const videoId = extractYoutubeId(youtubeUrl.trim());
      if (!videoId) throw new Error('Link YouTube không hợp lệ');

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.error) throw new Error(data.error.message || 'Lỗi từ YouTube API.');
      if (!data.items || data.items.length === 0) throw new Error('Không tìm thấy video.');

      const snippet = data.items[0].snippet;
      const fetchedTitle = snippet.title || '';
      const fetchedDescription = snippet.description || '';
      const publishDate = snippet.publishedAt || '';
      const thumbnails = snippet.thumbnails;
      const fetchedThumbnail = thumbnails?.maxres?.url || thumbnails?.standard?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const fetchedTeamMembers = parseTeamMembers(fetchedDescription);

      const newName = fetchedTitle;
      const newThumbnail = fetchedThumbnail;
      const newYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const newTeamMembers = fetchedTeamMembers.length > 0 ? fetchedTeamMembers.join('\n') : '';
      const newDescription = fetchedDescription;
      const newSemester = publishDate ? getSemesterFromDate(publishDate) : '';

      setFormData(prev => ({
        ...prev,
        name: newName,
        thumbnail: newThumbnail,
        youtubeUrl: newYoutubeUrl,
        teamMembers: newTeamMembers,
        description: newDescription,
        semester: newSemester
      }));
      
      setStatus({ type: 'success', message: 'Đã lấy thông tin từ YouTube qua API!' });
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isArticle: boolean, targetId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập trước khi tải ảnh lên.' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const timestamp = Date.now();
      const extMatch = file.name.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '.jpg';
      const folder = isArticle ? 'articles' : 'projects';
      const filename = `${folder}_${timestamp}${ext}`;
      const filePath = `public/images/${folder}/${filename}`;

      const uploadRes = await fetch(`${import.meta.env.VITE_WORKER_URL || 'https://unifolio-backend.nguyendinhteki.workers.dev'}/api/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser?.username, password: loginPassword, path: filePath, message: `Upload ${folder} image ${filename} [skip ci]`, content: base64Data, branch: 'main' })
      });

      if (!uploadRes.ok) throw new Error('Không thể upload ảnh lên Github');
      
      const publicUrl = getUploadedImagePath(folder, filename);
      
      if (targetId) {
        if (isArticle) {
          setArticlesList(prev => prev.map(a => a.id === targetId ? { ...a, imageUrl: publicUrl } : a));
        } else {
          setProjectsList(prev => prev.map(p => p.id === targetId ? { ...p, thumbnail: publicUrl } : p));
        }
      } else {
        if (isArticle) {
          setArticleFormData(prev => ({ ...prev, imageUrl: publicUrl }));
        } else {
          setFormData(prev => ({ ...prev, thumbnail: publicUrl }));
        }
      }
      
      setStatus({ type: 'success', message: 'Upload ảnh thành công!' });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'Có lỗi xảy ra khi upload ảnh.' });
    } finally {
      setIsUploadingImage(false);
      e.target.value = ''; // Reset input file
    }
  };

  const handleFetchBulkYoutube = async () => {
    if (!bulkYoutubeUrl) return;
    if (!youtubeApiKey) {
      setStatus({ type: 'error', message: 'Vui lòng cấu hình YouTube API Key trước khi sử dụng tính năng này.' });
      return;
    }

    setIsBulkFetching(true);
    setStatus({ type: 'info', message: 'Đang lấy danh sách video từ Playlist (thông qua YouTube API)...' });

    try {
      let playlistId = bulkYoutubeUrl;
      try {
        const url = new URL(bulkYoutubeUrl);
        playlistId = url.searchParams.get('list') || bulkYoutubeUrl;
      } catch (e) {
        // If not a valid URL, assume it's directly a playlist ID
      }

      let allVideos: any[] = [];
      let nextPageToken = '';

      do {
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${youtubeApiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.error) {
          throw new Error(data.error.message || 'Lỗi từ YouTube API. Vui lòng kiểm tra lại API Key hoặc Playlist ID.');
        }

        if (data.items && data.items.length > 0) {
          allVideos = allVideos.concat(data.items);
        }
        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken);

      if (allVideos.length === 0) {
        throw new Error('Không tìm thấy video nào. Đảm bảo Playlist ở trạng thái Công khai (Public).');
      }

      setBulkProgress({ current: 0, total: allVideos.length });
      const newProjects: any[] = [];

      for (let i = 0; i < allVideos.length; i++) {
        const item = allVideos[i];
        try {
          const snippet = item.snippet;
          const videoId = snippet.resourceId.videoId;
          const title = snippet.title;
          const publishedAt = snippet.publishedAt;

          // Bỏ qua các video bị xóa hoặc ẩn
          if (title === 'Private video' || title === 'Deleted video') {
            setBulkProgress(prev => ({ ...prev, current: i + 1 }));
            continue;
          }

          const description = snippet.description || '';
          const teamMembers = parseTeamMembers(description);

          const thumbnails = snippet.thumbnails;
          const thumbnail = thumbnails?.maxres?.url || thumbnails?.standard?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';

          if (!projectsList.some(p => (p.youtubeUrl && p.youtubeUrl.includes(videoId)) || p.id === videoId)) {
            newProjects.push({
              id: `${Date.now()}-${i}`,
              name: title || '',
              description: description,
              thumbnail: thumbnail,
              youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
              category: '',
              teamMembers: teamMembers,
              semester: publishedAt ? getSemesterFromDate(publishedAt) : '',
              major: '',
              techTags: [] as string[],
              isNewItem: true
            });
          }
        } catch (e) {
          console.warn('Lỗi xử lý 1 video trong playlist', e);
        }

        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        // Rút ngắn thời gian chờ vì API chính chủ xử lý rất mượt, không cần wait lâu
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (newProjects.length > 0) {
        setProjectsList(prev => [...newProjects, ...prev]);
        setStatus({ type: 'success', message: `Đã nhập nháp thành công ${newProjects.length} dự án từ Playlist!` });
        setTabIndex(1);
      } else {
        setStatus({ type: 'info', message: 'Tất cả video hợp lệ trong Playlist đều đã tồn tại trong hệ thống.' });
      }
      setBulkYoutubeUrl('');
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Lỗi khi lấy dữ liệu Playlist' });
    } finally {
      setIsBulkFetching(false);
      setBulkProgress({ total: 0, current: 0 });
    }
  };

  // Draft Actions (No direct commit)
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setStatus({ type: 'error', message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
      setIsAuthenticated(false);
      return;
    }

    const isEdit = !!formData.id;
    const projectToSave: any = {
      ...formData,
      id: isEdit ? formData.id : Date.now().toString(),
      teamMembers: formData.teamMembers.split('\n').map(m => m.trim()).filter(m => m),
      techTags: formData.techTags,
    };
    if (!isEdit) { projectToSave.isNewItem = true; projectToSave.userCreate = currentUser?.username; }
    else if ((formData as any).isNewItem) projectToSave.isNewItem = true;

    setProjectsList(prev => isEdit ? prev.map(p => p.id === formData.id ? projectToSave : p) : [projectToSave, ...prev]);
    setStatus({ type: 'success', message: `Đã lưu nháp dự án ${isEdit ? '(Cập nhật)' : '(Mới)'}!` });
    resetForm();
    if (!isEdit) setTabIndex(1);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', thumbnail: '', youtubeUrl: '', category: '', teamMembers: '', semester: '', techTags: [] as string[], isGoldenTicket: false, major: '' });
    setYoutubeUrl('');
  };

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setStatus({ type: 'error', message: 'Phiên đăng nhập không hợp lệ.' });
      return;
    }
    const isEdit = !!articleFormData.id;
    const articleToSave: any = {
      ...articleFormData,
      id: isEdit ? articleFormData.id : Date.now().toString(),
    };
    if (!isEdit) articleToSave.userCreate = currentUser?.username;
    setArticlesList(prev => isEdit ? prev.map(a => a.id === articleFormData.id ? articleToSave : a) : [articleToSave, ...prev]);
    setStatus({ type: 'success', message: `Đã lưu nháp bài viết ${isEdit ? '(Cập nhật)' : '(Mới)'}!` });
    resetArticleForm();
    if (!isEdit) setTabIndex(4);
  };

  const resetArticleForm = () => {
    setArticleFormData({ id: '', title: '', imageUrl: '', link: '', type: '', major: '', year: '' });
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
  const handleArticleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setArticlesList((items) => {
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

  const handleInlineEditProject = (id: string, field: string, value: string) => {
    setProjectsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleInlineEditArticle = (id: string, field: string, value: string) => {
    setArticlesList(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleInlineEditUnityAsset = (id: string, field: string, value: string) => {
    setUnityAssetsList(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleUnityAssetDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setUnityAssetsList((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleInlineAssetImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, assetId: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingImage(true);
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `asset_${Date.now()}.${ext}`;
        const res = await fetch(`${import.meta.env.VITE_WORKER_URL || 'https://unifolio-backend.nguyendinhteki.workers.dev'}/api/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser?.username, password: loginPassword, path: `public/assets/${fileName}`, message: `Upload image for asset ${fileName} [skip ci]`, content: base64Content, branch: 'main' })
        });
        if (!res.ok) throw new Error('Không thể upload ảnh');
        setUnityAssetsList(prev => prev.map(a => a.id === assetId ? { ...a, imageUrl: getAssetImagePath(fileName) } : a));
        setStatus({ type: 'success', message: 'Upload ảnh thành công!' });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Lỗi upload ảnh.' });
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Categories Draft Actions
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const colors = generateCategoryColors();
    const newCat: any = { id: Date.now().toString(), name: newCategoryName.trim(), userCreate: currentUser?.username, ...colors };
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
    const newMajor: any = { id: Date.now().toString(), name: newMajorName.trim(), userCreate: currentUser?.username, ...colors };
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

  // Asset Sources Draft Actions
  const [newAssetSourceName, setNewAssetSourceName] = useState('');
  const [assetSourceToDelete, setAssetSourceToDelete] = useState<string | null>(null);
  const [selectedAssetSources, setSelectedAssetSources] = useState<string[]>([]);
  const [bulkDeleteAssetSourcesConfirm, setBulkDeleteAssetSourcesConfirm] = useState(false);

  const handleAddAssetSource = () => {
    if (!newAssetSourceName.trim()) return;
    const colors = generateCategoryColors();
    const newSource: any = { id: Date.now().toString(), name: newAssetSourceName.trim(), userCreate: currentUser?.username, ...colors };
    setAssetSourcesList(prev => [...prev, newSource]);
    setNewAssetSourceName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp Nguồn Asset mới!' });
  };

  const confirmDeleteAssetSourceHandler = () => {
    if (!assetSourceToDelete) return;
    setAssetSourcesList(prev => prev.filter(c => c.id !== assetSourceToDelete));
    setAssetSourceToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá Nguồn Asset khỏi bản nháp.' });
  };

  const confirmBulkDeleteAssetSourcesAction = () => {
    if (selectedAssetSources.length === 0) return;
    setAssetSourcesList(prev => prev.filter(c => !selectedAssetSources.includes(c.id)));
    setSelectedAssetSources([]);
    setBulkDeleteAssetSourcesConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedAssetSources.length} Nguồn Asset.` });
  };

  const handleToggleAssetSource = (id: string) => setSelectedAssetSources(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllAssetSources = () => setSelectedAssetSources(selectedAssetSources.length === assetSourcesList.length ? [] : assetSourcesList.map(c => c.id));

  const handleMoveAssetSource = (index: number, direction: 'up' | 'down') => {
    setAssetSourcesList(prev => moveItem(prev, index, direction));
  };

  // Asset Types Draft Actions
  const [newAssetTypeName, setNewAssetTypeName] = useState('');
  const [assetTypeToDelete, setAssetTypeToDelete] = useState<string | null>(null);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>([]);
  const [bulkDeleteAssetTypesConfirm, setBulkDeleteAssetTypesConfirm] = useState(false);

  const handleAddAssetType = () => {
    if (!newAssetTypeName.trim()) return;
    const colors = generateCategoryColors();
    const newType: any = { id: Date.now().toString(), name: newAssetTypeName.trim(), userCreate: currentUser?.username, ...colors };
    setAssetTypesList(prev => [...prev, newType]);
    setNewAssetTypeName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp Loại Asset mới!' });
  };

  const confirmDeleteAssetTypeHandler = () => {
    if (!assetTypeToDelete) return;
    setAssetTypesList(prev => prev.filter(c => c.id !== assetTypeToDelete));
    setAssetTypeToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá Loại Asset khỏi bản nháp.' });
  };

  const confirmBulkDeleteAssetTypesAction = () => {
    if (selectedAssetTypes.length === 0) return;
    setAssetTypesList(prev => prev.filter(c => !selectedAssetTypes.includes(c.id)));
    setSelectedAssetTypes([]);
    setBulkDeleteAssetTypesConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedAssetTypes.length} Loại Asset.` });
  };

  const handleToggleAssetType = (id: string) => setSelectedAssetTypes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleToggleAllAssetTypes = () => setSelectedAssetTypes(selectedAssetTypes.length === assetTypesList.length ? [] : assetTypesList.map(c => c.id));

  const handleMoveAssetType = (index: number, direction: 'up' | 'down') => {
    setAssetTypesList(prev => moveItem(prev, index, direction));
  };

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
      setFormData(prev => ({ ...prev, techTags: text.split(',').map((t: string) => t.trim()).filter((t: string) => t) }));
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
    const newCat: any = { id: Date.now().toString(), name: newArticleTypeName.trim(), userCreate: currentUser?.username, ...colors };
    setArticleTypesList(prev => [...prev, newCat]);
    setNewArticleTypeName('');
    setStatus({ type: 'success', message: 'Đã lưu nháp loại bài viết mới!' });
  };

  const [editCategoryItem, setEditCategoryItem] = useState<any>(null);

  const handleSaveCategoryEdit = () => {
    if (!editCategoryItem) return;
    if (editCategoryItem.type === 'category') {
      setCategoriesList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    } else if (editCategoryItem.type === 'major') {
      setMajorsList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    } else if (editCategoryItem.type === 'articleType') {
      setArticleTypesList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
    } else if (editCategoryItem.type === 'assetType') {
      setAssetTypesList(prev => prev.map(c => c.id === editCategoryItem.id ? editCategoryItem : c));
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

  const handleExportUnityAssetsTemplate = () => {
    const data = unityAssetsList.map(a => {
      const matchedType = assetTypesList.find(t => String(t.id) === String(a.assetType));
      const matchedSource = assetSourcesList.find(s => String(s.id) === String(a.sourceId));
      return {
        'ID (Không sửa)': a.id,
        'Tên Tài Nguyên (*)': a.name,
        'Mô Tả': a.description || '',
        'Link Ảnh': a.imageUrl || '',
        'Loại (Tên)': matchedType?.name || '',
        'Loại (Mã)': a.assetType || '',
        'Nguồn (Tên)': matchedSource?.name || '',
        'Nguồn (Mã)': a.sourceId || '',
        'Link Gốc': a.originalLink || '',
        'Link Drive': a.driveLink || '',
        'Tác Giả': a.owner || '',
        'Ngày Tạo': a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{
      'ID (Không sửa)': '',
      'Tên Tài Nguyên (*)': 'Mẫu Tài Nguyên',
      'Mô Tả': '',
      'Link Ảnh': '',
      'Loại (Tên)': '',
      'Loại (Mã)': '',
      'Nguồn (Tên)': '',
      'Nguồn (Mã)': '',
      'Link Gốc': '',
      'Link Drive': '',
      'Tác Giả': '',
      'Ngày Tạo': ''
    }]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UnityAssets');
    
    // Tạo sheet hướng dẫn
    const instructions = [
      { 'Tên Cột': 'ID (Không sửa)', 'Hướng dẫn': 'Bắt buộc để cập nhật. Nếu bỏ trống sẽ tạo mới' },
      { 'Tên Cột': 'Tên Tài Nguyên (*)', 'Hướng dẫn': 'Bắt buộc' },
      { 'Tên Cột': 'Loại (Mã) HOẶC Loại (Tên)', 'Hướng dẫn': 'Chỉ điền MÃ hoặc TÊN LOẠI. Hệ thống tự động nhận diện' },
      { 'Tên Cột': 'Nguồn (Mã) HOẶC Nguồn (Tên)', 'Hướng dẫn': 'Chỉ điền MÃ hoặc TÊN NGUỒN. Hệ thống tự động nhận diện' }
    ];
    instructions.push({ 'Tên Cột': '', 'Hướng dẫn': '' });
    instructions.push({ 'Tên Cột': '--- MÃ LOẠI ---', 'Hướng dẫn': '--- TÊN LOẠI ---' });
    assetTypesList.forEach(t => instructions.push({ 'Tên Cột': t.id, 'Hướng dẫn': t.name }));
    instructions.push({ 'Tên Cột': '', 'Hướng dẫn': '' });
    instructions.push({ 'Tên Cột': '--- MÃ NGUỒN ---', 'Hướng dẫn': '--- TÊN NGUỒN ---' });
    assetSourcesList.forEach(s => instructions.push({ 'Tên Cột': s.id, 'Hướng dẫn': s.name }));

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'HuongDan');

    XLSX.writeFile(wb, `KHO_TAI_NGUYEN_${Date.now()}.xlsx`);
  };

  const confirmDeleteUnityAssetHandler = () => {
    if (!unityAssetToDelete) return;
    setUnityAssetsList(prev => prev.filter(c => c.id !== unityAssetToDelete));
    setUnityAssetToDelete(null);
    setStatus({ type: 'info', message: 'Đã xoá tài nguyên khỏi bản nháp.' });
  };

  const confirmBulkDeleteUnityAssetsAction = () => {
    if (selectedUnityAssets.length === 0) return;
    setUnityAssetsList(prev => prev.filter(c => !selectedUnityAssets.includes(c.id)));
    setSelectedUnityAssets([]);
    setBulkDeleteUnityAssetsConfirm(false);
    setStatus({ type: 'info', message: `Đã xoá nháp ${selectedUnityAssets.length} tài nguyên.` });
  };

  const handleMoveArticleType = (index: number, direction: 'up' | 'down') => {
    setArticleTypesList(prev => moveItem(prev, index, direction));
  };

  const handleImportUnityAssetsExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const importedData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        if (!importedData || importedData.length === 0) {
          setStatus({ type: 'error', message: 'File Excel không có dữ liệu!' });
          return;
        }

        const validAssets = importedData.map(row => {
          const id = row.id || row['ID (Không sửa)'];
          const name = row.name || row['Tên Tài Nguyên (*)'];
          const description = row.description || row['Mô Tả'];
          const imageUrl = row.imageUrl || row['Link Ảnh'];
          let assetType = row.assetType || row['Loại (Mã)'] || row['Loại (Tên)'];
          let sourceId = row.sourceId || row['Nguồn (Mã)'] || row['Nguồn (Tên)'];
          const originalLink = row.originalLink || row['Link Gốc'];
          const driveLink = row.driveLink || row['Link Drive'];
          const owner = row.owner || row['Tác Giả'];
          const dateVal = row.createdAt || row['Ngày Tạo'];

          // Xử lý ngược từ tên thành ID nếu người dùng nhập tên thay vì mã
          if (assetType && isNaN(Number(assetType)) && assetType.length < 13) {
             const found = assetTypesList.find(t => t.name.toLowerCase() === String(assetType).toLowerCase());
             if (found) assetType = found.id;
          }
          if (sourceId && isNaN(Number(sourceId)) && sourceId.length < 13) {
             const found = assetSourcesList.find(s => s.name.toLowerCase() === String(sourceId).toLowerCase());
             if (found) sourceId = found.id;
          }

          let parsedDate;
          if (dateVal) {
            if (typeof dateVal === 'number') {
              if (dateVal < 100000) parsedDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000)).getTime();
              else parsedDate = dateVal;
            } else {
              // Parse từ string DD/MM/YYYY hh:mm:ss
              const parts = String(dateVal).split(/[\s/:]+/);
              if (parts.length >= 3) {
                 const day = parseInt(parts[0], 10);
                 const month = parseInt(parts[1], 10) - 1;
                 const year = parseInt(parts[2], 10);
                 const d = new Date(year, month, day);
                 if (!isNaN(d.getTime())) parsedDate = d.getTime();
              } else {
                 const d = new Date(dateVal).getTime();
                 if (!isNaN(d)) parsedDate = d;
              }
            }
          }

          return {
            id: id || `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name || 'Untitled Asset',
            description: description || '',
            imageUrl: imageUrl || '',
            assetType: String(assetType || ''),
            originalLink: originalLink || '',
            driveLink: driveLink || '',
            owner: owner || '',
            sourceId: String(sourceId || ''),
            createdAt: parsedDate
          };
        });

        setUnityAssetsList(prev => {
          const map = new Map();
          prev.forEach(item => map.set(item.id, item));
          validAssets.forEach(item => {
            const existing = map.get(item.id);
            map.set(item.id, { ...item, createdAt: item.createdAt || existing?.createdAt || Date.now() });
          });
          return Array.from(map.values()).sort((a, b) => {
            const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });
        });

        setStatus({ type: 'success', message: `Nhập thành công ${validAssets.length} tài nguyên. Vui lòng bấm 'Lưu Lên GitHub' để hoàn tất.` });
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: 'Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng!' });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const autoMergeData = (remoteData: any[], localData: any[]) => {
    const map = new Map();
    remoteData.forEach(item => map.set(item.id, item));
    localData.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  // Global Save
  const saveAllChangesToGithub = async (projectsOverride?: any[]) => {
    if (fetchError) {
      setStatus({ type: 'error', message: 'Hệ thống đang lỗi tải dữ liệu. Không thể lưu để bảo vệ dữ liệu cũ.' });
      return;
    }
    if (!currentUser) {
      setStatus({ type: 'error', message: 'Cấu hình tài khoản chưa hợp lệ.' });
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
      if (isProjectsChanged || projectsOverride) {
        const finalProjects = (projectsOverride || projectsList).map(p => {
          const { isNewItem, ...rest } = p;
          if (typeof rest.teamMembers === 'string') {
            rest.teamMembers = (rest.teamMembers as string).split('\n').map(m => m.trim()).filter(Boolean);
          }
          if (typeof rest.techTags === 'string') {
            rest.techTags = (rest.techTags as string).split(',').map(t => t.trim()).filter(Boolean);
          }
          return rest;
        });
        const newSha = await commitFile(getProjectsApiUrl(), finalProjects, projectsSha, `Update projects (Bulk save) [skip ci]`);
        setOriginalProjects(finalProjects);
        setProjectsList(finalProjects);
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
      if (isUnityAssetsChanged) {
        const sortedAssets = [...unityAssetsList].sort((a, b) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        const newSha = await commitFile(getUnityAssetsApiUrl(), sortedAssets, unityAssetsSha, `Update unity assets (Bulk save) [skip ci]`);
        setOriginalUnityAssets(sortedAssets);
        setUnityAssetsList(sortedAssets);
        setUnityAssetsSha(newSha);
        successCount++;
      }
      if (isAssetSourcesChanged) {
        const newSha = await commitFile(getAssetSourcesApiUrl(), assetSourcesList, assetSourcesSha, `Update asset sources (Bulk save) [skip ci]`);
        setOriginalAssetSources(assetSourcesList);
        setAssetSourcesSha(newSha);
        successCount++;
      }
      if (isAssetTypesChanged) {
        const newSha = await commitFile(getAssetTypesApiUrl(), assetTypesList, assetTypesSha, `Update asset types (Bulk save) [skip ci]`);
        setOriginalAssetTypes(assetTypesList);
        setAssetTypesSha(newSha);
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
          if (isUnityAssetsChanged) {
            const remote = await fetchFile(getUnityAssetsApiUrl());
            const merged = autoMergeData(remote.data, unityAssetsList);
            const newSha = await commitFile(getUnityAssetsApiUrl(), merged, remote.sha, `Merge & Update unity assets [skip ci]`);
            setUnityAssetsList(merged); setOriginalUnityAssets(merged); setUnityAssetsSha(newSha);
          }
          if (isAssetSourcesChanged) {
            const remote = await fetchFile(getAssetSourcesApiUrl());
            const merged = autoMergeData(remote.data, assetSourcesList);
            const newSha = await commitFile(getAssetSourcesApiUrl(), merged, remote.sha, `Merge & Update asset sources [skip ci]`);
            setAssetSourcesList(merged); setOriginalAssetSources(merged); setAssetSourcesSha(newSha);
          }
          if (isAssetTypesChanged) {
            const remote = await fetchFile(getAssetTypesApiUrl());
            const merged = autoMergeData(remote.data, assetTypesList);
            const newSha = await commitFile(getAssetTypesApiUrl(), merged, remote.sha, `Merge & Update asset types [skip ci]`);
            setAssetTypesList(merged); setOriginalAssetTypes(merged); setAssetTypesSha(newSha);
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

  
  const fetchDriveCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access`, {
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveAccessCodes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCodes(false);
    }
  };

  const fetchDriveRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/requests`, {
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveAccessRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async () => {
    try {
      const asset = unityAssetsList.find(a => a.id === approveFormData.resourceId);
      if (!asset) {
        setStatus({ type: 'error', message: 'Không tìm thấy tài nguyên' });
        return;
      }
      const res = await fetch(`${WORKER_URL}/api/drive-access/requests/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` },
        body: JSON.stringify({
          id: approveFormData.id,
          durationDays: approveFormData.durationDays,
          maxUses: approveFormData.maxUses,
          driveLink: asset.driveLink
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Đã duyệt yêu cầu và gửi mã bảo vệ thành công' });
        setApproveFormData({ ...approveFormData, open: false });
        fetchDriveRequests();
        fetchDriveCodes();
      } else {
        setStatus({ type: 'error', message: 'Lỗi khi duyệt yêu cầu' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Lỗi mạng' });
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) return;
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/requests/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setStatus({ type: 'info', message: 'Đã từ chối yêu cầu và thông báo cho sinh viên' });
        fetchDriveRequests();
      } else {
        setStatus({ type: 'error', message: 'Lỗi khi từ chối yêu cầu' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Lỗi mạng' });
    }
  };

  const fetchDriveLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/logs`, {
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveAccessLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (tabIndex === 14 && currentUser) {
      fetchDriveCodes();
      fetchDriveLogs();
    }
  }, [tabIndex]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeFormData.resourceId || !codeFormData.email) return;
    
    // Find resource name and driveLink for better display
    let rName = 'N/A';
    let rDriveLink = codeFormData.driveLink;
    const targetAsset = unityAssetsList.find(a => a.id === codeFormData.resourceId);
    if (targetAsset) {
      rName = targetAsset.name;
      if (!rDriveLink && targetAsset.driveLink) rDriveLink = targetAsset.driveLink;
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` 
        },
        body: JSON.stringify({ 
          resourceId: codeFormData.resourceId,
          email: codeFormData.email,
          durationDays: codeFormData.durationDays,
          maxUses: codeFormData.maxUses || null,
          resourceName: rName,
          driveLink: rDriveLink
        })
      });
      if (!res.ok) throw new Error('Lỗi tạo mã');
      const data = await res.json();
      setDriveAccessCodes(data);
      setStatus({ type: 'success', message: 'Tạo mã thành công!' });
      setCodeFormData({ resourceId: '', email: '', durationDays: 1, maxUses: 0, driveLink: '' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa/thu hồi mã này?')) return;
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (!res.ok) throw new Error('Lỗi xóa mã');
      const data = await res.json();
      setDriveAccessCodes(data);
      setStatus({ type: 'success', message: 'Đã thu hồi mã thành công!' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    }
  };

  const handleManualBuild = async () => {
    if (!currentUser) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để thực hiện.' });
      return;
    }
    try {
      setIsTriggeringBuild(true);
      setStatus({ type: 'info', message: 'Đang gửi yêu cầu Build Sitemap...' });
      const remote = await fetchFile(getTriggerApiUrl());
      await commitFile(getTriggerApiUrl(), [{ timestamp: Date.now() }], remote.sha, 'Manual trigger sitemap build');
      setStatus({ type: 'success', message: 'Đã gửi lệnh cập nhật Sitemap! Quá trình build sẽ mất khoảng 1-2 phút.' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Lỗi khi gửi yêu cầu Build: ' + err.message });
    } finally {
      setIsTriggeringBuild(false);
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

  const handleUpdateClick = () => {
    if (isProjectsChanged) {
      const sorted = [...projectsList].sort((a, b) => compareSemesters(a.semester || '', b.semester || ''));
      setSortedProjectsPreview(sorted);
      setShowSortPreview(true);
    } else {
      saveAllChangesToGithub();
    }
  };

  const handleDragEndPreview = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSortedProjectsPreview((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };


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
              Đăng <span style={{ color: muiTheme.palette.primary.main }}> nhập</span>
            </Typography>
            <Typography color="text.secondary">Vui lòng cung cấp thông tin để tiếp tục.</Typography>
          </Box>

          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <form onSubmit={handleLogin}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Tên đăng nhập" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Mật khẩu" type={showPassword ? 'text' : 'password'} required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '1rem', py: 1.5, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)' }}>
                    Truy cập Quản trị
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
      <Helmet>
        <title>Quản trị nội dung | UniFolio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
            <Button variant="contained" color="warning" onClick={handleUpdateClick} disabled={isSavingAll || !!fetchError} startIcon={isSavingAll ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />} sx={{ borderRadius: 100, fontWeight: 700, px: 3, '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
              {isSavingAll ? 'Đang Gửi...' : 'Lưu Lên GitHub'}
            </Button>
            <Button variant="contained" color="info" onClick={handleManualBuild} disabled={isTriggeringBuild || isSavingAll || !!fetchError} startIcon={isTriggeringBuild ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />} sx={{ borderRadius: 100, fontWeight: 700, px: 3, display: { xs: 'none', md: 'flex' } }}>
              Build Sitemap
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
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quản trị nội dung</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Hệ Thống <span style={{ color: muiTheme.palette.primary.main }}>Quản Lý</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 100, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Xin chào, <span style={{ color: '#2563EB', fontWeight: 800 }}>{currentUser?.username}</span></Typography>
            </Box>
            <Button variant="outlined" color="primary" onClick={() => { setChangePasswordOpen(true); setProfileEmail(currentUser?.email || ''); setNewPassword(''); setConfirmNewPassword(''); }} sx={{ borderRadius: 100, fontWeight: 700, px: 2 }}>
              Hồ Sơ Của Tôi
            </Button>
            <Button variant="outlined" color="info" onClick={handleManualBuild} disabled={isTriggeringBuild || isSavingAll || !!fetchError} startIcon={isTriggeringBuild ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />} sx={{ borderRadius: 100, fontWeight: 700, px: 2 }}>
              Cập Nhật Sitemap
            </Button>
            <IconButton onClick={handleLogout} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.light' } }} title="Đăng xuất">
              <LogoutIcon />
            </IconButton>
          </Box>
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

              {hasPerm('projects', 'view') && <>
              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'primary.main', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <FolderIcon fontSize="small" /> NHÓM DỰ ÁN
              </ListSubheader>
              <ListItemButton selected={tabIndex === 1} onClick={() => setTabIndex(1)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 1 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Dự Án</Typography>} />
              </ListItemButton>
              {hasPerm('projects', 'add') && <ListItemButton selected={tabIndex === 0} onClick={() => setTabIndex(0)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 0 ? 700 : 500, fontSize: '0.9rem' }}>{formData.id ? "Sửa Dự Án" : "Thêm Dự Án"}</Typography>} />
              </ListItemButton>}
              <ListItemButton selected={tabIndex === 2} onClick={() => setTabIndex(2)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 2 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Loại Dự Án</Typography>} />
              </ListItemButton>
              </>}

              {hasPerm('articles', 'view') && <>
              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'secondary.main', fontSize: '0.75rem', letterSpacing: '0.05em', mt: 1 }}>
                <ArticleIcon fontSize="small" /> NHÓM BÀI VIẾT
              </ListSubheader>
              <ListItemButton selected={tabIndex === 4} onClick={() => setTabIndex(4)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 4 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Bài Viết</Typography>} />
              </ListItemButton>
              {hasPerm('articles', 'add') && <ListItemButton selected={tabIndex === 3} onClick={() => setTabIndex(3)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 3 ? 700 : 500, fontSize: '0.9rem' }}>{articleFormData.id ? "Sửa Bài Viết" : "Thêm Bài Viết"}</Typography>} />
              </ListItemButton>}
              <ListItemButton selected={tabIndex === 6} onClick={() => setTabIndex(6)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 6 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Loại Bài Viết</Typography>} />
              </ListItemButton>
              </>}

              {hasPerm('assets', 'view') && <>
              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'success.main', fontSize: '0.75rem', letterSpacing: '0.05em', mt: 1 }}>
                <AutoAwesomeIcon fontSize="small" /> TÀI NGUYÊN (ASSETS)
              </ListSubheader>
              {hasPerm('driveAccess', 'view') && <ListItemButton selected={tabIndex === 14} onClick={() => { setTabIndex(14); fetchDriveCodes(); fetchDriveLogs(); }} sx={{ mt: 1, mb: 1, bgcolor: tabIndex === 14 ? 'primary.main' : 'rgba(168, 85, 247, 0.05)', borderRadius: 3, '&:hover': { bgcolor: tabIndex === 14 ? 'primary.dark' : 'rgba(168, 85, 247, 0.15)' } }}>
                <ListItemIcon sx={{ minWidth: 32 }}><VpnKeyIcon fontSize="small" sx={{ color: tabIndex === 14 ? '#fff' : '#A855F7' }} /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 14 ? 700 : 500, fontSize: '0.9rem', color: tabIndex === 14 ? '#fff' : 'inherit' }}>Mã Bảo Vệ Drive</Typography>} />
              </ListItemButton>}
              {hasPerm('driveAccess', 'view') && <ListItemButton selected={tabIndex === 15} onClick={() => { setTabIndex(15); fetchDriveRequests(); }} sx={{ mb: 1, bgcolor: tabIndex === 15 ? 'warning.main' : 'rgba(245, 158, 11, 0.05)', borderRadius: 3, '&:hover': { bgcolor: tabIndex === 15 ? 'warning.dark' : 'rgba(245, 158, 11, 0.15)' } }}>
                <ListItemIcon sx={{ minWidth: 32 }}><SendIcon fontSize="small" sx={{ color: tabIndex === 15 ? '#fff' : '#F59E0B' }} /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 15 ? 700 : 500, fontSize: '0.9rem', color: tabIndex === 15 ? '#fff' : 'inherit' }}>Quản Lý Yêu Cầu {driveAccessRequests.filter(r => r.status === 'pending').length > 0 && <span style={{ background: '#fff', color: '#F59E0B', borderRadius: '50%', padding: '2px 8px', marginLeft: 8, fontSize: '0.8rem', fontWeight: 900 }}>{driveAccessRequests.filter(r => r.status === 'pending').length}</span>}</Typography>} />
              </ListItemButton>}
              <ListItemButton selected={tabIndex === 9} onClick={() => setTabIndex(9)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 9 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Tài Nguyên</Typography>} />
              </ListItemButton>
              {hasPerm('assets', 'add') && <ListItemButton selected={tabIndex === 10} onClick={() => setTabIndex(10)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 10 ? 700 : 500, fontSize: '0.9rem' }}>{unityAssetFormData.id ? "Sửa Tài Nguyên" : "Thêm Tài Nguyên"}</Typography>} />
              </ListItemButton>}
              <ListItemButton selected={tabIndex === 11} onClick={() => setTabIndex(11)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 11 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Nguồn Tài Nguyên</Typography>} />
              </ListItemButton>
              <ListItemButton selected={tabIndex === 12} onClick={() => setTabIndex(12)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 12 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Hình Thức Sở Hữu</Typography>} />
              </ListItemButton>
              </>}

              <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'transparent', lineHeight: '36px', fontWeight: 800, color: 'info.main', fontSize: '0.75rem', letterSpacing: '0.05em', mt: 1 }}>
                <SettingsIcon fontSize="small" /> QUẢN LÝ CHUNG
              </ListSubheader>

              <ListItemButton selected={tabIndex === 5} onClick={() => setTabIndex(5)}>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 5 ? 700 : 500, fontSize: '0.9rem' }}>Quản Lý Chuyên Ngành</Typography>} />
              </ListItemButton>
              {currentUser?.role === 'SUPERADMIN' && (
                <ListItemButton selected={tabIndex === 13} onClick={() => setTabIndex(13)} sx={{ mt: 1, bgcolor: tabIndex === 13 ? 'rgba(239, 68, 68, 0.15)' : 'transparent', borderRadius: 3, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><LockIcon fontSize="small" sx={{ color: tabIndex === 13 ? '#ef4444' : 'inherit' }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 13 ? 700 : 500, fontSize: '0.9rem', color: tabIndex === 13 ? '#ef4444' : 'inherit' }}>Tài Khoản (MOD)</Typography>} />
                </ListItemButton>
              )}
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
                
                {/* 1. Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#1E3A8A', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <FolderIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <FolderIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TỔNG DỰ ÁN</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{projectsList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)', color: '#6B21A8', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <ArticleIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <ArticleIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TỔNG BÀI VIẾT</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{articlesList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#065F46', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <AutoAwesomeIcon sx={{ position: 'absolute', right: -16, bottom: -16, fontSize: 120, opacity: 0.08, transform: 'rotate(-15deg)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                          <AutoAwesomeIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>TỔNG TÀI NGUYÊN</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{unityAssetsList.length}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
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
                </Grid>

                {/* 2. Detailed Distribution Sections */}
                <Grid container spacing={3}>
                  {/* Row 1: Phân Bổ Theo Chuyên Ngành (Full width grid) */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><SchoolIcon color="primary" /> Phân Bổ Theo Chuyên Ngành</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                      {majorsList.length === 0 ? (
                        <Typography color="text.secondary">Chưa có dữ liệu chuyên ngành.</Typography>
                      ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
                          {majorsList.map(major => {
                            const pCount = projectsList.filter(p => p.major === major.id).length;
                            const aCount = articlesList.filter(a => a.major === major.id).length;
                            const totalItems = projectsList.length + articlesList.length;
                            const pPercentage = totalItems > 0 ? (pCount / totalItems) * 100 : 0;
                            const aPercentage = totalItems > 0 ? (aCount / totalItems) * 100 : 0;
                            return (
                              <Box key={major.id} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>{major.name}</Typography>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.secondary' }}>Dự án: {pCount} | Bài viết: {aCount}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', height: 12, borderRadius: 10, overflow: 'hidden', bgcolor: 'action.hover' }}>
                                  <Box sx={{ width: `${pPercentage}%`, bgcolor: major.bg !== 'transparent' ? major.bg : 'primary.main', transition: 'width 1s ease-in-out' }} />
                                  <Box sx={{ width: `${aPercentage}%`, bgcolor: major.text !== 'transparent' ? major.text : 'secondary.main', transition: 'width 1s ease-in-out', opacity: 0.7 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Row 2: Categories and Article Types */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><CategoryIcon color="info" /> Phân Loại Dự Án</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      {categoriesList.length === 0 ? <Typography color="text.secondary">Chưa có phân loại dự án.</Typography> : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {categoriesList.map(cat => {
                            const count = projectsList.filter(p => p.category === cat.id).length;
                            const percentage = projectsList.length > 0 ? (count / projectsList.length) * 100 : 0;
                            return (
                              <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 100, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{cat.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: cat.bg !== 'transparent' ? cat.bg : 'info.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 24, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><ArticleIcon color="secondary" /> Loại Bài Viết</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      {articleTypesList.length === 0 ? <Typography color="text.secondary">Chưa có loại bài viết.</Typography> : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {articleTypesList.map(type => {
                            const count = articlesList.filter(a => a.type === type.id).length;
                            const percentage = articlesList.length > 0 ? (count / articlesList.length) * 100 : 0;
                            return (
                              <Box key={type.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 100, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{type.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: type.bg !== 'transparent' ? type.bg : 'secondary.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 24, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Row 3: Unity Assets */}
                  <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><StorageIcon color="success" /> Cơ Cấu Tài Nguyên</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Nguồn</Typography>
                          {assetSourcesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {assetSourcesList.map(src => {
                                const count = unityAssetsList.filter(a => a.sourceId === src.id).length;
                                return (
                                  <Box key={src.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{src.name}</Typography>
                                    <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: 'action.selected' }} />
                                  </Box>
                                )
                              })}
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Loại</Typography>
                          {assetTypesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {assetTypesList.map(type => {
                                const count = unityAssetsList.filter(a => a.assetType === type.id).length;
                                return (
                                  <Box key={type.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: type.text }}>{type.name}</Typography>
                                    <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: type.bg, color: type.text }} />
                                  </Box>
                                )
                              })}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>

              </Box>
            )}

            {/* Tab 13: MOD Account */}
            {tabIndex === 13 && (
              <Box sx={{ animation: 'fadeIn 0.3s' }}>
                <UserManagement workerUrl={WORKER_URL} currentUser={currentUser} />
              </Box>
            )}

            {/* Tab 14: Mã Bảo Vệ Drive */}
            {tabIndex === 14 && (
              <Box>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Mã Bảo Vệ Drive</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={() => { fetchDriveLogs(); }} disabled={loadingLogs} sx={{ borderRadius: 2, fontWeight: 600 }}>Làm mới Log</Button>
                    <Button variant="contained" onClick={() => { fetchDriveCodes(); fetchDriveLogs(); }} disabled={loadingCodes} startIcon={loadingCodes ? <CircularProgress size={20} /> : <AutoAwesomeIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>Làm Mới</Button>
                  </Box>
                </Box>

                {/* Tabs: Danh sách mã / Log truy cập */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0 }}>
                    {['Danh sách mã bảo vệ', 'Lịch sử truy cập'].map((label, idx) => (
                      <Button key={idx} onClick={() => setLogTabValue(idx)} variant={logTabValue === idx ? 'contained' : 'text'} sx={{ borderRadius: 0, borderBottom: logTabValue === idx ? '2px solid' : '2px solid transparent', fontWeight: logTabValue === idx ? 700 : 500, px: 3 }}>{label}</Button>
                    ))}
                  </Box>
                </Box>

                {logTabValue === 0 && (
                  <Box>
                    {/* Form cấp mã mới */}
                    {hasPerm('driveAccess', 'add') && (
                      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Cấp mã mới</Typography>
                      <form onSubmit={handleGenerateCode}>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                              options={unityAssetsList.filter(a => a.driveLink && (currentUser?.role === 'SUPERADMIN' || a.userCreate === currentUser?.username))}
                              getOptionLabel={(option) => option.name}
                              onChange={(_, val) => setCodeFormData({...codeFormData, resourceId: val ? val.id : '', driveLink: val?.driveLink || ''})}
                              renderInput={(params) => <TextField {...params} label="Chọn tài nguyên" required />}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Email người nhận" type="email" value={codeFormData.email} onChange={e => setCodeFormData({...codeFormData, email: e.target.value})} required />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                              <InputLabel>Thời hạn</InputLabel>
                              <Select value={codeFormData.durationDays} label="Thời hạn" onChange={e => setCodeFormData({...codeFormData, durationDays: Number(e.target.value)})}>
                                <MenuItem value={1}>24 giờ</MenuItem>
                                <MenuItem value={2}>2 ngày</MenuItem>
                                <MenuItem value={3}>3 ngày</MenuItem>
                                <MenuItem value={7}>7 ngày</MenuItem>
                                <MenuItem value={30}>30 ngày</MenuItem>
                                <MenuItem value={0}>Vĩnh viễn</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Số lượt" type="number" helperText="0 = Không giới hạn" value={codeFormData.maxUses} onChange={e => setCodeFormData({...codeFormData, maxUses: Number(e.target.value)})} slotProps={{ htmlInput: { min: 0 } }} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>Tạo Mã Bảo Vệ Link Drive</Button>
                          </Grid>
                        </Grid>
                      </form>
                    </Paper>
                    )}

                    {/* Bảng danh sách mã */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 1000 }}>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Tài Nguyên</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Mã Bảo Vệ</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Thời hạn</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Đã dùng / Giới hạn</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Link</TableCell>
                            {hasPerm('driveAccess', 'delete') && <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Xóa</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadingCodes ? (
                            <TableRow><TableCell colSpan={hasPerm('driveAccess', 'delete') ? 7 : 6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                          ) : driveAccessCodes.length === 0 ? (
                            <TableRow><TableCell colSpan={hasPerm('driveAccess', 'delete') ? 7 : 6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có mã bảo vệ nào.</TableCell></TableRow>
                          ) : (
                            driveAccessCodes.map((codeItem) => {
                              const isExpired = codeItem.expiresAt && Date.now() > codeItem.expiresAt;
                              const isMaxed = codeItem.maxUses && codeItem.usedCount >= codeItem.maxUses;
                              return (
                                <TableRow key={codeItem.id} sx={{ bgcolor: isExpired || isMaxed ? 'rgba(239,68,68,0.04)' : 'inherit' }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{codeItem.resourceName}</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: {codeItem.resourceId}</Typography>
                                  </TableCell>
                                  <TableCell><Typography variant="body2">{codeItem.email}</Typography></TableCell>
                                  <TableCell>
                                    <Chip label={codeItem.code} color={isExpired || isMaxed ? 'error' : 'primary'} variant="outlined" size="small" sx={{ fontWeight: 800, letterSpacing: 1 }} />
                                  </TableCell>
                                  <TableCell>
                                    {codeItem.expiresAt ? (
                                      <Typography variant="body2" color={isExpired ? 'error' : 'text.primary'} sx={{ fontSize: '0.8rem' }}>
                                        {new Date(codeItem.expiresAt).toLocaleString('vi-VN')}
                                        {isExpired && <Chip label="Hết hạn" color="error" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
                                      </Typography>
                                    ) : <Chip label="Vĩnh viễn" color="success" variant="outlined" size="small" />}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2" color={isMaxed ? 'error' : 'text.primary'} sx={{ fontWeight: 700 }}>
                                      {codeItem.usedCount || 0} / {codeItem.maxUses || '∞'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {codeItem.hasDriveLink ? <Chip label="Có" color="success" size="small" /> : <Chip label="Không" size="small" variant="outlined" />}
                                  </TableCell>
                                  {hasPerm('driveAccess', 'delete') && (
                                    <TableCell align="center">
                                      {hasPerm('driveAccess', 'delete', unityAssetsList.find(a => a.id === codeItem.resourceId)?.userCreate) && (
                                        <IconButton color="error" size="small" onClick={() => handleDeleteCode(codeItem.id)}><DeleteIcon fontSize="small" /></IconButton>
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {logTabValue === 1 && (
                  <Box>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 1000 }}>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Tài nguyên ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Mã (ẩn)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Kết quả</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Lý do</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadingLogs ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                          ) : driveAccessLogs.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có lịch sử nào.</TableCell></TableRow>
                          ) : (
                            driveAccessLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{new Date(log.time).toLocaleString('vi-VN')}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>{log.email}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{log.resourceId}</TableCell>
                                <TableCell><code style={{ fontSize: '0.8rem' }}>{log.code}</code></TableCell>
                                <TableCell align="center">
                                  <Chip label={log.success ? 'Thành công' : 'Thất bại'} color={log.success ? 'success' : 'error'} size="small" />
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {log.reason === 'OK' && 'Đúng mã'}
                                  {log.reason === 'WRONG_CODE' && 'Sai mã/email'}
                                  {log.reason === 'EXPIRED' && 'Hết hạn'}
                                  {log.reason === 'LOCKED' && '🔒 Bị khóa'}
                                  {log.reason === 'MAX_USES_REACHED' && 'Hết lượt dùng'}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{log.ip}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}


            {/* Tab 15: Quản Lý Yêu Cầu */}
          {tabIndex === 15 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#1e293b' }}>Quản Lý Yêu Cầu Truy Cập</Typography>
                  <Typography color="text.secondary">Duyệt hoặc từ chối các yêu cầu xin mã bảo vệ từ sinh viên.</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  <Button onClick={() => setReqTabValue(0)} variant={reqTabValue === 0 ? 'contained' : 'text'} color="warning" sx={{ borderRadius: 0, px: 3, fontWeight: reqTabValue === 0 ? 700 : 500 }}>Chờ duyệt</Button>
                  <Button onClick={() => setReqTabValue(1)} variant={reqTabValue === 1 ? 'contained' : 'text'} color="inherit" sx={{ borderRadius: 0, px: 3, fontWeight: reqTabValue === 1 ? 700 : 500, bgcolor: reqTabValue === 1 ? 'action.selected' : 'transparent' }}>Lịch sử</Button>
                </Box>
              </Box>
              
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Sinh Viên</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tài Nguyên</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Lý Do</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Thời Gian</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">{reqTabValue === 0 ? 'Thao Tác' : 'Trạng Thái'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingRequests ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                    ) : (reqTabValue === 0 ? driveAccessRequests.filter(r => r.status === 'pending') : driveAccessRequests.filter(r => r.status !== 'pending').sort((a, b) => (b.processedAt || 0) - (a.processedAt || 0))).length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>{reqTabValue === 0 ? 'Không có yêu cầu nào đang chờ duyệt.' : 'Chưa có lịch sử nào.'}</TableCell></TableRow>
                    ) : (
                      (reqTabValue === 0 ? driveAccessRequests.filter(r => r.status === 'pending') : driveAccessRequests.filter(r => r.status !== 'pending').sort((a, b) => (b.processedAt || 0) - (a.processedAt || 0))).map(req => {
                        const asset = unityAssetsList.find(a => a.id === req.resourceId);
                        return (
                        <TableRow key={req.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{req.name}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{req.studentId} - {req.school}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 600 }}>{req.email}</Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{req.resourceName}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{req.assetType}</Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 200, maxWidth: 350 }}>
                            <Typography sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{req.message}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', minWidth: 150 }}>
                            <Box>
                              Gửi: {new Date(req.createdAt).toLocaleString('vi-VN')}
                            </Box>
                            {req.processedAt && (
                              <Box sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.5 }}>
                                Xử lý: {new Date(req.processedAt).toLocaleString('vi-VN')}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {reqTabValue === 0 ? (
                              hasPerm('driveAccess', 'edit', asset?.userCreate) ? (
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <Button size="small" variant="contained" color="success" onClick={() => setApproveFormData({ id: req.id, resourceId: req.resourceId, durationDays: 1, maxUses: 0, open: true })} sx={{ borderRadius: 10, textTransform: 'none', fontWeight: 700 }}>
                                    Duyệt
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" onClick={() => handleRejectRequest(req.id)} sx={{ borderRadius: 10, textTransform: 'none', fontWeight: 700 }}>
                                    Từ chối
                                  </Button>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">Không có quyền thao tác</Typography>
                              )
                            ) : (
                              <Chip label={req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'} color={req.status === 'approved' ? 'success' : 'error'} size="small" sx={{ fontWeight: 700 }} />
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Approve Modal */}
              <Dialog open={approveFormData.open} onClose={() => setApproveFormData({ ...approveFormData, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 900 }}>Duyệt Yêu Cầu</DialogTitle>
                <DialogContent>
                  <Typography variant="body2" sx={{ mb: 3 }}>Hệ thống sẽ tự sinh mã bảo vệ ngẫu nhiên và gửi thẳng vào email của sinh viên.</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth type="number" label="Số ngày hiệu lực" value={approveFormData.durationDays} onChange={e => setApproveFormData({ ...approveFormData, durationDays: Number(e.target.value) })} helperText="0 = Vĩnh viễn" sx={{ mb: 2 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth type="number" label="Số lần sử dụng (Max Uses)" value={approveFormData.maxUses} onChange={e => setApproveFormData({ ...approveFormData, maxUses: Number(e.target.value) })} helperText="0 = Không giới hạn" />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                  <Button onClick={() => setApproveFormData({ ...approveFormData, open: false })} variant="outlined" sx={{ borderRadius: 10 }}>Huỷ</Button>
                  <Button onClick={handleApproveRequest} variant="contained" color="success" sx={{ borderRadius: 10, fontWeight: 700 }}>Xác nhận & Gửi Mail</Button>
                </DialogActions>
              </Dialog>
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

            {/* Tab 9: Unity Assets List */}
            {tabIndex === 9 && hasPerm('assets', 'view') && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Tài Nguyên</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportUnityAssetsExcel} />
                    <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={handleExportUnityAssetsTemplate} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>File Mẫu</Button>
                    <Button variant="outlined" color="info" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Nhập Excel</Button>
                    {selectedUnityAssets.length > 0 && hasPerm('assets', 'delete') && (
                      <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setBulkDeleteUnityAssetsConfirm(true)} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Xoá {selectedUnityAssets.length} mục</Button>
                    )}
                    {hasPerm('assets', 'add') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setUnityAssetFormData({ id: '', name: '', description: '', imageUrl: '', assetType: 'GOOGLE_DRIVE', originalLink: '', driveLink: '', owner: '' }); setTabIndex(10); }} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Thêm Tài Nguyên</Button>}
                  </Box>
                </Box>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                  {unityAssetsList.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có tài nguyên nào.</Typography></Box>
                  ) : (
                    <>
                      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField fullWidth size="small" placeholder="Tìm kiếm tài nguyên..." value={unityAssetsSearch} onChange={(e) => { setUnityAssetsSearch(e.target.value); setUnityAssetsPage(1); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><AutoAwesomeIcon fontSize="small" /></InputAdornment> } }} />
                        <FormControlLabel
                          control={<Checkbox checked={unityAssetsDriveFilter} onChange={(e) => { setUnityAssetsDriveFilter(e.target.checked); setUnityAssetsPage(1); }} size="small" />}
                          label={<Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Chỉ hiện có link Drive</Typography>}
                          sx={{ m: 0 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedUnityAssets.length > 0 && selectedUnityAssets.length === unityAssetsList.length} indeterminate={selectedUnityAssets.length > 0 && selectedUnityAssets.length < unityAssetsList.length} onChange={(e) => setSelectedUnityAssets(e.target.checked ? unityAssetsList.map(a => a.id) : [])} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                      </Box>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleUnityAssetDragEnd}>
                        <SortableContext items={unityAssetsList.map(a => a.id)} strategy={verticalListSortingStrategy}>
                          <List sx={{ p: 0 }}>
                            {(()=>{
                              const filtered = unityAssetsList.filter(a => {
                                if (unityAssetsSearch && !a.name.toLowerCase().includes(unityAssetsSearch.toLowerCase())) return false;
                                if (unityAssetsDriveFilter && !a.driveLink) return false;
                                return true;
                              });
                              const paginated = filtered.slice((unityAssetsPage - 1) * itemsPerPage, unityAssetsPage * itemsPerPage);
                              return paginated;
                            })().map((asset) => (
                              <Box key={asset.id} sx={{ px: 2, pt: 1.5, pb: 0 }}>
                                <SortableUnityAssetItem
                                  key={asset.id}
                                  canEdit={hasPerm('assets', 'edit', asset.userCreate)}
                                  canDelete={hasPerm('assets', 'delete', asset.userCreate)}
                                  asset={asset}
                                  assetTypesList={assetTypesList}
                                  assetSourcesList={assetSourcesList}
                                  isSelected={selectedUnityAssets.includes(asset.id)}
                                  onToggle={(id: string) => setSelectedUnityAssets(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                                  onInlineEdit={handleInlineEditUnityAsset}
                                  onDelete={(id: string) => setUnityAssetToDelete(id)}
                                  onImageUpload={handleInlineAssetImageUpload}
                                  isUploadingImage={isUploadingImage}
                                />
                              </Box>
                            ))}
                          </List>
                        </SortableContext>
                      </DndContext>
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Pagination count={Math.ceil(unityAssetsList.filter(a => {
                                if (unityAssetsSearch && !a.name.toLowerCase().includes(unityAssetsSearch.toLowerCase())) return false;
                                if (unityAssetsDriveFilter && !a.driveLink) return false;
                                return true;
                              }).length / itemsPerPage)} page={unityAssetsPage} onChange={(_, v) => setUnityAssetsPage(v)} color="primary" />
                      </Box>
                      {visibleUnityAssetsCount < unityAssetsList.length && (
                        <Box sx={{ textAlign: 'center', mt: 3, pb: 3 }}>
                          <Button variant="outlined" onClick={() => setVisibleUnityAssetsCount(prev => prev + 20)} sx={{ borderRadius: 100, px: 4, fontWeight: 700 }}>
                            Tải thêm tài nguyên ({unityAssetsList.length - visibleUnityAssetsCount} mục còn lại)
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </Paper>
              </Box>
            )}

            {/* Tab 10: Unity Asset Form */}
            {tabIndex === 10 && hasPerm('assets', unityAssetFormData.id ? 'edit' : 'add') && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>{unityAssetFormData.id ? 'Chỉnh Sửa Tài Nguyên' : 'Thêm Tài Nguyên Mới'}</Typography>
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField fullWidth label="Tên Tài Nguyên" value={unityAssetFormData.name} onChange={e => setUnityAssetFormData({ ...unityAssetFormData, name: e.target.value })} sx={{ mb: 3 }} />
                      <TextField fullWidth label="Link Gốc Unity Store" value={unityAssetFormData.originalLink} onChange={e => setUnityAssetFormData({ ...unityAssetFormData, originalLink: e.target.value })} sx={{ mb: 3 }} />
                      <TextField fullWidth label="Link Google Drive (tuỳ chọn)" value={unityAssetFormData.driveLink || ''} onChange={e => setUnityAssetFormData({ ...unityAssetFormData, driveLink: e.target.value })} sx={{ mb: 3 }} />
                      <TextField fullWidth label="Người sở hữu/Đóng góp (tuỳ chọn)" value={unityAssetFormData.owner || ''} onChange={e => setUnityAssetFormData({ ...unityAssetFormData, owner: e.target.value })} sx={{ mb: 3 }} />
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Mô tả tài nguyên</Typography>
                        <TextField fullWidth multiline rows={4} value={unityAssetFormData.description} onChange={e => setUnityAssetFormData({ ...unityAssetFormData, description: e.target.value })} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Hình Thức Sở Hữu</InputLabel>
                        <Select value={unityAssetFormData.assetType} label="Hình Thức Sở Hữu" onChange={e => setUnityAssetFormData({ ...unityAssetFormData, assetType: e.target.value })}>
                          {assetTypesList.map(type => (
                            <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Nguồn Tài Nguyên</InputLabel>
                        <Select value={unityAssetFormData.sourceId || ''} label="Nguồn Tài Nguyên" onChange={e => setUnityAssetFormData({ ...unityAssetFormData, sourceId: e.target.value })}>
                          <MenuItem value=""><em>(Không chọn)</em></MenuItem>
                          {assetSourcesList.map(source => (
                            <MenuItem key={source.id} value={source.id}>{source.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField 
                        fullWidth 
                        label="Ngày Tạo" 
                        type="date" 
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={unityAssetFormData.createdAt ? new Date(unityAssetFormData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                        onChange={e => setUnityAssetFormData({ ...unityAssetFormData, createdAt: e.target.value ? new Date(e.target.value).getTime() : Date.now() })} 
                        sx={{ mb: 3 }} 
                      />
                      
                      <Box sx={{ mb: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        {unityAssetFormData.imageUrl ? (
                          <Box sx={{ position: 'relative' }}>
                            <img src={unityAssetFormData.imageUrl} alt="Thumbnail" style={{ width: '100%', borderRadius: 8 }} />
                            <IconButton onClick={() => setUnityAssetFormData({ ...unityAssetFormData, imageUrl: '' })} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'error.main' } }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        ) : (
                          <>
                            <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Kéo thả hoặc chọn ảnh minh hoạ</Typography>
                            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={async (e) => {
                              if (!e.target.files || !e.target.files[0]) return;
                              setIsUploadingImage(true);
                              try {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64Content = (reader.result as string).split(',')[1];
                                  const ext = file.name.split('.').pop();
                                  const fileName = `asset_${Date.now()}.${ext}`;
                                  const res = await fetch(`${import.meta.env.VITE_WORKER_URL || 'https://unifolio-backend.nguyendinhteki.workers.dev'}/api/content`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ username: currentUser?.username, password: loginPassword, path: `public/assets/${fileName}`, message: `Upload image for asset ${fileName} [skip ci]`, content: base64Content, branch: 'main' })
                                  });
                                  if (!res.ok) throw new Error('Upload ảnh thất bại');
                                  
                                  setUnityAssetFormData({ ...unityAssetFormData, imageUrl: getAssetImagePath(fileName) });
                                  setStatus({ type: 'success', message: 'Tải ảnh thành công' });
                                };
                                reader.readAsDataURL(file);
                              } catch (err: any) {
                                setStatus({ type: 'error', message: err.message });
                              } finally {
                                setIsUploadingImage(false);
                              }
                            }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={isUploadingImage} />
                            {isUploadingImage && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.5, ml: -1.5 }} />}
                          </>
                        )}
                      </Box>

                      <Button variant="contained" fullWidth onClick={() => {
                        if (!unityAssetFormData.name) { setStatus({ type: 'error', message: 'Vui lòng nhập tên tài nguyên!' }); return; }
                        const newId = unityAssetFormData.id || Date.now().toString();
                        const newAsset: any = { ...unityAssetFormData, id: newId, createdAt: unityAssetFormData.createdAt || Date.now() };
                        if (!unityAssetFormData.id) newAsset.userCreate = currentUser?.username;
                        let newList = [...unityAssetsList];
                        if (unityAssetFormData.id) {
                          newList = newList.map(a => a.id === newId ? newAsset : a);
                        } else {
                          newList.unshift(newAsset);
                        }
                        setUnityAssetsList(newList);
                        setUnityAssetFormData({ id: '', name: '', description: '', imageUrl: '', assetType: 'GOOGLE_DRIVE', originalLink: '', driveLink: '', owner: '' });
                        setTabIndex(9);
                        setStatus({ type: 'success', message: 'Đã lưu tài nguyên vào bản nháp. Vui lòng bấm Lưu Lên GitHub!' });
                      }} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>
                        {unityAssetFormData.id ? 'Cập Nhật Tài Nguyên' : 'Thêm Tài Nguyên'}
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => { setUnityAssetFormData({ id: '', name: '', description: '', imageUrl: '', assetType: 'GOOGLE_DRIVE', originalLink: '', driveLink: '', owner: '' }); setTabIndex(9); }} sx={{ mt: 2, py: 1.5, fontWeight: 700, borderRadius: 2 }}>
                        Hủy Bỏ
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            {/* Tab 11: Asset Sources List */}
            {tabIndex === 11 && hasPerm('assets', 'view') && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Nguồn Tài Nguyên</Typography>
                  {selectedAssetSources.length > 0 && hasPerm('assets', 'delete') && (
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setBulkDeleteAssetSourcesConfirm(true)} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Xoá {selectedAssetSources.length} mục</Button>
                  )}
                </Box>
                {hasPerm('assets', 'add') && <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>Thêm Nguồn Tài Nguyên Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField fullWidth size="small" placeholder="VD: Unity Asset Store, Github, Tự Viết..." value={newAssetSourceName} onChange={e => setNewAssetSourceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAssetSource()} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddAssetSource} disabled={!newAssetSourceName.trim()} sx={{ minWidth: 120, borderRadius: 2, fontWeight: 700 }}>Thêm</Button>
                  </Box>
                </Paper>}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell padding="checkbox"><Checkbox indeterminate={selectedAssetSources.length > 0 && selectedAssetSources.length < assetSourcesList.length} checked={assetSourcesList.length > 0 && selectedAssetSources.length === assetSourcesList.length} onChange={handleToggleAllAssetSources} /></TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tên Nguồn Tài Nguyên</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Sắp xếp</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetSourcesList.map((source, index) => (
                        <TableRow key={source.id} hover>
                          <TableCell padding="checkbox"><Checkbox checked={selectedAssetSources.includes(source.id)} onChange={() => handleToggleAssetSource(source.id)} /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: source.bg }} />
                              {source.name}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {hasPerm('assets', 'edit', source.userCreate) && <>
                              <IconButton size="small" disabled={index === 0} onClick={() => handleMoveAssetSource(index, 'up')} sx={{ bgcolor: 'action.hover', mr: 0.5 }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                              <IconButton size="small" disabled={index === assetSourcesList.length - 1} onClick={() => handleMoveAssetSource(index, 'down')} sx={{ bgcolor: 'action.hover' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            </>}
                          </TableCell>
                          <TableCell align="right">
                            {hasPerm('assets', 'delete', source.userCreate) && <IconButton onClick={() => setAssetSourceToDelete(source.id)} color="error"><DeleteIcon /></IconButton>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {assetSourcesList.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Chưa có nguồn tài nguyên nào.</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 12: Asset Types List */}
            {tabIndex === 12 && hasPerm('assets', 'view') && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Loại Tài Nguyên</Typography>
                  {selectedAssetTypes.length > 0 && hasPerm('assets', 'delete') && (
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setBulkDeleteAssetTypesConfirm(true)} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Xoá {selectedAssetTypes.length} mục</Button>
                  )}
                </Box>
                {hasPerm('assets', 'add') && <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>Thêm Loại Tài Nguyên Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField fullWidth size="small" placeholder="VD: Unity Account, Google Drive, OneDrive..." value={newAssetTypeName} onChange={e => setNewAssetTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAssetType()} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddAssetType} disabled={!newAssetTypeName.trim()} sx={{ minWidth: 120, borderRadius: 2, fontWeight: 700 }}>Thêm</Button>
                  </Box>
                </Paper>}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell padding="checkbox"><Checkbox indeterminate={selectedAssetTypes.length > 0 && selectedAssetTypes.length < assetTypesList.length} checked={assetTypesList.length > 0 && selectedAssetTypes.length === assetTypesList.length} onChange={handleToggleAllAssetTypes} /></TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tên Hình Thức Sở Hữu</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Sắp xếp</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetTypesList.map((type, index) => (
                        <TableRow key={type.id} hover>
                          <TableCell padding="checkbox"><Checkbox checked={selectedAssetTypes.includes(type.id)} onChange={() => handleToggleAssetType(type.id)} /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Chip label={type.name} sx={{ bgcolor: type.bg, color: type.text, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="center">
                            {hasPerm('assets', 'edit', type.userCreate) && <>
                              <IconButton size="small" disabled={index === 0} onClick={() => handleMoveAssetType(index, 'up')} sx={{ bgcolor: 'action.hover', mr: 0.5 }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                              <IconButton size="small" disabled={index === assetTypesList.length - 1} onClick={() => handleMoveAssetType(index, 'down')} sx={{ bgcolor: 'action.hover' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            </>}
                          </TableCell>
                          <TableCell align="right">
                            {hasPerm('assets', 'edit', type.userCreate) && <IconButton onClick={() => setEditCategoryItem({ ...type, type: 'assetType' })} color="primary" sx={{ mr: 1 }}><EditIcon /></IconButton>}
                            {hasPerm('assets', 'delete', type.userCreate) && <IconButton onClick={() => setAssetTypeToDelete(type.id)} color="error"><DeleteIcon /></IconButton>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {assetTypesList.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Chưa có loại tài nguyên nào.</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 0: Add / Edit Form */}
            {tabIndex === 0 && hasPerm('projects', formData.id ? 'edit' : 'add') && (
              <Box>
                {!formData.id && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Nhập một Video</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField fullWidth size="small" placeholder="Dán link YouTube để tự động điền..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFetchYoutube())} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                        <Button type="button" variant="contained" onClick={handleFetchYoutube} disabled={fetching || !youtubeUrl.trim()} startIcon={fetching ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />} sx={{ minWidth: 150, whiteSpace: 'nowrap', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                          {fetching ? 'Đang cào...' : 'Auto Fill YouTube'}
                        </Button>
                      </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, border: `2px dashed ${muiTheme.palette.secondary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Nhập hàng loạt từ Playlist</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          placeholder="Dán YouTube API Key của bạn (Bắt buộc)..."
                          value={youtubeApiKey}
                          onChange={e => {
                            setYoutubeApiKey(e.target.value);
                            localStorage.setItem('youtube_api_key', e.target.value);
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                        />
                      </Box>
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
                          <Select name="category" value={formData.category} label="Loại dự án" onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}>
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
                        <Autocomplete
                          multiple
                          freeSolo
                          options={Array.from(new Set(projectsList.flatMap(p => Array.isArray(p.techTags) ? p.techTags : (typeof p.techTags === 'string' && p.techTags ? (p.techTags as string).split(',').map(t => t.trim()) : []))))}
                          value={Array.isArray(formData.techTags) ? formData.techTags : (typeof formData.techTags === 'string' && formData.techTags ? (formData.techTags as string).split(',').map(t => t.trim()) : [])}
                          onChange={(_, newValue) => setFormData({ ...formData, techTags: newValue as string[] })}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="React, Node, AI..."
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField fullWidth label="Link ảnh Thumbnail" name="thumbnail" value={formData.thumbnail} onChange={handleChange} required />
                          <IconButton component="label" disabled={isUploadingImage} sx={{ bgcolor: 'action.hover', p: 1.5 }} title="Tải ảnh từ máy">
                            {isUploadingImage ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                          </IconButton>
                        </Box>
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
            {tabIndex === 1 && hasPerm('projects', 'view') && (
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                {loadingList ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: 'primary.main' }} /></Box>
                ) : projectsList.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có dự án nào.</Typography></Box>
                ) : (
                  <>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <TextField fullWidth size="small" placeholder="Tìm kiếm dự án..." value={projectsSearch} onChange={(e) => { setProjectsSearch(e.target.value); setProjectsPage(1); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><AutoAwesomeIcon fontSize="small" /></InputAdornment> } }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={<Checkbox checked={selectedProjects.length > 0 && selectedProjects.length === projectsList.length} indeterminate={selectedProjects.length > 0 && selectedProjects.length < projectsList.length} onChange={handleToggleAllProjects} />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Chọn tất cả</Typography>}
                          sx={{ ml: 0.5 }}
                        />
                      </Box>
                      {selectedProjects.length > 0 && hasPerm('projects', 'delete') && (
                        <Button variant="contained" color="error" size="small" onClick={() => setBulkDeleteProjectsConfirm(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                          Xoá {selectedProjects.length} mục
                        </Button>
                      )}
                    </Box>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={projectsList.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <List sx={{ p: 0 }}>
                          {(()=>{
                            const filtered = projectsList.filter(p => p.name.toLowerCase().includes(projectsSearch.toLowerCase()));
                            const paginated = filtered.slice((projectsPage - 1) * itemsPerPage, projectsPage * itemsPerPage);
                            return paginated;
                          })().map((project, idx) => {
                            const allTags = Array.from(new Set(projectsList.flatMap(p => Array.isArray(p.techTags) ? p.techTags : (typeof p.techTags === 'string' && p.techTags ? (p.techTags as string).split(',').map(t => t.trim()) : []))));
                            return (
                              <SortableProjectItem
                                key={project.id}
                                canEdit={hasPerm('projects', 'edit', project.userCreate)}
                                canDelete={hasPerm('projects', 'delete', project.userCreate)}
                                id={project.id}
                                project={project}
                                idx={idx}
                                isSelected={selectedProjects.includes(project.id)}
                                onToggle={handleToggleProject}
                                categoriesList={categoriesList}
                                majorsList={majorsList}
                                allTags={allTags}
                                onImageUpload={handleImageUpload}
                                isUploadingImage={isUploadingImage}
                                onUpdateTechTags={(id: string, newTags: string[]) => {
                                  setProjectsList(prev => prev.map(p => p.id === id ? { ...p, techTags: newTags } : p));
                                }}
                                onEdit={(p: any) => {
                                  setFormData({
                                    id: p.id, name: p.name, description: p.description, thumbnail: p.thumbnail,
                                    youtubeUrl: p.youtubeUrl || '', category: p.category,
                                    teamMembers: Array.isArray(p.teamMembers) ? p.teamMembers.join('\n') : p.teamMembers,
                                    semester: p.semester,
                                    techTags: Array.isArray(p.techTags) ? p.techTags : [],
                                    isGoldenTicket: !!p.isGoldenTicket,
                                    major: p.major || '',
                                    userCreate: p.userCreate,
                                  } as any);
                                  setTabIndex(0);
                                }}
                                onDelete={(id: string) => { setProjectToDelete(id); setDeleteConfirmOpen(true); }}
                                onInlineEdit={handleInlineEditProject}
                              />
                            );
                          })}
                        </List>
                      </SortableContext>
                    </DndContext>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Pagination count={Math.ceil(projectsList.filter(p => p.name.toLowerCase().includes(projectsSearch.toLowerCase())).length / itemsPerPage)} page={projectsPage} onChange={(_, v) => setProjectsPage(v)} color="primary" />
                    </Box>
                  </>
                )}
              </Paper>
            )}

            {/* Tab 2: Manage Categories */}
            {tabIndex === 2 && hasPerm('projects', 'view') && (
              <Box>
                {hasPerm('categories', 'add') && <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên loại dự án mới" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                    <Button variant="contained" onClick={handleAddCategory} disabled={!newCategoryName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>}

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
                        {selectedCategories.length > 0 && hasPerm('categories', 'delete') && (
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
                                {hasPerm('categories', 'edit', cat.userCreate) && <>
                                  <IconButton size="small" onClick={() => handleMoveCategory(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleMoveCategory(idx, 'down')} disabled={idx === categoriesList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => setEditCategoryItem({ ...cat, type: 'category' })} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                </>}
                                {hasPerm('categories', 'delete', cat.userCreate) && <IconButton size="small" onClick={() => { setCategoryToDelete(cat.id); setDeleteConfirmOpen(true); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>}
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
            {tabIndex === 3 && hasPerm('articles', articleFormData.id ? 'edit' : 'add') && (
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField fullWidth label="Link ảnh bài viết (Không bắt buộc)" value={articleFormData.imageUrl} onChange={e => setArticleFormData({ ...articleFormData, imageUrl: e.target.value })} />
                          <IconButton component="label" disabled={isUploadingImage} sx={{ bgcolor: 'action.hover', p: 1.5 }} title="Tải ảnh từ máy">
                            {isUploadingImage ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
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
                      <Grid size={{ xs: 12, sm: 4 }}>
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
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Năm (VD: 2026)" value={articleFormData.year || ''} onChange={e => setArticleFormData({ ...articleFormData, year: e.target.value })} />
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
            {tabIndex === 4 && hasPerm('articles', 'view') && (
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }}>
                {loadingArticles ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
                ) : articlesList.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Chưa có bài viết nào.</Typography></Box>
                ) : (
                  <>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <TextField fullWidth size="small" placeholder="Tìm kiếm bài viết..." value={articlesSearch} onChange={(e) => { setArticlesSearch(e.target.value); setArticlesPage(1); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><AutoAwesomeIcon fontSize="small" /></InputAdornment> } }} />
                    </Box>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArticleDragEnd}>
                      <SortableContext items={articlesList.map(a => a.id)} strategy={verticalListSortingStrategy}>
                        <List sx={{ p: 0 }}>
                          {(()=>{
                            const filtered = articlesList.filter(a => a.title.toLowerCase().includes(articlesSearch.toLowerCase()));
                            const paginated = filtered.slice((articlesPage - 1) * itemsPerPage, articlesPage * itemsPerPage);
                            return paginated;
                        })().map((article, idx) => (
                          <SortableArticleItem
                            key={article.id}
                            canEdit={hasPerm('articles', 'edit', article.userCreate)}
                            canDelete={hasPerm('articles', 'delete', article.userCreate)}
                            article={article}
                            idx={idx}
                            articleTypesList={articleTypesList}
                            majorsList={majorsList}
                            onEdit={(a: any) => { setArticleFormData(a); setTabIndex(3); }}
                            onDelete={(id: string) => setArticlesList(prev => prev.filter(item => item.id !== id))}
                            onInlineEdit={handleInlineEditArticle}
                            onImageUpload={handleImageUpload}
                            isUploadingImage={isUploadingImage}
                          />
                        ))}
                      </List>
                    </SortableContext>
                  </DndContext>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Pagination count={Math.ceil(articlesList.filter(a => a.title.toLowerCase().includes(articlesSearch.toLowerCase())).length / itemsPerPage)} page={articlesPage} onChange={(_, v) => setArticlesPage(v)} color="primary" />
                  </Box>
                  </>
                )}
              </Paper>
            )}

            {/* Tab 5: QL Chuyên Ngành */}
            {tabIndex === 5 && (
              <Box>
                {hasPerm('categories', 'add') && <Paper elevation={0} sx={{ p: 3, mb: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Thêm Chuyên Ngành Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên chuyên ngành mới" value={newMajorName} onChange={e => setNewMajorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMajor())} />
                    <Button variant="contained" onClick={handleAddMajor} disabled={!newMajorName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>}

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
                        {selectedMajors.length > 0 && hasPerm('categories', 'delete') && (
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
                                {hasPerm('categories', 'edit', cat.userCreate) && <>
                                  <IconButton size="small" onClick={() => handleMoveMajor(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleMoveMajor(idx, 'down')} disabled={idx === majorsList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => setEditCategoryItem({ ...cat, type: 'major' })} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                </>}
                                {hasPerm('categories', 'delete', cat.userCreate) && <IconButton size="small" onClick={() => { setMajorToDelete(cat.id); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>}
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
            {tabIndex === 6 && hasPerm('articles', 'view') && (
              <Box>
              {hasPerm('categories', 'add') && <Paper elevation={0} sx={{ p: 3, mb: 3, border: `2px dashed ${muiTheme.palette.primary.light}`, borderRadius: 4, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Thêm Loại Bài Viết Mới</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Tên loại bài viết mới" value={newArticleTypeName} onChange={e => setNewArticleTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddArticleType())} />
                    <Button variant="contained" onClick={handleAddArticleType} disabled={!newArticleTypeName.trim()} startIcon={<AddIcon />} sx={{ minWidth: 150, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '&.Mui-disabled': { background: muiTheme.palette.action.disabledBackground, color: muiTheme.palette.text.disabled, boxShadow: 'none' } }}>
                      Thêm Nháp
                    </Button>
                  </Box>
                </Paper>}

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
                        {selectedArticleTypes.length > 0 && hasPerm('categories', 'delete') && (
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
                                {hasPerm('categories', 'edit', cat.userCreate) && <>
                                <IconButton size="small" onClick={() => handleMoveArticleType(idx, 'up')} disabled={idx === 0} sx={{ color: 'action.active' }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleMoveArticleType(idx, 'down')} disabled={idx === articleTypesList.length - 1} sx={{ color: 'action.active' }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => setEditCategoryItem({ ...cat, type: 'articleType' })} sx={{ color: 'primary.main', bgcolor: 'action.hover' }}><EditIcon fontSize="small" /></IconButton>
                                </>}
                                {hasPerm('categories', 'delete', cat.userCreate) && <IconButton size="small" onClick={() => { setArticleTypeToDelete(cat.id); }} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)', transition: 'all 0.2s', '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' } }}><DeleteIcon fontSize="small" /></IconButton>}
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

      {/* Unity Assets Dialogs */}
      <Dialog open={!!unityAssetToDelete} onClose={() => setUnityAssetToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá tài nguyên này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setUnityAssetToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteUnityAssetHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteUnityAssetsConfirm} onClose={() => setBulkDeleteUnityAssetsConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedUnityAssets.length} tài nguyên khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteUnityAssetsConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteUnityAssetsAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      {/* Asset Sources Dialogs */}
      <Dialog open={!!assetSourceToDelete} onClose={() => setAssetSourceToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá Nguồn tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá Nguồn tài nguyên này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAssetSourceToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteAssetSourceHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteAssetSourcesConfirm} onClose={() => setBulkDeleteAssetSourcesConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều Nguồn tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedAssetSources.length} Nguồn tài nguyên khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteAssetSourcesConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteAssetSourcesAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
        </DialogActions>
      </Dialog>

      {/* Asset Types Dialogs */}
      <Dialog open={!!assetTypeToDelete} onClose={() => setAssetTypeToDelete(null)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá Loại tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá Loại tài nguyên này khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAssetTypeToDelete(null)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmDeleteAssetTypeHandler} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteAssetTypesConfirm} onClose={() => setBulkDeleteAssetTypesConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xoá nhiều Loại tài nguyên</DialogTitle>
        <DialogContent><DialogContentText>Xoá {selectedAssetTypes.length} Loại tài nguyên khỏi bản nháp?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDeleteAssetTypesConfirm(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={confirmBulkDeleteAssetTypesAction} variant="contained" color="error" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Xoá Hàng Loạt</Button>
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

      <Dialog open={showSortPreview} onClose={() => setShowSortPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận sắp xếp Dự Án</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          <DialogContentText sx={{ mb: 2 }}>
            Danh sách đã được tự động sắp xếp theo học kỳ (Mới nhất ➝ Cũ nhất). Bạn có thể kéo thả để điều chỉnh lại trước khi lưu lên GitHub.
          </DialogContentText>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPreview}>
            <SortableContext items={sortedProjectsPreview.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {sortedProjectsPreview.map((project, idx) => (
                <SortablePreviewItem key={project.id} project={project} idx={idx} />
              ))}
            </SortableContext>
          </DndContext>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowSortPreview(false)} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
          <Button onClick={() => {
            setShowSortPreview(false);
            saveAllChangesToGithub(sortedProjectsPreview);
          }} variant="contained" color="warning" startIcon={isSavingAll ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />} disabled={isSavingAll} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Xác nhận & Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Hồ Sơ Của Tôi</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Email nhận thông báo" type="email" fullWidth value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required />
          <Typography variant="caption" color="text.secondary">Để trống 2 ô dưới nếu không muốn đổi mật khẩu</Typography>
          <TextField label="Mật khẩu mới" type="password" fullWidth value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setChangePasswordOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
          <Button onClick={() => handleSaveProfile(false)} variant="contained" disabled={changingPassword} sx={{ fontWeight: 700 }}>
            {changingPassword ? <CircularProgress size={24} /> : 'Cập Nhật'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Force Profile Dialog */}
      <Dialog open={forceProfileOpen} fullWidth maxWidth="xs" sx={{ zIndex: 9999 }}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Cập Nhật Bắt Buộc</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Bạn cần hoàn thiện thông tin trước khi sử dụng hệ thống.</Typography>
          <TextField label="Email nhận thông báo" type="email" fullWidth value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required />
          {currentUser?.mustChangePassword && (
            <>
              <TextField label="Mật khẩu mới" type="password" fullWidth value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => handleLogout()} color="inherit" sx={{ fontWeight: 600 }}>Đăng Xuất</Button>
          <Button onClick={() => handleSaveProfile(true)} variant="contained" disabled={changingPassword} sx={{ fontWeight: 700 }}>
            {changingPassword ? <CircularProgress size={24} /> : 'Cập Nhật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
