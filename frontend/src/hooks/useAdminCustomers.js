import { useState, useCallback } from 'react';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../services/adminService';

export function useAdminCustomers(token) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers(token);
      setCustomers(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchCustomer = useCallback(async (id) => {
    if (!token) return null;
    try {
      return await getCustomer(id, token);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar cliente');
      return null;
    }
  }, [token]);

  const addCustomer = useCallback(async (dto) => {
    if (!token) return null;
    setError(null);
    try {
      const created = await createCustomer(dto, token);
      setCustomers((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al crear cliente');
      return null;
    }
  }, [token]);

  const editCustomer = useCallback(async (id, dto) => {
    if (!token) return null;
    setError(null);
    try {
      const updated = await updateCustomer(id, dto, token);
      setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al actualizar cliente');
      return null;
    }
  }, [token]);

  const removeCustomer = useCallback(async (id) => {
    if (!token) return false;
    setError(null);
    try {
      await deleteCustomer(id, token);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al eliminar cliente');
      return false;
    }
  }, [token]);

  return { customers, isLoading, error, fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer };
}
