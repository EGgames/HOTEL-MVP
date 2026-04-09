import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Room } from '../rooms/entities/room.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async getReservationById(reservationId: string): Promise<object> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva con id ${reservationId} no encontrada`);
    }

    return this.buildReservationResponse(reservation);
  }

  async getReservationByCode(code: string): Promise<object> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservation_code: code },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva con código ${code} no encontrada`);
    }

    return this.buildReservationResponse(reservation);
  }

  private async buildReservationResponse(reservation: Reservation): Promise<object> {
    const room = await this.roomRepository.findOne({
      where: { id: reservation.room_id },
    });

    const checkin = new Date(reservation.checkin);
    const checkout = new Date(reservation.checkout);
    const nights = Math.round(
      (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: reservation.id,
      reservation_code: reservation.reservation_code,
      room_id: reservation.room_id,
      room_number: room?.room_number ?? null,
      hotel_id: room?.hotel_id ?? null,
      checkin: reservation.checkin,
      checkout: reservation.checkout,
      status: reservation.status,
      price_per_night: room ? parseFloat(room.price_per_night as unknown as string) : null,
      nights,
      total_amount: room
        ? parseFloat(room.price_per_night as unknown as string) * nights
        : null,
      created_at: reservation.created_at,
    };
  }
}
