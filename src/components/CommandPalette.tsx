import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, InputBase, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, useTheme, ListSubheader, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../ThemeContext';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import PublicIcon from '@mui/icons-material/Public';
import CodeIcon from '@mui/icons-material/Code';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';

type ActionCategory = 'Điều hướng' | 'Giao diện' | 'Giải trí (Minigames)';

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: ActionCategory;
  onSelect: () => void;
  keywords: string[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const theme = useTheme();
  const listRef = useRef<HTMLUListElement>(null);

  const dispatchSecretCode = (code: string) => {
    code.split('').forEach(char => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
    });
  };

  const actions: Action[] = useMemo(() => [
    {
      id: 'nav-home',
      label: 'Đi tới Dự án (Home)',
      icon: <HomeIcon />,
      category: 'Điều hướng',
      onSelect: () => navigate('/'),
      keywords: ['home', 'du an', 'project', 'trang chu']
    },
    {
      id: 'nav-articles',
      label: 'Đi tới Bài viết',
      icon: <ArticleIcon />,
      category: 'Điều hướng',
      onSelect: () => navigate('/articles'),
      keywords: ['bai viet', 'article', 'blog']
    },
    {
      id: 'nav-admin',
      label: 'Đi tới Quản trị',
      icon: <AdminPanelSettingsIcon />,
      category: 'Điều hướng',
      onSelect: () => navigate('/admin'),
      keywords: ['quan tri', 'admin', 'dashboard']
    },
    {
      id: 'theme-toggle',
      label: 'Đổi giao diện (Sáng/Tối)',
      icon: <Brightness4Icon />,
      category: 'Giao diện',
      onSelect: toggleTheme,
      keywords: ['theme', 'dark mode', 'light mode', 'giao dien', 'sang toi']
    },
    {
      id: 'game-retro',
      label: 'Hiệu ứng: Hoài cổ (Retro)',
      icon: <SportsEsportsIcon />,
      category: 'Giải trí (Minigames)',
      onSelect: () => dispatchSecretCode('retro'),
      keywords: ['game', 'retro', 'hoai co', 'pixel', 'old']
    },
    {
      id: 'effect-roll',
      label: 'Hiệu ứng: Lăn Cầu 3D (Roll)',
      icon: <ThreeDRotationIcon />,
      category: 'Giải trí (Minigames)',
      onSelect: () => dispatchSecretCode('roll'),
      keywords: ['effect', 'roll', 'lan cau', '3d']
    },
    {
      id: 'game-gravity',
      label: 'Hiệu ứng: Vô trọng lực (Gravity)',
      icon: <PublicIcon />,
      category: 'Giải trí (Minigames)',
      onSelect: () => dispatchSecretCode('gravity'),
      keywords: ['game', 'gravity', 'trong luc', 'bay']
    },
    {
      id: 'game-matrix',
      label: 'Hiệu ứng: Ma trận (Matrix)',
      icon: <CodeIcon />,
      category: 'Giải trí (Minigames)',
      onSelect: () => dispatchSecretCode('matrix'),
      keywords: ['matrix', 'ma tran', 'hacker', 'code']
    },
    {
      id: 'game-reset',
      label: 'Tắt toàn bộ hiệu ứng (Reset)',
      icon: <RestartAltIcon />,
      category: 'Giải trí (Minigames)',
      onSelect: () => dispatchSecretCode('reset'),
      keywords: ['reset', 'tat', 'clear', 'stop']
    }
  ], [navigate, toggleTheme]);

  const filteredActions = useMemo(() => {
    if (!searchQuery) return actions;
    const query = searchQuery.toLowerCase().trim();
    return actions.filter(action => 
      action.label.toLowerCase().includes(query) || 
      action.keywords.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQuery, actions]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: { [key in ActionCategory]?: Action[] } = {};
    filteredActions.forEach(action => {
      if (!groups[action.category]) groups[action.category] = [];
      groups[action.category]!.push(action);
    });
    return groups;
  }, [filteredActions]);

  // Handle global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === 'k')) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Ensure selected index is valid
  useEffect(() => {
    if (selectedIndex >= filteredActions.length) {
      setSelectedIndex(Math.max(0, filteredActions.length - 1));
    }
  }, [filteredActions, selectedIndex]);

  // Handle keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filteredActions[selectedIndex];
      if (action) {
        action.onSelect();
        setOpen(false);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector('.Mui-selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, open]);

  return (
    <Dialog 
      open={open} 
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backgroundImage: 'none',
          overflow: 'hidden',
          m: 2
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0,0,0,0.4)'
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <SearchIcon color="action" sx={{ mr: 2 }} />
        <InputBase
          autoFocus
          placeholder="Bạn muốn làm gì? (Gõ tên chức năng...)"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ fontSize: '1.1rem' }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', ml: 2 }}>
          <Typography variant="caption" sx={{ bgcolor: 'action.selected', px: 1, py: 0.5, borderRadius: 1, fontWeight: 700, color: 'text.secondary' }}>ESC</Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, maxHeight: 400 }}>
        {filteredActions.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Không tìm thấy chức năng phù hợp.</Typography>
          </Box>
        ) : (
          <List ref={listRef} sx={{ p: 0 }}>
            {Object.entries(groupedActions).map(([category, items]) => {
              const catActions = items as Action[];
              if (!catActions || catActions.length === 0) return null;
              
              return (
                <Box key={category}>
                  <ListSubheader disableSticky sx={{ 
                    bgcolor: 'transparent', 
                    color: 'text.secondary', 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    lineHeight: '32px'
                  }}>
                    {category}
                  </ListSubheader>
                  {catActions.map((action) => {
                    const globalIndex = filteredActions.indexOf(action);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <ListItem disablePadding key={action.id}>
                        <ListItemButton 
                          selected={isSelected}
                          onClick={() => {
                            action.onSelect();
                            setOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          sx={{ 
                            px: 3, 
                            py: 1.5,
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                color: 'inherit'
                              },
                              '&:hover': {
                                bgcolor: 'primary.main',
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                            {action.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={<Typography sx={{ fontWeight: 500 }}>{action.label}</Typography>} 
                          />
                          {isSelected && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              Enter để chọn
                            </Typography>
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                  <Divider sx={{ my: 0.5 }} />
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>
      <Box sx={{ px: 3, py: 1.5, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5, border: '1px solid', borderColor: 'divider' }}>↑</Box>
          <Box component="span" sx={{ bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5, border: '1px solid', borderColor: 'divider' }}>↓</Box>
          để chọn
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5, border: '1px solid', borderColor: 'divider' }}>↵</Box>
          để thực thi
        </Typography>
      </Box>
    </Dialog>
  );
}
