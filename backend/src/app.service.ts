/**
 * @sdd
 * [Objetivo]: Servicio de logica de negocio para el endpoint base del backend.
 * [I/O]: getHello() retorna string 'Hello World!'.
 * [Edge Cases]: Ninguno. Operacion puramente sincrona e inmutable.
 */
import { Injectable } from '@nestjs/common';

/**
 * Servicio central para operaciones base del backend.
 */
@Injectable()
export class AppService {
  /**
   * Retorna el mensaje de saludo general.
   * @returns Cadena con saludo 'Hello World!'.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
