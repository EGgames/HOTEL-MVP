import { render, screen } from '@testing-library/react';
import { RoomList } from '../components/RoomList/RoomList';

const rooms = [
  {
    id: 'room-1',
    room_number: '101',
    type: 'DOUBLE',
    price_per_night: '100',
    capacity: 2,
    amenities: ['wifi'],
  },
  {
    id: 'room-2',
    room_number: '102',
    type: 'SINGLE',
    price_per_night: '80',
    capacity: 1,
    amenities: [],
  },
];

describe('RoomList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner and text when isLoading is true', () => {
    render(
      <RoomList
        rooms={rooms}
        isLoading={true}
        onSelectRoom={vi.fn()}
        selectingRoomId={null}
      />,
    );

    expect(screen.getByLabelText('Cargando habitaciones')).toBeInTheDocument();
    expect(screen.getByText('Buscando disponibilidad...')).toBeInTheDocument();
  });

  it('shows empty message when rooms is empty', () => {
    render(
      <RoomList
        rooms={[]}
        isLoading={false}
        onSelectRoom={vi.fn()}
        selectingRoomId={null}
      />,
    );

    expect(
      screen.getByText('No hay habitaciones disponibles para las fechas seleccionadas.'),
    ).toBeInTheDocument();
  });

  it('shows empty message when rooms is null', () => {
    render(
      <RoomList
        rooms={null}
        isLoading={false}
        onSelectRoom={vi.fn()}
        selectingRoomId={null}
      />,
    );

    expect(
      screen.getByText('No hay habitaciones disponibles para las fechas seleccionadas.'),
    ).toBeInTheDocument();
  });

  it('renders one RoomCard per room', () => {
    render(
      <RoomList
        rooms={rooms}
        isLoading={false}
        onSelectRoom={vi.fn()}
        selectingRoomId={null}
      />,
    );

    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
  });
});
