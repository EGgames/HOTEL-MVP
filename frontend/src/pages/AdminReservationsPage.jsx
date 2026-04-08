import { useEffect, useState } from 'react';
import { useAdminReservations } from '../hooks/useAdminReservations';
import { DataTable } from '../components/DataTable/DataTable';
import { AdminFormModal } from '../components/AdminFormModal/AdminFormModal';
import styles from './AdminReservationsPage.module.css';

const STATUS_LABELS = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendiente',
};

const COLUMNS = [
  { key: 'reservation_code', label: 'Código' },
  { key: 'customer_name', label: 'Cliente' },
  { key: 'customer_email', label: 'Email' },
  {
    key: 'checkin',
    label: 'Entrada',
    render: (v) => v?.split('T')[0] ?? '-',
  },
  {
    key: 'checkout',
    label: 'Salida',
    render: (v) => v?.split('T')[0] ?? '-',
  },
  {
    key: 'status',
    label: 'Estado',
    render: (v) => STATUS_LABELS[v] ?? v,
  },
];

export function AdminReservationsPage({ token }) {
  const { reservations, isLoading, error, fetchReservations, addReservation, cancelReservation } =
    useAdminReservations(token);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    room_id: '', checkin: '', checkout: '', customer_email: '', customer_name: '',
  });

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const created = await addReservation(form);
    if (created) {
      setShowModal(false);
      setForm({ room_id: '', checkin: '', checkout: '', customer_email: '', customer_name: '' });
    }
  }

  async function handleCancel(row) {
    if (window.confirm(`¿Cancelar reserva ${row.reservation_code}?`)) {
      await cancelReservation(row.id);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reservas</h1>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Nueva reserva
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={reservations}
          emptyMessage="Sin reservas"
          actions={(row) =>
            row.status !== 'CANCELLED' && (
              <button className={styles.cancelBtn} onClick={() => handleCancel(row)}>
                Cancelar
              </button>
            )
          }
        />
      )}

      <AdminFormModal title="Nueva Reserva" isOpen={showModal} onClose={() => setShowModal(false)}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Room ID
            <input name="room_id" className={styles.input} value={form.room_id} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Entrada
            <input name="checkin" type="date" className={styles.input} value={form.checkin} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Salida
            <input name="checkout" type="date" className={styles.input} value={form.checkout} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Email cliente
            <input name="customer_email" type="email" className={styles.input} value={form.customer_email} onChange={handleChange} required />
          </label>
          <label className={styles.label}>
            Nombre cliente
            <input name="customer_name" className={styles.input} value={form.customer_name} onChange={handleChange} required />
          </label>
          <button type="submit" className={styles.submitBtn}>Crear</button>
        </form>
      </AdminFormModal>
    </div>
  );
}
