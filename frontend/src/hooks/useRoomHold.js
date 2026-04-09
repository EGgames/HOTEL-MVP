import { useState, useCallback } from 'react';
import { createHold } from '../services/holdService';

export function useRoomHold() {
  const [hold, setHold] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestHold = useCallback(async (roomId, checkin, checkout) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createHold(roomId, checkin, checkout);
      setHold(data);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.detail ?? 'No se pudo bloquear la habitación';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { hold, isLoading, error, requestHold };
}
