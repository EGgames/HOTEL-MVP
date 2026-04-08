import { renderHook, act } from '@testing-library/react';
import { useAdminCustomers } from '../hooks/useAdminCustomers';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  getCustomers: vi.fn(),
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

describe('useAdminCustomers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminCustomers('tok'));

    expect(result.current.customers).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchCustomers loads data', async () => {
    getCustomers.mockResolvedValue([{ id: 'c1' }]);
    const { result } = renderHook(() => useAdminCustomers('tok'));

    await act(async () => { await result.current.fetchCustomers(); });

    expect(result.current.customers).toEqual([{ id: 'c1' }]);
  });

  it('fetchCustomers sets error on failure', async () => {
    getCustomers.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    await act(async () => { await result.current.fetchCustomers(); });

    expect(result.current.error).toBe('Error');
  });

  it('fetchCustomers does nothing without token', async () => {
    const { result } = renderHook(() => useAdminCustomers(null));

    await act(async () => { await result.current.fetchCustomers(); });

    expect(getCustomers).not.toHaveBeenCalled();
  });

  it('fetchCustomer returns data', async () => {
    getCustomer.mockResolvedValue({ id: 'c1', name: 'A' });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let customer;
    await act(async () => { customer = await result.current.fetchCustomer('c1'); });

    expect(customer).toEqual({ id: 'c1', name: 'A' });
  });

  it('fetchCustomer returns null on error', async () => {
    getCustomer.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let customer;
    await act(async () => { customer = await result.current.fetchCustomer('c1'); });

    expect(customer).toBeNull();
    expect(result.current.error).toBe('Not found');
  });

  it('fetchCustomer returns null without token', async () => {
    const { result } = renderHook(() => useAdminCustomers(null));

    let customer;
    await act(async () => { customer = await result.current.fetchCustomer('c1'); });

    expect(customer).toBeNull();
  });

  it('addCustomer prepends to list', async () => {
    createCustomer.mockResolvedValue({ id: 'c-new', name: 'New' });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let created;
    await act(async () => { created = await result.current.addCustomer({ email: 'a@b.com', name: 'New' }); });

    expect(created).toEqual({ id: 'c-new', name: 'New' });
    expect(result.current.customers[0].id).toBe('c-new');
  });

  it('addCustomer returns null on error', async () => {
    createCustomer.mockRejectedValue({ response: { data: { message: 'Conflict' } } });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let created;
    await act(async () => { created = await result.current.addCustomer({}); });

    expect(created).toBeNull();
  });

  it('addCustomer returns null without token', async () => {
    const { result } = renderHook(() => useAdminCustomers(null));

    let created;
    await act(async () => { created = await result.current.addCustomer({}); });

    expect(created).toBeNull();
  });

  it('editCustomer updates item in list', async () => {
    getCustomers.mockResolvedValue([{ id: 'c1', name: 'Old' }]);
    updateCustomer.mockResolvedValue({ id: 'c1', name: 'New' });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    await act(async () => { await result.current.fetchCustomers(); });
    let updated;
    await act(async () => { updated = await result.current.editCustomer('c1', { name: 'New' }); });

    expect(updated).toEqual({ id: 'c1', name: 'New' });
    expect(result.current.customers[0].name).toBe('New');
  });

  it('editCustomer returns null on error', async () => {
    updateCustomer.mockRejectedValue({ response: { data: { message: 'Fail' } } });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let updated;
    await act(async () => { updated = await result.current.editCustomer('c1', {}); });

    expect(updated).toBeNull();
  });

  it('editCustomer returns null without token', async () => {
    const { result } = renderHook(() => useAdminCustomers(null));

    let updated;
    await act(async () => { updated = await result.current.editCustomer('c1', {}); });

    expect(updated).toBeNull();
  });

  it('removeCustomer removes from list', async () => {
    getCustomers.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    deleteCustomer.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminCustomers('tok'));

    await act(async () => { await result.current.fetchCustomers(); });
    let ok;
    await act(async () => { ok = await result.current.removeCustomer('c1'); });

    expect(ok).toBe(true);
    expect(result.current.customers).toEqual([{ id: 'c2' }]);
  });

  it('removeCustomer returns false on error', async () => {
    deleteCustomer.mockRejectedValue({ response: { data: { message: 'Active' } } });
    const { result } = renderHook(() => useAdminCustomers('tok'));

    let ok;
    await act(async () => { ok = await result.current.removeCustomer('c1'); });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('Active');
  });

  it('removeCustomer returns false without token', async () => {
    const { result } = renderHook(() => useAdminCustomers(null));

    let ok;
    await act(async () => { ok = await result.current.removeCustomer('c1'); });

    expect(ok).toBe(false);
  });
});
