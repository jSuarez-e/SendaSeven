/**
 * @sdd
 * [Objetivo]: Constantes de negocio y catalogo cerrado de las 12 rutas turisticas oficiales (RN-02, RN-03, RN-04, RN-05).
 * [I/O]: Constantes de capacidad maxima (7), votos requeridos (2), grupo de exclusividad e INITIAL_ROUTES.
 * [Edge Cases]: Inmutabilidad de los slugs y fechas asignadas.
 */

/** Capacidad maxima estricta permitida por ruta. */
export const MAX_ROUTE_CAPACITY = 7;

/** Numero obligatorio de rutas que cada usuario debe votar. */
export const REQUIRED_VOTES_COUNT = 2;

/** Grupo de exclusividad mutua entre Villanueva y Barichara. */
export const EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA = 'VILLANUEVA_BARICHARA';

/**
 * Definicion estructural de una ruta para inicializacion y catalogo.
 */
export interface IInitialRouteDefinition {
  /** Slug identificador. */
  slug: string;
  /** Nombre representativo. */
  name: string;
  /** Numero del dia asignado. */
  dayNumber: number;
  /** Grupo de exclusividad o null. */
  exclusivityGroup: string | null;
}

/** Catalogo cerrado oficial de las 12 rutas turisticas. */
export const INITIAL_ROUTES_CATALOG: readonly IInitialRouteDefinition[] = [
  { slug: 'giron', name: 'Girón', dayNumber: 4, exclusivityGroup: null },
  { slug: 'piedecuesta', name: 'Piedecuesta', dayNumber: 5, exclusivityGroup: null },
  { slug: 'aratoca', name: 'Aratoca', dayNumber: 6, exclusivityGroup: null },
  { slug: 'villanueva', name: 'Villanueva', dayNumber: 7, exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA },
  { slug: 'barichara', name: 'Barichara', dayNumber: 8, exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA },
  { slug: 'contratacion', name: 'Contratación', dayNumber: 9, exclusivityGroup: null },
  { slug: 'aguada', name: 'Aguada', dayNumber: 10, exclusivityGroup: null },
  { slug: 'san-jose-de-suaita', name: 'San José de Suaita', dayNumber: 11, exclusivityGroup: null },
  { slug: 'el-penon', name: 'El Peñón', dayNumber: 12, exclusivityGroup: null },
  { slug: 'puente-nacional', name: 'Puente Nacional', dayNumber: 13, exclusivityGroup: null },
  { slug: 'velez-manana', name: 'Vélez (Mañana)', dayNumber: 17, exclusivityGroup: null },
  { slug: 'velez-tarde', name: 'Vélez (Tarde)', dayNumber: 18, exclusivityGroup: null },
] as const;

/** Lista blanca de cedulas o codigos autorizados para acceder al reporte detallado de personas inscritas. */
export const ADMIN_DOCUMENTS_WHITELIST: readonly string[] = [
  '1098633123',
] as const;
