import { renderHook, act } from '@testing-library/react';
import { useAdminRooms } from '../hooks/useAdminRooms';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  getRooms: vi.fn(),
  createRoom: vi.fn(),
  updateRoom: vi.fn(),
  deleteRoom: vi.fn(),
}));

describe('useAdminRooms', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminRooms('tok'));
    expect(result.current.rooms).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchRooms loads data', async () => {
    getRooms.mockResolvedValue([{ id: 'r1', room_number: '101' }]);
    const { result } = renderHook(() => useAdminRooms('tok'));

    await act(async () => { await result.current.fetchRooms(); });

    expect(result.current.rooms).toEqual([{ id: 'r1', room_number: '101' }]);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetchRooms sets error on failure', async () => {
    getRooms.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    const { result } = renderHook(() => useAdminRooms('tok'));

    await act(async () => { await result.current.fetchRooms(); });

    expect(result.current.error).toBe('Server error');
  });

  it('fetchRooms uses fallback error message', async () => {
    getRooms.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAdminRooms('tok'));

    await act(async () => { await result.current.fetchRooms(); });

    expect(result.current.error).toBe('Error al cargar habitaciones');
  });

  it('fetchRooms does nothing without token', async () => {
    const { result } = renderHook(() => useAdminRooms(null));

    await act(async () => { await result.current.fetchRooms(); });

    expect(getRooms).not.toHaveBeenCalled();
  });

  it('addRoom prepends to list', async () => {
    createRoom.mockResolvedValue({ id: 'r-new', room_number: '200' });
    const { result } = renderHook(() => useAdminRooms('tok'));

    let created;
    await act(async () => { created = await result.current.addRoom({ room_number: '200' }); });

    expect(created).toEqual({ id: 'r-new', room_number: '200' });
    expect(result.current.rooms[0].id).toBe('r-new');
  });

  it('addRoom returns null on error', async () => {
    createRoom.mockRejectedValue({ response: { data: { message: 'Conflict' } } });
    const { result } = renderHook(() => useAdminRooms('tok'));

    let created;
    await act(async () => { created = await result.current.addRoom({}); });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Conflict');
  });

  it('addRoom returns null without token', async () => {
    const { result } = renderHook(() => useAdminRooms(null));

    let created;
    await act(async () => { created = await result.current.addRoom({}); });

    expect(created).toBeNull();
  });

  it('editRoom updates item in list', async () => {
    getRooms.mockResolvedValue([{ id: 'r1', room_number: '101' }]);
    updateRoom.mockResolvedValue({ id: 'r1', room_number: '102' });
    const { result } = renderHook(() => useAdminRooms('tok'));

    await act(async () => { await result.current.fetchRooms(); });
    let updated;
    await act(async () => { updated = await result.current.editRoom('r1', { room_number: '102' }); });

    expect(updated).toEqual({ id: 'r1', room_number: '102' });
    expect(result.current.rooms[0].room_number).toBe('102');
  });

  it('editRoom returns null on error', async () => {
    updateRoom.mockRejectedValue({ response: { data: { message: 'Fail' } } });
    const { result } = renderHook(() => useAdminRooms('tok'));

    let updated;
    await act(async () => { updated = await result.current.editRoom('r1', {}); });

    expect(updated).toBeNull();
  });

  it('editRoom returns null without token', async () => {
    const { result } = renderHook(() => useAdminRooms(null));

    let updated;
    await act(async () => { updated = await result.current.editRoom('r1', {}); });

    expect(updated).toBeNull();
  });

  it('removeRoom removes from list', async () => {
    getRooms.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
    deleteRoom.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminRooms('tok'));

    await act(async () => { await result.current.fetchRooms(); });
    let ok;
    await act(async () => { ok = await result.current.removeRoom('r1'); });

    expect(ok).toBe(true);
    expect(result.current.rooms).toEqual([{ id: 'r2' }]);
  });

  it('removeRoom returns false on error', async () => {
    deleteRoom.mockRejectedValue({ response: { data: { message: 'Active' } } });
    const { result } = renderHook(() => useAdminRooms('tok'));

    let ok;
    await act(async () => { ok = await result.current.removeRoom('r1'); });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('Active');
  });

  it('removeRoom returns false without token', async () => {
    const { result } = renderHook(() => useAdminRooms(null));

    let ok;
    await act(async () => { ok = await result.current.removeRoom('r1'); });

    expect(ok).toBe(false);
  });
});
