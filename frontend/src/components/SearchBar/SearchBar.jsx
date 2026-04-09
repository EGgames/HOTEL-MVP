import { useState } from 'react';
import styles from './SearchBar.module.css';

const today = () => new Date().toISOString().split('T')[0];

export function SearchBar({ onSearch }) {
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!checkin || !checkout) {
      setValidationError('Por favor seleccioná ambas fechas.');
      return;
    }
    if (checkout <= checkin) {
      setValidationError('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }

    onSearch(checkin, checkout);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <label className={styles.label}>
          Entrada
          <input
            type="date"
            className={styles.input}
            value={checkin}
            min={today()}
            onChange={(e) => setCheckin(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Salida
          <input
            type="date"
            className={styles.input}
            value={checkout}
            min={checkin || today()}
            onChange={(e) => setCheckout(e.target.value)}
          />
        </label>

        <button type="submit" className={styles.button}>
          Buscar
        </button>
      </div>

      {validationError && (
        <p className={styles.error}>{validationError}</p>
      )}
    </form>
  );
}
