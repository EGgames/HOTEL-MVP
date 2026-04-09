import { RoomCard } from '../RoomCard/RoomCard';
import styles from './RoomList.module.css';

export function RoomList({ rooms, isLoading, onSelectRoom, selectingRoomId }) {
  if (isLoading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} aria-label="Cargando habitaciones" />
        <p>Buscando disponibilidad...</p>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className={styles.center}>
        <p className={styles.empty}>No hay habitaciones disponibles para las fechas seleccionadas.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onSelect={onSelectRoom}
          isLoading={selectingRoomId === room.id}
        />
      ))}
    </div>
  );
}
