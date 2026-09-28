# Giải thích Component `HomePage` (Trang chủ)

**File liên quan:** 
- `src/pages/HomePage/HomePage.jsx`
- `src/pages/HomePage/HomePage.css`

## 1. Mục đích của HomePage
`HomePage` là trang đầu tiên người dùng nhìn thấy (Landing Page). Giao diện hiện tại được lấy cảm hứng trực tiếp từ thiết kế chuyên nghiệp của **Miro**, mang đậm phong cách SaaS (phần mềm dịch vụ): chữ siêu to đậm, bố cục chia đôi màn hình (Split Layout), và các khối tính năng xen kẽ.

Cấu trúc gồm 4 phần chính:
1. **Hero Section (Split Layout):** Bên trái là chữ và form điền email đăng ký. Bên phải là hình ảnh Mockup giao diện ứng dụng.
2. **Video Section (Trình chiếu Faux-Video):** Mô phỏng một trình phát video tự động chuyển đổi các bức ảnh giao diện (Mockup), tăng tính chân thực và mượt mà mà không tốn nhiều băng thông như video thật.
3. **Features Section (Zig-zag Layout):** Các khối tính năng được trình bày xen kẽ (chữ trái/ảnh phải, sau đó chữ phải/ảnh trái).
4. **CTA Section:** Khối kêu gọi chốt đăng ký với tông màu hồng pastel nhẹ nhàng, làm nổi bật nút bấm chính mà không gây chói mắt.

## 2. Giải thích chi tiết mã trong `HomePage.jsx`

### a. Khối Hero và Email Signup
```jsx
<div className="hero-signup">
  <input type="email" placeholder="Nhập email công việc..." className="hero-input" />
  <button className="primary-btn">Đăng ký miễn phí</button>
</div>
```
- Khác với thiết kế cũ chỉ có nút bấm, thiết kế mới theo kiểu Miro yêu cầu người dùng nhập email ngay lập tức. Điều này giúp giảm bớt 1 bước click chuột cho người dùng và tăng tỉ lệ chuyển đổi (Conversion Rate).

### b. Khối giao diện giả lập (Mockup Window)
```jsx
<div className="hero-image-container">
  <div className="mockup-window">
    {/* Header giả lập macOS */}
    <div className="mockup-header">...</div>
```
- **Lý do dùng:** Giúp người dùng hình dung ngay lập tức hình dáng của phần mềm mà không cần đọc nhiều chữ. Mockup được tạo hoàn toàn bằng HTML/CSS mô phỏng lại một trình soạn thảo thực thụ gồm: Sidebar, Toolbar, Text Editor và Popup Comment lơ lửng.

### c. Trình phát Video mô phỏng (Faux Video Carousel)
```jsx
const [currentFrame, setCurrentFrame] = useState(0);
const [isPlaying, setIsPlaying] = useState(true);

// ... setInterval để tự động chuyển ảnh ...
```
- Sử dụng Hook `useEffect` và `setInterval` của React để chuyển qua lại 3 bức ảnh giao diện mỗi 3 giây. Cách tiếp cận "faux-video" này giúp trang web load nhanh hơn rất nhiều so với tải một video thực tế, nhưng vẫn mang lại trải nghiệm động (dynamic) cuốn hút.

### d. Bố cục Zig-zag (Tính năng xen kẽ)
```jsx
<div className="zigzag-row">
  <div className="zigzag-text">...</div>
  <div className="zigzag-image">...</div>
</div>

<div className="zigzag-row reverse">
  <div className="zigzag-text">...</div>
  <div className="zigzag-image">...</div>
</div>
```
- **Cách dùng:** Chúng ta sử dụng class `.reverse` kết hợp với thuộc tính `direction: rtl` trong CSS để đảo ngược vị trí của chữ và ảnh mà không cần phải viết lại thứ tự HTML. Cách trình bày Z-pattern (đọc theo đường zigzag từ trái sang phải, xuống dòng) là một quy tắc UI/UX kinh điển để mắt người đọc không bị mỏi khi lướt qua nhiều nội dung.

## 3. Một số điểm nhấn trong CSS (`HomePage.css`)

- **Bố cục chia đôi (Split Layout):** Dùng `grid-template-columns: 1fr 1fr;`.
- **Màu sắc Miro-style:** Tiêu đề dùng màu xanh đen đậm `#050038` kết hợp với màu hồng chủ đạo của bạn (`var(--primary)`) tạo sự tương phản cực mạnh.
- **Thủ thuật đảo ngược cột:**
  ```css
  .zigzag-row.reverse { direction: rtl; } /* Đảo dòng từ phải qua trái */
  .zigzag-row.reverse > * { direction: ltr; } /* Đưa chữ bên trong về lại ltr */
  ```
  Đây là một thủ thuật cực kỳ thông minh bằng CSS để làm Zig-zag layout mà không dùng tới `flex-direction: row-reverse`!
