import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function adminLogin(email, password) {
  const res = await axios.post(`${API_BASE}/api/v1/admin/auth/login`, { email, password });
  return res.data;
}

export async function getDashboard(token) {
  const res = await axios.get(`${API_BASE}/api/v1/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getReservations(token, filters = {}) {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;

  const res = await axios.get(`${API_BASE}/api/v1/admin/reservations`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

export async function createReservation(data, token) {
  const res = await axios.post(`${API_BASE}/api/v1/admin/reservations`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteReservation(id, token) {
  const res = await axios.delete(`${API_BASE}/api/v1/admin/reservations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getCustomers(token) {
  const res = await axios.get(`${API_BASE}/api/v1/admin/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getCustomer(id, token) {
  const res = await axios.get(`${API_BASE}/api/v1/admin/customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createCustomer(data, token) {
  const res = await axios.post(`${API_BASE}/api/v1/admin/customers`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateCustomer(id, data, token) {
  const res = await axios.patch(`${API_BASE}/api/v1/admin/customers/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteCustomer(id, token) {
  await axios.delete(`${API_BASE}/api/v1/admin/customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getRooms(token) {
  const res = await axios.get(`${API_BASE}/api/v1/admin/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createRoom(data, token) {
  const res = await axios.post(`${API_BASE}/api/v1/admin/rooms`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateRoom(id, data, token) {
  const res = await axios.patch(`${API_BASE}/api/v1/admin/rooms/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteRoom(id, token) {
  await axios.delete(`${API_BASE}/api/v1/admin/rooms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getHotels(token) {
  const res = await axios.get(`${API_BASE}/api/v1/admin/hotels`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
