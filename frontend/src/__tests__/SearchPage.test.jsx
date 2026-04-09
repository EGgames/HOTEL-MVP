import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SearchPage } from '../pages/SearchPage';
import { useAvailableRooms } from '../hooks/useAvailableRooms';
import { useRoomHold } from '../hooks/useRoomHold';

vi.mock('../hooks/useAvailableRooms', () => ({
  useAvailableRooms: vi.fn(),
}));

vi.mock('../hooks/useRoomHold', () => ({
  useRoomHold: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/checkout/:holdId" element={<div>Checkout</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SearchPage', () => {
  const mockSearch = vi.fn();
  const mockRequestHold = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAvailableRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      error: null,
      search: mockSearch,
    });
    useRoomHold.mockReturnValue({
      isLoading: false,
      error: null,
      requestHold: mockRequestHold,
    });
  });

  it('renders header and search bar', () => {
    renderPage();

    expect(screen.getByText(/Hotel Booking MVP/i)).toBeInTheDocument();
  });

  it('shows search error when present', () => {
    useAvailableRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      error: 'No rooms found',
      search: mockSearch,
    });

    renderPage();

    expect(screen.getByText('No rooms found')).toBeInTheDocument();
  });

  it('renders rooms when available', () => {
    useAvailableRooms.mockReturnValue({
      rooms: [
        { id: 'r1', room_number: '101', type: 'DOUBLE', price_per_night: '100.00', capacity: 2, amenities: ['wifi'] },
      ],
      isLoading: false,
      error: null,
      search: mockSearch,
    });

    renderPage();

    expect(screen.getByText(/#101/)).toBeInTheDocument();
  });

  it('calls search on SearchBar submit', () => {
    renderPage();

    const checkinInput = screen.getByLabelText(/entrada/i);
    const checkoutInput = screen.getByLabelText(/salida/i);
    fireEvent.change(checkinInput, { target: { value: '2026-05-10' } });
    fireEvent.change(checkoutInput, { target: { value: '2026-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(mockSearch).toHaveBeenCalledWith('2026-05-10', '2026-05-12', undefined, {
      city: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it('calls requestHold and navigates on room select', async () => {
    mockRequestHold.mockResolvedValue({ id: 'hold-1' });
    useAvailableRooms.mockReturnValue({
      rooms: [
        { id: 'r1', room_number: '101', type: 'DOUBLE', price_per_night: '100.00', capacity: 2, amenities: ['wifi'] },
      ],
      isLoading: false,
      error: null,
      search: mockSearch,
    });

    renderPage();

    // First search to set dates
    const checkinInput = screen.getByLabelText(/entrada/i);
    const checkoutInput = screen.getByLabelText(/salida/i);
    fireEvent.change(checkinInput, { target: { value: '2026-05-10' } });
    fireEvent.change(checkoutInput, { target: { value: '2026-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    // Select room
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    });

    expect(mockRequestHold).toHaveBeenCalledWith('r1', '2026-05-10', '2026-05-12');
  });

  it('shows toast error when hold fails', async () => {
    mockRequestHold.mockResolvedValue(null);
    useRoomHold.mockReturnValue({
      isLoading: false,
      error: 'Room conflict',
      requestHold: mockRequestHold,
    });
    useAvailableRooms.mockReturnValue({
      rooms: [
        { id: 'r1', room_number: '101', type: 'DOUBLE', price_per_night: '100.00', capacity: 2, amenities: ['wifi'] },
      ],
      isLoading: false,
      error: null,
      search: mockSearch,
    });

    renderPage();

    const checkinInput = screen.getByLabelText(/entrada/i);
    const checkoutInput = screen.getByLabelText(/salida/i);
    fireEvent.change(checkinInput, { target: { value: '2026-05-10' } });
    fireEvent.change(checkoutInput, { target: { value: '2026-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
