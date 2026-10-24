/**
 * @sdd
 * [Objetivo]: Modulo NestJS para la gestion de la cola y sorteo aleatorio controlado de votacion.
 * [I/O]: Registra VotingQueueEntity y UserEntity en TypeOrmModule; expone QueueController y exporta QueueService.
 * [Edge Cases]: Prevencion de dependencias circulares; aislamiento modular.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingQueueEntity } from '../../entities/voting-queue.entity.js';
import { UserEntity } from '../../entities/user.entity.js';
import { QueueController } from './queue.controller.js';
import { QueueService } from './queue.service.js';

/**
 * Modulo de sorteo y orden de cola de votacion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VotingQueueEntity, UserEntity])],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
