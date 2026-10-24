/**
 * @sdd
 * [Objetivo]: Dataset oficial de pruebas QA para pruebas de concurrencia e integracion (Segmento #3).
 * [I/O]: Expone 12 rutas oficiales (capacidad 7) y 25 usuarios de prueba (DOC-001 a DOC-025) sin votos iniciales.
 * [Edge Cases]: Inmutabilidad de los datos base; funciones de clonado profundo para aislamiento entre tests.
 */
import {
  INITIAL_ROUTES_CATALOG,
  MAX_ROUTE_CAPACITY,
} from '../../../shared/constants/routes.constants.js';

/**
 * Representacion de usuario de prueba en memoria para QA.
 */
/**
 * Representacion de voto para datos de prueba QA.
 */
export interface IQATestVote {
  /** Identificador UUID del voto. */
  id: string;
  /** Identificador UUID del usuario votante. */
  userId: string;
  /** Identificador numerico de la ruta votada. */
  routeId: number;
}

/**
 * Representacion de usuario de prueba en memoria para QA.
 */
export interface IQATestUser {
  /** Identificador UUID. */
  id: string;
  /** Documento unico de identidad. */
  documentId: string;
  /** Nombre completo descriptivo. */
  fullName: string;
  /** Coleccion de votos iniciales. */
  votes: IQATestVote[];
}

/**
 * Representacion de ruta de prueba en memoria para QA.
 */
export interface IQATestRoute {
  /** Identificador numerico oficial. */
  id: number;
  /** Slug representativo. */
  slug: string;
  /** Nombre de la ruta. */
  name: string;
  /** Dia del itinerario. */
  dayNumber: number;
  /** Capacidad maxima estricta. */
  maxCapacity: number;
  /** Grupo de exclusividad si aplica. */
  exclusivityGroup: string | null;
}

/**
 * Genera el listado de las 12 rutas oficiales para el entorno de test.
 * @returns Arreglo de 12 rutas con maxCapacity = 7.
 */
export function getQATestRoutes(): IQATestRoute[] {
  return INITIAL_ROUTES_CATALOG.map((definition, index) => ({
    id: index + 1,
    slug: definition.slug,
    name: definition.name,
    dayNumber: definition.dayNumber,
    maxCapacity: MAX_ROUTE_CAPACITY,
    exclusivityGroup: definition.exclusivityGroup,
  }));
}

/**
 * Genera el listado de los 25 usuarios de prueba (DOC-001 a DOC-025) sin votos previos.
 * @returns Arreglo de 25 usuarios pre-cargados.
 */
export function getQATestUsers(): IQATestUser[] {
  const users: IQATestUser[] = [];
  for (let index = 1; index <= 25; index += 1) {
    const paddedIndex = String(index).padStart(3, '0');
    users.push({
      id: `usr-test-uuid-${paddedIndex}`,
      documentId: `DOC-${paddedIndex}`,
      fullName: `Usuario de Prueba ${paddedIndex}`,
      votes: [],
    });
  }
  return users;
}
