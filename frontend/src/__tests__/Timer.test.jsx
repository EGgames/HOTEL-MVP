import { render, screen, act } from '@testing-library/react';
import { Timer } from '../components/Timer/Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders countdown in MM:SS format', () => {
    render(<Timer remainingSeconds={300} isExpired={false} onExpired={vi.fn()} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('renders expired message when isExpired is true', () => {
    render(<Timer remainingSeconds={0} isExpired={true} onExpired={vi.fn()} />);

    expect(screen.getByText(/ha expirado/i)).toBeInTheDocument();
  });

  it('renders expired message when remainingSeconds is 0', () => {
    render(<Timer remainingSeconds={0} isExpired={false} onExpired={vi.fn()} />);

    expect(screen.getByText(/ha expirado/i)).toBeInTheDocument();
  });

  it('shows urgent message when remainingSeconds is <= 60', () => {
    render(<Timer remainingSeconds={45} isExpired={false} onExpired={vi.fn()} />);

    expect(screen.getByText(/pronto/i)).toBeInTheDocument();
  });

  it('shows standard message when remainingSeconds is > 60', () => {
    render(<Timer remainingSeconds={120} isExpired={false} onExpired={vi.fn()} />);

    expect(screen.getByText(/antes de que expire/i)).toBeInTheDocument();
  });

  it('calls onExpired when countdown reaches 0', () => {
    const onExpired = vi.fn();
    render(<Timer remainingSeconds={1} isExpired={false} onExpired={onExpired} />);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('syncs to new remainingSeconds when prop updates', () => {
    const { rerender } = render(
      <Timer remainingSeconds={300} isExpired={false} onExpired={vi.fn()} />,
    );

    expect(screen.getByText('05:00')).toBeInTheDocument();

    rerender(<Timer remainingSeconds={60} isExpired={false} onExpired={vi.fn()} />);

    expect(screen.getByText('01:00')).toBeInTheDocument();
  });
});
