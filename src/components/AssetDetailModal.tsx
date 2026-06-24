import { Dialog, Box, Typography, IconButton, Button, TextField, CircularProgress, Chip, Grid, Avatar, useTheme, useMediaQuery, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorageIcon from '@mui/icons-material/Storage';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import type { UnityAsset } from '../types/UnityAsset';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const AssetFallbackImage = ({ asset }: { asset: any }) => {
  const isUnity = asset.sourceName?.toLowerCase().includes('unity');
  const isFab = asset.sourceName?.toLowerCase().includes('fab');
  const gradient1 = asset.sourceBg || 'hsl(220, 80%, 92%)';
  const gradient2 = asset.sourceText || 'hsl(220, 85%, 35%)';
  return (
    <Box sx={{ height: '100%', width: '100%', background: `linear-gradient(135deg, ${gradient1} 0%, ${gradient2} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {isUnity ? <AutoAwesomeIcon sx={{ fontSize: 100, mb: 1, opacity: 0.9 }} /> : isFab ? <StorageIcon sx={{ fontSize: 100, mb: 1, opacity: 0.9 }} /> : <FolderZipIcon sx={{ fontSize: 100, mb: 1, opacity: 0.9 }} />}
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.9, textTransform: 'uppercase' }}>{asset.sourceName || 'ASSET STORE'}</Typography>
      <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(-45deg)' }} />
    </Box>
  );
};

interface Props {
  asset: UnityAsset | null;
  open: boolean;
  onClose: () => void;
}

export default function AssetDetailModal({ asset, open, onClose }: Props) {
  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === 'light';
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [formData, setFormData] = useState({ name: '', studentId: '', school: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!asset) return null;

  const parsedDate = typeof asset.createdAt === 'number' && asset.createdAt < 100000 
    ? Math.round((asset.createdAt - 25569) * 86400 * 1000) 
    : asset.createdAt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const accessKey = "a5b2c357-ae00-48e5-9f59-2945167199be";
    if (!accessKey) {
      alert("Hệ thống chưa được cấu hình API Key gửi Email. Vui lòng liên hệ Admin.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[Yêu cầu cấp quyền Tài Nguyên] ${asset.name} - ${formData.studentId}`,
          from_name: formData.name,
          Tài_Nguyên: asset.name,
          Loại: asset.assetTypeName || (asset.assetType === 'ACCOUNT' ? 'Unity Account' : 'Google Drive'),
          Họ_Và_Tên: formData.name,
          MSSV: formData.studentId,
          Trường: formData.school,
          Email_Liên_Hệ: formData.email,
          Mục_Đích_Sử_Dụng: formData.message,
        })
      });

      if (response.status === 200) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${asset.name} | UniFolio`}</title>
        <meta name="description" content={`Tài nguyên Unity: ${asset.name}. Cung cấp bởi ${asset.owner || 'UniFolio'}`} />
        <meta property="og:title" content={asset.name} />
        <meta property="og:description" content={`Tài nguyên Unity: ${asset.name}. Cung cấp bởi ${asset.owner || 'UniFolio'}`} />
        {asset.imageUrl && <meta property="og:image" content={asset.imageUrl} />}
        <link rel="canonical" href={`${window.location.origin}/asset/${asset.id}`} />
      </Helmet>

      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth 
        fullScreen={isMobile}
        sx={{
        backdropFilter: 'blur(20px)',
        '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.6)' },
        '& .MuiDialog-paper': {
          borderRadius: { xs: 0, md: 6 },
          m: { xs: 0, md: 2 },
          overflow: 'hidden',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      {/* Hero Banner Area */}
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 200, md: 320 }, bgcolor: '#000' }}>
        {asset.imageUrl ? (
          <Box component="img" src={asset.imageUrl} alt={asset.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <AssetFallbackImage asset={asset} />
        )}
        
        {/* Gradient Overlay for seamless transition */}
        <Box sx={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '180px', background: `linear-gradient(to top, ${muiTheme.palette.background.paper} 0%, transparent 100%)` }} />

        {/* Action Buttons Overlay */}
        <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 2 }}>
          <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: 'error.main' }, backdropFilter: 'blur(8px)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <DialogContent sx={{ p: { xs: 3, md: 5 }, pt: { xs: 0, md: 2 }, overflowX: 'hidden' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, position: 'relative', zIndex: 2 }}>
            <Chip label={asset.assetTypeName || (asset.assetType === 'ACCOUNT' ? 'Acc Unity' : 'Khác')} sx={{ fontWeight: 800, bgcolor: asset.assetTypeBg || 'primary.main', color: asset.assetTypeText || '#fff' }} />
            {asset.sourceName && <Chip label={asset.sourceName} variant="outlined" sx={{ fontWeight: 700, bgcolor: 'background.paper' }} />}
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 900, 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            background: isLight ? 'linear-gradient(90deg, #1E293B, #2563EB)' : 'linear-gradient(90deg, #F8FAFC, #60A5FA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
            lineHeight: 1.3
          }}>
            {asset.name}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', color: 'text.secondary', mb: 4 }}>
            {asset.owner && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800 }}>{asset.owner.charAt(0).toUpperCase()}</Avatar>
                <Typography sx={{ fontWeight: 700 }}>Đăng bởi {asset.owner}</Typography>
              </Box>
            )}
            {parsedDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarMonthIcon fontSize="small" />
                <Typography sx={{ fontWeight: 600 }}>{new Date(parsedDate).toLocaleDateString('vi-VN')}</Typography>
              </Box>
            )}
          </Box>

          {(asset.driveLink || asset.originalLink) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 5, p: 3, borderRadius: 4, bgcolor: isLight ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.1)', border: '1px dashed', borderColor: 'primary.light' }}>
              <Typography variant="subtitle1" sx={{ width: '100%', fontWeight: 800, color: 'text.primary', mb: 1 }}>Tải về tài nguyên</Typography>
              {asset.driveLink && (
                <Button variant="contained" href={asset.driveLink} target="_blank" startIcon={<FileDownloadIcon />} sx={{ fontWeight: 800, borderRadius: 100, px: 3, py: 1, textTransform: 'none', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.6)' }}>
                  Tải Drive Trực Tiếp
                </Button>
              )}
              {asset.originalLink && (
                <Button variant="outlined" href={asset.originalLink} target="_blank" startIcon={<OpenInNewIcon />} sx={{ fontWeight: 800, borderRadius: 100, px: 3, py: 1, textTransform: 'none', bgcolor: 'background.paper' }}>
                  Xem Nguồn Gốc
                </Button>
              )}
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" /> Chi Tiết
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: '1.05rem', mb: 5 }}>
            {asset.description || 'Chưa có mô tả chi tiết cho tài nguyên này.'}
          </Typography>
        </Box>

        {/* Form Đăng Ký Sử Dụng */}
        <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, position: 'relative', zIndex: 1 }}>
            <PersonIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Mẫu Đăng Ký Truy Cập</Typography>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>Vui lòng điền form dưới đây nếu tài nguyên yêu cầu cấp quyền truy cập từ Admin.</Typography>

          {submitStatus === 'success' ? (
            <Box sx={{ textAlign: 'center', py: 4, animation: 'fadeIn 0.5s ease-out' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mb: 2 }}>Gửi yêu cầu thành công! 🎉</Typography>
              <Typography color="text.secondary">Yêu cầu của bạn đã được gửi. Chúng tôi sẽ phản hồi qua Email trong thời gian sớm nhất.</Typography>
              <Button variant="contained" color="primary" onClick={onClose} sx={{ mt: 4, borderRadius: 100, fontWeight: 800, px: 5, py: 1.5, textTransform: 'none' }}>Đóng Cửa Sổ</Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Họ và Tên" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Mã Sinh Viên" required value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Trường" required value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Email liên hệ" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />
                </Grid>
              </Grid>
              <TextField fullWidth multiline rows={3} label="Lý do / Mục đích sử dụng cụ thể" required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} helperText="Chi tiết mục đích sẽ giúp Admin duyệt nhanh hơn." sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />
              
              <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} sx={{ width: '100%', py: 1.5, borderRadius: 3, fontWeight: 800, fontSize: '1.05rem', textTransform: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 8px 25px -8px rgba(37,99,235,0.6)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px -10px rgba(37,99,235,0.8)' } }}>
                {isSubmitting ? 'Đang xử lý...' : 'Gửi Yêu Cầu Xin Quyền'}
              </Button>
            </form>
          )}
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
}
