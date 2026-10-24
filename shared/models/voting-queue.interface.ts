/**
 * @sdd
 * [Objetivo]: Contratos e interfaces compartidas para el sorteo y orden de votacion aleatorio controlado.
 * [I/O]: Define estados de turno VotingQueueStatus, item de cola IVotingQueueItem y resumen general IVotingQueueSummary.
 * [Edge Cases]: Exclusion de usuarios con votos registrados, persistencia del orden generado, soporte de filtro por documento/nombre.
 */

/**
 * Estados posibles de un participante en la cola de votacion.
 */
export type VotingQueueStatus = 'PENDING' | 'VOTED';

/**
 * Representacion de un participante dentro del orden sorteado.
 */
export interface IVotingQueueItem {
  /** Identificador unico del registro de cola (UUID). */
  id: string;
  /** Numero de turno asignado de forma aleatoria (1..N). */
  turnNumber: number;
  /** Identificador UUID del usuario registrado. */
  userId: string;
  /** Documento de identidad del participante. */
  documentId: string;
  /** Nombre completo del participante. */
  fullName: string;
  /** Estado actual del turno: PENDING o VOTED. */
  status: VotingQueueStatus;
  /** Fecha y hora en que se genero o asigno el turno. */
  createdAt: string;
  /** Fecha y hora en que se registro el voto, o null si esta pendiente. */
  votedAt: string | null;
}

/**
 * Resumen consolidado del estado de la cola y sorteo de votacion.
 */
export interface IVotingQueueSummary {
  /** Cantidad total de participantes en el sorteo activo. */
  totalInQueue: number;
  /** Cantidad de participantes pendientes por votar. */
  pendingCount: number;
  /** Cantidad de participantes que ya completaron su votacion. */
  votedCount: number;
  /** Numero del turno que corresponde votar actualmente, o null si no hay pendientes. */
  currentTurnNumber: number | null;
  /** Datos del votante en turno actual, o null si todos ya votaron. */
  currentVoter: IVotingQueueItem | null;
  /** Lista ordenada de forma ascendente por turnNumber con todos los turnos. */
  items: IVotingQueueItem[];
}
