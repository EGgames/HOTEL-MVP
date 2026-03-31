import { useState } from 'react';
import { Timer } from '../Timer/Timer';
import styles from './CheckoutForm.module.css';

const TYPE_LABELS = { SINGLE: 'Individual', DOUBLE: 'Doble', SUITE: 'Suite' };

export function CheckoutForm({ hold, room, remainingSeconds, isExpired, onExpired, onPaymentSubmit, isLoading, paymentError }) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [formError, setFormError] = useState('');

  const nights = hold
    ? Math.round(
        (new Date(hold.checkout).getTime() - new Date(hold.checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const totalAmount = room ? parseFloat(room.price_per_night) * nights : 0;

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!guestName.trim()) {
      setFormError('Por favor ingresá tu nombre.');
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes('@')) {
      setFormError('Por favor ingresá un email válido.');
      return;
    }
    onPaymentSubmit(totalAmount);
  }

  return (
    <div className={styles.wrapper}>
      <Timer
        remainingSeconds={remainingSeconds}
        isExpired={isExpired}
        onExpired={onExpired}
      />

      {hold && room && (
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Resumen de reserva</h3>
          <div className={styles.row}>
            <span>Habitación</span>
            <strong>#{room.room_number} — {TYPE_LABELS[room.type] ?? room.type}</strong>
          </div>
          <div className={styles.row}>
            <span>Entrada</span>
            <strong>{hold.checkin}</strong>
          </div>
          <div className={styles.row}>
            <span>Salida</span>
            <strong>{hold.checkout}</strong>
          </div>
          <div className={styles.row}>
            <span>Noches</span>
            <strong>{nights}</strong>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <span>Total</span>
            <strong>U${totalAmount.toFixed(2)}</strong>
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>Datos del huésped</h3>

        <label className={styles.label}>
          Nombre completo
          <input
            className={styles.input}
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Juan García"
            disabled={isExpired || isLoading}
          />
        </label>

        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="juan@email.com"
            disabled={isExpired || isLoading}
          />
        </label>

        {(formError || paymentError) && (
          <p className={styles.error}>{formError || paymentError}</p>
        )}

        <button
          type="submit"
          className={styles.payButton}
          disabled={isExpired || isLoading}
        >
          {isLoading ? 'Procesando...' : `Pagar U$${totalAmount.toFixed(2)} (simulado)`}
        </button>
      </form>
    </div>
  );
}
