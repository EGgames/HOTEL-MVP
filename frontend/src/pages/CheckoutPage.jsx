import { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckoutForm } from '../components/CheckoutForm/CheckoutForm';
import { useHoldState } from '../hooks/useHoldState';
import { usePayment } from '../hooks/usePayment';
import { getHoldState } from '../services/holdService';
import { getReservation } from '../services/reservationService';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const { holdId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { remainingSeconds, isExpired, error: holdError } = useHoldState(holdId);
  const { isLoading, error: paymentError, pay } = usePayment();

  const room = state?.room ?? null;

  useEffect(() => {
    if (holdError) {
      navigate('/', { replace: true });
    }
  }, [holdError, navigate]);

  async function handlePaymentSubmit(amount, customerInfo) {
    const result = await pay(holdId, amount, customerInfo);
    if (result.success) {
      const updatedHold = await getHoldState(holdId);
      if (updatedHold.reservation_id) {
        const reservation = await getReservation(updatedHold.reservation_id);
        navigate(`/confirmation/${reservation.reservation_code}`);
      }
    }
  }

  function handleExpired() {
    setTimeout(() => navigate('/', { replace: true }), 3000);
  }

  const holdData = holdId
    ? { id: holdId, checkin: state?.checkin, checkout: state?.checkout }
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>
          ← Volver
        </button>
        <h1 className={styles.title}>Checkout</h1>
      </header>

      <div className={styles.content}>
        <CheckoutForm
          hold={holdData}
          room={room}
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          onExpired={handleExpired}
          onPaymentSubmit={handlePaymentSubmit}
          isLoading={isLoading}
          paymentError={paymentError}
        />
      </div>
    </main>
  );
}
