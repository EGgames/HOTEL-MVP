import styles from './RoomCard.module.css';

const TYPE_LABELS = { SINGLE: 'Individual', DOUBLE: 'Doble', SUITE: 'Suite' };

export function RoomCard({ room, onSelect, isLoading }) {
  return (
    <article className={styles.card}>
      {room.image_url && (
        <img src={room.image_url} alt={`Habitación ${room.room_number}`} className={styles.image} />
      )}

      <div className={styles.header}>
        <span className={styles.type}>{TYPE_LABELS[room.type] ?? room.type}</span>
        <span className={styles.number}>#{room.room_number}</span>
      </div>

      {room.hotel && (
        <div className={styles.location}>
          📍 {room.hotel.city}{room.hotel.country ? `, ${room.hotel.country}` : ''}
        </div>
      )}

      <div className={styles.price}>
        <span className={styles.amount}>
          U${parseFloat(room.price_per_night).toFixed(2)}
        </span>
        <span className={styles.perNight}>/noche</span>
      </div>

      <div className={styles.capacity}>
        👥 Hasta {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}
      </div>

      {room.amenities?.length > 0 && (
        <ul className={styles.amenities}>
          {room.amenities.map((a) => (
            <li key={a} className={styles.amenity}>
              {a.replace(/_/g, ' ')}
            </li>
          ))}
        </ul>
      )}

      <button
        className={styles.button}
        onClick={() => onSelect(room)}
        disabled={isLoading}
      >
        {isLoading ? 'Reservando...' : 'Seleccionar'}
      </button>
    </article>
  );
}
