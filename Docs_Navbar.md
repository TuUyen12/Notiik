# Giải thích Component `Navbar` (Thanh điều hướng)

**File liên quan:** 
- `src/components/Navbar.jsx`
- `src/components/Navbar.css`

## 1. Mục đích của Navbar
Component này tạo ra một thanh điều hướng nằm ở trên cùng của trang web. Chức năng chính là giúp người dùng di chuyển giữa các khu vực của trang (Trang chủ, Tính năng, Bảng giá, v.v.) và thực hiện các hành động chung như Đăng nhập, Đăng ký.

## 2. Giải thích chi tiết mã trong `Navbar.jsx`

### a. Khai báo State (`useState`)
```jsx
import { useState } from 'react';
```
- **Lý do dùng:** Navbar của chúng ta cần hiển thị tốt trên cả máy tính (màn hình lớn) và điện thoại (màn hình nhỏ). Trên điện thoại, danh sách link sẽ bị ẩn đi và thay bằng một nút "Hamburger menu" (nút có 3 gạch ngang `☰`). Khi người dùng bấm vào nút này, menu sẽ mở ra hoặc đóng lại. Để lưu trữ trạng thái "Đang mở" hay "Đang đóng", chúng ta dùng Hook `useState` của React.

### b. Danh sách các Link (`navItems`)
```jsx
const navItems = [
  { label: 'Trang chủ', href: '#' },
  { label: 'Tính năng', href: '#features' },
  // ...
];
```
- **Lý do dùng:** Việc khai báo dữ liệu dạng mảng (Array) bên ngoài Component giúp mã nguồn gọn gàng hơn. Nếu sau này bạn cần thêm/bớt một menu item, bạn chỉ cần sửa mảng này thay vì phải kéo xuống sửa cả khối HTML (JSX) bên dưới. Điều này gọi là phương pháp "Data-driven".

### c. Hàm khởi tạo Component
```jsx
export default function Navbar() {
  const [open, setOpen] = useState(false);
  // ...
```
- Khởi tạo biến state `open` mặc định là `false` (Menu trên điện thoại bị đóng mặc định).
- Hàm `setOpen` được dùng để thay đổi giá trị của `open`.

### d. Nút Toggle (Chỉ hiện trên điện thoại)
```jsx
<button
  className="menu-toggle"
  onClick={() => setOpen((prev) => !prev)}
>
  ☰
</button>
```
- **Cách dùng:** Bắt sự kiện click chuột `onClick`.
- **Lý do dùng `(prev) => !prev`:** Khi ấn vào nút, nếu menu đang đóng (`false`) thì nó sẽ chuyển thành mở (`true`), và ngược lại. Nó lật ngược (toggle) trạng thái trước đó.

### e. Hiển thị danh sách Link
```jsx
<ul className={`nav-links ${open ? 'open' : ''}`}>
  {navItems.map((item) => (
    <li key={item.label}>
      <a href={item.href} onClick={() => setOpen(false)}>
        {item.label}
      </a>
    </li>
  ))}
</ul>
```
- **`className={\`nav-links ${open ? 'open' : ''}\`}`**: Đây là kĩ thuật dùng Template Literal trong JS. Nếu biến `open` là true, class `open` sẽ được thêm vào (thành `nav-links open`), giúp CSS hiển thị menu.
- **`.map()`**: Vòng lặp duyệt qua mảng `navItems` để render ra các thẻ `<li>` và `<a>`. 
- **`onClick={() => setOpen(false)}`**: Khi người dùng nhấn vào 1 link trên điện thoại, menu nên tự động đóng lại để họ có thể xem nội dung trang.

---

## 3. Một số điểm nhấn trong CSS (`Navbar.css`)

- **`backdrop-filter: blur(10px)`**: Tạo hiệu ứng mờ nhòe kính (Glassmorphism) cực kỳ hiện đại cho nền của Navbar.
- **`@media (max-width: 768px)`**: Responsive Design. Mọi CSS bên trong khối này chỉ áp dụng khi màn hình có kích thước nhỏ hơn hoặc bằng 768px (Điện thoại/Tablet). Ở đây chúng ta ẩn `.nav-links` đi (display: none) và chỉ hiện lại `.nav-links.open` (display: flex).
