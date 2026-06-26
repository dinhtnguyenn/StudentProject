with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

content = content.replace(r"\'grab\'", "'grab'")
content = content.replace(r"\'not-allowed\'", "'not-allowed'")

with open('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
