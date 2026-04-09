import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * @param {string} holdId
 * @param {number} amount
 * @param {string} idempotencyKey — UUID generado en el cliente
 * @param {{ customer_email?: string, customer_name?: string }} [customerInfo]
 */
export async function processPayment(holdId, amount, idempotencyKey, customerInfo = {}) {
  const res = await axios.post(`${API_BASE}/api/v1/payments`, {
    hold_id: holdId,
    amount,
    idempotency_key: idempotencyKey,
    ...(customerInfo.customer_email && { customer_email: customerInfo.customer_email }),
    ...(customerInfo.customer_name && { customer_name: customerInfo.customer_name }),
  });
  return res.data;
}
