import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/checkout/:holdId" element={<CheckoutPage />} />
        <Route path="/confirmation/:reservationCode" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
