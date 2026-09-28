import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainLayout.css';

export default function MainLayout({ children }) {
  return (
    <div className="layout-shell">
      <Navbar />
      <main className="layout-content">{children}</main>
      <Footer />
    </div>
  );
}
