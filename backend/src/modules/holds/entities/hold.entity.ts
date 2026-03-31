import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';

export enum HoldStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

@Entity('holds')
export class Hold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'room_id' })
  room_id: string;

  @Column({ type: 'date' })
  checkin: Date;

  @Column({ type: 'date' })
  checkout: Date;

  @Column({ type: 'enum', enum: HoldStatus, default: HoldStatus.PENDING })
  status: HoldStatus;

  @Index()
  @Column({ type: 'timestamptz', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'uuid', name: 'payment_id', nullable: true })
  payment_id: string | null;

  @Column({ type: 'uuid', name: 'reservation_id', nullable: true })
  reservation_id: string | null;

  @ManyToOne(() => Room, (room) => room.holds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
