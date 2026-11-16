import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthCtx = createContext(null);
const BrandCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
export const useBrand = () => useContext(BrandCtx);

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [brand, setBrand] = useState({ appName: 'Doctor Appointment System', logoPath: null, commissionPercent: 10 });

  const loadBrand = useCallback(() => api.get('/settings/public').then((r) => setBrand(r.data)).catch(() => {}), []);
  const refreshUser = useCallback(() => api.get('/auth/me').then((r) => setUser(r.data)), []);

  useEffect(() => {
    loadBrand();
    if (localStorage.getItem('token')) {
      refreshUser()
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    }
  }, [loadBrand, refreshUser]);

  useEffect(() => {
    document.title = brand.appName;
  }, [brand.appName]);

  const login = (token, u) => {
    localStorage.setItem('token', token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <BrandCtx.Provider value={{ brand, loadBrand }}>
      <AuthCtx.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthCtx.Provider>
    </BrandCtx.Provider>
  );
}
