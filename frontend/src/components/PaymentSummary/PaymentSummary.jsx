import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './PaymentSummary.module.css';

export function PaymentSummary({ reservation }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reservation.reservation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso — clipboard no disponible
    }
  }

  const nights = reservation
    ? Math.round(
        (new Date(reservation.checkout).getTime() - new Date(reservation.checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.success}>
        <span className={styles.icon}>✅</span>
        <h2 className={styles.title}>¡Reserva confirmada!</h2>
        <p className={styles.subtitle}>Tu habitación está garantizada</p>
      </div>

      <div className={styles.codeSection}>
        <span className={styles.codeLabel}>Código de reserva</span>
        <div className={styles.codeRow}>
          <span className={styles.code}>{reservation.reservation_code}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className={styles.qrSection}>
        <QRCodeSVG
          value={`${window.location.origin}/confirmation/${reservation.reservation_code}`}
          size={160}
          level="M"
        />
        <span className={styles.qrLabel}>Escaneá el QR para ver tu reserva</span>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span>Habitación</span>
          <strong>#{reservation.room_number}</strong>
        </div>
        <div className={styles.row}>
          <span>Entrada</span>
          <strong>{reservation.checkin}</strong>
        </div>
        <div className={styles.row}>
          <span>Salida</span>
          <strong>{reservation.checkout}</strong>
        </div>
        <div className={styles.row}>
          <span>Noches</span>
          <strong>{nights}</strong>
        </div>
        <div className={styles.row}>
          <span>Precio/noche</span>
          <strong>U${parseFloat(reservation.price_per_night ?? 0).toFixed(2)}</strong>
        </div>
        <div className={`${styles.row} ${styles.total}`}>
          <span>Total pagado</span>
          <strong>U${parseFloat(reservation.total_amount ?? 0).toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}
