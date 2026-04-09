import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import databaseConfig from './config/database.config';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { HoldsModule } from './modules/holds/holds.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { WorkersModule } from './modules/workers/workers.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    HotelsModule,
    RoomsModule,
    HoldsModule,
    PaymentsModule,
    ReservationsModule,
    WorkersModule,
    AdminModule,
  ],
})
export class AppModule {}
