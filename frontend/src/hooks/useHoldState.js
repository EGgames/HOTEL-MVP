import { useState, useEffect, useCallback, useRef } from 'react';
import { getHoldState } from '../services/holdService';

const SYNC_INTERVAL_MS = 5000;

export function useHoldState(holdId) {
  const [hold, setHold] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchHold = useCallback(async () => {
    if (!holdId) return;
    try {
      const data = await getHoldState(holdId);
      setHold(data);
      setRemainingSeconds(data.remaining_seconds);
      if (data.remaining_seconds <= 0 || data.status !== 'PENDING') {
        setIsExpired(true);
      }
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Error al obtener estado del hold';
      setError(message);
      setIsExpired(true);
    }
  }, [holdId]);

  useEffect(() => {
    if (!holdId) return;

    fetchHold();

    intervalRef.current = setInterval(fetchHold, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [holdId, fetchHold]);

  useEffect(() => {
    if (isExpired && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [isExpired]);

  return { hold, remainingSeconds, isExpired, error };
}
