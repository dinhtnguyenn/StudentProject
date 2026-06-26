import re

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

# 1. Projects (tabIndex === 1 -> Add Form, but "Thêm Dự Án" is in tabIndex === 2!)
# Actually "Thêm Dự Án" button is in Tab 2, and the form is Tab 1.
# But wait, Tab 1 is `Manage Projects` List!
# Wait, let's just check the button "Thêm Dự Án" and "Thêm Bài Viết" and "Thêm Tài Nguyên".
content = content.replace(
    '<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData(',
    '{hasPerm(\'projects\', \'add\') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData('
)
content = content.replace(
    '}); setTabIndex(0); }} sx={{ borderRadius: 100, textTransform: \'none\', fontWeight: 600 }}>Thêm Dự Án</Button>',
    '}); setTabIndex(0); }} sx={{ borderRadius: 100, textTransform: \'none\', fontWeight: 600 }}>Thêm Dự Án</Button>}'
)

# 2. Articles
content = content.replace(
    '<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setArticleFormData(',
    '{hasPerm(\'articles\', \'add\') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setArticleFormData('
)
content = content.replace(
    "}); setTabIndex(3); }} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Thêm Bài Viết</Button>",
    "}); setTabIndex(3); }} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Thêm Bài Viết</Button>}"
)

# 3. UnityAssets
content = content.replace(
    '<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setUnityAssetFormData(',
    '{hasPerm(\'assets\', \'add\') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setUnityAssetFormData('
)
content = content.replace(
    "}); setTabIndex(10); }} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Thêm Tài Nguyên</Button>",
    "}); setTabIndex(10); }} sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>Thêm Tài Nguyên</Button>}"
)


with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
