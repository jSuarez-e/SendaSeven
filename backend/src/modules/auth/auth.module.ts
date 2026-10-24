/**
 * @sdd
 * [Objetivo]: Modulo NestJS para la validacion y autenticacion de usuarios pre-cargados (RN-01).
 * [I/O]: Registra UserEntity y expone AuthService y AuthController.
 * [Edge Cases]: Exporta AuthService para uso en validaciones transversales de votos.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entities/user.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

/**
 * Modulo de autenticacion de usuarios.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
