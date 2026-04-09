import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminCustomersPage } from '../pages/AdminCustomersPage';
import { useAdminCustomers } from '../hooks/useAdminCustomers';

vi.mock('../hooks/useAdminCustomers');
vi.mock('../pages/AdminCustomersPage.module.css', () => ({ default: {} }));
vi.mock('../components/DataTable/DataTable.module.css', () => ({ default: {} }));
vi.mock('../components/AdminFormModal/AdminFormModal.module.css', () => ({ default: {} }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('AdminCustomersPage', () => {
  const fetchCustomers = vi.fn();
  const addCustomer = vi.fn();
  const editCustomer = vi.fn();
  const removeCustomer = vi.fn();
  const fetchCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAdminCustomers.mockReturnValue({
      customers: [],
      isLoading: false,
      error: null,
      fetchCustomers,
      fetchCustomer,
      addCustomer,
      editCustomer,
      removeCustomer,
    });
  });

  it('renders title and add button', () => {
    render(<AdminCustomersPage token="tok" />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('+ Nuevo cliente')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useAdminCustomers.mockReturnValue({
      customers: [], isLoading: true, error: null,
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows error', () => {
    useAdminCustomers.mockReturnValue({
      customers: [], isLoading: false, error: 'Algo salió mal',
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('renders customers in table', () => {
    useAdminCustomers.mockReturnValue({
      customers: [{ id: '1', name: 'Ana', email: 'a@b.com', phone: '123', created_at: '2025-01-01T10:00:00' }],
      isLoading: false, error: null,
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('calls fetchCustomers on mount', () => {
    render(<AdminCustomersPage token="tok" />);
    expect(fetchCustomers).toHaveBeenCalled();
  });

  it('opens create modal', () => {
    render(<AdminCustomersPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nuevo cliente'));
    expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
  });

  it('submits create form', async () => {
    addCustomer.mockResolvedValue({ id: '1' });
    render(<AdminCustomersPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nuevo cliente'));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana', name: 'name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '123', name: 'phone' } });
    fireEvent.click(screen.getByText('Crear'));
    await waitFor(() => expect(addCustomer).toHaveBeenCalledWith({ name: 'Ana', email: 'a@b.com', phone: '123' }));
  });

  it('opens edit modal', () => {
    useAdminCustomers.mockReturnValue({
      customers: [{ id: '1', name: 'Ana', email: 'a@b.com', phone: '123', created_at: '2025-01-01T10:00:00' }],
      isLoading: false, error: null,
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
  });

  it('submits edit form', async () => {
    editCustomer.mockResolvedValue({ id: '1' });
    useAdminCustomers.mockReturnValue({
      customers: [{ id: '1', name: 'Ana', email: 'a@b.com', phone: '', created_at: '2025-01-01' }],
      isLoading: false, error: null,
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana2', name: 'name' } });
    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() => expect(editCustomer).toHaveBeenCalled());
  });

  it('calls removeCustomer on delete confirm', async () => {
    removeCustomer.mockResolvedValue(true);
    window.confirm = vi.fn(() => true);
    useAdminCustomers.mockReturnValue({
      customers: [{ id: '1', name: 'Ana', email: 'a@b.com', phone: '', created_at: '2025-01-01' }],
      isLoading: false, error: null,
      fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer,
    });
    render(<AdminCustomersPage token="tok" />);
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => expect(removeCustomer).toHaveBeenCalledWith('1'));
  });
});
