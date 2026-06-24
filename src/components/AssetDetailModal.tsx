import { Dialog, Box, Typography, IconButton, Button, TextField, CircularProgress, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import type { UnityAsset } from '../types/UnityAsset';
import { useState, useEffect } from 'react';
import ImageWithFallback from './ImageWithFallback';

interface Props {
  asset: UnityAsset | null;
  open: boolean;
  onClose: () => void;
}

export default function AssetDetailModal({ asset, open, onClose }: Props) {
  const [formData, setFormData] = useState({ name: '', studentId: '', school: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (open && asset) {
      document.title = `Tài nguyên: ${asset.name} | UniFolio`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', `Tài nguyên Unity: ${asset.name}. Cung cấp bởi ${asset.owner || 'UniFolio'}`);
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', `Tài nguyên: ${asset.name} | UniFolio`);
    } else {
      document.title = 'UniFolio';
    }
  }, [open, asset]);

  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Sử dụng Access Key do Web3Forms cung cấp (Khóa này an toàn để để công khai trên frontend)
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
          Loại: asset.assetType === 'ACCOUNT' ? 'Unity Account' : 'Google Drive',
          Họ_Và_Tên: formData.name,
          MSSV: formData.studentId,
          Trường: formData.school,
          Email_Liên_Hệ: formData.email,
          Mục_Đích_Sử_Dụng: formData.message,
        })
      });

      const result = await response.json();
      if (response.status === 200) {
        setSubmitStatus('success');
      } else {
        console.log(result);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 4, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 250 }}>
        <ImageWithFallback src={asset.imageUrl} alt={asset.name} fallbackText={asset.name} iconKeyword="3d" height="100%" />
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: 'background.default' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={asset.assetType === 'ACCOUNT' ? 'Acc Unity' : 'Google Drive'} size="small" sx={{ fontWeight: 800, bgcolor: asset.assetType === 'ACCOUNT' ? 'primary.main' : 'success.main', color: '#fff' }} />
            {asset.owner && <Chip label={`Người đóng góp: ${asset.owner}`} size="small" variant="outlined" />}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>{asset.name}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{asset.description}</Typography>
          {asset.originalLink && (
            <Button variant="text" href={asset.originalLink} target="_blank" sx={{ mt: 2, fontWeight: 700, textTransform: 'none' }}>
              Xem trước trên Unity Asset Store ↗
            </Button>
          )}
        </Box>

        <Box sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Mẫu Đăng Ký Sử Dụng</Typography>
          </Box>

          {submitStatus === 'success' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mb: 2 }}>Gửi yêu cầu thành công! 🎉</Typography>
              <Typography color="text.secondary">Thông tin của bạn đã được gửi đến Admin. Vui lòng kiểm tra email thường xuyên, chúng tôi sẽ phản hồi sớm nhất có thể.</Typography>
              <Button variant="outlined" onClick={onClose} sx={{ mt: 4, borderRadius: 100, fontWeight: 700, px: 4 }}>Đóng Cửa Sổ</Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <TextField label="Họ và Tên" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <TextField label="Mã Sinh Viên" required value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} />
                <TextField label="Trường" required value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} />
                <TextField label="Email liên hệ" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Box>
              <TextField fullWidth multiline rows={3} label="Lý do / Mục đích sử dụng" required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} sx={{ mb: 4 }} helperText="Hãy ghi rõ mục đích để Admin dễ dàng xét duyệt nhé." />
              
              <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} sx={{ width: '100%', py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.5)' }}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
              </Button>
            </form>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
