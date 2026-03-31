import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * @param {string} reservationId
 */
export async function getReservation(reservationId) {
  const res = await axios.get(`${API_BASE}/api/v1/reservations/${reservationId}`);
  return res.data;
}

/**
 * @param {string} code — 8-char alphanumeric
 */
export async function getReservationByCode(code) {
  const res = await axios.get(`${API_BASE}/api/v1/reservations`, {
    params: { reservation_code: code },
  });
  return res.data;
}
