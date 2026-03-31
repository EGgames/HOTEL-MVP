import { useParams, useNavigate } from 'react-router-dom';
import { PaymentSummary } from '../components/PaymentSummary/PaymentSummary';
import { useReservation } from '../hooks/useReservation';
import styles from './ConfirmationPage.module.css';

export function ConfirmationPage() {
  const { reservationCode } = useParams();
  const navigate = useNavigate();
  const { reservation, isLoading, error } = useReservation(reservationCode);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Cargando confirmación...</p>
        </div>
      </main>
    );
  }

  if (error || !reservation) {
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <p className={styles.errorText}>
            {error ?? 'No se encontró la reserva.'}
          </p>
          <button className={styles.homeBtn} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <PaymentSummary reservation={reservation} />
        <button className={styles.homeBtn} onClick={() => navigate('/')}>
          Realizar otra reserva
        </button>
      </div>
    </main>
  );
}
