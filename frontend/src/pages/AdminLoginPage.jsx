import { useNavigate } from 'react-router-dom';
import { AdminLogin } from '../components/AdminLogin/AdminLogin';
import { useAdminAuth } from '../hooks/useAdminAuth';
import styles from './AdminLoginPage.module.css';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, login } = useAdminAuth();

  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  async function handleLogin(email, password) {
    const ok = await login(email, password);
    if (ok) navigate('/admin/dashboard', { replace: true });
  }

  return (
    <main className={styles.page}>
      <AdminLogin onLogin={handleLogin} isLoading={isLoading} error={error} />
    </main>
  );
}
