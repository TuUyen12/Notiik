import { useState, useEffect } from 'react';
import './HomePage.css';
import noteEditorImg from '../../assets/images/note_editor.jpg';
import collabImg from '../../assets/images/collaboration.jpg';
import cloudStorageImg from '../../assets/images/cloud_storage.jpg';

const demoImages = [noteEditorImg, collabImg, cloudStorageImg];

export default function HomePage() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % demoImages.length);
      }, 3000); // Change image every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <main className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Nơi mọi ý tưởng <span className="highlight-text">thăng hoa</span></h1>
          <p className="subtitle">
            Notik là không gian làm việc trực quan giúp mọi đội ngũ sáng tạo, lên kế hoạch và cộng tác trên cùng một nền tảng.
          </p>
          <div className="hero-signup">
            <input type="email" placeholder="Nhập email công việc của bạn" className="hero-input" />
            <button className="primary-btn">Đăng ký miễn phí</button>
          </div>
          <p className="hero-hint">Giữ công việc và đời tư tách biệt bằng cách dùng email công ty.</p>
        </div>
        
        <div className="hero-image-container">
          <div className="mockup-window">
            <div className="mockup-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="sidebar-item active">📝 Kế hoạch ra mắt</div>
                <div className="sidebar-item">💡 Ý tưởng tính năng</div>
                <div className="sidebar-item">📅 OKRs Q3/2026</div>
                <div className="sidebar-item">🎨 Design System</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-toolbar">
                  <span className="toolbar-icon">B</span>
                  <span className="toolbar-icon">I</span>
                  <span className="toolbar-icon">U</span>
                  <div className="toolbar-divider"></div>
                  <span className="toolbar-icon">🔗</span>
                  <span className="toolbar-icon">🖼️</span>
                  <div className="toolbar-divider"></div>
                  <span className="toolbar-icon share-btn">Chia sẻ</span>
                </div>
                <div className="mockup-editor">
                  <h2 className="mockup-real-title">Kế hoạch ra mắt Notik 🚀</h2>
                  <p className="mockup-real-text">
                    Ứng dụng ghi chú và làm việc nhóm thế hệ mới. Mục tiêu hoàn thiện bản Beta vào đầu tháng tới.
                  </p>
                  <div className="mockup-todo-list">
                    <div className="todo-item checked">
                      <span className="checkbox">☑</span> <span className="strikethrough">Thiết kế Landing Page</span>
                    </div>
                    <div className="todo-item active">
                      <span className="checkbox">☐</span> <span>Tích hợp AI Assistant</span> <span className="mockup-cursor"></span>
                    </div>
                    <div className="todo-item">
                      <span className="checkbox">☐</span> <span>Mở đăng ký dùng thử Beta</span>
                    </div>
                  </div>
                  <div className="mockup-comment-overlay">
                    <div className="mockup-avatar">H</div>
                    <div className="mockup-comment-box">Tuyệt vời! Thiết kế trông rất gọn gàng. 👍</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="video-section">
        <h2 className="video-title">Tất cả trong một không gian duy nhất</h2>
        <div className="video-wrapper faux-video" onClick={togglePlay}>
          {demoImages.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt={`Demo frame ${idx}`} 
              className={`demo-frame ${idx === currentFrame ? 'active' : ''}`}
            />
          ))}
          
          <div className="faux-video-controls">
            <button className="play-pause-btn">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((currentFrame + 1) / demoImages.length) * 100}%`,
                  transition: isPlaying ? 'width 3s linear' : 'none'
                }}
              ></div>
            </div>
          </div>
          
          {!isPlaying && (
            <div className="play-overlay">
              <span>▶</span>
            </div>
          )}
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="zigzag-row">
          <div className="zigzag-text">
            <h2>Ghi chú và soạn thảo đa định dạng</h2>
            <p>Hỗ trợ văn bản, danh sách, bảng biểu và Markdown. Lưu trữ mọi ý tưởng của bạn một cách có hệ thống để không bao giờ bỏ lỡ thông tin quan trọng.</p>
            <a href="#learn-more" className="learn-more-link">Tìm hiểu thêm →</a>
          </div>
          <div className="zigzag-image">
            <img src={noteEditorImg} alt="Giao diện Ghi chú đa định dạng" className="feature-screenshot" />
          </div>
        </div>

        <div className="zigzag-row reverse">
          <div className="zigzag-text">
            <h2>Cộng tác thời gian thực cùng đội nhóm</h2>
            <p>Cho phép nhiều người cùng nhập nội dung, bình luận và theo dõi thay đổi ngay lập tức. Xóa bỏ mọi rào cản giao tiếp trong công việc.</p>
            <a href="#learn-more" className="learn-more-link">Tìm hiểu thêm →</a>
          </div>
          <div className="zigzag-image">
            <img src={collabImg} alt="Giao diện Cộng tác thời gian thực" className="feature-screenshot" />
          </div>
        </div>

        <div className="zigzag-row">
          <div className="zigzag-text">
            <h2>Lưu trữ đám mây an toàn & đồng bộ</h2>
            <p>Tự động đồng bộ trên mọi thiết bị. Dữ liệu của bạn luôn được mã hóa và bảo vệ bằng những tiêu chuẩn bảo mật hàng đầu.</p>
            <a href="#learn-more" className="learn-more-link">Tìm hiểu thêm →</a>
          </div>
          <div className="zigzag-image">
            <img src={cloudStorageImg} alt="Giao diện Lưu trữ đám mây" className="feature-screenshot" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Bắt đầu hành trình sáng tạo cùng Notik</h2>
          <p>Tham gia cùng hàng ngàn người dùng đang cải thiện hiệu suất làm việc mỗi ngày.</p>
          <button className="primary-btn btn-large">Tạo tài khoản ngay</button>
        </div>
      </section>
    </main>
  );
}
