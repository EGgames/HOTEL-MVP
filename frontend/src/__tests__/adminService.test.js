import axios from 'axios';
import {
  adminLogin,
  getDashboard,
  getReservations,
  createReservation,
  deleteReservation,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../services/adminService';

vi.mock('axios');

describe('adminService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adminLogin posts credentials and returns data', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'jwt' } });

    const result = await adminLogin('a@b.com', 'pass');

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/admin/auth/login'), { email: 'a@b.com', password: 'pass' });
    expect(result).toEqual({ access_token: 'jwt' });
  });

  it('getDashboard sends auth header', async () => {
    axios.get.mockResolvedValue({ data: { total_revenue: 100 } });

    const result = await getDashboard('tok');

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/admin/dashboard'), {
      headers: { Authorization: 'Bearer tok' },
    });
    expect(result).toEqual({ total_revenue: 100 });
  });

  it('getReservations sends filters as params', async () => {
    axios.get.mockResolvedValue({ data: [] });

    await getReservations('tok', { status: 'CONFIRMED' });

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reservations'),
      expect.objectContaining({ params: { status: 'CONFIRMED' } }),
    );
  });

  it('createReservation posts data with token', async () => {
    const dto = { room_id: 'r1', checkin: '2026-06-01', checkout: '2026-06-03', customer_email: 'a@b.com', customer_name: 'A' };
    axios.post.mockResolvedValue({ data: { id: 'new' } });

    const result = await createReservation(dto, 'tok');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reservations'),
      dto,
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
    expect(result).toEqual({ id: 'new' });
  });

  it('deleteReservation sends DELETE with token', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'ok' } });

    const result = await deleteReservation('r1', 'tok');

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reservations/r1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
    expect(result).toEqual({ message: 'ok' });
  });

  it('getCustomers sends auth header', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'c1' }] });

    const result = await getCustomers('tok');

    expect(result).toEqual([{ id: 'c1' }]);
  });

  it('getCustomer fetches by id with auth', async () => {
    axios.get.mockResolvedValue({ data: { id: 'c1' } });

    const result = await getCustomer('c1', 'tok');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/customers/c1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
    expect(result).toEqual({ id: 'c1' });
  });

  it('createCustomer posts data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'c-new' } });

    const result = await createCustomer({ email: 'a@b.com', name: 'A' }, 'tok');

    expect(result).toEqual({ id: 'c-new' });
  });

  it('updateCustomer patches data', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'c1', name: 'Updated' } });

    const result = await updateCustomer('c1', { name: 'Updated' }, 'tok');

    expect(result).toEqual({ id: 'c1', name: 'Updated' });
  });

  it('deleteCustomer sends DELETE', async () => {
    axios.delete.mockResolvedValue({});

    await deleteCustomer('c1', 'tok');

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/admin/customers/c1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
  });

  it('getRooms sends auth header', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'r1' }] });

    const result = await getRooms('tok');

    expect(result).toEqual([{ id: 'r1' }]);
  });

  it('createRoom posts data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'r-new' } });

    const result = await createRoom({ room_number: '101' }, 'tok');

    expect(result).toEqual({ id: 'r-new' });
  });

  it('updateRoom patches data', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'r1', price: 200 } });

    const result = await updateRoom('r1', { price_per_night: 200 }, 'tok');

    expect(result).toEqual({ id: 'r1', price: 200 });
  });

  it('deleteRoom sends DELETE', async () => {
    axios.delete.mockResolvedValue({});

    await deleteRoom('r1', 'tok');

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/admin/rooms/r1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
  });
});
