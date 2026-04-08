import { useState } from 'react';
import styles from './AdminLogin.module.css';

export function AdminLogin({ onLogin, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    onLogin(email, password);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Admin Login</h2>

      <label className={styles.label}>
        Email
        <input
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className={styles.label}>
        Contraseña
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.button} disabled={isLoading}>
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
