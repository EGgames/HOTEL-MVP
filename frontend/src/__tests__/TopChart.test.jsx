import { render, screen } from '@testing-library/react';
import { TopChart } from '../components/TopChart/TopChart';

vi.mock('../components/TopChart/TopChart.module.css', () => ({ default: {} }));

describe('TopChart', () => {
  const items = [
    { name: 'Room A', count: 10 },
    { name: 'Room B', count: 5 },
  ];

  it('renders title and items', () => {
    render(<TopChart title="Top Rooms" items={items} labelKey="name" valueKey="count" />);
    expect(screen.getByText('Top Rooms')).toBeInTheDocument();
    expect(screen.getByText('Room A')).toBeInTheDocument();
    expect(screen.getByText('Room B')).toBeInTheDocument();
  });

  it('renders value prefix', () => {
    render(<TopChart title="Revenue" items={[{ name: 'A', val: 1000 }]} labelKey="name" valueKey="val" valuePrefix="$" />);
    expect(screen.getByText(/\$.*1.*000/)).toBeInTheDocument();
  });

  it('returns null when items is empty', () => {
    const { container } = render(<TopChart title="Empty" items={[]} labelKey="name" valueKey="count" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when items is null', () => {
    const { container } = render(<TopChart title="Empty" items={null} labelKey="name" valueKey="count" />);
    expect(container.firstChild).toBeNull();
  });
});
