import { Dialog, Box, Typography, IconButton, Button, TextField, CircularProgress, Chip, Grid, Avatar, useTheme, useMediaQuery, DialogContent, FormControlLabel, Checkbox, DialogActions, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorageIcon from '@mui/icons-material/Storage';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
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

// Disclaimer Dialog Component
const DisclaimerDialog = ({ open, onAgree, onDisagree, type }: { open: boolean; onAgree: () => void; onDisagree: () => void; type: 'submit' | 'drive' }) => {
  const [checked, setChecked] = useState(false);

  const disclaimerTexts = {
    submit: {
      title: 'Điều khoản và Tuyên bố miễn trừ trách nhiệm',
      items: [
        { label: '1.', text: 'Tôi sẽ chỉ sử dụng tài nguyên này cho các mục đích học tập, nghiên cứu học thuật hoặc dự án thực hành trong phạm vi trường học.' },
        { label: '2.', text: 'Tôi cam kết không sử dụng tài nguyên này cho mục đích thương mại, lợi nhuận hoặc bất kỳ hoạt động nào trái pháp luật.' },
        { label: '3.', text: 'Tôi chịu trách nhiệm hoàn toàn về việc tuân thủ các điều khoản sử dụng từ nhà cung cấp tài nguyên gốc (Unity Asset Store, Fab.com, v.v.).' },
        { label: '4.', text: 'UniFolio không chịu trách nhiệm cho bất kỳ hậu quả nào phát sinh từ việc sử dụng tài nguyên này, bao gồm nhưng không giới hạn: lỗi kỹ thuật, mất dữ liệu, hoặc vi phạm bản quyền.' },
        { label: '5.', text: 'Tôi hiểu rằng việc sử dụng sai mục đích có thể dẫn đến việc hủy bỏ quyền truy cập và có thể có hậu quả pháp lý.' }
      ]
    },
    drive: {
      title: 'Điều khoản và Tuyên bố miễn trừ trách nhiệm',
      items: [
        { label: '1.', text: 'Tài nguyên trên Google Drive có thể chứa các file được chia sẻ bởi bên thứ ba. Vui lòng kiểm tra virus và bảo mật trước khi sử dụng.' },
        { label: '2.', text: 'UniFolio không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc tải xuống hoặc sử dụng các file từ Google Drive.' },
        { label: '3.', text: 'Hãy chắc chắn rằng bạn có quyền truy cập hợp pháp vào nội dung này và sẽ tuân thủ tất cả các điều khoản sử dụng.' },
        { label: '4.', text: 'Nếu bạn phát hiện bất kỳ vấn đề nào, vui lòng báo cáo cho Unifolio ngay lập tức.' }
      ]
    }
  };

  const currentText = disclaimerTexts[type];

  return (
    <Dialog open={open} onClose={onDisagree} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 900, color: 'warning.main' }}>
        <WarningIcon /> {currentText.title}
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        {currentText.items.map((item) => (
          <Typography key={item.label} variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', mb: 2, textAlign: 'justify' }}>
            <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>{item.label}</Box>
            {item.text}
          </Typography>
        ))}
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Tôi đã đọc và đồng ý với các điều khoản trên</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onDisagree} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Hủy
        </Button>
        <Button onClick={onAgree} variant="contained" disabled={!checked} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Tôi đã hiểu và đồng ý
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function AssetDetailModal({ asset, open, onClose }: Props) {
  const muiTheme = useTheme();
  const isLight = muiTheme.palette.mode === 'light';
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [formData, setFormData] = useState({ name: '', studentId: '', school: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [disclaimerType, setDisclaimerType] = useState<'submit' | 'drive'>('submit');
  const [driveLink, setDriveLink] = useState<string>('');

  if (!asset) return null;

  const parsedDate = typeof asset.createdAt === 'number' && asset.createdAt < 100000
    ? Math.round((asset.createdAt - 25569) * 86400 * 1000)
    : asset.createdAt;
  const receiveMethod = asset.assetTypeName || (asset.assetType === 'ACCOUNT' ? 'Unity/Fab Account' : asset.assetType === 'GOOGLE_DRIVE' ? 'Google Drive' : 'Khác');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show disclaimer first
    setDisclaimerType('submit');
    setDisclaimerOpen(true);
  };

  const handleDisclaimerAgree = async () => {
    setDisclaimerOpen(false);
    if (disclaimerType === 'submit') {
      await submitForm();
    } else if (disclaimerType === 'drive' && driveLink) {
      window.open(driveLink, '_blank');
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const accessKey = "a5b2c357-ae00-48e5-9f59-2945167199be";
    if (!accessKey) {
      alert("Hệ thống chưa được cấu hình API Key gửi Email. Vui lòng liên hệ Unifolio.");
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

  const handleGoogleDriveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (asset?.driveLink) {
      setDriveLink(asset.driveLink);
      setDisclaimerType('drive');
      setDisclaimerOpen(true);
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
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 120, md: 200 }, bgcolor: '#000' }}>
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

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="primary" /> Chi Tiết
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: '1.05rem', mb: 4, textAlign: 'justify' }}>
              {asset.description || 'Chưa có mô tả chi tiết cho tài nguyên này.'}
            </Typography>

            {(asset.driveLink || asset.originalLink) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 5, p: 4, borderRadius: 5, bgcolor: isLight ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.12)', border: '1px solid', borderColor: 'primary.light' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>Bạn muốn tải tài nguyên?</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, textAlign: 'justify' }}>
                  Nếu bạn muốn tải tài nguyên với mục đích học tập, hãy gửi thông tin yêu cầu ở form bên dưới để Unifolio kiểm duyệt và cấp quyền.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
                  Hình thức nhận tài nguyên thông qua: {receiveMethod}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
                  {asset.driveLink && (
                    <Button variant="contained" onClick={handleGoogleDriveClick} startIcon={<FileDownloadIcon />} sx={{ fontWeight: 800, borderRadius: 100, px: 3, py: 1.25, textTransform: 'none', boxShadow: '0 10px 30px -10px rgba(37,99,235,0.75)' }}>
                      Link Drive tài nguyên
                    </Button>
                  )}
                  {asset.originalLink && (
                    <Button variant="outlined" href={asset.originalLink} target="_blank" startIcon={<OpenInNewIcon />} sx={{ fontWeight: 800, borderRadius: 100, px: 3, py: 1.25, textTransform: 'none', bgcolor: 'background.paper' }}>
                      Xem nguồn tài nguyên gốc
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Form Đăng Ký Sử Dụng */}
          <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, bgcolor: isLight ? 'rgba(248,250,252,0.98)' : 'rgba(15,23,42,0.92)', border: '1px solid', borderColor: isLight ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.2)', position: 'relative', overflow: 'hidden', boxShadow: isLight ? '0 20px 80px rgba(15,23,42,0.04)' : '0 20px 80px rgba(15,23,42,0.2)' }}>
            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: isLight ? 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, position: 'relative', zIndex: 1 }}>
              <PersonIcon sx={{ color: 'primary.main', fontSize: 30 }} />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Yêu cầu truy cập tài nguyên</Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mb: 4, fontWeight: 500, lineHeight: 1.8 }}>
              Điền đầy đủ thông tin bên dưới để Unifolio xem xét và cấp quyền truy cập tài nguyên trên.
            </Typography>

            {submitStatus === 'success' ? (
              <Box sx={{ textAlign: 'center', py: 4, animation: 'fadeIn 0.5s ease-out' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mb: 2 }}>Gửi yêu cầu thành công!</Typography>
                <Typography color="text.secondary">Yêu cầu của bạn đã được gửi. Unifolio sẽ phản hồi qua email trong thời gian sớm nhất.</Typography>
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
                <TextField fullWidth multiline rows={3} label="Lý do / Mục đích sử dụng cụ thể" required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} helperText="Chi tiết mục đích sẽ giúp Unifolio duyệt nhanh hơn." sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }} />

                <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} sx={{ width: '100%', py: 1.5, borderRadius: 3, fontWeight: 800, fontSize: '1.05rem', textTransform: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 8px 25px -8px rgba(37,99,235,0.6)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px -10px rgba(37,99,235,0.8)' } }}>
                  {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                </Button>
              </form>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Disclaimer Dialog */}
      <DisclaimerDialog
        open={disclaimerOpen}
        type={disclaimerType}
        onAgree={handleDisclaimerAgree}
        onDisagree={() => setDisclaimerOpen(false)}
      />
    </>
  );
}
