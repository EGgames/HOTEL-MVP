import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutForm } from '../components/CheckoutForm/CheckoutForm';

const mockHold = {
  id: 'hold-1',
  checkin: '2026-05-10',
  checkout: '2026-05-12',
  status: 'PENDING',
};

const mockRoom = {
  id: 'room-1',
  room_number: '101',
  type: 'DOUBLE',
  price_per_night: '100.00',
};

const defaultProps = {
  hold: mockHold,
  room: mockRoom,
  remainingSeconds: 300,
  isExpired: false,
  onExpired: vi.fn(),
  onPaymentSubmit: vi.fn(),
  isLoading: false,
  paymentError: null,
};

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders guest name and email inputs', () => {
    render(<CheckoutForm {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Juan García/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders reservation summary with room and dates', () => {
    render(<CheckoutForm {...defaultProps} />);

    expect(screen.getByText(/#101/)).toBeInTheDocument();
    expect(screen.getByText('2026-05-10')).toBeInTheDocument();
    expect(screen.getByText('2026-05-12')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 nights
  });

  it('disables the pay button when isExpired is true', () => {
    render(<CheckoutForm {...defaultProps} isExpired={true} remainingSeconds={0} />);

    expect(screen.getByRole('button', { name: /pagar/i })).toBeDisabled();
  });

  it('disables the pay button when isLoading is true', () => {
    render(<CheckoutForm {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled();
  });

  it('shows form error when name is empty on submit', () => {
    render(<CheckoutForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /pagar/i }));

    expect(screen.getByText('Por favor ingresá tu nombre.')).toBeInTheDocument();
    expect(defaultProps.onPaymentSubmit).not.toHaveBeenCalled();
  });

  it('shows form error when email is invalid on submit', () => {
    render(<CheckoutForm {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/Juan García/i), {
      target: { value: 'Ana López' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /pagar/i }));

    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(defaultProps.onPaymentSubmit).not.toHaveBeenCalled();
  });

  it('calls onPaymentSubmit with total amount when form is valid', () => {
    const onPaymentSubmit = vi.fn();
    render(<CheckoutForm {...defaultProps} onPaymentSubmit={onPaymentSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Juan García/i), {
      target: { value: 'Ana López' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'ana@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /pagar/i }));

    // 2 nights × $100/night = $200
    expect(onPaymentSubmit).toHaveBeenCalledWith(200);
  });

  it('displays paymentError when provided', () => {
    render(<CheckoutForm {...defaultProps} paymentError="Pago rechazado" />);

    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
  });
});
