import re

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

# 1. Fix duplicate disabled in Image Upload buttons
content = content.replace("disabled={!canEdit || isUploadingImage} component=\"label\" disabled={isUploadingImage}", "disabled={!canEdit || isUploadingImage} component=\"label\"")
content = content.replace("disabled={!canEdit || isUploadingImage} component=\"label\" disabled={isUploadingImage || !canEdit}", "disabled={!canEdit || isUploadingImage} component=\"label\"")

# 2. Fix duplicate disabled in Autocomplete renderInput
content = content.replace("<TextField disabled={!canEdit}  {...params}", "<TextField {...params}")
content = content.replace("<TextField disabled={!canEdit} {...params}", "<TextField {...params}")

# 3. Revert canEdit inside SortablePreviewItem
preview_item_target = """        <Box {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} sx={{ cursor: canEdit ? 'grab' : 'not-allowed', color: 'text.disabled' }}><DragIndicatorIcon fontSize="small" /></Box>"""
preview_item_rep = """        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.disabled' }}><DragIndicatorIcon fontSize="small" /></Box>"""
content = content.replace(preview_item_target, preview_item_rep)

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
