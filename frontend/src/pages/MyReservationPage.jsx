import { useState } from 'react';
import { useReservationLookup } from '../hooks/useReservationLookup';
import styles from './MyReservationPage.module.css';

const STATUS_LABELS = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendiente',
};

export function MyReservationPage() {
  const [code, setCode] = useState('');
  const { reservation, isLoading, error, lookup, reset } = useReservationLookup();

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    lookup(code.trim());
  }

  function handleClear() {
    setCode('');
    reset();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Consultar mi reserva</h1>
        <p className={styles.subtitle}>Ingresá tu código de reserva para ver el estado</p>
      </header>

      <section className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: A1B2C3D4"
            maxLength={10}
          />
          <button type="submit" className={styles.searchBtn} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
          {reservation && (
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              Limpiar
            </button>
          )}
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {reservation && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span className={styles.label}>Código</span>
              <span className={styles.value}>{reservation.reservation_code}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Estado</span>
              <span className={`${styles.value} ${styles.status}`}>
                {STATUS_LABELS[reservation.status] ?? reservation.status}
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Entrada</span>
              <span className={styles.value}>{reservation.checkin?.split('T')[0]}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Salida</span>
              <span className={styles.value}>{reservation.checkout?.split('T')[0]}</span>
            </div>
            {reservation.customer_name && (
              <div className={styles.row}>
                <span className={styles.label}>Huésped</span>
                <span className={styles.value}>{reservation.customer_name}</span>
              </div>
            )}
            {reservation.total_price != null && (
              <div className={styles.row}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>${parseFloat(reservation.total_price).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
