import { renderHook, act } from '@testing-library/react';
import { useRoomHold } from '../hooks/useRoomHold';
import { createHold } from '../services/holdService';

vi.mock('../services/holdService', () => ({
  createHold: vi.fn(),
}));

describe('useRoomHold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useRoomHold());

    expect(result.current.hold).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('requestHold() sets hold and returns data on success', async () => {
    const holdData = { id: 'hold-1', status: 'PENDING' };
    createHold.mockResolvedValue(holdData);

    const { result } = renderHook(() => useRoomHold());

    let response;
    await act(async () => {
      response = await result.current.requestHold('room-1', '2026-05-10', '2026-05-12');
    });

    expect(createHold).toHaveBeenCalledWith('room-1', '2026-05-10', '2026-05-12');
    expect(response).toEqual(holdData);
    expect(result.current.hold).toEqual(holdData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('requestHold() sets detail error and returns null on failure', async () => {
    createHold.mockRejectedValue({
      response: { data: { detail: 'Habitación no disponible' } },
    });

    const { result } = renderHook(() => useRoomHold());

    let response;
    await act(async () => {
      response = await result.current.requestHold('room-1', '2026-05-10', '2026-05-12');
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe('Habitación no disponible');
    expect(result.current.isLoading).toBe(false);
  });

  it('requestHold() uses fallback error when detail is unavailable', async () => {
    createHold.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRoomHold());

    let response;
    await act(async () => {
      response = await result.current.requestHold('room-1', '2026-05-10', '2026-05-12');
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe('No se pudo bloquear la habitación');
    expect(result.current.isLoading).toBe(false);
  });
});
