import { render, screen, fireEvent } from '@testing-library/react';
import { MyReservationPage } from '../pages/MyReservationPage';
import { useReservationLookup } from '../hooks/useReservationLookup';

vi.mock('../hooks/useReservationLookup');
vi.mock('../pages/MyReservationPage.module.css', () => ({ default: {} }));

describe('MyReservationPage', () => {
  const lookup = vi.fn();
  const reset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useReservationLookup.mockReturnValue({
      reservation: null,
      isLoading: false,
      error: null,
      lookup,
      reset,
    });
  });

  it('renders search form', () => {
    render(<MyReservationPage />);
    expect(screen.getByText('Consultar mi reserva')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: A1B2C3D4')).toBeInTheDocument();
  });

  it('calls lookup on submit', () => {
    render(<MyReservationPage />);
    fireEvent.change(screen.getByPlaceholderText('Ej: A1B2C3D4'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByText('Buscar'));
    expect(lookup).toHaveBeenCalledWith('ABC123');
  });

  it('does not call lookup for empty input', () => {
    render(<MyReservationPage />);
    fireEvent.click(screen.getByText('Buscar'));
    expect(lookup).not.toHaveBeenCalled();
  });

  it('displays error', () => {
    useReservationLookup.mockReturnValue({
      reservation: null, isLoading: false, error: 'Not found', lookup, reset,
    });
    render(<MyReservationPage />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('displays reservation details', () => {
    useReservationLookup.mockReturnValue({
      reservation: {
        reservation_code: 'ABC',
        status: 'CONFIRMED',
        checkin: '2025-01-01T00:00:00',
        checkout: '2025-01-03T00:00:00',
        customer_name: 'Juan',
        total_price: '500.00',
      },
      isLoading: false,
      error: null,
      lookup,
      reset,
    });
    render(<MyReservationPage />);
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useReservationLookup.mockReturnValue({
      reservation: null, isLoading: true, error: null, lookup, reset,
    });
    render(<MyReservationPage />);
    expect(screen.getByText('Buscando...')).toBeInTheDocument();
  });

  it('clears state on clear button', () => {
    useReservationLookup.mockReturnValue({
      reservation: { reservation_code: 'XYZ', status: 'PENDING', checkin: '2025-01-01', checkout: '2025-01-02' },
      isLoading: false, error: null, lookup, reset,
    });
    render(<MyReservationPage />);
    fireEvent.click(screen.getByText('Limpiar'));
    expect(reset).toHaveBeenCalled();
  });
});
