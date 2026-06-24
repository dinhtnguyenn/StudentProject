import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Chip, IconButton, Skeleton, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { motion } from 'framer-motion';
import type { UnityAsset } from '../types/UnityAsset';
import AssetDetailModal from './AssetDetailModal';
import { useParams, useNavigate } from 'react-router-dom';

export default function AssetsGallery() {
  const navigate = useNavigate();
  const { assetId } = useParams();
  
  const [assets, setAssets] = useState<UnityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
          const matchedType = typesData.find((t: any) => t.id === a.assetType);
          return {
            ...a,
            sourceName: sourcesData.find((s: any) => s.id === a.sourceId)?.name,
            assetTypeName: matchedType?.name || a.assetType,
            assetTypeBg: matchedType?.bg,
            assetTypeText: matchedType?.text
          };
        });
        setAssets(enrichedAssets);
        
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

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(90deg, #10B981, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <AutoAwesomeIcon fontSize="large" sx={{ color: '#10B981' }} /> Kho Tài Nguyên
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 500 }}>
          Nơi chia sẻ các Unity Packages, Source Code và 3D Models giá trị. Xin cấp quyền để tải về và sử dụng cho dự án của bạn!
        </Typography>
      </Box>

      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
        <TextField 
          variant="outlined" 
          placeholder="Tìm kiếm tài nguyên..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          sx={{ width: '100%', maxWidth: 500, '& .MuiOutlinedInput-root': { borderRadius: 100, bgcolor: 'background.paper', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> } }}
        />
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
              <Skeleton variant="text" sx={{ mt: 2, fontSize: '1.5rem' }} />
              <Skeleton variant="text" width="60%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={4}>
          {filteredAssets.map((asset, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={asset.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
                <Card 
                  onClick={() => handleOpenAsset(asset)}
                  sx={{ 
                    borderRadius: 4, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 200 }}>
                    <CardMedia component="img" image={asset.imageUrl} alt={asset.name} sx={{ height: '100%', objectFit: 'cover' }} />
                    <Chip 
                      label={asset.assetTypeName || (asset.assetType === 'ACCOUNT' ? 'Acc Unity' : 'Google Drive')} 
                      size="small" 
                      sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 800, bgcolor: asset.assetTypeBg || (asset.assetType === 'ACCOUNT' ? 'primary.main' : 'success.main'), color: asset.assetTypeText || '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} 
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {asset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2 }}>
                      {asset.description}
                    </Typography>
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        {asset.createdAt && <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500, color: 'text.secondary', mb: 0.5 }}><CalendarMonthIcon sx={{ fontSize: 14 }} /> {new Date(asset.createdAt).toLocaleDateString('vi-VN')}</Typography>}
                        {asset.owner && <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary' }}>Tác giả: {asset.owner}</Typography>}
                        {asset.sourceName && <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'primary.main' }}>Nguồn: {asset.sourceName}</Typography>}
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/asset/${asset.id}`); alert('Đã copy link!'); }}><ShareIcon fontSize="small" /></IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
          {filteredAssets.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Chưa có tài nguyên nào được đăng tải.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      <AssetDetailModal asset={selectedAsset} open={!!selectedAsset} onClose={handleCloseModal} />
    </Box>
  );
}
