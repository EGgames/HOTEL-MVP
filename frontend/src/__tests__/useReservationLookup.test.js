import { renderHook, act } from '@testing-library/react';
import { useReservationLookup } from '../hooks/useReservationLookup';
import { lookupReservation } from '../services/reservationService';

vi.mock('../services/reservationService', () => ({
  lookupReservation: vi.fn(),
}));

describe('useReservationLookup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns initial state', () => {
    const { result } = renderHook(() => useReservationLookup());
    expect(result.current.reservation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('lookup returns reservation on success', async () => {
    const res = { reservation_code: 'ABC', status: 'CONFIRMED' };
    lookupReservation.mockResolvedValue(res);
    const { result } = renderHook(() => useReservationLookup());

    let data;
    await act(async () => { data = await result.current.lookup('ABC'); });

    expect(data).toEqual(res);
    expect(result.current.reservation).toEqual(res);
    expect(result.current.isLoading).toBe(false);
  });

  it('lookup sets 404 error', async () => {
    lookupReservation.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useReservationLookup());

    let data;
    await act(async () => { data = await result.current.lookup('XYZ'); });

    expect(data).toBeNull();
    expect(result.current.error).toBe('No se encontró ninguna reserva con ese código.');
  });

  it('lookup sets generic error', async () => {
    lookupReservation.mockRejectedValue({ response: { status: 500, data: { message: 'Fail' } } });
    const { result } = renderHook(() => useReservationLookup());

    let data;
    await act(async () => { data = await result.current.lookup('XYZ'); });

    expect(data).toBeNull();
    expect(result.current.error).toBe('Fail');
  });

  it('lookup uses fallback error when no message', async () => {
    lookupReservation.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useReservationLookup());

    await act(async () => { await result.current.lookup('XYZ'); });

    expect(result.current.error).toBe('Error al buscar la reserva');
  });

  it('reset clears state', async () => {
    const res = { reservation_code: 'ABC' };
    lookupReservation.mockResolvedValue(res);
    const { result } = renderHook(() => useReservationLookup());

    await act(async () => { await result.current.lookup('ABC'); });
    expect(result.current.reservation).toBeTruthy();

    act(() => { result.current.reset(); });

    expect(result.current.reservation).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
