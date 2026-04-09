import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { Room } from '../rooms/entities/room.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Room])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [TypeOrmModule],
})
export class ReservationsModule {}
