import re

with open('src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

# 1. Add states
state_insertion = """
  const [driveAccessCodes, setDriveAccessCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeFormData, setCodeFormData] = useState({ resourceId: '', email: '', durationDays: 1 });
"""
content = content.replace("const [categoriesList, setCategoriesList] = useState<Category[]>([]);", "const [categoriesList, setCategoriesList] = useState<Category[]>([]);\n" + state_insertion)

# 2. Add fetch function and handler
func_insertion = """
  const fetchDriveCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access`, {
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveAccessCodes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    if (tabIndex === 14 && currentUser) {
      fetchDriveCodes();
    }
  }, [tabIndex]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeFormData.resourceId || !codeFormData.email) return;
    
    // Find resource name for better display
    let rName = 'N/A';
    const allAssets = [...projectsList, ...unityAssetsList];
    const targetAsset = allAssets.find(a => a.id === codeFormData.resourceId);
    if (targetAsset) rName = targetAsset.name;

    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` 
        },
        body: JSON.stringify({ ...codeFormData, resourceName: rName })
      });
      if (!res.ok) throw new Error('Lỗi tạo mã');
      const data = await res.json();
      setDriveAccessCodes(data);
      setStatus({ type: 'success', message: 'Tạo mã thành công!' });
      setCodeFormData({ resourceId: '', email: '', durationDays: 1 });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa/thu hồi mã này?')) return;
    try {
      const res = await fetch(`${WORKER_URL}/api/drive-access/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${btoa(currentUser.username + ':' + sessionStorage.getItem('unifolio_pass'))}` }
      });
      if (!res.ok) throw new Error('Lỗi xóa mã');
      const data = await res.json();
      setDriveAccessCodes(data);
      setStatus({ type: 'success', message: 'Đã thu hồi mã thành công!' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    }
  };
"""
content = content.replace("const handleManualBuild = async () => {", func_insertion + "\n  const handleManualBuild = async () => {")

# 3. Add sidebar button (Tab 14)
sidebar_button = """              <ListItemButton selected={tabIndex === 14} onClick={() => setTabIndex(14)} sx={{ mt: 1, bgcolor: tabIndex === 14 ? 'primary.main' : 'rgba(168, 85, 247, 0.05)', borderRadius: 3, '&:hover': { bgcolor: tabIndex === 14 ? 'primary.dark' : 'rgba(168, 85, 247, 0.15)' } }}>
                <ListItemIcon sx={{ minWidth: 32 }}><VpnKeyIcon fontSize="small" sx={{ color: tabIndex === 14 ? '#fff' : '#A855F7' }} /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: tabIndex === 14 ? 700 : 500, fontSize: '0.9rem', color: tabIndex === 14 ? '#fff' : 'inherit' }}>Mã Bảo Vệ Drive</Typography>} />
              </ListItemButton>
"""
content = content.replace("QUẢN LÝ CHUNG\n              </ListSubheader>", "QUẢN LÝ CHUNG\n              </ListSubheader>\n" + sidebar_button)

# 4. Add VpnKeyIcon import
content = content.replace("import LockIcon from '@mui/icons-material/Lock';", "import LockIcon from '@mui/icons-material/Lock';\nimport VpnKeyIcon from '@mui/icons-material/VpnKey';")


with open('src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
