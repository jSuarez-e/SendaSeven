/**
 * @sdd
 * [Objetivo]: Entidad relacional TypeORM de ruta turistica (tabla 'tourist_routes') con capacidad estricta (RN-02, RN-03).
 * [I/O]: Mapea id, slug (unico), name, dayNumber, maxCapacity (7) y exclusivityGroup.
 * [Edge Cases]: maxCapacity por defecto 7; slug indexado y unico.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  type Relation,
} from 'typeorm';
import { VoteEntity } from './vote.entity.js';

/**
 * Entidad de persistencia para el catalogo de rutas turisticas.
 */
@Entity('tourist_routes')
export class TouristRouteEntity {
  /** Identificador numerico autoincremental de la ruta. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Slug representativo unico de la ruta. */
  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  /** Nombre oficial de la ruta. */
  @Column({ type: 'varchar', length: 80 })
  name: string;

  /** Numero de dia asignado en el itinerario. */
  @Column({ name: 'day_number', type: 'int' })
  dayNumber: number;

  /** Capacidad maxima estricta de cupos asignables (predeterminado 7). */
  @Column({ name: 'max_capacity', type: 'int', default: 7 })
  maxCapacity: number;

  /** Grupo de exclusividad mutua si aplica (e.g. VILLANUEVA_BARICHARA). */
  @Column({ name: 'exclusivity_group', type: 'varchar', length: 40, nullable: true })
  exclusivityGroup: string | null;

  /** Votos registrados asociados a la ruta. */
  @OneToMany(() => VoteEntity, (vote) => vote.route)
  votes: Relation<VoteEntity[]>;
}
