import { renderHook, act } from '@testing-library/react';
import { usePayment } from '../hooks/usePayment';
import { processPayment } from '../services/paymentService';

vi.mock('../services/paymentService', () => ({
  processPayment: vi.fn(),
}));
vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-uuid') }));

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls processPayment with a generated idempotency key', async () => {
    processPayment.mockResolvedValue({ id: 'pay-1', status: 'SUCCESS' });
    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.pay('hold-1', 100);
    });

    expect(processPayment).toHaveBeenCalledWith('hold-1', 100, 'mock-uuid', {});
  });

  it('reuses the same idempotency key on repeated pay() calls', async () => {
    processPayment.mockResolvedValue({ id: 'pay-1', status: 'SUCCESS' });
    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.pay('hold-1', 100);
      await result.current.pay('hold-1', 100);
    });

    const calls = processPayment.mock.calls;
    expect(calls[0][2]).toBe(calls[1][2]);
  });

  it('returns { success: true, data } on successful payment', async () => {
    const paymentData = { id: 'pay-1', status: 'SUCCESS' };
    processPayment.mockResolvedValue(paymentData);
    const { result } = renderHook(() => usePayment());

    let outcome;
    await act(async () => {
      outcome = await result.current.pay('hold-1', 100);
    });

    expect(outcome).toEqual({ success: true, data: paymentData });
    expect(result.current.payment).toEqual(paymentData);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns { success: false, declined: true } when payment is DECLINED', async () => {
    const error = { response: { data: { status: 'DECLINED' } } };
    processPayment.mockRejectedValue(error);
    const { result } = renderHook(() => usePayment());

    let outcome;
    await act(async () => {
      outcome = await result.current.pay('hold-1', 100);
    });

    expect(outcome).toEqual({ success: false, declined: true });
    expect(result.current.error).toBe('Pago rechazado por el banco. La habitación fue liberada.');
  });

  it('returns { success: false, declined: false } on generic error', async () => {
    const error = { response: { data: { detail: 'Server error' } } };
    processPayment.mockRejectedValue(error);
    const { result } = renderHook(() => usePayment());

    let outcome;
    await act(async () => {
      outcome = await result.current.pay('hold-1', 100);
    });

    expect(outcome).toEqual({ success: false, declined: false });
    expect(result.current.error).toBe('Server error');
  });

  it('resetKey() clears payment and error state', async () => {
    processPayment.mockResolvedValue({ id: 'pay-1' });
    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.pay('hold-1', 100);
    });

    act(() => {
      result.current.resetKey();
    });

    expect(result.current.payment).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
