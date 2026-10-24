/**
 * @sdd
 * [Objetivo]: Modulo NestJS para el motor transaccional de confirmacion de votaciones.
 * [I/O]: Registra entidades UserEntity, TouristRouteEntity y VoteEntity; expone VotesService y VotesController.
 * [Edge Cases]: Requiere acceso al DataSource para gestion de transacciones interactiva.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entities/user.entity.js';
import { TouristRouteEntity } from '../../entities/tourist-route.entity.js';
import { VoteEntity } from '../../entities/vote.entity.js';
import { VotesService } from './votes.service.js';
import { VotesController } from './votes.controller.js';

/**
 * Modulo del motor de votacion.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TouristRouteEntity, VoteEntity]),
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
