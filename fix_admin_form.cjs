const fs = require('fs');
let content = fs.readFileSync('src/components/AdminForm.tsx', 'utf-8');

// 1. Add states
content = content.replace(
  "const [changePasswordOpen, setChangePasswordOpen] = useState(false);",
  "const [changePasswordOpen, setChangePasswordOpen] = useState(false);\n  const [forceProfileOpen, setForceProfileOpen] = useState(false);\n  const [profileEmail, setProfileEmail] = useState('');"
);

// 2. Update initAuth
content = content.replace(
  "setCurrentUser(JSON.parse(user));\n        setLoginPassword(pass);",
  "const parsedUser = JSON.parse(user);\n        setCurrentUser(parsedUser);\n        setLoginPassword(pass);\n        if (parsedUser.mustChangePassword || !parsedUser.email) setForceProfileOpen(true);"
);

// 3. Update handleLogin
content = content.replace(
  "setIsAuthenticated(true);\n      setStatus({ type: 'success', message: 'Đăng nhập thành công!' });",
  "setIsAuthenticated(true);\n      if (user.mustChangePassword || !user.email) setForceProfileOpen(true);\n      setStatus({ type: 'success', message: 'Đăng nhập thành công!' });"
);

// 4. Update Header button
content = content.replace(
  /{currentUser\?\.role === 'MOD' && \(\s*<Button variant="outlined" color="primary" onClick=\{[^}]+\} sx=\{\{ borderRadius: 100, fontWeight: 700, px: 2 \}\}>\s*Đổi Mật Khẩu\s*<\/Button>\s*\)}/g,
  `<Button variant="outlined" color="primary" onClick={() => { setChangePasswordOpen(true); setProfileEmail(currentUser?.email || ''); setNewPassword(''); setConfirmNewPassword(''); }} sx={{ borderRadius: 100, fontWeight: 700, px: 2 }}>\n              Hồ Sơ Của Tôi\n            </Button>`
);

// 5. Replace handleChangePassword with handleSaveProfile
const oldHandleChangePassword = `  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setStatus({ type: 'error', message: 'Mật khẩu phải từ 6 ký tự trở lên' }); return; }
    if (newPassword !== confirmNewPassword) { setStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp' }); return; }
    setChangingPassword(true);
    try {
      const res = await fetch(\`\${WORKER_URL}/api/change-password\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Basic \${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}\` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      setStatus({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setChangePasswordOpen(false);
      setTimeout(() => handleLogout(), 2000);
    } catch (err: any) { setStatus({ type: 'error', message: err.message }); }
    finally { setChangingPassword(false); }
  };`;

const newHandleSaveProfile = `  const handleSaveProfile = async (isForced = false) => {
    if (!profileEmail) { setStatus({ type: 'error', message: 'Vui lòng nhập Email' }); return; }
    if (newPassword || isForced || currentUser?.mustChangePassword) {
      if (newPassword.length < 6) { setStatus({ type: 'error', message: 'Mật khẩu phải từ 6 ký tự trở lên' }); return; }
      if (newPassword !== confirmNewPassword) { setStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp' }); return; }
    }
    
    setChangingPassword(true);
    try {
      const basicAuth = \`Basic \${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}\`;
      
      const resProfile = await fetch(\`\${WORKER_URL}/api/users/profile\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': basicAuth },
        body: JSON.stringify({ email: profileEmail })
      });
      if (!resProfile.ok) throw new Error('Có lỗi xảy ra khi cập nhật email');
      
      let updatedUser = { ...currentUser, email: profileEmail };
      
      let changedPass = false;
      if (newPassword) {
        const resPass = await fetch(\`\${WORKER_URL}/api/change-password\`, {
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
  };`;

content = content.replace(oldHandleChangePassword, newHandleSaveProfile);

// 6. Delete ALL occurrences of the old changePasswordOpen dialog
const oldDialog1 = `<Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Đổi Mật Khẩu</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Mật khẩu mới" type="password" fullWidth value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setChangePasswordOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={changingPassword} sx={{ fontWeight: 700 }}>
            {changingPassword ? <CircularProgress size={24} /> : 'Cập Nhật'}
          </Button>
        </DialogActions>
      </Dialog>`;

const oldDialog2 = `<Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Đổi Mật Khẩu</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Mật khẩu mới" type="password" fullWidth value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setChangePasswordOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={changingPassword} sx={{ fontWeight: 700, borderRadius: 2 }}>
            {changingPassword ? <CircularProgress size={24} color="inherit" /> : 'Xác Nhận Đổi'}
          </Button>
        </DialogActions>
      </Dialog>`;

content = content.replace(oldDialog1, '');
content = content.replace(oldDialog2, '');

const newDialogs = `      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} fullWidth maxWidth="xs">
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
      </Dialog>`;

// Insert the new dialogs right before the final </Box>
content = content.replace("    </Box>\n  );\n}", newDialogs + "\n    </Box>\n  );\n}");

fs.writeFileSync('src/components/AdminForm.tsx', content, 'utf-8');
