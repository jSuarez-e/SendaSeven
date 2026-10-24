/**
 * @sdd
 * [Objetivo]: Entidad relacional TypeORM de usuario (tabla 'users') precargado en el sistema (RN-01).
 * [I/O]: Mapea campos id (UUID), documentId (unico), fullName, createdAt y relacion 1:N con votes.
 * [Edge Cases]: documentId indexado y unico. Eliminacion restringida si existen votos asociados.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { VoteEntity } from './vote.entity.js';

/**
 * Entidad de persistencia para usuarios registrados.
 */
@Entity('users')
export class UserEntity {
  /** Identificador primario UUID. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Documento de identidad unico para autenticacion. */
  @Column({ name: 'document_id', type: 'varchar', length: 30, unique: true })
  documentId: string;

  /** Nombre completo del usuario registrado. */
  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  /** Marca de tiempo de creacion del usuario. */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** Votos registrados por el usuario. */
  @OneToMany(() => VoteEntity, (vote) => vote.user)
  votes: Relation<VoteEntity[]>;
}
