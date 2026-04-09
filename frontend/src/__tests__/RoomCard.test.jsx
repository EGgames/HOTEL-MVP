import { render, screen, fireEvent } from '@testing-library/react';
import { RoomCard } from '../components/RoomCard/RoomCard';

const baseRoom = {
  id: 'room-1',
  room_number: '101',
  type: 'DOUBLE',
  price_per_night: '100',
  capacity: 2,
  amenities: ['air_conditioning', 'wifi'],
};

describe('RoomCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders room number and type label', () => {
    render(<RoomCard room={baseRoom} onSelect={vi.fn()} isLoading={false} />);

    expect(screen.getByText('Doble')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<RoomCard room={baseRoom} onSelect={vi.fn()} isLoading={false} />);

    expect(screen.getByText('U$100.00')).toBeInTheDocument();
  });

  it('renders singular and plural capacity labels', () => {
    const { rerender } = render(
      <RoomCard room={{ ...baseRoom, capacity: 1 }} onSelect={vi.fn()} isLoading={false} />,
    );

    expect(screen.getByText(/Hasta 1 persona/)).toBeInTheDocument();

    rerender(<RoomCard room={{ ...baseRoom, capacity: 3 }} onSelect={vi.fn()} isLoading={false} />);

    expect(screen.getByText(/Hasta 3 personas/)).toBeInTheDocument();
  });

  it('renders amenities list', () => {
    render(<RoomCard room={baseRoom} onSelect={vi.fn()} isLoading={false} />);

    expect(screen.getByText('air conditioning')).toBeInTheDocument();
    expect(screen.getByText('wifi')).toBeInTheDocument();
  });

  it('calls onSelect with room when button is clicked', () => {
    const onSelect = vi.fn();
    render(<RoomCard room={baseRoom} onSelect={onSelect} isLoading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));

    expect(onSelect).toHaveBeenCalledWith(baseRoom);
  });

  it("shows 'Reservando...' and disables button when isLoading", () => {
    render(<RoomCard room={baseRoom} onSelect={vi.fn()} isLoading={true} />);

    const button = screen.getByRole('button', { name: /reservando/i });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Reservando...');
  });
});
