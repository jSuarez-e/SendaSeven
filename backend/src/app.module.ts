/**
 * @sdd
 * [Objetivo]: Modulo raiz del backend NestJS que agrupa la configuracion de TypeORM y los modulos de negocio.
 * [I/O]: Registra ConfigModule, TypeOrmModule, AuthModule, RoutesModule y VotesModule.
 * [Edge Cases]: Carga parametrizada de la configuracion de la base de datos y endpoint raiz de salud.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database/database.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RoutesModule } from './modules/routes/routes.module.js';
import { VotesModule } from './modules/votes/votes.module.js';
import { QueueModule } from './modules/queue/queue.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

/**
 * Modulo raiz de la aplicacion backend NestJS.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    RoutesModule,
    VotesModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
