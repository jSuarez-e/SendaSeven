/**
 * @sdd
 * [Objetivo]: Contratos de envio y confirmacion transaccional del lote de 2 votos por usuario (RN-04).
 * [I/O]: Define IVoteSubmissionPayload e IVoteConfirmationResponse.
 * [Edge Cases]: Envio exactamente de 2 rutas distintas sin repeticion.
 */

/**
 * Payload de confirmacion de votos emitido por el cliente.
 */
export interface IVoteSubmissionPayload {
  /** Documento de identificacion del votante. */
  documentId: string;
  /** Tupla obligatoria con los 2 IDs de rutas seleccionadas. */
  routeIds: [number, number];
}

/**
 * Respuesta de confirmacion transaccional exitosa.
 */
export interface IVoteConfirmationResponse {
  /** Indica si la transaccion fue completada. */
  success: boolean;
  /** Mensaje informativo de la operacion. */
  message: string;
  /** Arreglo con los IDs de las rutas votadas. */
  votedRouteIds: number[];
  /** Marca de tiempo ISO de la confirmacion. */
  confirmedAt: string;
}
