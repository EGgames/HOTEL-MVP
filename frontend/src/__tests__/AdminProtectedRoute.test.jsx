import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute/AdminProtectedRoute';

describe('AdminProtectedRoute', () => {
  it('renders children when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminProtectedRoute isAuthenticated={true}>
          <p>Protected Content</p>
        </AdminProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute isAuthenticated={false}>
                <p>Protected Content</p>
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<p>Login Page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
