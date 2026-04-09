import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Hotel } from '../../modules/hotels/entities/hotel.entity';
import { Room, RoomType } from '../../modules/rooms/entities/room.entity';
import { Hold } from '../../modules/holds/entities/hold.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';
import { Reservation } from '../../modules/reservations/entities/reservation.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'hotel_user',
  password: process.env.DB_PASSWORD ?? 'hotel_pass',
  database: process.env.DB_NAME ?? 'hotel_booking',
  entities: [Hotel, Room, Hold, Payment, Reservation],
  synchronize: true,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Conexión a base de datos establecida');

  const hotelRepo = AppDataSource.getRepository(Hotel);
  const roomRepo = AppDataSource.getRepository(Room);

  const existingHotels = await hotelRepo.count();
  if (existingHotels > 0) {
    console.log('Seeder: datos ya existentes, omitiendo inserción duplicada');
    await AppDataSource.destroy();
    return;
  }

  const hotelsData = [
    {
      name: 'Hotel Grand Buenos Aires',
      city: 'Buenos Aires',
      country: 'Argentina',
      address: 'Av. Corrientes 1234, CABA',
      latitude: -34.6037,
      longitude: -58.3816,
    },
    {
      name: 'Hotel Mar del Plata Palace',
      city: 'Mar del Plata',
      country: 'Argentina',
      address: 'Blvd. Marítimo 5678',
      latitude: -38.0055,
      longitude: -57.5426,
    },
  ];

  const hotels = await hotelRepo.save(hotelsData);
  console.log(`Seeder: ${hotels.length} hoteles insertados`);

  const roomsData: Partial<Room>[] = [];

  const hotel1 = hotels[0];
  const hotel2 = hotels[1];

  const hotel1Rooms = [
    { room_number: '101', type: RoomType.SINGLE, price_per_night: 80, capacity: 1, amenities: ['wifi', 'ac', 'tv'] },
    { room_number: '102', type: RoomType.SINGLE, price_per_night: 85, capacity: 1, amenities: ['wifi', 'ac'] },
    { room_number: '201', type: RoomType.DOUBLE, price_per_night: 150, capacity: 2, amenities: ['wifi', 'ac', 'tv', 'minibar'] },
    { room_number: '202', type: RoomType.DOUBLE, price_per_night: 155, capacity: 2, amenities: ['wifi', 'ac', 'tv', 'minibar', 'balcony'] },
    { room_number: '203', type: RoomType.DOUBLE, price_per_night: 160, capacity: 3, amenities: ['wifi', 'ac', 'tv', 'jacuzzi'] },
    { room_number: '301', type: RoomType.SUITE, price_per_night: 350, capacity: 4, amenities: ['wifi', 'ac', 'tv', 'minibar', 'jacuzzi', 'ocean_view'] },
    { room_number: '302', type: RoomType.SUITE, price_per_night: 400, capacity: 4, amenities: ['wifi', 'ac', 'tv', 'minibar', 'jacuzzi', 'ocean_view', 'living_room'] },
  ];

  const hotel2Rooms = [
    { room_number: '101', type: RoomType.SINGLE, price_per_night: 90, capacity: 1, amenities: ['wifi', 'ac', 'sea_view'] },
    { room_number: '201', type: RoomType.DOUBLE, price_per_night: 180, capacity: 2, amenities: ['wifi', 'ac', 'tv', 'sea_view'] },
    { room_number: '202', type: RoomType.DOUBLE, price_per_night: 200, capacity: 2, amenities: ['wifi', 'ac', 'tv', 'sea_view', 'balcony'] },
    { room_number: '301', type: RoomType.SUITE, price_per_night: 450, capacity: 4, amenities: ['wifi', 'ac', 'tv', 'minibar', 'jacuzzi', 'panoramic_view'] },
    { room_number: '305', type: RoomType.SUITE, price_per_night: 500, capacity: 5, amenities: ['wifi', 'ac', 'tv', 'minibar', 'jacuzzi', 'pool_access', 'butler'] },
  ];

  for (const r of hotel1Rooms) {
    roomsData.push({ ...r, hotel_id: hotel1.id });
  }

  for (const r of hotel2Rooms) {
    roomsData.push({ ...r, hotel_id: hotel2.id });
  }

  const rooms = await roomRepo.save(roomsData);
  console.log(`Seeder: ${rooms.length} habitaciones insertadas`);

  await AppDataSource.destroy();
  console.log('Seeder completado exitosamente');
}

seed().catch((err) => {
  console.error('Error en seeder:', err);
  process.exit(1);
});
