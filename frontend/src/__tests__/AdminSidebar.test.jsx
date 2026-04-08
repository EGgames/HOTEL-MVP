import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar/AdminSidebar';

vi.mock('../components/AdminSidebar/AdminSidebar.module.css', () => ({ default: {} }));

describe('AdminSidebar', () => {
  const onLogout = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  function renderSidebar() {
    return render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminSidebar onLogout={onLogout} />
      </MemoryRouter>,
    );
  }

  it('renders brand', () => {
    renderSidebar();
    expect(screen.getByText('Hotel Admin')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Habitaciones')).toBeInTheDocument();
  });

  it('calls onLogout', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
