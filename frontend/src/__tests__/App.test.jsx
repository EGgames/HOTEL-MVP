import { render, screen } from '@testing-library/react';
import App from '../App';
import { useAvailableRooms } from '../hooks/useAvailableRooms';
import { useRoomHold } from '../hooks/useRoomHold';

vi.mock('../hooks/useAvailableRooms', () => ({
  useAvailableRooms: vi.fn(),
}));

vi.mock('../hooks/useRoomHold', () => ({
  useRoomHold: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    useAvailableRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      error: null,
      search: vi.fn(),
    });
    useRoomHold.mockReturnValue({
      isLoading: false,
      error: null,
      requestHold: vi.fn(),
    });
  });

  it('renders SearchPage on default route', () => {
    render(<App />);

    expect(screen.getByText(/Hotel Booking MVP/i)).toBeInTheDocument();
  });
});
