/**
 * @sdd
 * [Objetivo]: Contratos de rutas turisticas, resumenes publicos anonimos (RN-06) y modelos de vista para la maquina de estados de votacion en UI.
 * [I/O]: Define ITouristRoute, IRoutePublicSummary, RouteVisualStatus e IRouteCardViewModel.
 * [Edge Cases]: Cero exposicion de datos de votantes; estados visuales exhaustivos para UI reactiva.
 */

/**
 * Entidad de ruta turistica del catalogo oficial.
 */
export interface ITouristRoute {
  /** Identificador numerico de la ruta. */
  id: number;
  /** Slug unico identificador. */
  slug: string;
  /** Nombre representativo de la ruta. */
  name: string;
  /** Dia asignado para la salida de la ruta. */
  dayNumber: number;
  /** Capacidad maxima de cupos permitidos. */
  maxCapacity: number;
  /** Grupo de exclusividad mutua si aplica. */
  exclusivityGroup: string | null;
}

/**
 * Resumen publico y anonimo del estado de una ruta turistica.
 */
export interface IRoutePublicSummary {
  /** Identificador numerico de la ruta. */
  id: number;
  /** Slug unico identificador. */
  slug: string;
  /** Nombre representativo de la ruta. */
  name: string;
  /** Dia asignado para la salida de la ruta. */
  dayNumber: number;
  /** Capacidad maxima total de cupos. */
  maxCapacity: number;
  /** Numero total de cupos ocupados (0 a 7). */
  occupiedSeats: number;
  /** Numero de cupos aun disponibles. */
  availableSeats: number;
  /** Indica si la ruta aun admite votaciones. */
  isAvailable: boolean;
  /** Grupo de exclusividad mutua si aplica. */
  exclusivityGroup: string | null;
}

/**
 * Estados visuales reactivos para las tarjetas de rutas en el tablero de votacion.
 */
export type RouteVisualStatus =
  | 'AVAILABLE'
  | 'SELECTED'
  | 'VOTED_BY_ME'
  | 'LOCKED_EXCLUSION'
  | 'LOCKED_FULL'
  | 'LOCKED_MAX_SELECTED';

/**
 * Modelo de vista reactivo para la presentacion de tarjetas de ruta en la UI.
 */
export interface IRouteCardViewModel {
  /** Identificador de la ruta. */
  id: number;
  /** Slug unico. */
  slug: string;
  /** Nombre oficial de la ruta. */
  name: string;
  /** Numero del dia asignado. */
  dayNumber: number;
  /** Capacidad maxima total. */
  maxCapacity: number;
  /** Cupos ocupados actualmente. */
  occupiedSeats: number;
  /** Cupos disponibles. */
  availableSeats: number;
  /** Disponibilidad base de la ruta. */
  isAvailable: boolean;
  /** Grupo de exclusividad mutua si aplica. */
  exclusivityGroup: string | null;
  /** Estado visual calculado por la maquina de estados. */
  visualStatus: RouteVisualStatus;
  /** Orden de seleccion del usuario (1 o 2) o null. */
  selectionOrder: 1 | 2 | null;
  /** Mensaje explicativo cuando la tarjeta esta bloqueada. */
  exclusionMessage: string | null;
}

/**
 * Elemento de asistente registrado en una ruta turistica.
 */
export interface IRouteAttendeeItem {
  /** Documento de identidad del asistente. */
  documentId: string;
  /** Nombre completo del asistente registrado. */
  fullName: string;
  /** Fecha y hora ISO de la confirmacion del voto. */
  confirmedAt: string;
}

/**
 * Reporte detallado de asistentes por ruta para administracion y auditoria.
 */
export interface IRouteDetailReport {
  /** Identificador de la ruta. */
  routeId: number;
  /** Slug unico identificador. */
  slug: string;
  /** Nombre oficial de la ruta. */
  name: string;
  /** Dia del itinerario. */
  dayNumber: number;
  /** Capacidad maxima total. */
  maxCapacity: number;
  /** Total de cupos ocupados. */
  occupiedSeats: number;
  /** Listado de asistentes confirmados. */
  attendees: IRouteAttendeeItem[];
}
