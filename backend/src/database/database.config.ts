/**
 * @sdd
 * [Objetivo]: Proveedor de configuracion de TypeORM para conexion a PostgreSQL compatible con variables de entorno y Docker.
 * [I/O]: Expone getDatabaseConfig() retornando TypeOrmModuleOptions.
 * [Edge Cases]: Soporta connection string DATABASE_URL o parametros individuales (DB_HOST, DB_USER, etc.).
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity.js';
import { TouristRouteEntity } from '../entities/tourist-route.entity.js';
import { VoteEntity } from '../entities/vote.entity.js';
import { VotingQueueEntity } from '../entities/voting-queue.entity.js';

/**
 * Genera las opciones de configuracion de conexion para TypeORM PostgreSQL.
 * @returns TypeOrmModuleOptions configuradas.
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  const databaseUrl = process.env.DATABASE_URL;

  const shouldSynchronize =
    process.env.DB_SYNCHRONIZE === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [UserEntity, TouristRouteEntity, VoteEntity, VotingQueueEntity],
      synchronize: shouldSynchronize,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'votacion_user',
    password: process.env.DB_PASSWORD ?? 'votacion_secret',
    database: process.env.DB_NAME ?? 'rutas_turisticas_db',
    entities: [UserEntity, TouristRouteEntity, VoteEntity, VotingQueueEntity],
    synchronize: shouldSynchronize,
    logging: false,
  };
}
