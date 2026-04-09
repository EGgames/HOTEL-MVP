import { render, screen, fireEvent } from '@testing-library/react';
import { AdminFormModal } from '../components/AdminFormModal/AdminFormModal';

vi.mock('../components/AdminFormModal/AdminFormModal.module.css', () => ({ default: {} }));

// Mock dialog element API
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('AdminFormModal', () => {
  const onClose = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('renders title and children when open', () => {
    render(
      <AdminFormModal title="Test Modal" isOpen={true} onClose={onClose}>
        <p>Content</p>
      </AdminFormModal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls showModal when isOpen becomes true', () => {
    render(
      <AdminFormModal title="Test" isOpen={true} onClose={onClose}>
        <p>Body</p>
      </AdminFormModal>,
    );
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('calls onClose on close button click', () => {
    render(
      <AdminFormModal title="Test" isOpen={true} onClose={onClose}>
        <p>Body</p>
      </AdminFormModal>,
    );
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click', () => {
    render(
      <AdminFormModal title="Test" isOpen={true} onClose={onClose}>
        <p>Body</p>
      </AdminFormModal>,
    );
    const dialog = document.querySelector('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
