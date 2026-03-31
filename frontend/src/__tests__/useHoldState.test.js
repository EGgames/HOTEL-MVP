import { renderHook, waitFor, act } from '@testing-library/react';
import { useHoldState } from '../hooks/useHoldState';
import { getHoldState } from '../services/holdService';

vi.mock('../services/holdService', () => ({
  getHoldState: vi.fn(),
}));

describe('useHoldState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches hold on mount and sets state', async () => {
    getHoldState.mockResolvedValue({ id: 'hold-1', status: 'PENDING', remaining_seconds: 300 });

    const { result } = renderHook(() => useHoldState('hold-1'));

    await waitFor(() => expect(result.current.hold).toBeTruthy());

    expect(getHoldState).toHaveBeenCalledWith('hold-1');
    expect(result.current.remainingSeconds).toBe(300);
    expect(result.current.isExpired).toBe(false);
  });

  it('does not fetch when holdId is null', () => {
    renderHook(() => useHoldState(null));

    expect(getHoldState).not.toHaveBeenCalled();
  });

  it('sets isExpired when remaining_seconds is 0', async () => {
    getHoldState.mockResolvedValue({ id: 'hold-1', status: 'PENDING', remaining_seconds: 0 });

    const { result } = renderHook(() => useHoldState('hold-1'));

    await waitFor(() => expect(result.current.isExpired).toBe(true));
  });

  it('sets isExpired when hold status is not PENDING', async () => {
    getHoldState.mockResolvedValue({ id: 'hold-1', status: 'EXPIRED', remaining_seconds: 100 });

    const { result } = renderHook(() => useHoldState('hold-1'));

    await waitFor(() => expect(result.current.isExpired).toBe(true));
  });

  it('sets error and isExpired when fetch fails', async () => {
    const mockError = { response: { data: { detail: 'Hold not found' } } };
    getHoldState.mockRejectedValue(mockError);

    const { result } = renderHook(() => useHoldState('hold-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('Hold not found');
      expect(result.current.isExpired).toBe(true);
    });
  });

  it('polls getHoldState every 5 seconds', async () => {
    vi.useFakeTimers();
    getHoldState.mockResolvedValue({ id: 'hold-1', status: 'PENDING', remaining_seconds: 300 });

    renderHook(() => useHoldState('hold-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(getHoldState).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(getHoldState).toHaveBeenCalledTimes(2);
  });

  it('stops polling when isExpired becomes true', async () => {
    vi.useFakeTimers();
    getHoldState.mockResolvedValue({ id: 'hold-1', status: 'PENDING', remaining_seconds: 0 });

    const { result } = renderHook(() => useHoldState('hold-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isExpired).toBe(true);

    const callsBeforeAdvance = getHoldState.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(getHoldState.mock.calls.length).toBe(callsBeforeAdvance);
  });
});
