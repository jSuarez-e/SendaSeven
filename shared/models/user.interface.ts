/**
 * @sdd
 * [Objetivo]: Contratos de interfaz de usuario e informacion de sesion/autenticacion compartida entre frontend y backend.
 * [I/O]: Define IUser e IAuthUserResponse.
 * [Edge Cases]: Tipado estricto sin campos opcionales ambiguos.
 */

/**
 * Entidad de usuario registrada en el sistema.
 */
export interface IUser {
  /** Identificador unico UUID. */
  id: string;
  /** Documento de identidad unico. */
  documentId: string;
  /** Nombre completo del usuario. */
  fullName: string;
  /** Fecha de creacion del registro. */
  createdAt: Date;
}

/**
 * Respuesta de autenticacion y estado de votacion del usuario.
 */
export interface IAuthUserResponse {
  /** Identificador unico del usuario. */
  id: string;
  /** Documento de identidad del usuario. */
  documentId: string;
  /** Nombre completo del usuario. */
  fullName: string;
  /** Indica si el usuario ya confirmo sus votos. */
  hasVoted: boolean;
  /** Arreglo con los IDs de las rutas votadas si aplica. */
  votedRouteIds: number[];
}
