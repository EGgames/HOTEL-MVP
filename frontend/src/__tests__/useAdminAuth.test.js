import { renderHook, act } from '@testing-library/react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { adminLogin } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  adminLogin: vi.fn(),
}));

describe('useAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAdminAuth());

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('login sets token on success', async () => {
    adminLogin.mockResolvedValue({ access_token: 'jwt-token' });
    const { result } = renderHook(() => useAdminAuth());

    let ok;
    await act(async () => {
      ok = await result.current.login('a@b.com', 'pass');
    });

    expect(ok).toBe(true);
    expect(result.current.token).toBe('jwt-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('admin_token')).toBe('jwt-token');
  });

  it('login sets error on failure', async () => {
    adminLogin.mockRejectedValue({ response: { data: { message: 'Bad credentials' } } });
    const { result } = renderHook(() => useAdminAuth());

    let ok;
    await act(async () => {
      ok = await result.current.login('a@b.com', 'wrong');
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('Bad credentials');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login uses fallback error message', async () => {
    adminLogin.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAdminAuth());

    await act(async () => {
      await result.current.login('a@b.com', 'wrong');
    });

    expect(result.current.error).toBe('Credenciales inválidas');
  });

  it('logout clears token', async () => {
    adminLogin.mockResolvedValue({ access_token: 'jwt-token' });
    const { result } = renderHook(() => useAdminAuth());

    await act(async () => { await result.current.login('a@b.com', 'pass'); });

    act(() => { result.current.logout(); });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('admin_token')).toBeNull();
  });

  it('restores token from localStorage', () => {
    localStorage.setItem('admin_token', 'stored-token');

    const { result } = renderHook(() => useAdminAuth());

    expect(result.current.token).toBe('stored-token');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
