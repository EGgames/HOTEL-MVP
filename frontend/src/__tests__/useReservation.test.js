import { renderHook, waitFor } from '@testing-library/react';
import { useReservation } from '../hooks/useReservation';
import { getReservationByCode } from '../services/reservationService';

vi.mock('../services/reservationService', () => ({
  getReservationByCode: vi.fn(),
}));

describe('useReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches reservation on mount when code is provided', async () => {
    getReservationByCode.mockResolvedValue({ reservation_code: 'ABC12345' });

    renderHook(() => useReservation('ABC12345'));

    await waitFor(() => {
      expect(getReservationByCode).toHaveBeenCalledWith('ABC12345');
    });
  });

  it('does not fetch when code is null or undefined', () => {
    renderHook(() => useReservation(null));
    renderHook(() => useReservation(undefined));

    expect(getReservationByCode).not.toHaveBeenCalled();
  });

  it('sets reservation data on success', async () => {
    const reservation = {
      reservation_code: 'ABC12345',
      room_number: '101',
    };
    getReservationByCode.mockResolvedValue(reservation);

    const { result } = renderHook(() => useReservation('ABC12345'));

    await waitFor(() => {
      expect(result.current.reservation).toEqual(reservation);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error message from response detail on failure', async () => {
    getReservationByCode.mockRejectedValue({
      response: { data: { detail: 'Código inválido' } },
    });

    const { result } = renderHook(() => useReservation('BADCODE'));

    await waitFor(() => {
      expect(result.current.error).toBe('Código inválido');
    });

    expect(result.current.reservation).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('uses fallback error message when response detail is unavailable', async () => {
    getReservationByCode.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReservation('BADCODE'));

    await waitFor(() => {
      expect(result.current.error).toBe('Reserva no encontrada');
    });

    expect(result.current.reservation).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
