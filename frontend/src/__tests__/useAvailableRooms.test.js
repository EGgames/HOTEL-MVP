import { renderHook, act } from '@testing-library/react';
import { useAvailableRooms } from '../hooks/useAvailableRooms';
import { getAvailableRooms } from '../services/roomService';

vi.mock('../services/roomService', () => ({
  getAvailableRooms: vi.fn(),
}));

describe('useAvailableRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAvailableRooms());

    expect(result.current.rooms).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('search() sets rooms on success and updates loading state', async () => {
    const mockRooms = [{ id: 'room-1' }, { id: 'room-2' }];
    let resolvePromise;
    getAvailableRooms.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() => useAvailableRooms());

    act(() => {
      void result.current.search('2026-05-10', '2026-05-12', 'hotel-1');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise(mockRooms);
      await Promise.resolve();
    });

    expect(getAvailableRooms).toHaveBeenCalledWith('2026-05-10', '2026-05-12', 'hotel-1', {});
    expect(result.current.rooms).toEqual(mockRooms);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('search() sets response detail error and clears rooms on failure', async () => {
    getAvailableRooms.mockRejectedValue({
      response: { data: { detail: 'Sin disponibilidad en ese rango' } },
    });

    const { result } = renderHook(() => useAvailableRooms());

    await act(async () => {
      await result.current.search('2026-05-10', '2026-05-12', 'hotel-1');
    });

    expect(result.current.error).toBe('Sin disponibilidad en ese rango');
    expect(result.current.rooms).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("search() uses fallback error when response detail is unavailable", async () => {
    getAvailableRooms.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAvailableRooms());

    await act(async () => {
      await result.current.search('2026-05-10', '2026-05-12', 'hotel-1');
    });

    expect(result.current.error).toBe('Error al buscar habitaciones');
    expect(result.current.rooms).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
