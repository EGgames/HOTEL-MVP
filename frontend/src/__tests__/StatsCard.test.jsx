import { render, screen } from '@testing-library/react';
import { StatsCard } from '../components/StatsCard/StatsCard';

vi.mock('../components/StatsCard/StatsCard.module.css', () => ({ default: {} }));

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Total" value="$1,000" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatsCard label="Total" value="10" icon="💰" />);
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('renders without icon', () => {
    const { container } = render(<StatsCard label="Total" value="5" />);
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });
});
