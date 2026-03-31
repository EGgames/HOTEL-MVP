import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * @param {string} holdId
 * @param {number} amount
 * @param {string} idempotencyKey — UUID generado en el cliente
 */
export async function processPayment(holdId, amount, idempotencyKey) {
  const res = await axios.post(`${API_BASE}/api/v1/payments`, {
    hold_id: holdId,
    amount,
    idempotency_key: idempotencyKey,
  });
  return res.data;
}
