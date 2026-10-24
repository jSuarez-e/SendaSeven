/**
 * @sdd
 * [Objetivo]: Modulo NestJS para la gestion y consulta publica del catalogo de rutas turisticas.
 * [I/O]: Registra entidades TouristRouteEntity y VoteEntity; provee RoutesService y RoutesController.
 * [Edge Cases]: Exporta RoutesService para reutilizacion si es requerido por otros modulos.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TouristRouteEntity } from '../../entities/tourist-route.entity.js';
import { VoteEntity } from '../../entities/vote.entity.js';
import { RoutesService } from './routes.service.js';
import { RoutesController } from './routes.controller.js';

/**
 * Modulo de rutas turisticas.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TouristRouteEntity, VoteEntity])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
