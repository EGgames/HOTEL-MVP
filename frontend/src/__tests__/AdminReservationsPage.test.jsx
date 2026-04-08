import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminReservationsPage } from '../pages/AdminReservationsPage';
import { useAdminReservations } from '../hooks/useAdminReservations';

vi.mock('../hooks/useAdminReservations');
vi.mock('../pages/AdminReservationsPage.module.css', () => ({ default: {} }));
vi.mock('../components/DataTable/DataTable.module.css', () => ({ default: {} }));
vi.mock('../components/AdminFormModal/AdminFormModal.module.css', () => ({ default: {} }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('AdminReservationsPage', () => {
  const fetchReservations = vi.fn();
  const addReservation = vi.fn();
  const cancelReservation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAdminReservations.mockReturnValue({
      reservations: [],
      isLoading: false,
      error: null,
      fetchReservations,
      addReservation,
      cancelReservation,
    });
  });

  it('renders title and add button', () => {
    render(<AdminReservationsPage token="tok" />);
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText('+ Nueva reserva')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useAdminReservations.mockReturnValue({
      reservations: [], isLoading: true, error: null, fetchReservations, addReservation, cancelReservation,
    });
    render(<AdminReservationsPage token="tok" />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows error', () => {
    useAdminReservations.mockReturnValue({
      reservations: [], isLoading: false, error: 'Error', fetchReservations, addReservation, cancelReservation,
    });
    render(<AdminReservationsPage token="tok" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders reservations in table', () => {
    useAdminReservations.mockReturnValue({
      reservations: [{
        id: '1', reservation_code: 'ABC', customer_name: 'Ana', customer_email: 'a@b.com',
        checkin: '2025-01-01T00:00:00', checkout: '2025-01-03T00:00:00', status: 'CONFIRMED',
      }],
      isLoading: false, error: null, fetchReservations, addReservation, cancelReservation,
    });
    render(<AdminReservationsPage token="tok" />);
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('calls fetchReservations on mount', () => {
    render(<AdminReservationsPage token="tok" />);
    expect(fetchReservations).toHaveBeenCalled();
  });

  it('opens modal on add button click', () => {
    render(<AdminReservationsPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nueva reserva'));
    expect(screen.getByText('Nueva Reserva')).toBeInTheDocument();
  });

  it('submits create form', async () => {
    addReservation.mockResolvedValue({ id: '1' });
    render(<AdminReservationsPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nueva reserva'));
    fireEvent.change(screen.getByLabelText('Room ID'), { target: { value: 'r1', name: 'room_id' } });
    fireEvent.change(screen.getByLabelText('Entrada'), { target: { value: '2025-01-01', name: 'checkin' } });
    fireEvent.change(screen.getByLabelText('Salida'), { target: { value: '2025-01-03', name: 'checkout' } });
    fireEvent.change(screen.getByLabelText('Email cliente'), { target: { value: 'a@b.com', name: 'customer_email' } });
    fireEvent.change(screen.getByLabelText('Nombre cliente'), { target: { value: 'Ana', name: 'customer_name' } });
    fireEvent.click(screen.getByText('Crear'));
    await waitFor(() => expect(addReservation).toHaveBeenCalled());
  });

  it('calls cancelReservation on confirm', async () => {
    cancelReservation.mockResolvedValue(true);
    window.confirm = vi.fn(() => true);
    useAdminReservations.mockReturnValue({
      reservations: [{
        id: '1', reservation_code: 'ABC', customer_name: 'Ana', customer_email: 'a@b.com',
        checkin: '2025-01-01T00:00:00', checkout: '2025-01-03T00:00:00', status: 'CONFIRMED',
      }],
      isLoading: false, error: null, fetchReservations, addReservation, cancelReservation,
    });
    render(<AdminReservationsPage token="tok" />);
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(cancelReservation).toHaveBeenCalledWith('1'));
  });
});
