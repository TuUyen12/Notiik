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
