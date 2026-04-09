import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * @param {string} roomId
 * @param {string} checkin  — YYYY-MM-DD
 * @param {string} checkout — YYYY-MM-DD
 */
export async function createHold(roomId, checkin, checkout) {
  const res = await axios.post(`${API_BASE}/api/v1/rooms/${roomId}/hold`, {
    checkin,
    checkout,
  });
  return res.data;
}

/**
 * @param {string} holdId
 */
export async function getHoldState(holdId) {
  const res = await axios.get(`${API_BASE}/api/v1/holds/${holdId}`);
  return res.data;
}
