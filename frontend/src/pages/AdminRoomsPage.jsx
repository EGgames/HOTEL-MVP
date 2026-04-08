import { useEffect, useState } from 'react';
import { useAdminRooms } from '../hooks/useAdminRooms';
import { DataTable } from '../components/DataTable/DataTable';
import { AdminFormModal } from '../components/AdminFormModal/AdminFormModal';
import styles from './AdminRoomsPage.module.css';

const TYPE_LABELS = { SINGLE: 'Individual', DOUBLE: 'Doble', SUITE: 'Suite' };

const COLUMNS = [
  { key: 'room_number', label: '#' },
  { key: 'type', label: 'Tipo', render: (v) => TYPE_LABELS[v] ?? v },
  { key: 'price_per_night', label: 'Precio / noche', render: (v) => `$${parseFloat(v).toFixed(2)}` },
  { key: 'capacity', label: 'Capacidad' },
  { key: 'floor', label: 'Piso', render: (v) => v ?? '-' },
  { key: 'wing', label: 'Ala', render: (v) => v ?? '-' },
];

const EMPTY_FORM = {
  room_number: '', hotel_id: '', type: 'SINGLE', price_per_night: '',
  capacity: '', amenities: '', floor: '', wing: '', image_url: '',
};

export function AdminRoomsPage({ token }) {
  const { rooms, isLoading, error, fetchRooms, addRoom, editRoom, removeRoom } = useAdminRooms(token);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      room_number: row.room_number,
      hotel_id: row.hotel_id ?? row.hotel?.id ?? '',
      type: row.type,
      price_per_night: String(row.price_per_night),
      capacity: String(row.capacity),
      amenities: (row.amenities ?? []).join(', '),
      floor: row.floor ?? '',
      wing: row.wing ?? '',
      image_url: row.image_url ?? '',
    });
    setShowModal(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function buildDto(isEdit) {
    const dto = { ...form };
    dto.price_per_night = parseFloat(dto.price_per_night);
    dto.capacity = parseInt(dto.capacity, 10);
    dto.amenities = dto.amenities ? dto.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [];
    dto.floor = dto.floor ? parseInt(dto.floor, 10) : undefined;
    dto.wing = dto.wing || undefined;
    dto.image_url = dto.image_url || undefined;
    if (isEdit) delete dto.hotel_id;
    return dto;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const dto = buildDto(!!editing);
    if (editing) {
      const ok = await editRoom(editing.id, dto);
      if (ok) setShowModal(false);
    } else {
      const ok = await addRoom(dto);
      if (ok) setShowModal(false);
    }
  }

  async function handleDelete(row) {
    if (window.confirm(`¿Eliminar habitación #${row.room_number}?`)) {
      await removeRoom(row.id);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Habitaciones</h1>
        <button className={styles.addBtn} onClick={openCreate}>
          + Nueva habitación
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rooms}
          emptyMessage="Sin habitaciones"
          actions={(row) => (
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => openEdit(row)}>Editar</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(row)}>Eliminar</button>
            </div>
          )}
        />
      )}

      <AdminFormModal
        title={editing ? 'Editar Habitación' : 'Nueva Habitación'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Número
            <input name="room_number" className={styles.input} value={form.room_number} onChange={handleChange} required />
          </label>
          {!editing && (
            <label className={styles.label}>
              Hotel ID
              <input name="hotel_id" className={styles.input} value={form.hotel_id} onChange={handleChange} required />
            </label>
          )}
          <label className={styles.label}>
            Tipo
            <select name="type" className={styles.input} value={form.type} onChange={handleChange}>
              <option value="SINGLE">Individual</option>
              <option value="DOUBLE">Doble</option>
              <option value="SUITE">Suite</option>
            </select>
          </label>
          <label className={styles.label}>
            Precio / noche
            <input name="price_per_night" type="number" step="0.01" className={styles.input} value={form.price_per_night} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Capacidad
            <input name="capacity" type="number" className={styles.input} value={form.capacity} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Amenities (separados por coma)
            <input name="amenities" className={styles.input} value={form.amenities} onChange={handleChange} />
          </label>
          <label className={styles.label}>
            Piso
            <input name="floor" type="number" className={styles.input} value={form.floor} onChange={handleChange} />
          </label>
          <label className={styles.label}>
            Ala
            <input name="wing" className={styles.input} value={form.wing} onChange={handleChange} />
          </label>
          <label className={styles.label}>
            URL Imagen
            <input name="image_url" className={styles.input} value={form.image_url} onChange={handleChange} />
          </label>
          <button type="submit" className={styles.submitBtn}>
            {editing ? 'Guardar' : 'Crear'}
          </button>
        </form>
      </AdminFormModal>
    </div>
  );
}
