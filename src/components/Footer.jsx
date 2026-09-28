import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="footer-brand">Notik</div>
          <p className="footer-desc">Không gian làm việc trực quan cho các đội ngũ sáng tạo. Kế hoạch, thiết kế và cộng tác dễ dàng.</p>
          <div className="social-links">
            <a href="#twitter" aria-label="Twitter">🐦</a>
            <a href="#linkedin" aria-label="LinkedIn">💼</a>
            <a href="#youtube" aria-label="YouTube">▶️</a>
          </div>
        </div>
        <div className="footer-links-col">
          <h3>Sản phẩm</h3>
          <ul>
            <li><a href="#features">Tính năng</a></li>
            <li><a href="#integrations">Tích hợp</a></li>
            <li><a href="#pricing">Bảng giá</a></li>
            <li><a href="#changelog">Cập nhật mới</a></li>
          </ul>
        </div>
        <div className="footer-links-col">
          <h3>Giải pháp</h3>
          <ul>
            <li><a href="#marketing">Marketing</a></li>
            <li><a href="#product">Quản lý sản phẩm</a></li>
            <li><a href="#engineering">Kỹ thuật</a></li>
            <li><a href="#design">Thiết kế</a></li>
          </ul>
        </div>
        <div className="footer-links-col">
          <h3>Tài nguyên</h3>
          <ul>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#help">Trung tâm trợ giúp</a></li>
            <li><a href="#community">Cộng đồng</a></li>
            <li><a href="#webinar">Webinars</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Notik Inc. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#privacy">Chính sách bảo mật</a>
          <a href="#terms">Điều khoản sử dụng</a>
        </div>
      </div>
    </footer>
  );
}
