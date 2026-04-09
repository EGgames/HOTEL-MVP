import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * @param {string} checkin  — YYYY-MM-DD
 * @param {string} checkout — YYYY-MM-DD
 * @param {string} [hotelId]
 */
export async function getAvailableRooms(checkin, checkout, hotelId) {
  const params = { checkin, checkout };
  if (hotelId) params.hotel_id = hotelId;

  const res = await axios.get(`${API_BASE}/api/v1/rooms/available`, { params });
  return res.data;
}
