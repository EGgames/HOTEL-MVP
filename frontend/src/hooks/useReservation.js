import { useState, useEffect } from 'react';
import { getReservationByCode } from '../services/reservationService';

export function useReservation(reservationCode) {
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reservationCode) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getReservationByCode(reservationCode)
      .then((data) => {
        if (!cancelled) setReservation(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail ?? 'Reserva no encontrada');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservationCode]);

  return { reservation, isLoading, error };
}
