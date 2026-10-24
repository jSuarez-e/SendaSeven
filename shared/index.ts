/**
 * @sdd
 * [Objetivo]: Punto de exportacion central de contratos, DTOs e interfaces compartidas entre frontend y backend.
 * [I/O]: Re-exporta modelos de usuario, rutas, votos y constantes de dominio.
 * [Edge Cases]: Ninguno. Modulo de definicion de contratos de dominio compartido.
 */

export const SHARED_DOMAIN_VERSION = '1.0.0';

export * from './models/user.interface.js';
export * from './models/route.interface.js';
export * from './models/vote.interface.js';
export * from './models/voting-queue.interface.js';
export * from './constants/routes.constants.js';
