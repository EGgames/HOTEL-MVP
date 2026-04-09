import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

@Injectable()
export class AdminRoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async list(): Promise<object[]> {
    const rooms = await this.roomRepository.find({ order: { room_number: 'ASC' } });

    const hotels = await this.hotelRepository.find();
    const hotelMap = new Map(hotels.map((h) => [h.id, h]));

    return rooms.map((room) => {
      const hotel = hotelMap.get(room.hotel_id);
      return {
        id: room.id,
        room_number: room.room_number,
        hotel_id: room.hotel_id,
        hotel_name: hotel?.name ?? null,
        type: room.type,
        price_per_night: parseFloat(room.price_per_night as unknown as string),
        capacity: room.capacity,
        amenities: room.amenities,
        floor: room.floor,
        wing: room.wing,
        image_url: room.image_url,
        created_at: room.created_at,
      };
    });
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    const hotel = await this.hotelRepository.findOne({ where: { id: dto.hotel_id } });
    if (!hotel) {
      throw new NotFoundException(`Hotel con id ${dto.hotel_id} no encontrado`);
    }

    const existing = await this.roomRepository.findOne({
      where: { room_number: dto.room_number, hotel_id: dto.hotel_id },
    });
    if (existing) {
      throw new ConflictException('Ya existe una habitación con ese número en este hotel');
    }

    const room = this.roomRepository.create(dto);
    return this.roomRepository.save(room);
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    const now = new Date();
    const activeReservations = await this.reservationRepository
      .createQueryBuilder('res')
      .where('res.room_id = :roomId', { roomId: id })
      .andWhere('res.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere('res.checkout > :now', { now })
      .getCount();

    if (activeReservations > 0) {
      throw new ConflictException('No se puede eliminar una habitación con reservas activas');
    }

    await this.roomRepository.remove(room);
  }
}
