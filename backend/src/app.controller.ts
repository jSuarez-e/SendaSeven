/**
 * @sdd
 * [Objetivo]: Controlador raiz de NestJS para comprobacion de salud y endpoint base.
 * [I/O]: GET / retorna string de bienvenida provisto por AppService.
 * [Edge Cases]: Ninguno. Delegacion directa a la capa de servicio.
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

/**
 * Controlador principal de la aplicacion backend.
 */
@Controller()
export class AppController {
  /**
   * Constructor con inyeccion de dependencias.
   * @param appService Servicio de logica de aplicacion inyectado.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de bienvenida base.
   * @returns Saludo en texto plano.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
