import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Hold } from '../holds/entities/hold.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Hold, Reservation])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [TypeOrmModule],
})
export class RoomsModule {}
