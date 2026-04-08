import { useEffect } from 'react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { StatsCard } from '../components/StatsCard/StatsCard';
import { TopChart } from '../components/TopChart/TopChart';
import styles from './AdminDashboardPage.module.css';

export function AdminDashboardPage({ token }) {
  const { stats, isLoading, error, fetchStats } = useAdminDashboard(token);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) return <p className={styles.loading}>Cargando dashboard...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!stats) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.grid}>
        <StatsCard label="Ingresos totales" value={`$${stats.total_revenue?.toLocaleString() ?? 0}`} icon="💰" />
        <StatsCard label="Reservas totales" value={stats.total_reservations ?? 0} icon="📋" />
        <StatsCard label="Habitaciones" value={stats.all_rooms_stats?.length ?? 0} icon="🏨" />
        <StatsCard label="Clientes" value={stats.all_customers_stats?.length ?? 0} icon="👥" />
      </div>

      <div className={styles.charts}>
        <TopChart
          title="Top 5 Habitaciones"
          items={stats.top_rooms}
          labelKey="room_number"
          valueKey="reservation_count"
        />
        <TopChart
          title="Top 5 Clientes"
          items={stats.top_customers}
          labelKey="customer_name"
          valueKey="reservation_count"
        />
      </div>
    </div>
  );
}
