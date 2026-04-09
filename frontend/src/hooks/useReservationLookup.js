import { useState, useCallback } from 'react';
import { lookupReservation } from '../services/reservationService';

export function useReservationLookup() {
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookup = useCallback(async (code) => {
    setIsLoading(true);
    setError(null);
    setReservation(null);
    try {
      const data = await lookupReservation(code);
      setReservation(data);
      return data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError('No se encontró ninguna reserva con ese código.');
      } else {
        setError(err.response?.data?.message ?? 'Error al buscar la reserva');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setReservation(null);
    setError(null);
  }, []);

  return { reservation, isLoading, error, lookup, reset };
}
