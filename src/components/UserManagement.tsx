import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Select, MenuItem, Checkbox, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

const MODULES = [
  { id: 'projects', label: 'Dự Án' },
  { id: 'categories', label: 'Loại Dự Án' },
  { id: 'articles', label: 'Bài Viết' },
  { id: 'articleTypes', label: 'Loại Bài Viết' },
  { id: 'majors', label: 'Chuyên Ngành' },
  { id: 'assets', label: 'Tài Nguyên' },
  { id: 'assetSources', label: 'Nguồn Tài Nguyên' },
  { id: 'assetTypes', label: 'Loại Tài Nguyên' },
  { id: 'driveAccess', label: 'Quản Lý Mã/Yêu Cầu Drive' }
];

export default function UserManagement({ workerUrl, currentUser }: { workerUrl: string, currentUser: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editUser, setEditUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const getHeaders = () => ({
    'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}`,
    'Content-Type': 'application/json'
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${workerUrl}/api/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách user');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editUser.username || !editUser.password) {
      alert('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    setIsSaving(true);
    try {
      const method = users.find(u => u.username === editUser.username) ? 'PUT' : 'POST';
      const url = method === 'PUT' ? `${workerUrl}/api/users/${editUser.username}` : `${workerUrl}/api/users`;
      
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(editUser)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi lưu user');
      }
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Bạn có chắc muốn xoá ${username}?`)) return;
    try {
      const res = await fetch(`${workerUrl}/api/users/${username}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Lỗi xoá user');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const initNewUser = () => {
    const defaultPerms: any = {};
    MODULES.forEach(m => {
      defaultPerms[m.id] = { view: false, add: false, edit: 'NONE', delete: 'NONE' };
    });
    setEditUser({ username: '', password: '', role: 'MOD', permissions: defaultPerms });
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, color: 'error.main' }}>{error}</Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Tài Khoản (MOD)</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={initNewUser}>Thêm Tài Khoản Mới</Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Tài Khoản</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mật Khẩu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vai Trò</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.username}>
                <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {showPassword[u.username] ? u.password : '••••••••'}
                    </Typography>
                    <Button size="small" onClick={() => setShowPassword(p => ({ ...p, [u.username]: !p[u.username] }))}>
                      {showPassword[u.username] ? 'Ẩn' : 'Hiện'}
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={u.role} color={u.role === 'SUPERADMIN' ? 'error' : 'primary'} size="small" sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setEditUser(JSON.parse(JSON.stringify(u)))} color="primary"><EditIcon /></IconButton>
                  {u.username !== currentUser.username && (
                    <IconButton onClick={() => handleDeleteUser(u.username)} color="error"><DeleteIcon /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {users.find(u => u?.username === editUser?.username) ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
        </DialogTitle>
        <DialogContent dividers>
          {editUser && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  fullWidth label="Tên Đăng Nhập" 
                  value={editUser.username} 
                  disabled={users.some(u => u.username === editUser.username)}
                  onChange={e => setEditUser({...editUser, username: e.target.value})} 
                  sx={{ mb: 2 }}
                />
                <TextField 
                  fullWidth label="Mật Khẩu" 
                  value={editUser.password} 
                  onChange={e => setEditUser({...editUser, password: e.target.value})} 
                  sx={{ mb: 2 }}
                />
                <Select 
                  fullWidth value={editUser.role} 
                  onChange={e => setEditUser({...editUser, role: e.target.value})}
                >
                  <MenuItem value="MOD">MOD</MenuItem>
                  <MenuItem value="SUPERADMIN">SUPERADMIN</MenuItem>
                </Select>
              </Grid>
              
              <Grid size={{ xs: 12, md: 8 }}>
                {editUser.role === 'SUPERADMIN' ? (
                  <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 2 }}>
                    <Typography variant="h6" color="error" sx={{ fontWeight: 700 }}>Quyền Truy Cập Vô Hạn</Typography>
                    <Typography variant="body2" color="text.secondary">Tài khoản SUPERADMIN có tất cả mọi quyền trên hệ thống.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>View</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Add</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Edit</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Delete</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {MODULES.map(m => {
                          const p = editUser.permissions?.[m.id] || { view: false, add: false, edit: 'NONE', delete: 'NONE' };
                          const updatePerm = (action: string, val: any) => {
                            const newPerms = { ...editUser.permissions, [m.id]: { ...p, [action]: val } };
                            setEditUser({ ...editUser, permissions: newPerms });
                          };
                          
                          return (
                            <TableRow key={m.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{m.label}</TableCell>
                              <TableCell align="center">
                                <Checkbox checked={p.view} onChange={e => updatePerm('view', e.target.checked)} />
                              </TableCell>
                              <TableCell align="center">
                                <Checkbox checked={p.add} onChange={e => updatePerm('add', e.target.checked)} />
                              </TableCell>
                              <TableCell align="center">
                                <Select size="small" value={p.edit} onChange={e => updatePerm('edit', e.target.value)}>
                                  <MenuItem value="NONE">Không</MenuItem>
                                  <MenuItem value="OWN">Sở hữu</MenuItem>
                                  <MenuItem value="ALL">Tất cả</MenuItem>
                                </Select>
                              </TableCell>
                              <TableCell align="center">
                                <Select size="small" value={p.delete} onChange={e => updatePerm('delete', e.target.value)}>
                                  <MenuItem value="NONE">Không</MenuItem>
                                  <MenuItem value="OWN">Sở hữu</MenuItem>
                                  <MenuItem value="ALL">Tất cả</MenuItem>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditUser(null)} color="inherit" sx={{ fontWeight: 600 }}>Huỷ</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={16} color="inherit"/> : <SaveIcon />} sx={{ fontWeight: 700 }}>
            Lưu Tài Khoản
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
