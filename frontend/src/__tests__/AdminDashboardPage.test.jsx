import { render, screen } from '@testing-library/react';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

vi.mock('../hooks/useAdminDashboard');
vi.mock('../pages/AdminDashboardPage.module.css', () => ({ default: {} }));
vi.mock('../components/StatsCard/StatsCard.module.css', () => ({ default: {} }));
vi.mock('../components/TopChart/TopChart.module.css', () => ({ default: {} }));

describe('AdminDashboardPage', () => {
  const fetchStats = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    useAdminDashboard.mockReturnValue({ stats: null, isLoading: true, error: null, fetchStats });
    render(<AdminDashboardPage token="tok" />);
    expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useAdminDashboard.mockReturnValue({ stats: null, isLoading: false, error: 'Server fail', fetchStats });
    render(<AdminDashboardPage token="tok" />);
    expect(screen.getByText('Server fail')).toBeInTheDocument();
  });

  it('renders null when no stats', () => {
    useAdminDashboard.mockReturnValue({ stats: null, isLoading: false, error: null, fetchStats });
    const { container } = render(<AdminDashboardPage token="tok" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stats cards', () => {
    useAdminDashboard.mockReturnValue({
      stats: {
        total_revenue: 5000,
        total_reservations: 10,
        all_rooms_stats: [{ id: '1' }],
        all_customers_stats: [{ id: '1' }, { id: '2' }],
        top_rooms: [],
        top_customers: [],
      },
      isLoading: false,
      error: null,
      fetchStats,
    });
    render(<AdminDashboardPage token="tok" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/\$5[,.]?000/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls fetchStats on mount', () => {
    useAdminDashboard.mockReturnValue({ stats: null, isLoading: true, error: null, fetchStats });
    render(<AdminDashboardPage token="tok" />);
    expect(fetchStats).toHaveBeenCalled();
  });
});
