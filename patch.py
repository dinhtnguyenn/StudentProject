import json

def apply_chunks(file_path, chunks):
    with open(file_path, 'r') as f:
        content = f.read()

    for chunk in chunks:
        target = chunk['TargetContent']
        replacement = chunk['ReplacementContent']
        if target in content:
            content = content.replace(target, replacement, 1 if not chunk.get('AllowMultiple') else -1)
        else:
            print(f"FAILED TO MATCH: {target[:50]}")
    
    with open(file_path, 'w') as f:
        f.write(content)

with open('/tmp/chunks.json', 'r') as f:
    chunks = json.load(f)

apply_chunks('/Users/dinhnguyen/Desktop/StudentProject/src/components/AdminForm.tsx', chunks)
