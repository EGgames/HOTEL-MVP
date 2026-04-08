import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../components/SearchBar/SearchBar';

describe('SearchBar', () => {
  it('renders check-in and check-out date inputs', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByLabelText(/entrada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salida/i)).toBeInTheDocument();
  });

  it('renders buscar button', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('shows error when dates are empty on submit', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(screen.getByText(/seleccioná ambas fechas/i)).toBeInTheDocument();
  });


  it('shows error when checkout is equal to checkin', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/entrada/i), { target: { value: '2026-05-10' } });
    fireEvent.change(screen.getByLabelText(/salida/i), { target: { value: '2026-05-10' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(screen.getByText(/posterior/i)).toBeInTheDocument();
  });

  it('calls onSearch with checkin and checkout when dates are valid', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText(/entrada/i), { target: { value: '2026-05-10' } });
    fireEvent.change(screen.getByLabelText(/salida/i), { target: { value: '2026-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(onSearch).toHaveBeenCalledWith('2026-05-10', '2026-05-12', {
      city: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it('does not call onSearch when validation fails', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(onSearch).not.toHaveBeenCalled();
  });
});
