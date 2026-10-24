/**
 * @sdd
 * [Objetivo]: Logger centralizado para el frontend que encapsula la emision de logs y previene el uso de raw consoles segun la gobernanza.
 * [I/O]: Expone metodos de logging estructurado (error, warn, info) aceptando mensajes y parametros de tipo unknown.
 * [Edge Cases]: Entornos sin consola disponible o valores nulos/indefinidos.
 */

export const Logger = {
  /**
   * Emite un mensaje de error en la consola del navegador.
   * @param error Objeto o mensaje de error capturado.
   * @returns void.
   */
  error(error: unknown): void {
    if (typeof console !== 'undefined' && console.error) {
      console.error(error);
    }
  },

  /**
   * Emite una advertencia estructurada en la consola del navegador.
   * @param message Mensaje descriptivo de la advertencia.
   * @param optionalParams Parametros adicionales de depuracion.
   * @returns void.
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(message, ...optionalParams);
    }
  },

  /**
   * Emite un mensaje informativo en la consola del navegador.
   * @param message Mensaje informativo.
   * @param optionalParams Parametros adicionales de contexto.
   * @returns void.
   */
  info(message: string, ...optionalParams: unknown[]): void {
    if (typeof console !== 'undefined' && console.info) {
      console.info(message, ...optionalParams);
    }
  }
};
