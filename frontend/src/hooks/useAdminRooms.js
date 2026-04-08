import { useState, useCallback } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../services/adminService';

export function useAdminRooms(token) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRooms(token);
      setRooms(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar habitaciones');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const addRoom = useCallback(async (dto) => {
    if (!token) return null;
    setError(null);
    try {
      const created = await createRoom(dto, token);
      setRooms((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al crear habitación');
      return null;
    }
  }, [token]);

  const editRoom = useCallback(async (id, dto) => {
    if (!token) return null;
    setError(null);
    try {
      const updated = await updateRoom(id, dto, token);
      setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al actualizar habitación');
      return null;
    }
  }, [token]);

  const removeRoom = useCallback(async (id) => {
    if (!token) return false;
    setError(null);
    try {
      await deleteRoom(id, token);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al eliminar habitación');
      return false;
    }
  }, [token]);

  return { rooms, isLoading, error, fetchRooms, addRoom, editRoom, removeRoom };
}
