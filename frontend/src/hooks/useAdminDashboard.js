import { useState, useCallback } from 'react';
import { getDashboard } from '../services/adminService';

export function useAdminDashboard(token) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboard(token);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return { stats, isLoading, error, fetchStats };
}
