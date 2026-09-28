# TÀI LIỆU PAGE: Workspace
**Đường dẫn:** `src/pages/Workspace/Workspace.jsx`

## 1. Mục Đích
- Là không gian làm việc chính (Trang Dashboard) của ứng dụng Notiik.
- Quản lý Hệ thống ghi chú (Tạo, Đọc, Sửa, Xóa), Hộp thư thông báo và tính năng Cộng tác (Collaborative Editing).

## 2. Kiến Trúc Dữ Liệu & State
- `notesData`: Cấu trúc Object gom nhóm các ghi chú vào mảng tương ứng `{ projects: [], personal: [], shared: [] }`.
- `inboxNotifications`: Mảng lưu các thông báo mời chia sẻ (`status = 'pending'`).
- `activeTab`: Lưu tab đang mở (inbox, projects, personal, shared).
- `activeNoteId` / `activeNotificationId`: Lưu ID của đối tượng đang được chọn ở cột giữa để hiển thị chi tiết ở cột phải (Editor).
- `searchKeyword`: Từ khóa lọc danh sách ghi chú.
- `typingTimeoutRef` / `pendingUpdates`: Quản lý Debounce khi gõ chữ (Trì hoãn lưu lên Database 1 giây để tránh nghẽn mạng).

## 3. Các Chức Năng Cốt Lõi
- **Đồng bộ Supabase:** Dùng `useEffect` chạy lệnh `select()` từ bảng `notes` và `note_shares`. Tự động áp dụng các bộ lọc bảo mật RLS để trả về đúng dữ liệu được phép xem.
- **Trình soạn thảo (ReactQuill):** Cung cấp các công cụ định dạng văn bản (In đậm, Nghiêng, H1, H2, Gắn Link, Chèn Ảnh). Sử dụng prop `key={activeNote.id}` để triệt tiêu lỗi tái sử dụng Instance của thư viện.
- **Tối ưu Preview:** Tự động dùng Regex xóa sạch mã HTML sinh ra bởi ReactQuill, chuyển thẻ block (`</p>`) thành dấu xuống dòng và cắt đúng 40 ký tự của dòng đầu tiên để làm Preview cực đẹp.

## 4. Tính Năng Chia Sẻ (Collaboration)
- Nút "Chia sẻ" sẽ chèn 1 bản ghi vào bảng `note_shares` (với `status = 'pending'`).
- Người được mời sẽ thấy thông báo hiện trong tab "Hộp thư" (Inbox).
- Người được mời có quyền bấm "Tham gia dự án" (cập nhật status thành 'accepted') hoặc "Từ chối" (xóa bản ghi).
- Chỉ khi 'accepted', ghi chú đó mới xuất hiện bên tab "Đã chia sẻ" và cho phép vào chỉnh sửa.
- Chủ nhân ghi chú có toàn quyền Xóa (Trash), trong khi người được mời bị ẩn nút Xóa.

## 5. Tính Năng Dự án (Folders)
- Dự án đóng vai trò như các thư mục chứa nhiều ghi chú con. Bảng `projects` chứa thông tin thư mục cha, bảng `notes` có `project_id`.
- Khi chia sẻ 1 Dự án, toàn bộ các ghi chú con bên trong dự án đó cũng được chia sẻ theo (Bảng `project_shares`).

## 6. Tính Năng Xuất File (Export / Download)
- Tích hợp công cụ xuất dữ liệu tại thanh Topbar.
- Hỗ trợ xuất 1 Ghi chú hoặc Tải toàn bộ 1 Dự án (nén file ZIP).
- Hỗ trợ đa định dạng: Markdown (.md), MS Word (.doc), và PDF (.pdf).
- Dùng `turndown` cho MD, `html2pdf.js` cho PDF, cấu trúc Blob đặc biệt cho Word, và `jszip` & `file-saver` để tải file nén trực tiếp tại trình duyệt (Client-side).

## 7. Chế độ Tập trung (Zen Mode)
- Nút toggle hình `◧` / `◨` trên thanh Topbar cho phép ẩn toàn bộ cột điều hướng (Sidebar) và cột danh sách (Notes List).
- Khi kích hoạt, trình soạn thảo Editor sẽ mở rộng toàn màn hình, tạo không gian tập trung tối đa cho việc viết lách. Mọi thứ được xử lý gọn gàng bằng CSS class `.sidebar-hidden`.
