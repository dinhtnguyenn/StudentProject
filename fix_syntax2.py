with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

content = content.replace("type=\"date\" \n                  disabled={!canEdit}", "type=\"date\"")

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
