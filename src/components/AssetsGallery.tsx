import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Chip, IconButton, Skeleton, TextField, InputAdornment, Tooltip, Avatar, Button, Select, MenuItem, FormControl, useTheme, Divider, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import StorageIcon from '@mui/icons-material/Storage';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import FilterListIcon from '@mui/icons-material/FilterList';
import { motion } from 'framer-motion';
import type { UnityAsset } from '../types/UnityAsset';
import AssetDetailModal from './AssetDetailModal';
import { useParams, useNavigate } from 'react-router-dom';

const AssetFallbackImage = ({ asset }: { asset: any }) => {
  const isUnity = asset.sourceName?.toLowerCase().includes('unity');
  const isFab = asset.sourceName?.toLowerCase().includes('fab');
  const gradient1 = asset.sourceBg || 'hsl(220, 80%, 92%)';
  const gradient2 = asset.sourceText || 'hsl(220, 85%, 35%)';
  return (
    <Box sx={{ height: '100%', width: '100%', background: `linear-gradient(135deg, ${gradient1} 0%, ${gradient2} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {isUnity ? <AutoAwesomeIcon sx={{ fontSize: 80, mb: 1, opacity: 0.9 }} /> : isFab ? <StorageIcon sx={{ fontSize: 80, mb: 1, opacity: 0.9 }} /> : <FolderZipIcon sx={{ fontSize: 80, mb: 1, opacity: 0.9 }} />}
      <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.9, textTransform: 'uppercase' }}>{asset.sourceName || 'ASSET STORE'}</Typography>
      <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(-45deg)' }} />
    </Box>
  );
};

export default function AssetsGallery() {
  const muiTheme = useTheme();
  const navigate = useNavigate();
  const { assetId } = useParams();
  
  const [assets, setAssets] = useState<UnityAsset[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [currentSource, setCurrentSource] = useState<string>('All');
  const [currentType, setCurrentType] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<UnityAsset | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/unity-assets.json').then(res => res.json()),
      fetch('/data/asset-sources.json').then(res => res.json().catch(() => [])),
      fetch('/data/asset-types.json').then(res => res.json().catch(() => []))
    ])
      .then(([assetsData, sourcesData, typesData]) => {
        // Map sourceName and type object to asset object
        const enrichedAssets = assetsData.map((a: any) => {
          const matchedType = typesData.find((t: any) => String(t.id) === String(a.assetType));
          const matchedSource = sourcesData.find((s: any) => String(s.id) === String(a.sourceId));
          return {
            ...a,
            sourceName: matchedSource?.name,
            sourceBg: matchedSource?.bg,
            sourceText: matchedSource?.text,
            assetTypeName: matchedType?.name || a.assetType,
            assetTypeBg: matchedType?.bg,
            assetTypeText: matchedType?.text
          };
        });
        const sortedEnrichedAssets = enrichedAssets.sort((a: any, b: any) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        setAssets(sortedEnrichedAssets);
        setSources([{ id: 'All', name: 'Tất cả nguồn' }, ...(sourcesData || [])]);
        setTypes([{ id: 'All', name: 'Tất cả hình thức' }, ...(typesData || [])]);
        
        if (assetId) {
          const found = enrichedAssets.find((a: UnityAsset) => a.id === assetId);
          if (found) setSelectedAsset(found);
        }
      })
      .catch(err => console.error("Error fetching unity assets:", err))
      .finally(() => setLoading(false));
  }, [assetId]);

  const handleOpenAsset = (asset: UnityAsset) => {
    navigate(`/asset/${asset.id}`);
  };

  const handleCloseModal = () => {
    setSelectedAsset(null);
    navigate('/assets');
  };

  const filteredAssets = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.description && a.description.toLowerCase().includes(search.toLowerCase()));
    const matchSource = currentSource === 'All' || String(a.sourceId) === currentSource;
    const matchType = currentType === 'All' || String(a.assetType) === currentType;
    return matchSearch && matchSource && matchType;
  });

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(90deg, #10B981, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <AutoAwesomeIcon fontSize="large" sx={{ color: '#10B981' }} /> Kho Tài Nguyên
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 500 }}>
          Nơi chia sẻ các Unity Packages, Source Code và 3D Models giá trị. Phục vụ học tập và phát triển!
        </Typography>
      </Box>

      {/* Main Layout Grid */}
      <Grid container spacing={{ xs: 3, lg: 4 }} sx={{ alignItems: 'flex-start', position: 'relative' }}>
        
        {/* Sidebar Filters */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ position: { md: 'sticky' }, top: { md: 100 }, zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{
              background: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid', borderColor: 'divider', borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              p: { xs: 2.5, sm: 3 },
              display: 'flex', flexDirection: 'column', gap: 2.5,
              maxHeight: { md: 'calc(100vh - 120px)' },
              overflowY: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -1 }}>Tìm kiếm</Typography>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Tìm theo tên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                    '&:hover': { bgcolor: 'background.paper' },
                    transition: 'all 0.3s'
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Divider />

              {/* Type Filter */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>Hình Thức Sở Hữu</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={currentType}
                    onChange={(e) => setCurrentType(e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)', 
                      '& fieldset': { borderColor: 'divider' } 
                    }}
                    startAdornment={<InputAdornment position="start"><FilterListIcon color="action" fontSize="small" /></InputAdornment>}
                  >
                    {types.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              {/* Source Filter */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>Nguồn Tài Nguyên</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={currentSource}
                    onChange={(e) => setCurrentSource(e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)', 
                      '& fieldset': { borderColor: 'divider' } 
                    }}
                    startAdornment={<InputAdornment position="start"><StorageIcon color="action" fontSize="small" /></InputAdornment>}
                  >
                    {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              {(search || currentType !== 'All' || currentSource !== 'All') && (
                <Button 
                  size="small" 
                  color="error"
                  onClick={() => { 
                    setSearch(''); 
                    setCurrentType('All'); 
                    setCurrentSource('All'); 
                  }}
                  sx={{ mt: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </Box>
          </motion.div>
        </Grid>

        {/* Gallery Content */}
        <Grid size={{ xs: 12, md: 9 }}>
          {loading ? (
            <Grid container spacing={4}>
              {[1, 2, 3, 4].map(i => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 4 }} />
                  <Skeleton variant="text" sx={{ mt: 2, fontSize: '1.5rem' }} />
                  <Skeleton variant="text" width="60%" />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={4}>
              {filteredAssets.map((asset, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={asset.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} style={{ height: '100%' }}>
                <Card 
                  onClick={() => handleOpenAsset(asset as UnityAsset)}
                  sx={{ 
                    borderRadius: 4, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderColor: 'primary.light', '& .asset-img': { transform: 'scale(1.05)' } }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    {asset.imageUrl ? (
                      <CardMedia className="asset-img" component="img" image={asset.imageUrl} alt={asset.name} sx={{ height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} />
                    ) : (
                      <Box className="asset-img" sx={{ height: '100%', transition: 'transform 0.6s ease' }}><AssetFallbackImage asset={asset} /></Box>
                    )}
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.9) 100%)', pointerEvents: 'none' }} />
                    

                    
                    <Box sx={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 10px rgba(0,0,0,0.8)', lineHeight: 1.3 }}>
                        {asset.name}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexGrow: 1, mb: 2 }}>
                      <Chip 
                        label={asset.assetTypeName || (asset.assetType === 'ACCOUNT' ? 'Unity Account' : 'Khác')} 
                        size="small" 
                        sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: asset.assetTypeBg || 'primary.main', color: asset.assetTypeText || '#fff', height: 24 }} 
                      />
                      <Chip 
                        icon={<StorageIcon sx={{ fontSize: '14px !important', color: 'inherit' }} />}
                        label={asset.sourceName || 'Chưa rõ'} 
                        size="small" 
                        sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(0,0,0,0.04)', color: 'text.primary', border: 'none', height: 24, '& .MuiChip-icon': { color: 'text.secondary' } }} 
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: '0.9rem', fontWeight: 800 }}>{asset.owner ? asset.owner.charAt(0).toUpperCase() : 'U'}</Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', maxWidth: 120, lineHeight: 1.2 }} noWrap>{asset.owner || 'Ẩn danh'}</Typography>
                          {asset.createdAt && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2, mt: 0.2 }}>
                              {new Date(typeof asset.createdAt === 'number' && asset.createdAt < 100000 ? Math.round((asset.createdAt - 25569) * 86400 * 1000) : asset.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Tooltip title="Copy Link Mời">
                        <IconButton size="small" onClick={(e) => { 
                          e.stopPropagation(); 
                          navigator.clipboard.writeText(`Tài nguyên: ${asset.name}\nXem tại: ${window.location.origin}/asset/${asset.id}`); 
                          setShareSuccess(true); 
                        }} sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}><ShareIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
          {filteredAssets.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Chưa có tài nguyên nào được đăng tải hoặc không có kết quả phù hợp.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

        </Grid>
      </Grid>

      <AssetDetailModal asset={selectedAsset} open={!!selectedAsset} onClose={handleCloseModal} />
      
      <Snackbar open={shareSuccess} autoHideDuration={3000} onClose={() => setShareSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShareSuccess(false)} severity="success" sx={{ width: '100%', fontWeight: 600 }}>
          Đã copy link tài nguyên!
        </Alert>
      </Snackbar>
    </Box>
  );
}
