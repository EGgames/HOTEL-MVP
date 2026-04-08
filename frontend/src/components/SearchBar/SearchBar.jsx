import { useState } from 'react';
import styles from './SearchBar.module.css';

const today = () => new Date().toISOString().split('T')[0];

export function SearchBar({ onSearch }) {
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
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
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setValidationError('El precio mínimo no puede superar al máximo.');
      return;
    }

    onSearch(checkin, checkout, {
      city: city || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
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

        <label className={styles.label}>
          Ciudad
          <input
            type="text"
            className={styles.input}
            value={city}
            placeholder="Ej: Buenos Aires"
            onChange={(e) => setCity(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Precio mín.
          <input
            type="number"
            className={styles.input}
            value={minPrice}
            min="0"
            step="1"
            placeholder="$0"
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Precio máx.
          <input
            type="number"
            className={styles.input}
            value={maxPrice}
            min="0"
            step="1"
            placeholder="$999"
            onChange={(e) => setMaxPrice(e.target.value)}
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
