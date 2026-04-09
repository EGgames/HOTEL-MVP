import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Hotel } from '../modules/hotels/entities/hotel.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Hold } from '../modules/holds/entities/hold.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'hotel_user',
    password: process.env.DB_PASSWORD ?? 'hotel_pass',
    database: process.env.DB_NAME ?? 'hotel_booking',
    entities: [Hotel, Room, Hold, Payment, Reservation],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  }),
);
