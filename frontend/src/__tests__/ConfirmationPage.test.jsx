import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { useReservation } from '../hooks/useReservation';

vi.mock('../hooks/useReservation', () => ({
  useReservation: vi.fn(),
}));

function renderPage(code = 'ABC12345') {
  return render(
    <MemoryRouter initialEntries={[`/confirmation/${code}`]}>
      <Routes>
        <Route path="/confirmation/:reservationCode" element={<ConfirmationPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when isLoading is true', () => {
    useReservation.mockReturnValue({ reservation: null, isLoading: true, error: null });

    renderPage();

    expect(screen.getByText(/Cargando confirmación/i)).toBeInTheDocument();
  });

  it('shows error text when there is an error', () => {
    useReservation.mockReturnValue({ reservation: null, isLoading: false, error: 'Not found' });

    renderPage();

    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('shows fallback text when reservation is null and no error', () => {
    useReservation.mockReturnValue({ reservation: null, isLoading: false, error: null });

    renderPage();

    expect(screen.getByText(/No se encontró la reserva/i)).toBeInTheDocument();
  });

  it('renders PaymentSummary when reservation is loaded', () => {
    useReservation.mockReturnValue({
      reservation: {
        reservation_code: 'ABC12345',
        room_number: '101',
        checkin: '2026-05-10',
        checkout: '2026-05-12',
        nights: 2,
        price_per_night: 100,
        total_amount: 200,
        status: 'CONFIRMED',
      },
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(/ABC12345/)).toBeInTheDocument();
  });

  it('shows "Volver al inicio" button on error', () => {
    useReservation.mockReturnValue({ reservation: null, isLoading: false, error: 'Error' });

    renderPage();

    expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
  });
});
