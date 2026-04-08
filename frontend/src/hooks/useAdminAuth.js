import { useState, useCallback, useEffect } from 'react';
import { adminLogin } from '../services/adminService';

const TOKEN_KEY = 'admin_token';

export function useAdminAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminLogin(email, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored !== token) setToken(stored);
  }, [token]);

  return { token, isAuthenticated, isLoading, error, login, logout };
}
