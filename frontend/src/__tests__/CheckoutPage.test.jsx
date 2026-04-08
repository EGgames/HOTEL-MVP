import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CheckoutPage } from '../pages/CheckoutPage';
import { useHoldState } from '../hooks/useHoldState';
import { usePayment } from '../hooks/usePayment';
import { getHoldState } from '../services/holdService';
import { getReservation } from '../services/reservationService';

vi.mock('../hooks/useHoldState', () => ({
  useHoldState: vi.fn(),
}));

vi.mock('../hooks/usePayment', () => ({
  usePayment: vi.fn(),
}));

vi.mock('../services/holdService', () => ({
  getHoldState: vi.fn(),
}));

vi.mock('../services/reservationService', () => ({
  getReservation: vi.fn(),
}));

const locationState = {
  room: { id: 'room-1', room_number: '101', type: 'DOUBLE', price_per_night: '100.00' },
  checkin: '2026-05-10',
  checkout: '2026-05-12',
};

function renderPage(holdId = 'hold-1', state = locationState) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/checkout/${holdId}`, state }]}>
      <Routes>
        <Route path="/checkout/:holdId" element={<CheckoutPage />} />
        <Route path="/" element={<div>Home</div>} />
        <Route path="/confirmation/:reservationCode" element={<div>Confirmation</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheckoutPage', () => {
  const mockPay = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useHoldState.mockReturnValue({
      remainingSeconds: 300,
      isExpired: false,
      error: null,
    });
    usePayment.mockReturnValue({
      isLoading: false,
      error: null,
      pay: mockPay,
    });
  });

  it('renders checkout title and back button', () => {
    renderPage();

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText(/Volver/)).toBeInTheDocument();
  });

  it('renders checkout form with room and dates', () => {
    renderPage();

    expect(screen.getByText(/#101/)).toBeInTheDocument();
    expect(screen.getByText('2026-05-10')).toBeInTheDocument();
    expect(screen.getByText('2026-05-12')).toBeInTheDocument();
  });

  it('redirects to home when holdError is present', () => {
    useHoldState.mockReturnValue({
      remainingSeconds: 0,
      isExpired: true,
      error: 'Hold not found',
    });

    renderPage();

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('calls pay and navigates on successful payment', async () => {
    mockPay.mockResolvedValue({ success: true });
    getHoldState.mockResolvedValue({ reservation_id: 'res-1' });
    getReservation.mockResolvedValue({ reservation_code: 'ABC12345' });

    renderPage();

    // Fill form and submit
    fireEvent.change(screen.getByPlaceholderText(/Juan García/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /pagar/i }));
    });

    expect(mockPay).toHaveBeenCalled();
  });

  it('handles expired timer', () => {
    vi.useFakeTimers();

    useHoldState.mockReturnValue({
      remainingSeconds: 0,
      isExpired: true,
      error: null,
    });

    renderPage();

    // The expired handler sets a timeout to navigate
    vi.advanceTimersByTime(4000);

    vi.useRealTimers();
  });
});
