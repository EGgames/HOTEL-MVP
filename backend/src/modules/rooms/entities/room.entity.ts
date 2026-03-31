import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Hold } from '../../holds/entities/hold.entity';

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  SUITE = 'SUITE',
}

@Entity('rooms')
@Unique(['room_number', 'hotel_id'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, name: 'room_number' })
  room_number: string;

  @Column({ type: 'uuid', name: 'hotel_id' })
  hotel_id: string;

  @Column({ type: 'enum', enum: RoomType })
  type: RoomType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_night' })
  price_per_night: number;

  @Column({ type: 'smallint' })
  capacity: number;

  @Column({ type: 'text', array: true, default: [] })
  amenities: string[];

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => Hold, (hold) => hold.room)
  holds: Hold[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
