import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminReservationsPage } from './pages/AdminReservationsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminRoomsPage } from './pages/AdminRoomsPage';
import { MyReservationPage } from './pages/MyReservationPage';
import { AdminProtectedRoute } from './components/AdminProtectedRoute/AdminProtectedRoute';
import { AdminSidebar } from './components/AdminSidebar/AdminSidebar';
import { useAdminAuth } from './hooks/useAdminAuth';

function AdminLayout() {
  const { token, isAuthenticated, logout } = useAdminAuth();

  return (
    <AdminProtectedRoute isAuthenticated={isAuthenticated}>
      <div style={{ display: 'flex' }}>
        <AdminSidebar onLogout={logout} />
        <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: '#f1f5f9' }}>
          <Outlet context={{ token }} />
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

function AdminDashboardWrapper() {
  const { token } = useOutletContext();
  return <AdminDashboardPage token={token} />;
}

function AdminReservationsWrapper() {
  const { token } = useOutletContext();
  return <AdminReservationsPage token={token} />;
}

function AdminCustomersWrapper() {
  const { token } = useOutletContext();
  return <AdminCustomersPage token={token} />;
}

function AdminRoomsWrapper() {
  const { token } = useOutletContext();
  return <AdminRoomsPage token={token} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/checkout/:holdId" element={<CheckoutPage />} />
        <Route path="/confirmation/:reservationCode" element={<ConfirmationPage />} />
        <Route path="/my-reservation" element={<MyReservationPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardWrapper />} />
          <Route path="reservations" element={<AdminReservationsWrapper />} />
          <Route path="customers" element={<AdminCustomersWrapper />} />
          <Route path="rooms" element={<AdminRoomsWrapper />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
