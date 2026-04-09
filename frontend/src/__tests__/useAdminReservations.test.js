import { renderHook, act } from '@testing-library/react';
import { useAdminReservations } from '../hooks/useAdminReservations';
import { getReservations, createReservation, deleteReservation } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  getReservations: vi.fn(),
  createReservation: vi.fn(),
  deleteReservation: vi.fn(),
}));

describe('useAdminReservations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminReservations('tok'));

    expect(result.current.reservations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchReservations loads data', async () => {
    getReservations.mockResolvedValue([{ id: 'r1' }]);
    const { result } = renderHook(() => useAdminReservations('tok'));

    await act(async () => { await result.current.fetchReservations(); });

    expect(result.current.reservations).toEqual([{ id: 'r1' }]);
  });

  it('fetchReservations sets error on failure', async () => {
    getReservations.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const { result } = renderHook(() => useAdminReservations('tok'));

    await act(async () => { await result.current.fetchReservations(); });

    expect(result.current.error).toBe('Error');
  });

  it('fetchReservations does nothing without token', async () => {
    const { result } = renderHook(() => useAdminReservations(null));

    await act(async () => { await result.current.fetchReservations(); });

    expect(getReservations).not.toHaveBeenCalled();
  });

  it('addReservation prepends new reservation', async () => {
    getReservations.mockResolvedValue([{ id: 'r1' }]);
    createReservation.mockResolvedValue({ id: 'r-new' });
    const { result } = renderHook(() => useAdminReservations('tok'));

    await act(async () => { await result.current.fetchReservations(); });
    let created;
    await act(async () => { created = await result.current.addReservation({ room_id: 'r1' }); });

    expect(created).toEqual({ id: 'r-new' });
    expect(result.current.reservations[0].id).toBe('r-new');
  });

  it('addReservation returns null and sets error on failure', async () => {
    createReservation.mockRejectedValue({ response: { data: { message: 'Conflict' } } });
    const { result } = renderHook(() => useAdminReservations('tok'));

    let created;
    await act(async () => { created = await result.current.addReservation({}); });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Conflict');
  });

  it('addReservation returns null without token', async () => {
    const { result } = renderHook(() => useAdminReservations(null));

    let created;
    await act(async () => { created = await result.current.addReservation({}); });

    expect(created).toBeNull();
  });

  it('cancelReservation removes from list', async () => {
    getReservations.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
    deleteReservation.mockResolvedValue({ message: 'Cancelled' });
    const { result } = renderHook(() => useAdminReservations('tok'));

    await act(async () => { await result.current.fetchReservations(); });
    let ok;
    await act(async () => { ok = await result.current.cancelReservation('r1'); });

    expect(ok).toBe(true);
    expect(result.current.reservations).toEqual([{ id: 'r2' }]);
  });

  it('cancelReservation returns false on error', async () => {
    deleteReservation.mockRejectedValue({ response: { data: { message: 'Fail' } } });
    const { result } = renderHook(() => useAdminReservations('tok'));

    let ok;
    await act(async () => { ok = await result.current.cancelReservation('r1'); });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('Fail');
  });

  it('cancelReservation returns false without token', async () => {
    const { result } = renderHook(() => useAdminReservations(null));

    let ok;
    await act(async () => { ok = await result.current.cancelReservation('r1'); });

    expect(ok).toBe(false);
  });
});
