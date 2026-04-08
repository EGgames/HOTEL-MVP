import { renderHook, act } from '@testing-library/react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { getDashboard } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  getDashboard: vi.fn(),
}));

describe('useAdminDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns initial state', () => {
    const { result } = renderHook(() => useAdminDashboard('tok'));

    expect(result.current.stats).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchStats loads dashboard data', async () => {
    getDashboard.mockResolvedValue({ total_revenue: 500 });
    const { result } = renderHook(() => useAdminDashboard('tok'));

    await act(async () => { await result.current.fetchStats(); });

    expect(result.current.stats).toEqual({ total_revenue: 500 });
    expect(result.current.isLoading).toBe(false);
  });

  it('fetchStats sets error on failure', async () => {
    getDashboard.mockRejectedValue({ response: { data: { message: 'Forbidden' } } });
    const { result } = renderHook(() => useAdminDashboard('tok'));

    await act(async () => { await result.current.fetchStats(); });

    expect(result.current.error).toBe('Forbidden');
    expect(result.current.stats).toBeNull();
  });

  it('fetchStats does nothing without token', async () => {
    const { result } = renderHook(() => useAdminDashboard(null));

    await act(async () => { await result.current.fetchStats(); });

    expect(getDashboard).not.toHaveBeenCalled();
  });
});
