# TÀI LIỆU COMPONENT: AuthModal
**Đường dẫn:** `src/components/AuthModal.jsx`

## 1. Mục Đích
- Là Hộp thoại (Modal) cung cấp giao diện Đăng nhập (Login) và Đăng ký (Sign Up) cho người dùng.
- Tương tác trực tiếp với Supabase Authentication để xác thực danh tính.

## 2. Các State Cốt Lõi (State Management)
- `isLoginMode` (boolean): Chuyển đổi qua lại giữa form Đăng nhập và Đăng ký.
- `email`, `password` (string): Lưu thông tin người dùng nhập vào.
- `error` (string): Lưu lỗi từ Supabase (vd: Sai mật khẩu, Email chưa xác thực).
- `successMsg` (string): Lưu thông báo thành công (vd: Yêu cầu kiểm tra email để xác thực).
- `loading` (boolean): Khóa nút bấm và hiển thị trạng thái "Đang xử lý..." khi gửi API.

## 3. Chức Năng Chính
- **Đăng ký (Sign Up):** Gọi `supabase.auth.signUp()`. Vì mặc định Supabase yêu cầu xác thực email, nên khi đăng ký thành công, form sẽ báo màu xanh yêu cầu người dùng vào email để kích hoạt.
- **Đăng nhập (Sign In):** Gọi `supabase.auth.signInWithPassword()`. Nếu thành công, đóng Modal.
- **Quản lý Lỗi:** Bắt các lỗi phổ biến (như "Email not confirmed") và báo đỏ trực quan.

## 4. Đặc Điểm Giao Diện (UI/UX)
- Giao diện mờ nền (Overlay) và chặn tương tác bên ngoài.
- Có nút "X" để đóng modal dễ dàng thông qua hàm `onClose`.
- Nút bấm thay đổi văn bản linh hoạt ("Đăng nhập" / "Đang xử lý...").
