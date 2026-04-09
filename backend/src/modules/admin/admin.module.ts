import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';

import { Admin } from './entities/admin.entity';
import { Customer } from './entities/customer.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Room } from '../rooms/entities/room.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Payment } from '../payments/entities/payment.entity';

import { AdminAuthService } from './auth/admin-auth.service';
import { JwtStrategy } from './auth/jwt.strategy';

import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminReservationsService } from './services/admin-reservations.service';
import { AdminCustomersService } from './services/admin-customers.service';
import { AdminRoomsService } from './services/admin-rooms.service';
import { AdminHotelsService } from './services/admin-hotels.service';
import { MailService } from './services/mail.service';

import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminReservationsController } from './controllers/admin-reservations.controller';
import { AdminCustomersController } from './controllers/admin-customers.controller';
import { AdminRoomsController } from './controllers/admin-rooms.controller';
import { AdminHotelsController } from './controllers/admin-hotels.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Customer, Reservation, Room, Hotel, Payment]),
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'hotel-admin-secret-dev',
      signOptions: { expiresIn: '8h' },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST ?? 'localhost',
        port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
        ignoreTLS: true,
        auth:
          process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      },
      defaults: {
        from: process.env.SMTP_FROM ?? '"Hotel Booking" <noreply@hotel.com>',
      },
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminReservationsController,
    AdminCustomersController,
    AdminRoomsController,
    AdminHotelsController,
  ],
  providers: [
    AdminAuthService,
    JwtStrategy,
    AdminDashboardService,
    AdminReservationsService,
    AdminCustomersService,
    AdminRoomsService,
    AdminHotelsService,
    MailService,
  ],
})
export class AdminModule {}
