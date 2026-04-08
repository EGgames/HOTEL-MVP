import { NavLink } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/reservations', label: 'Reservas', icon: '📋' },
  { to: '/admin/customers', label: 'Clientes', icon: '👥' },
  { to: '/admin/rooms', label: 'Habitaciones', icon: '🏨' },
];

export function AdminSidebar({ onLogout }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Hotel Admin</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button className={styles.logout} onClick={onLogout}>
        Cerrar sesión
      </button>
    </aside>
  );
}
