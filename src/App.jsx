import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage/HomePage';
import Workspace from './pages/Workspace/Workspace';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash);
  const { currentUser } = useAuth();

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.hash);
    };
    window.addEventListener('hashchange', onLocationChange);
    return () => window.removeEventListener('hashchange', onLocationChange);
  }, []);

  if (currentPath === '#app') {
    if (currentUser) {
      return <Workspace />;
    } else {
      // Nếu chưa đăng nhập mà cố vào Workspace, thì render Home
      window.location.hash = '';
      return (
        <MainLayout>
          <HomePage />
        </MainLayout>
      );
    }
  }

  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
