import { useState, useCallback } from 'react';
import { getAvailableRooms } from '../services/roomService';

export function useAvailableRooms() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (checkin, checkout, hotelId, filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAvailableRooms(checkin, checkout, hotelId, filters);
      setRooms(data);
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Error al buscar habitaciones';
      setError(message);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rooms, isLoading, error, search };
}
