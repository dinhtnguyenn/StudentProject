import re

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

# 1. Disable inputs in SortableProjectItem
def disable_inputs_project(match):
    block = match.group(0)
    # Add disabled={!canEdit} to InputBase, Select, TextField, Autocomplete, IconButton
    block = re.sub(r'<(InputBase|Select|TextField|Autocomplete|Checkbox)\b(?!.*disabled=\{!canEdit\})', r'<\1 disabled={!canEdit} ', block)
    # Only disable IconButtons that are not for expansion/viewing.
    # Actually, we can just replace all IconButtons that do "onInlineEdit" or "onImageUpload" or "onDelete"
    block = re.sub(r'<IconButton([^>]*onClick=\{\s*\([^)]*\)\s*=>\s*onInlineEdit[^>]*>)', r'<IconButton disabled={!canEdit}\1', block)
    block = re.sub(r'<IconButton([^>]*title="Tải ảnh từ máy"[^>]*>)', r'<IconButton disabled={!canEdit || isUploadingImage}\1', block)
    # Drag indicator: <Box {...attributes} {...listeners}
    block = re.sub(r'<Box\s+\{\.\.\.attributes\}\s+\{\.\.\.listeners\}\s+sx=\{\{ cursor: \'grab\'', r'<Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? \'grab\' : \'not-allowed\'', block)
    return block

content = re.sub(r'(?s)function SortableProjectItem.*?return \(\s*<Box ref=\{setNodeRef\}.*?// --- Sortable Article Item', lambda m: disable_inputs_project(m) + '\n// --- Sortable Article Item', content)

# 2. Disable inputs in SortableArticleItem
def disable_inputs_article(match):
    block = match.group(0)
    block = re.sub(r'<(InputBase|Select|TextField|Autocomplete|Checkbox)\b(?!.*disabled=\{!canEdit\})', r'<\1 disabled={!canEdit} ', block)
    block = re.sub(r'<IconButton([^>]*onClick=\{\s*\([^)]*\)\s*=>\s*onInlineEdit[^>]*>)', r'<IconButton disabled={!canEdit}\1', block)
    block = re.sub(r'<IconButton([^>]*title="Tải ảnh từ máy"[^>]*>)', r'<IconButton disabled={!canEdit || isUploadingImage}\1', block)
    block = re.sub(r'<Box\s+\{\.\.\.attributes\}\s+\{\.\.\.listeners\}\s+sx=\{\{ cursor: \'grab\'', r'<Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? \'grab\' : \'not-allowed\'', block)
    return block

content = re.sub(r'(?s)function SortableArticleItem.*?return \(\s*<Box ref=\{setNodeRef\}.*?// --- Sortable Unity Asset Item', lambda m: disable_inputs_article(m) + '\n// --- Sortable Unity Asset Item', content)

# 3. Disable inputs in SortableUnityAssetItem
def disable_inputs_unity(match):
    block = match.group(0)
    block = re.sub(r'<(InputBase|Select|TextField|Autocomplete|Checkbox)\b(?!.*disabled=\{!canEdit\})', r'<\1 disabled={!canEdit} ', block)
    block = re.sub(r'<IconButton([^>]*onClick=\{\s*\([^)]*\)\s*=>\s*onInlineEdit[^>]*>)', r'<IconButton disabled={!canEdit}\1', block)
    block = re.sub(r'<IconButton([^>]*title="Tải ảnh từ máy"[^>]*>)', r'<IconButton disabled={!canEdit || isUploadingImage}\1', block)
    block = re.sub(r'<Box\s+\{\.\.\.attributes\}\s+\{\.\.\.listeners\}\s+sx=\{\{ cursor: \'grab\'', r'<Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? \'grab\' : \'not-allowed\'', block)
    return block

# The last one goes until the end of SortableUnityAssetItem, which ends before `export default function AdminForm`
content = re.sub(r'(?s)function SortableUnityAssetItem.*?return \(\s*<Box ref=\{setNodeRef\}.*?export default function AdminForm', lambda m: disable_inputs_unity(m) + '\nexport default function AdminForm', content)


# 4. Hide "Add Forms" for Projects, Articles, UnityAssets if !hasPerm(module, 'add')
# We can wrap the `formData.id ? 'Cập Nhật Nháp' : 'Lưu Nháp Mới'` form areas.
# But actually, the form is used for BOTH adding new and editing existing if they click "Edit".
# Wait! In this codebase, does clicking a SortableProjectItem Edit button use the top form?
# No, SortableProjectItem uses `onInlineEdit` for all edits! The top form is ONLY for adding new items!
# Let's verify this!

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
