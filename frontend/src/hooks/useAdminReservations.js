import { useState, useCallback } from 'react';
import { getReservations, createReservation, deleteReservation } from '../services/adminService';

export function useAdminReservations(token) {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReservations = useCallback(async (filters = {}) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReservations(token, filters);
      setReservations(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar reservas');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const addReservation = useCallback(async (dto) => {
    if (!token) return null;
    setError(null);
    try {
      const created = await createReservation(dto, token);
      setReservations((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al crear reserva');
      return null;
    }
  }, [token]);

  const cancelReservation = useCallback(async (id) => {
    if (!token) return false;
    setError(null);
    try {
      await deleteReservation(id, token);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cancelar reserva');
      return false;
    }
  }, [token]);

  return { reservations, isLoading, error, fetchReservations, addReservation, cancelReservation };
}
