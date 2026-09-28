import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    // Lấy session hiện tại khi load trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Lắng nghe mọi sự kiện thay đổi auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hàm Đăng ký
  const signup = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  // Hàm Đăng nhập
  const login = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  // Hàm Đăng xuất
  const logout = () => {
    return supabase.auth.signOut();
  };

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
