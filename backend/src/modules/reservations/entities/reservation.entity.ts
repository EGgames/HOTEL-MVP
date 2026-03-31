import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 8, name: 'reservation_code' })
  reservation_code: string;

  @Index()
  @Column({ type: 'uuid', name: 'room_id' })
  room_id: string;

  @Column({ type: 'uuid', name: 'hold_id' })
  hold_id: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  payment_id: string;

  @Column({ type: 'date' })
  checkin: Date;

  @Column({ type: 'date' })
  checkout: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
  status: ReservationStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
