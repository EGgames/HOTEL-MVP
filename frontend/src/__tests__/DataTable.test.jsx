import { render, screen } from '@testing-library/react';
import { DataTable } from '../components/DataTable/DataTable';

vi.mock('../components/DataTable/DataTable.module.css', () => ({ default: {} }));

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders rows', () => {
    const rows = [{ id: '1', name: 'Ana', email: 'a@b.com' }];
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('renders empty message', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="No hay datos" />);
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
  });

  it('renders default empty message', () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('renders column with custom render', () => {
    const cols = [{ key: 'status', label: 'Estado', render: (v) => `[${v}]` }];
    render(<DataTable columns={cols} rows={[{ id: '1', status: 'OK' }]} />);
    expect(screen.getByText('[OK]')).toBeInTheDocument();
  });

  it('renders actions column', () => {
    const rows = [{ id: '1', name: 'Ana', email: 'a@b.com' }];
    render(
      <DataTable
        columns={columns}
        rows={rows}
        actions={(row) => <button>Edit {row.name}</button>}
      />,
    );
    expect(screen.getByText('Acciones')).toBeInTheDocument();
    expect(screen.getByText('Edit Ana')).toBeInTheDocument();
  });
});
