import { useState } from 'react';
import './Navbar.css';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Trang chủ', href: '#' },
  { label: 'Tính năng', href: '#features' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Giới thiệu', href: '#about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { currentUser, logout } = useAuth();

  const handleLoginClick = (e, mode) => {
    e.preventDefault();
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleAppClick = (e) => {
    e.preventDefault();
    window.location.hash = '#app';
  };

  return (
    <>
      <nav className="topbar" aria-label="Main navigation">
        <div className="nav-brand" onClick={() => window.location.hash = ''} style={{ cursor: 'pointer' }}>
          Notiik
        </div>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {navItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <button type="button" className="nav-login" onClick={logout}>Đăng xuất</button>
              <button type="button" className="nav-button" onClick={handleAppClick}>Vào ứng dụng</button>
            </>
          ) : (
            <>
              <button type="button" className="nav-login" onClick={(e) => handleLoginClick(e, 'login')}>Đăng nhập</button>
              <button type="button" className="nav-button" onClick={(e) => handleLoginClick(e, 'signup')}>Đăng ký miễn phí</button>
            </>
          )}
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
