import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { RoomList } from '../components/RoomList/RoomList';
import { useAvailableRooms } from '../hooks/useAvailableRooms';
import { useRoomHold } from '../hooks/useRoomHold';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const navigate = useNavigate();
  const { rooms, isLoading, error: searchError, search } = useAvailableRooms();
  const { isLoading: isHolding, error: holdError, requestHold } = useRoomHold();
  const [selectingRoomId, setSelectingRoomId] = useState(null);
  const [dates, setDates] = useState({ checkin: '', checkout: '' });
  const [toastError, setToastError] = useState('');

  function handleSearch(checkin, checkout) {
    setDates({ checkin, checkout });
    setToastError('');
    search(checkin, checkout);
  }

  async function handleSelectRoom(room) {
    if (!dates.checkin || !dates.checkout) return;
    setSelectingRoomId(room.id);
    setToastError('');

    const hold = await requestHold(room.id, dates.checkin, dates.checkout);

    if (hold) {
      navigate(`/checkout/${hold.id}`, {
        state: { room, checkin: dates.checkin, checkout: dates.checkout },
      });
    } else {
      setToastError(holdError ?? 'No se pudo bloquear la habitación. Intentá con otra.');
    }

    setSelectingRoomId(null);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>🏨 Hotel Booking MVP</h1>
        <p className={styles.subtitle}>Encontrá tu habitación ideal</p>
      </header>

      <section className={styles.searchSection}>
        <SearchBar onSearch={handleSearch} />
      </section>

      {(searchError || toastError) && (
        <div className={styles.toast} role="alert">
          {searchError || toastError}
        </div>
      )}

      <section className={styles.results}>
        <RoomList
          rooms={rooms}
          isLoading={isLoading}
          onSelectRoom={handleSelectRoom}
          selectingRoomId={selectingRoomId}
        />
      </section>
    </main>
  );
}
