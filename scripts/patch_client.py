import re

with open('src/components/AssetDetailModal.tsx', 'r') as f:
    content = f.read()

# 1. Add states for verification
states = """
  const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://unifolio-backend.nguyendinhteki.workers.dev';
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
"""
content = content.replace("const [driveLink, setDriveLink] = useState<string>('');", "const [driveLink, setDriveLink] = useState<string>('');\n" + states)

# 2. Modify handleDisclaimerAgree
old_disclaimer = """  const handleDisclaimerAgree = async () => {
    setDisclaimerOpen(false);
    if (disclaimerType === 'submit') {
      await submitForm();
    } else if (disclaimerType === 'drive' && driveLink) {
      window.open(driveLink, '_blank');
    }
  };"""

new_disclaimer = """  const handleDisclaimerAgree = async () => {
    setDisclaimerOpen(false);
    if (disclaimerType === 'submit') {
      await submitForm();
    } else if (disclaimerType === 'drive' && driveLink) {
      setVerificationOpen(true);
    }
  };

  const handleVerifyAccess = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: asset.id, email: verifyEmail, code: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xác thực');
      
      setVerificationOpen(false);
      window.open(driveLink, '_blank');
    } catch (e: any) {
      setVerifyError(e.message);
    } finally {
      setVerifying(false);
    }
  };"""

content = content.replace(old_disclaimer, new_disclaimer)

# 3. Add Verification Modal UI
modal_ui = """
      {/* Verification Dialog */}
      <Dialog open={verificationOpen} onClose={() => setVerificationOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pb: 1 }}>Truy cập Google Drive</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Tài liệu này được bảo mật. Vui lòng nhập Email đã đăng ký và Mã bảo vệ do Ban quản trị cấp để truy cập.
          </Typography>
          {verifyError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{verifyError}</Alert>}
          <TextField fullWidth label="Email của bạn" type="email" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Mã bảo vệ" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button fullWidth variant="contained" onClick={handleVerifyAccess} disabled={verifying || !verifyEmail || !verifyCode} sx={{ borderRadius: 100, py: 1.5, fontWeight: 700 }}>
            {verifying ? 'Đang kiểm tra...' : 'Xác thực & Mở Link'}
          </Button>
          <Button fullWidth onClick={() => setVerificationOpen(false)} sx={{ borderRadius: 100, color: 'text.secondary', fontWeight: 600 }}>Hủy bỏ</Button>
        </DialogActions>
      </Dialog>
"""

content = content.replace("      {/* Disclaimer Dialog */}", modal_ui + "\n      {/* Disclaimer Dialog */}")

with open('src/components/AssetDetailModal.tsx', 'w') as f:
    f.write(content)
