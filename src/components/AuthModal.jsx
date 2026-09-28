import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();

  // Reset form khi mở lại modal và đặt đúng chế độ
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setEmail('');
      setPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login(email, password);
      } else {
        res = await signup(email, password);
      }

      if (res.error) {
        throw res.error;
      }

      // Nếu đăng ký thành công nhưng Supabase yêu cầu xác thực email (session bị null)
      if (!isLogin && !res.data.session) {
        setSuccessMsg('Đăng ký thành công! Vui lòng kiểm tra hộp thư email (hoặc thư mục Spam) để xác thực tài khoản nhé.');
        setLoading(false);
        return; // Dừng lại ở đây, không đóng popup
      }

      onClose(); // Đóng modal nếu thành công và đã đăng nhập
      window.location.hash = '#app'; // Chuyển thẳng vào Workspace
    } catch (err) {
      console.error(err);
      // Hiển thị lỗi từ Supabase trả về để dễ debug
      if (err.message === 'Email not confirmed') {
        setError('Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn!');
      } else {
        setError(err.message || (isLogin ? 'Sai email hoặc mật khẩu.' : 'Lỗi đăng ký. Có thể email đã tồn tại.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>×</button>
        
        <h2 className="auth-title">{isLogin ? 'Đăng nhập vào Notiik' : 'Tạo tài khoản Notiik'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input 
              type="email" 
              required 
              placeholder="nhapemail@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button disabled={loading} type="submit" className="auth-submit-btn">
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký miễn phí')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
