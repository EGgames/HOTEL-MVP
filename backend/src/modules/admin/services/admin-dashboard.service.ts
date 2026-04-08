import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getStats(): Promise<object> {
    const confirmedReservations = await this.reservationRepository.find({
      where: { status: ReservationStatus.CONFIRMED },
    });

    let totalRevenue = 0;
    const roomCountMap = new Map<string, { count: number; revenue: number }>();
    const customerCountMap = new Map<string, { name: string; count: number; totalSpent: number }>();

    const rooms = await this.roomRepository.find();
    const roomMap = new Map(rooms.map((r) => [r.id, r]));

    const hotels = await this.hotelRepository.find();
    const hotelMap = new Map(hotels.map((h) => [h.id, h]));

    for (const res of confirmedReservations) {
      const room = roomMap.get(res.room_id);
      if (!room) continue;

      const checkin = new Date(res.checkin);
      const checkout = new Date(res.checkout);
      const nights = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(room.price_per_night as unknown as string) * nights;

      totalRevenue += amount;

      const roomStats = roomCountMap.get(res.room_id) ?? { count: 0, revenue: 0 };
      roomStats.count += 1;
      roomStats.revenue += amount;
      roomCountMap.set(res.room_id, roomStats);

      if (res.customer_email) {
        const custStats = customerCountMap.get(res.customer_email) ?? {
          name: res.customer_name ?? res.customer_email,
          count: 0,
          totalSpent: 0,
        };
        custStats.count += 1;
        custStats.totalSpent += amount;
        customerCountMap.set(res.customer_email, custStats);
      }
    }

    const allRoomsStats = Array.from(roomCountMap.entries()).map(([roomId, stats]) => {
      const room = roomMap.get(roomId);
      const hotel = room ? hotelMap.get(room.hotel_id) : null;
      return {
        room_id: roomId,
        room_number: room?.room_number ?? null,
        hotel_name: hotel?.name ?? null,
        reservation_count: stats.count,
        revenue: Math.round(stats.revenue * 100) / 100,
      };
    }).sort((a, b) => b.reservation_count - a.reservation_count);

    const allCustomersStats = Array.from(customerCountMap.entries()).map(([email, stats]) => ({
      email,
      name: stats.name,
      reservation_count: stats.count,
      total_spent: Math.round(stats.totalSpent * 100) / 100,
    })).sort((a, b) => b.reservation_count - a.reservation_count);

    return {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_reservations: confirmedReservations.length,
      top_rooms: allRoomsStats.slice(0, 5),
      top_customers: allCustomersStats.slice(0, 5),
      all_rooms_stats: allRoomsStats,
      all_customers_stats: allCustomersStats,
    };
  }
}
