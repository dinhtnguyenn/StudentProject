import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, IconButton,
  Skeleton, TextField, InputAdornment, Tooltip, Avatar, Button, Select,
  MenuItem, FormControl, InputLabel, useTheme, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import StorageIcon from '@mui/icons-material/Storage';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { motion, useInView } from 'framer-motion';
import type { UnityAsset } from '../types/UnityAsset';
import AssetDetailModal from './AssetDetailModal';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ImageWithFallback from './ImageWithFallback';

// ─── Animated Counter (same style as ProjectGallery / ArticlesGallery) ────────
const AnimatedCounter = ({ value, label }: { value: number; label: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;
      const duration = 1500;
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setCount(Math.floor(progress * (end - start) + start));
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    }
  }, [value, isInView]);

  return (
    <Box ref={ref} sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, flex: 1 }}>
      <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, fontSize: { xs: '1.75rem', sm: '3rem' } }}>
        {count}+
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: { xs: 0, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
        {label}
      </Typography>
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssetsGallery() {
  const muiTheme = useTheme();
  const navigate = useNavigate();
  const { assetId } = useParams();

  const [assets, setAssets] = useState<UnityAsset[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [currentSource, setCurrentSource] = useState<string>('All');
  const [currentType, setCurrentType] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<UnityAsset | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Trigger filter animation on filter change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 400);
    return () => clearTimeout(timer);
  }, [search, currentSource, currentType]);

  useEffect(() => {
    Promise.all([
      fetch('/data/unity-assets.json').then(res => res.json()),
      fetch('/data/asset-sources.json').then(res => res.json().catch(() => [])),
      fetch('/data/asset-types.json').then(res => res.json().catch(() => []))
    ])
      .then(([assetsData, sourcesData, typesData]) => {
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
      .catch(err => console.error('Error fetching unity assets:', err))
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

  const totalSources = sources.filter(s => s.id !== 'All').length;
  const totalTypes = types.filter(t => t.id !== 'All').length;
  const hasActiveFilter = search !== '' || currentSource !== 'All' || currentType !== 'All';

  return (
    <Box>
      <Helmet>
        <title>Kho tài nguyên | UniFolio</title>
        <meta name="description" content="Khám phá các Unity Packages, Source Code và 3D Models giá trị phục vụ học tập và phát triển." />
      </Helmet>

      {/* ─── HERO HEADER ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{
          mb: 5, textAlign: 'center', mt: 2, position: 'relative',
          '@keyframes pulseGlow': {
            '0%': { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' },
            '100%': { opacity: 0.8, transform: 'translate(-50%, -50%) scale(1.15)' }
          },
          '&::before': {
            content: '""', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '100%', maxWidth: 800, height: '150%',
            background: `radial-gradient(ellipse at center, ${muiTheme.palette.primary.main}20 0%, ${muiTheme.palette.secondary.main}15 40%, transparent 70%)`,
            filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none',
            animation: 'pulseGlow 4s ease-in-out infinite alternate',
          }
        }}>
          {/* Title */}
          <Typography variant="h3" component="h1" sx={{ mb: 1.5, fontWeight: 800, color: 'text.primary', fontSize: { xs: '2.25rem', sm: '3rem' } }}>
            Kho <span style={{ color: muiTheme.palette.primary.main }}>tài nguyên</span>
          </Typography>

          {/* Disclaimer pill */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box
              onClick={() => setDisclaimerOpen(true)}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                cursor: 'pointer',
                px: 2.5, py: 1,
                borderRadius: 99,
                border: '1.5px solid',
                borderColor: muiTheme.palette.mode === 'light' ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.3)',
                background: muiTheme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(254,243,199,0.8), rgba(255,255,255,0.9))'
                  : 'linear-gradient(135deg, rgba(120,83,19,0.25), rgba(30,27,20,0.8))',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 12px rgba(245,158,11,0.12)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#F59E0B',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.25)',
                  transform: 'translateY(-2px)',
                  background: muiTheme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, rgba(254,243,199,1), rgba(255,255,255,1))'
                    : 'linear-gradient(135deg, rgba(120,83,19,0.4), rgba(40,35,10,0.9))',
                }
              }}
            >
              <GavelIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: muiTheme.palette.mode === 'light' ? '#92400E' : '#FCD34D', letterSpacing: 0.3 }}>
                Tuyên bố miễn trừ trách nhiệm
              </Typography>
              <InfoOutlinedIcon sx={{ fontSize: 13, color: muiTheme.palette.mode === 'light' ? '#B45309' : '#FCD34D', opacity: 0.7 }} />
            </Box>
          </Box>

          {/* Stats bar — exact same style as ArticlesGallery / ProjectGallery */}
          <Box sx={{
            display: 'flex', justifyContent: 'center', maxWidth: 600, mx: 'auto',
            bgcolor: 'background.paper', borderRadius: 4,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
            border: '1px solid', borderColor: 'divider', overflow: 'hidden'
          }}>
            <AnimatedCounter value={assets.length} label="Tài nguyên" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={totalSources} label="Nguồn" />
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <AnimatedCounter value={totalTypes} label="Hình thức" />
          </Box>
        </Box>
      </motion.div>

      {/* ─── DISCLAIMER DIALOG ────────────────────────────────────────────────── */}
      <Dialog
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              background: muiTheme.palette.mode === 'light' ? 'rgba(255,255,255,0.97)' : 'rgba(18,18,18,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid',
              borderColor: muiTheme.palette.mode === 'light' ? 'rgba(251,191,36,0.35)' : 'rgba(251,191,36,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', pr: 7 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GavelIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
            TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM
          </Typography>
          <IconButton
            onClick={() => setDisclaimerOpen(false)}
            size="small"
            sx={{ position: 'absolute', right: 14, top: 14, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>1. Mục đích thông tin</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Tất cả các tài nguyên, tài liệu và thông tin được chia sẻ bởi Unifolio chỉ nhằm mục đích cung cấp thông tin tham khảo và giáo dục. Những nội dung này không cấu thành và không nên được xem là những lời khuyên chuyên môn (như tư vấn pháp lý, tài chính, y tế, hay kỹ thuật chuyên sâu).
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>2. Tính chính xác và tính trọn vẹn</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Mặc dù chúng tôi đã nỗ lực hết sức để đảm bảo rằng các tài nguyên được chia sẻ là chính xác và hữu ích tại thời điểm đăng tải, Unifolio không đưa ra bất kỳ sự đảm bảo hay cam kết nào, dù là tường minh hay ngụ ý, về tính chính xác, tính đầy đủ, độ tin cậy hoặc sự phù hợp của các thông tin này. Thông tin có thể trở nên lỗi thời theo thời gian hoặc thay đổi tùy theo từng ngữ cảnh cụ thể.
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>3. Giới hạn trách nhiệm pháp lý</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Người sử dụng hoàn toàn tự chịu rủi ro khi quyết định áp dụng hoặc sử dụng các tài nguyên được chia sẻ. Trong mọi trường hợp, Unifolio sẽ không chịu trách nhiệm đối với bất kỳ tổn thất, thiệt hại nào (bao gồm nhưng không giới hạn ở các thiệt hại trực tiếp, gián tiếp, do ngẫu nhiên, hoặc do hậu quả của việc mất dữ liệu, mất lợi nhuận) phát sinh từ:
                <Box component="span" sx={{ display: 'block', mt: 1, ml: 3, fontStyle: 'italic' }}>
                  - Việc tải xuống, cài đặt hoặc sử dụng các tài nguyên này.
                </Box>
                <Box component="span" sx={{ display: 'block', mt: 1, ml: 3, fontStyle: 'italic' }}>
                  - Những sai sót hoặc thiếu sót có trong nội dung tài nguyên.
                </Box>
                <Box component="span" sx={{ display: 'block', mt: 1, ml: 3, fontStyle: 'italic' }}>
                  - Bất kỳ quyết định nào được đưa ra dựa trên thông tin từ các tài nguyên này.
                </Box>
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>4. Bản quyền và Sở hữu trí tuệ</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Các tài nguyên có thể bao gồm nội dung thuộc bản quyền của bên thứ ba. Việc chia sẻ của chúng tôi tuân thủ mục đích sử dụng hợp lý (Fair Use) và tôn trọng quyền sở hữu trí tuệ của tác giả gốc. Người dùng khi tải về và sử dụng có trách nhiệm tự đảm bảo không vi phạm các quy định về bản quyền khi phân phối lại hoặc sử dụng cho mục đích thương mại.
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>5. Liên kết bên ngoài (Nếu có)</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Các tài nguyên có thể chứa các liên kết dẫn đến các trang web hoặc phần mềm của bên thứ ba. Chúng tôi không kiểm soát và không chịu trách nhiệm về nội dung, chính sách bảo mật hoặc các thực tiễn của bất kỳ trang web hay dịch vụ nào của bên thứ ba đó.
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ lineHeight: 1.9, color: 'text.primary', textAlign: 'justify' }}>
              <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>6. Sự chấp thuận</Box>
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 400 }}>
                Bằng việc truy cập, tải xuống hoặc sử dụng các tài nguyên được chia sẻ này, bạn được coi là đã đọc, hiểu và hoàn toàn đồng ý với Tuyên bố Miễn trừ Trách nhiệm này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng các tài nguyên này.
              </Box>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setDisclaimerOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 99,
              fontWeight: 700,
              textTransform: 'none',
              px: 4,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #D97706, #B45309)', boxShadow: '0 6px 20px rgba(245,158,11,0.45)' }
            }}
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MAIN LAYOUT ──────────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 3, lg: 4 }} sx={{ alignItems: 'flex-start', position: 'relative' }}>

        {/* Sidebar Filters */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ position: { md: 'sticky' }, top: { md: 100 }, zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
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
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -1 }}>Khám phá</Typography>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm tài nguyên..."
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

              {/* Filters section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Bộ lọc</Typography>
                  {hasActiveFilter && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => { setSearch(''); setCurrentType('All'); setCurrentSource('All'); }}
                      sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem' }}
                    >
                      Xóa tất cả
                    </Button>
                  )}
                </Box>

                {/* Type filter */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Hình thức sở hữu</InputLabel>
                  <Select
                    value={currentType}
                    label="Hình thức sở hữu"
                    onChange={e => setCurrentType(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {types.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>

                {/* Source filter */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Nguồn tài nguyên</InputLabel>
                  <Select
                    value={currentSource}
                    label="Nguồn tài nguyên"
                    onChange={e => setCurrentSource(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* Gallery Content */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* Result count — same style as ArticlesGallery */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, px: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Hiển thị {filteredAssets.length} tài nguyên
            </Typography>
          </Box>

          {loading ? (
            <Grid container spacing={4}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                  <Skeleton variant="text" sx={{ mt: 2, fontSize: '1.5rem' }} />
                  <Skeleton variant="text" width="60%" />
                </Grid>
              ))}
            </Grid>
          ) : isFiltering ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
              <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
            </Box>
          ) : filteredAssets.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Box sx={{ textAlign: 'center', py: 10, px: 3, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <SentimentDissatisfiedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Không tìm thấy tài nguyên nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Hãy thử tìm kiếm với từ khoá hoặc bộ lọc khác.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Grid container spacing={4}>
              {filteredAssets.map((asset, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={asset.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: index < 6 ? index * 0.05 : 0 }}
                    style={{ height: '100%' }}
                  >
                    <Card
                      onClick={() => handleOpenAsset(asset as UnityAsset)}
                      sx={{
                        borderRadius: 4,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        bgcolor: 'background.paper',
                        transition: 'all 0.3s ease',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                          transform: 'translateY(-8px)',
                          '& .asset-img': { transform: 'scale(1.05)' }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                        <ImageWithFallback
                          className="asset-img"
                          src={asset.imageUrl}
                          alt={asset.name}
                          height="100%"
                          sx={{ transition: 'transform 0.5s ease' }}
                        />
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
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(`Tài nguyên: ${asset.name}\nXem tại: ${window.location.origin}/asset/${asset.id}`);
                                setShareSuccess(true);
                              }}
                              sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
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
