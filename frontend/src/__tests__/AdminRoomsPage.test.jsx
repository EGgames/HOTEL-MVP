import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminRoomsPage } from '../pages/AdminRoomsPage';
import { useAdminRooms } from '../hooks/useAdminRooms';
import { getHotels } from '../services/adminService';

vi.mock('../hooks/useAdminRooms');
vi.mock('../services/adminService', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getHotels: vi.fn().mockResolvedValue([{ id: 'h1', name: 'Hotel Sol', city: 'Buenos Aires', country: 'Argentina' }]) };
});
vi.mock('../pages/AdminRoomsPage.module.css', () => ({ default: {} }));
vi.mock('../components/DataTable/DataTable.module.css', () => ({ default: {} }));
vi.mock('../components/AdminFormModal/AdminFormModal.module.css', () => ({ default: {} }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('AdminRoomsPage', () => {
  const fetchRooms = vi.fn();
  const addRoom = vi.fn();
  const editRoom = vi.fn();
  const removeRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAdminRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      error: null,
      fetchRooms,
      addRoom,
      editRoom,
      removeRoom,
    });
  });

  it('renders title and add button', () => {
    render(<AdminRoomsPage token="tok" />);
    expect(screen.getByText('Habitaciones')).toBeInTheDocument();
    expect(screen.getByText('+ Nueva habitación')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useAdminRooms.mockReturnValue({
      rooms: [], isLoading: true, error: null, fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows error', () => {
    useAdminRooms.mockReturnValue({
      rooms: [], isLoading: false, error: 'Error', fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders rooms in table', () => {
    useAdminRooms.mockReturnValue({
      rooms: [{
        id: '1', room_number: '101', type: 'SINGLE', price_per_night: '100.00',
        capacity: 2, floor: 1, wing: 'A',
      }],
      isLoading: false, error: null, fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getAllByText('Individual').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('calls fetchRooms on mount', () => {
    render(<AdminRoomsPage token="tok" />);
    expect(fetchRooms).toHaveBeenCalled();
  });

  it('opens create modal', () => {
    render(<AdminRoomsPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nueva habitación'));
    expect(screen.getByText('Nueva Habitación')).toBeInTheDocument();
  });

  it('submits create form', async () => {
    addRoom.mockResolvedValue({ id: '1' });
    render(<AdminRoomsPage token="tok" />);
    fireEvent.click(screen.getByText('+ Nueva habitación'));
    // Wait for hotels to load asynchronously into the select
    await waitFor(() => expect(screen.getByText('Hotel Sol — Buenos Aires, Argentina')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '201', name: 'room_number' } });
    fireEvent.change(screen.getByLabelText('Hotel'), { target: { value: 'h1', name: 'hotel_id' } });
    fireEvent.change(screen.getByLabelText('Precio / noche'), { target: { value: '150', name: 'price_per_night' } });
    fireEvent.change(screen.getByLabelText('Capacidad'), { target: { value: '2', name: 'capacity' } });
    fireEvent.click(screen.getByText('Crear'));
    await waitFor(() => expect(addRoom).toHaveBeenCalled());
  });

  it('opens edit modal', () => {
    useAdminRooms.mockReturnValue({
      rooms: [{ id: '1', room_number: '101', type: 'SINGLE', price_per_night: '100.00', capacity: 2, floor: 1, wing: 'A' }],
      isLoading: false, error: null, fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('Editar Habitación')).toBeInTheDocument();
  });

  it('submits edit form', async () => {
    editRoom.mockResolvedValue({ id: '1' });
    useAdminRooms.mockReturnValue({
      rooms: [{ id: '1', room_number: '101', type: 'SINGLE', price_per_night: '100', capacity: 2, floor: 1, wing: 'A', amenities: ['wifi'] }],
      isLoading: false, error: null, fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.change(screen.getByLabelText('Precio / noche'), { target: { value: '200', name: 'price_per_night' } });
    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() => expect(editRoom).toHaveBeenCalled());
  });

  it('calls removeRoom on delete confirm', async () => {
    removeRoom.mockResolvedValue(true);
    window.confirm = vi.fn(() => true);
    useAdminRooms.mockReturnValue({
      rooms: [{ id: '1', room_number: '101', type: 'SINGLE', price_per_night: '100', capacity: 2 }],
      isLoading: false, error: null, fetchRooms, addRoom, editRoom, removeRoom,
    });
    render(<AdminRoomsPage token="tok" />);
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => expect(removeRoom).toHaveBeenCalledWith('1'));
  });
});
