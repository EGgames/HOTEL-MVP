import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Customer } from '../entities/customer.entity';
import { CreateAdminReservationDto } from '../dto/create-admin-reservation.dto';
import { generateReservationCode } from '../../../common/utils/reservation-code.util';
import { MailService } from './mail.service';

@Injectable()
export class AdminReservationsService {
  private readonly logger = new Logger(AdminReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  async list(filters?: { status?: string; from_date?: string; to_date?: string }): Promise<object[]> {
    const qb = this.reservationRepository
      .createQueryBuilder('res')
      .orderBy('res.created_at', 'DESC');

    if (filters?.status) {
      qb.andWhere('res.status = :status', { status: filters.status });
    }
    if (filters?.from_date) {
      qb.andWhere('res.checkin >= :from_date', { from_date: filters.from_date });
    }
    if (filters?.to_date) {
      qb.andWhere('res.checkout <= :to_date', { to_date: filters.to_date });
    }

    const reservations = await qb.getMany();

    const rooms = await this.roomRepository.find();
    const roomMap = new Map(rooms.map((r) => [r.id, r]));

    const hotels = await this.hotelRepository.find();
    const hotelMap = new Map(hotels.map((h) => [h.id, h]));

    return reservations.map((res) => {
      const room = roomMap.get(res.room_id);
      const hotel = room ? hotelMap.get(room.hotel_id) : null;
      const checkin = new Date(res.checkin);
      const checkout = new Date(res.checkout);
      const nights = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: res.id,
        reservation_code: res.reservation_code,
        room_number: room?.room_number ?? null,
        hotel_name: hotel?.name ?? null,
        checkin: res.checkin,
        checkout: res.checkout,
        nights,
        status: res.status,
        customer_email: res.customer_email,
        customer_name: res.customer_name,
        total_amount: room ? parseFloat(room.price_per_night as unknown as string) * nights : null,
        created_at: res.created_at,
      };
    });
  }

  async create(dto: CreateAdminReservationDto): Promise<object> {
    return this.dataSource.transaction(async (manager) => {
      const room = await manager.findOne(Room, { where: { id: dto.room_id } });
      if (!room) {
        throw new NotFoundException(`Habitación con id ${dto.room_id} no encontrada`);
      }

      const conflicting = await manager
        .createQueryBuilder(Reservation, 'res')
        .where('res.room_id = :roomId', { roomId: dto.room_id })
        .andWhere('res.status = :status', { status: ReservationStatus.CONFIRMED })
        .andWhere('res.checkin < :checkout', { checkout: dto.checkout })
        .andWhere('res.checkout > :checkin', { checkin: dto.checkin })
        .getOne();

      if (conflicting) {
        throw new ConflictException('Habitación no disponible para las fechas seleccionadas');
      }

      const code = generateReservationCode();
      const reservation = manager.create(Reservation, {
        reservation_code: code,
        room_id: dto.room_id,
        hold_id: null,
        payment_id: null,
        checkin: new Date(dto.checkin),
        checkout: new Date(dto.checkout),
        status: ReservationStatus.CONFIRMED,
        customer_email: dto.customer_email,
        customer_name: dto.customer_name,
      });

      const saved = await manager.save(Reservation, reservation);

      // Auto-register customer if not exists
      const existingCustomer = await manager.findOne(Customer, {
        where: { email: dto.customer_email },
      });
      if (!existingCustomer) {
        const customer = manager.create(Customer, {
          email: dto.customer_email,
          name: dto.customer_name,
        });
        await manager.save(Customer, customer);
      }

      const hotel = await this.hotelRepository.findOne({ where: { id: room.hotel_id } });
      const checkin = new Date(dto.checkin);
      const checkout = new Date(dto.checkout);
      const nights = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = parseFloat(room.price_per_night as unknown as string) * nights;

      this.mailService.sendReservationConfirmation({
        to: dto.customer_email,
        reservationCode: code,
        hotelName: hotel?.name ?? 'Hotel',
        roomNumber: room.room_number,
        checkin: dto.checkin,
        checkout: dto.checkout,
        totalAmount,
      }).catch((err) => this.logger.error('Error enviando email de confirmación', err));

      return {
        id: saved.id,
        reservation_code: saved.reservation_code,
        room_id: saved.room_id,
        room_number: room.room_number,
        hotel_name: hotel?.name ?? null,
        checkin: saved.checkin,
        checkout: saved.checkout,
        nights,
        status: saved.status,
        customer_email: saved.customer_email,
        customer_name: saved.customer_name,
        total_amount: totalAmount,
        created_at: saved.created_at,
      };
    });
  }

  async cancel(id: string): Promise<{ message: string }> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    reservation.status = ReservationStatus.CANCELLED;
    await this.reservationRepository.save(reservation);

    return { message: 'Reserva cancelada' };
  }
}
