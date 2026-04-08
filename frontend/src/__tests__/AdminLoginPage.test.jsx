import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { useAdminAuth } from '../hooks/useAdminAuth';

vi.mock('../hooks/useAdminAuth');
vi.mock('../pages/AdminLoginPage.module.css', () => ({ default: {} }));
vi.mock('../components/AdminLogin/AdminLogin.module.css', () => ({ default: {} }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form when not authenticated', () => {
    useAdminAuth.mockReturnValue({
      isAuthenticated: false, isLoading: false, error: null, login: vi.fn(),
    });
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
  });

  it('navigates to dashboard when already authenticated', () => {
    useAdminAuth.mockReturnValue({
      isAuthenticated: true, isLoading: false, error: null, login: vi.fn(),
    });
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
  });

  it('displays error from hook', () => {
    useAdminAuth.mockReturnValue({
      isAuthenticated: false, isLoading: false, error: 'Invalid credentials', login: vi.fn(),
    });
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
