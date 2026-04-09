import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { processPayment } from '../services/paymentService';

export function usePayment() {
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const idempotencyKeyRef = useRef(null);

  const pay = useCallback(async (holdId, amount, customerInfo = {}) => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await processPayment(holdId, amount, idempotencyKeyRef.current, customerInfo);
      setPayment(data);
      return { success: true, data };
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.status === 'DECLINED') {
        setError('Pago rechazado por el banco. La habitación fue liberada.');
        return { success: false, declined: true };
      }
      const message = responseData?.detail ?? 'Error al procesar el pago';
      setError(message);
      return { success: false, declined: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetKey = useCallback(() => {
    idempotencyKeyRef.current = null;
    setPayment(null);
    setError(null);
  }, []);

  return { payment, isLoading, error, pay, resetKey };
}
