/**
 * @sdd
 * [Objetivo]: Entidad relacional TypeORM para el orden de votacion sorteado (tabla 'voting_queue').
 * [I/O]: Mapea campos id (UUID), turnNumber, userId (relacion con UserEntity), status (PENDING/VOTED), votedAt y createdAt.
 * [Edge Cases]: turnNumber indexado para ordenamiento rapido; eliminacion en cascada si se elimina el usuario; fecha de votacion nula para pendientes.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity.js';
import type { VotingQueueStatus } from '../../../shared/models/voting-queue.interface.js';

/**
 * Entidad de persistencia para el orden y turno de votacion asignado.
 */
@Entity('voting_queue')
export class VotingQueueEntity {
  /** Identificador primario UUID del turno. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numero de turno sorteado (1..N). */
  @Index('idx_voting_queue_turn_number')
  @Column({ name: 'turn_number', type: 'int' })
  turnNumber: number;

  /** Identificador UUID del usuario asignado. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Relacion ManyToOne con la entidad de usuario registrado. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  /** Estado del turno: PENDING o VOTED. */
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status: VotingQueueStatus;

  /** Fecha y hora en que se confirmo el voto, o null si permanece pendiente. */
  @Column({ name: 'voted_at', type: 'timestamp', nullable: true })
  votedAt: Date | null;

  /** Marca de tiempo de creacion del registro de turno. */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
