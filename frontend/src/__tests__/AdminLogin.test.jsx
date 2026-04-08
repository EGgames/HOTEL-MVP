import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLogin } from '../components/AdminLogin/AdminLogin';

vi.mock('../components/AdminLogin/AdminLogin.module.css', () => ({ default: {} }));

describe('AdminLogin', () => {
  const onLogin = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('renders form', () => {
    render(<AdminLogin onLogin={onLogin} isLoading={false} error={null} />);
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('calls onLogin on submit', () => {
    render(<AdminLogin onLogin={onLogin} isLoading={false} error={null} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(onLogin).toHaveBeenCalledWith('a@b.com', '123');
  });

  it('does not call onLogin with empty fields', () => {
    render(<AdminLogin onLogin={onLogin} isLoading={false} error={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('displays error', () => {
    render(<AdminLogin onLogin={onLogin} isLoading={false} error="Bad creds" />);
    expect(screen.getByText('Bad creds')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AdminLogin onLogin={onLogin} isLoading={true} error={null} />);
    expect(screen.getByRole('button', { name: 'Ingresando...' })).toBeDisabled();
  });
});
