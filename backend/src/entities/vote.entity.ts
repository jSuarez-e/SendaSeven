/**
 * @sdd
 * [Objetivo]: Entidad relacional TypeORM de voto (tabla 'votes') con restriccion de unicidad user-route (RN-04).
 * [I/O]: Mapea id (UUID), userId, routeId, createdAt y relaciones ManyToOne con User y TouristRoute.
 * [Edge Cases]: Restriccion @Unique(['userId', 'routeId']) previene a nivel de motor duplicar ruta por usuario.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  type Relation,
} from 'typeorm';
import { UserEntity } from './user.entity.js';
import { TouristRouteEntity } from './tourist-route.entity.js';

/**
 * Entidad de persistencia para votos individuales emitidos.
 */
@Entity('votes')
@Unique('uq_user_route', ['userId', 'routeId'])
@Index(['routeId'])
export class VoteEntity {
  /** Identificador primario UUID del voto. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Identificador foraneo del usuario votante. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Identificador foraneo de la ruta turistica seleccionada. */
  @Column({ name: 'route_id', type: 'int' })
  routeId: number;

  /** Marca de tiempo de creacion del voto. */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** Referencia relacional al usuario votante. */
  @ManyToOne(() => UserEntity, (user) => user.votes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  /** Referencia relacional a la ruta votada. */
  @ManyToOne(() => TouristRouteEntity, (route) => route.votes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'route_id' })
  route: Relation<TouristRouteEntity>;
}
