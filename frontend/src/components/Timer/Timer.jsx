import { useEffect, useState, useRef } from 'react';
import styles from './Timer.module.css';

export function Timer({ remainingSeconds, isExpired, onExpired }) {
  const [seconds, setSeconds] = useState(remainingSeconds ?? 0);
  const tickRef = useRef(null);

  useEffect(() => {
    if (remainingSeconds != null) {
      setSeconds(remainingSeconds);
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (isExpired) {
      clearInterval(tickRef.current);
      return;
    }

    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          onExpired?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [isExpired, onExpired]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;

  if (isExpired || seconds <= 0) {
    return (
      <div className={styles.expired}>
        ⏰ El tiempo de reserva ha expirado
      </div>
    );
  }

  return (
    <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
      <span className={styles.label}>Habitación reservada por</span>
      <span className={styles.countdown}>
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      <span className={styles.sublabel}>
        {isUrgent ? '¡Completá el pago pronto!' : 'Completá el pago antes de que expire'}
      </span>
    </div>
  );
}
