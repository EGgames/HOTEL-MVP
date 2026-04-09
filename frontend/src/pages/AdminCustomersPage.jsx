import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../hooks/useAdminCustomers';
import { DataTable } from '../components/DataTable/DataTable';
import { AdminFormModal } from '../components/AdminFormModal/AdminFormModal';
import styles from './AdminCustomersPage.module.css';

const COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono', render: (v) => v || '-' },
  {
    key: 'created_at',
    label: 'Registro',
    render: (v) => v?.split('T')[0] ?? '-',
  },
];

export function AdminCustomersPage({ token }) {
  const { customers, isLoading, error, fetchCustomers, addCustomer, editCustomer, removeCustomer } =
    useAdminCustomers(token);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', phone: '' });
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({ name: row.name, email: row.email, phone: row.phone ?? '' });
    setShowModal(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      const ok = await editCustomer(editing.id, { name: form.name, phone: form.phone || undefined });
      if (ok) setShowModal(false);
    } else {
      const ok = await addCustomer(form);
      if (ok) setShowModal(false);
    }
  }

  async function handleDelete(row) {
    if (window.confirm(`¿Eliminar cliente ${row.name}?`)) {
      await removeCustomer(row.id);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <button className={styles.addBtn} onClick={openCreate}>
          + Nuevo cliente
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={customers}
          emptyMessage="Sin clientes"
          actions={(row) => (
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => openEdit(row)}>Editar</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(row)}>Eliminar</button>
            </div>
          )}
        />
      )}

      <AdminFormModal
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nombre
            <input name="name" className={styles.input} value={form.name} onChange={handleChange} required />
          </label>
          {!editing && (
            <label className={styles.label}>
              Email
              <input name="email" type="email" className={styles.input} value={form.email} onChange={handleChange} required />
            </label>
          )}
          <label className={styles.label}>
            Teléfono
            <input name="phone" className={styles.input} value={form.phone} onChange={handleChange} />
          </label>
          <button type="submit" className={styles.submitBtn}>
            {editing ? 'Guardar' : 'Crear'}
          </button>
        </form>
      </AdminFormModal>
    </div>
  );
}
