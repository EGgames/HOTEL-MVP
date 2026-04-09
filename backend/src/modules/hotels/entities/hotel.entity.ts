import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  country: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  @OneToMany(() => Room, (room) => room.hotel)
  rooms: Room[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
