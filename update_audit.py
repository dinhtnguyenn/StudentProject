with open('/Users/dinhnguyen/.gemini/antigravity/brain/4a75dc99-522d-4721-a4be-e9512c210e46/rbac_audit.md', 'r') as f:
    content = f.read()

content += """

## Cập nhật Patch Mới Nhất
- Sửa lỗi Form Thêm Loại Bài Viết: Chuyển quyền yêu cầu từ `articles.add` sang `categories.add` (Đã đồng bộ như các Form Thêm Loại khác).
- Sửa lỗi quyền OWN không thể nhấn nút Sửa khi thêm mới: Dữ liệu (Dự án, Bài viết, Tài nguyên) khi thêm mới đã được đính kèm trường `userCreate` để hệ thống hiểu được ai là chủ sở hữu, từ đó nút Sửa không còn bị vô hiệu hoá sai.
- Ẩn toàn bộ nút "Xoá Hàng Loạt" (Bulk Delete) trên mọi phân hệ nếu người dùng không có quyền `delete` tương ứng.
"""

with open('/Users/dinhnguyen/.gemini/antigravity/brain/4a75dc99-522d-4721-a4be-e9512c210e46/rbac_audit.md', 'w') as f:
    f.write(content)
