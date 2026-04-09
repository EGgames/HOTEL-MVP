import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Room } from './entities/room.entity';
import { Hold, HoldStatus } from '../holds/entities/hold.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateHoldDto } from './dto/create-hold.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Hold)
    private readonly holdRepository: Repository<Hold>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getAvailableRooms(query: AvailabilityQueryDto): Promise<Room[]> {
    const { checkin, checkout, hotel_id, city, min_price, max_price } = query;

    if (min_price != null && max_price != null && min_price > max_price) {
      throw new BadRequestException('min_price no puede ser mayor que max_price');
    }

    const unavailableFromHolds = await this.holdRepository
      .createQueryBuilder('hold')
      .select('hold.room_id')
      .where('hold.status = :status', { status: HoldStatus.PENDING })
      .andWhere('hold.expires_at > NOW()')
      .andWhere('hold.checkin < :checkout', { checkout })
      .andWhere('hold.checkout > :checkin', { checkin })
      .getRawMany<{ hold_room_id: string }>();

    const unavailableFromReservations = await this.reservationRepository
      .createQueryBuilder('res')
      .select('res.room_id')
      .where('res.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere('res.checkin < :checkout', { checkout })
      .andWhere('res.checkout > :checkin', { checkin })
      .getRawMany<{ res_room_id: string }>();

    const blockedIds = [
      ...unavailableFromHolds.map((r) => r.hold_room_id),
      ...unavailableFromReservations.map((r) => r.res_room_id),
    ];

    const qb = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.hotel', 'hotel')
      .orderBy('room.price_per_night', 'ASC');

    if (hotel_id) {
      qb.andWhere('room.hotel_id = :hotel_id', { hotel_id });
    }

    if (city) {
      qb.andWhere('LOWER(hotel.city) LIKE LOWER(:city)', { city: `%${city}%` });
    }

    if (min_price != null) {
      qb.andWhere('room.price_per_night >= :min_price', { min_price });
    }

    if (max_price != null) {
      qb.andWhere('room.price_per_night <= :max_price', { max_price });
    }

    if (blockedIds.length > 0) {
      qb.andWhere('room.id NOT IN (:...blockedIds)', { blockedIds });
    }

    return qb.getMany();
  }

  async createHoldAtomic(roomId: string, dto: CreateHoldDto): Promise<Hold> {
    return this.dataSource.transaction(async (manager) => {
      const room = await manager
        .createQueryBuilder(Room, 'room')
        .setLock('pessimistic_write')
        .where('room.id = :id', { id: roomId })
        .getOne();

      if (!room) {
        throw new NotFoundException(`Habitación con id ${roomId} no encontrada`);
      }

      const conflictingHold = await manager
        .createQueryBuilder(Hold, 'hold')
        .where('hold.room_id = :roomId', { roomId })
        .andWhere('hold.status = :status', { status: HoldStatus.PENDING })
        .andWhere('hold.expires_at > NOW()')
        .andWhere('hold.checkin < :checkout', { checkout: dto.checkout })
        .andWhere('hold.checkout > :checkin', { checkin: dto.checkin })
        .getOne();

      if (conflictingHold) {
        throw new ConflictException(
          'Habitación no disponible (otro usuario la acaba de bloquear)',
        );
      }

      const conflictingReservation = await manager
        .createQueryBuilder(Reservation, 'res')
        .where('res.room_id = :roomId', { roomId })
        .andWhere('res.status = :status', { status: ReservationStatus.CONFIRMED })
        .andWhere('res.checkin < :checkout', { checkout: dto.checkout })
        .andWhere('res.checkout > :checkin', { checkin: dto.checkin })
        .getOne();

      if (conflictingReservation) {
        throw new ConflictException(
          'Habitación no disponible para las fechas seleccionadas',
        );
      }

      const holdDurationMinutes = parseInt(
        process.env.HOLD_DURATION_MINUTES ?? '10',
        10,
      );
      const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

      const hold = manager.create(Hold, {
        room_id: roomId,
        checkin: new Date(dto.checkin),
        checkout: new Date(dto.checkout),
        status: HoldStatus.PENDING,
        expires_at: expiresAt,
      });

      return manager.save(Hold, hold);
    });
  }
}
