import { render, screen } from '@testing-library/react';
import { PaymentSummary } from '../components/PaymentSummary/PaymentSummary';

const reservation = {
  reservation_code: 'ABC12345',
  room_number: '101',
  checkin: '2026-05-10',
  checkout: '2026-05-12',
  price_per_night: 100,
  total_amount: 200,
};

describe('PaymentSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reservation code', () => {
    render(<PaymentSummary reservation={reservation} />);

    expect(screen.getByText('ABC12345')).toBeInTheDocument();
  });

  it('renders room number', () => {
    render(<PaymentSummary reservation={reservation} />);

    expect(screen.getByText('#101')).toBeInTheDocument();
  });

  it('renders checkin and checkout dates', () => {
    render(<PaymentSummary reservation={reservation} />);

    expect(screen.getByText('2026-05-10')).toBeInTheDocument();
    expect(screen.getByText('2026-05-12')).toBeInTheDocument();
  });

  it('renders total amount', () => {
    render(<PaymentSummary reservation={reservation} />);

    expect(screen.getByText('U$200.00')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<PaymentSummary reservation={reservation} />);

    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });
});
