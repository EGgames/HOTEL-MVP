import styles from './StatsCard.module.css';

export function StatsCard({ label, value, icon }) {
  return (
    <div className={styles.card}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
