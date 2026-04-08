import styles from './TopChart.module.css';

export function TopChart({ title, items, labelKey, valueKey, valuePrefix = '' }) {
  if (!items || items.length === 0) return null;
  const max = Math.max(...items.map((i) => i[valueKey]));

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.list}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.row}>
            <span className={styles.label}>{item[labelKey]}</span>
            <div className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{ width: `${(item[valueKey] / max) * 100}%` }}
              />
            </div>
            <span className={styles.value}>
              {valuePrefix}{typeof item[valueKey] === 'number' ? item[valueKey].toLocaleString() : item[valueKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
