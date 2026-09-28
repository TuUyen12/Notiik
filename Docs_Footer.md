# Giải thích Component `Footer`

**File liên quan:**
- `src/components/Footer.jsx`
- `src/components/Footer.css`

## 1. Mục đích của Footer
Component `Footer` (Chân trang) là thành phần nằm ở cuối cùng của tất cả các trang web. Nó chứa các liên kết điều hướng phụ, thông tin bản quyền, và các liên kết mạng xã hội.

## 2. Giải thích chi tiết mã trong `Footer.jsx`
```jsx
<footer className="site-footer">
  <div className="footer-container">
    <div className="footer-brand-col">...</div>
    <div className="footer-links-col">...</div>
    ...
  </div>
</footer>
```
- **Lý do dùng:** Cấu trúc footer chuẩn của một phần mềm SaaS (lấy cảm hứng từ Miro). Bao gồm 4 cột: 1 cột hiển thị thương hiệu và mô tả ngắn, 3 cột còn lại chứa danh sách các trang con (Sản phẩm, Giải pháp, Tài nguyên). 
- Tính tái sử dụng: Footer được import vào `MainLayout.jsx` để tự động xuất hiện trên mọi trang mà không cần code lại.

## 3. Điểm nhấn trong CSS (`Footer.css`)
- **Màu sắc Miro-style:** Dùng nền xanh đen đậm `#050038` với chữ trắng, tạo độ vững chãi cho trang web ở phần cuối.
- **CSS Grid 4 cột:** Dùng `grid-template-columns: 2fr 1fr 1fr 1fr;` để chia footer thành 4 cột. Cột đầu tiên (Thương hiệu) sẽ chiếm không gian rộng gấp đôi (`2fr`) so với các cột chứa link (`1fr`).
- **Responsive:** Khi màn hình nhỏ (`max-width: 900px`), chuyển thành 2 cột. Khi cực nhỏ (`max-width: 600px`), xếp thành 1 cột dọc (Stacking).
