/**
 * @sdd
 * [Objetivo]: Servicio de consulta publica anonima de rutas y sembrado inicial del catalogo (RN-02, RN-03, RN-06).
 * [I/O]: Expone findAllPublicSummaries() retornando IRoutePublicSummary[] y seedInitialRoutes().
 * [Edge Cases]: RN-06 estricto: cero identificadores de votantes expuestos. Manejo de cupos agotados.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TouristRouteEntity } from '../../entities/tourist-route.entity.js';
import { VoteEntity } from '../../entities/vote.entity.js';
import {
  ADMIN_DOCUMENTS_WHITELIST,
  INITIAL_ROUTES_CATALOG,
  MAX_ROUTE_CAPACITY,
} from '../../../../shared/constants/routes.constants.js';
import {
  IRouteAttendeeItem,
  IRouteDetailReport,
  IRoutePublicSummary,
} from '../../../../shared/models/route.interface.js';

/**
 * Servicio encargado de la gestion y consulta publica del catalogo de rutas.
 */
@Injectable()
export class RoutesService implements OnApplicationBootstrap {
  /**
   * Inyeccion de dependencias de repositorios TypeORM.
   * @param routesRepository Repositorio de rutas turisticas.
   * @param votesRepository Repositorio de votos.
   */
  constructor(
    @InjectRepository(TouristRouteEntity)
    private readonly routesRepository: Repository<TouristRouteEntity>,
    @InjectRepository(VoteEntity)
    private readonly votesRepository: Repository<VoteEntity>,
  ) {}

  /**
   * Gancho de ciclo de vida que asegura el sembrado inicial al levantar la aplicacion.
   * @returns Promesa resuelta tras el sembrado.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedInitialRoutes();
  }

  /**
   * Siembra de forma idempotente las 12 rutas oficiales en la base de datos (RN-02).
   * @returns Promesa con el numero de rutas aseguradas.
   */
  async seedInitialRoutes(): Promise<number> {
    let processedCount = 0;
    for (const routeDefinition of INITIAL_ROUTES_CATALOG) {
      const existingRoute = await this.routesRepository.findOne({
        where: { slug: routeDefinition.slug },
      });

      if (!existingRoute) {
        const newRoute = this.routesRepository.create({
          slug: routeDefinition.slug,
          name: routeDefinition.name,
          dayNumber: routeDefinition.dayNumber,
          maxCapacity: MAX_ROUTE_CAPACITY,
          exclusivityGroup: routeDefinition.exclusivityGroup,
        });
        await this.routesRepository.save(newRoute);
      } else if (
        existingRoute.name !== routeDefinition.name ||
        existingRoute.dayNumber !== routeDefinition.dayNumber ||
        existingRoute.exclusivityGroup !== routeDefinition.exclusivityGroup
      ) {
        existingRoute.name = routeDefinition.name;
        existingRoute.dayNumber = routeDefinition.dayNumber;
        existingRoute.exclusivityGroup = routeDefinition.exclusivityGroup;
        existingRoute.maxCapacity = MAX_ROUTE_CAPACITY;
        await this.routesRepository.save(existingRoute);
      }
      processedCount += 1;
    }
    return processedCount;
  }

  /**
   * Obtiene el listado publico anonimo de las 12 rutas con sus cupos agregados (RN-06).
   * @returns Arreglo de IRoutePublicSummary sin informacion personal de votantes.
   */
  async findAllPublicSummaries(): Promise<IRoutePublicSummary[]> {
    const routes = await this.routesRepository.find({
      order: { dayNumber: 'ASC' },
    });

    const summaries: IRoutePublicSummary[] = [];

    for (const route of routes) {
      const occupiedSeats = await this.votesRepository.count({
        where: { routeId: route.id },
      });

      const availableSeats = Math.max(0, route.maxCapacity - occupiedSeats);
      const isAvailable = occupiedSeats < route.maxCapacity;

      summaries.push({
        id: route.id,
        slug: route.slug,
        name: route.name,
        dayNumber: route.dayNumber,
        maxCapacity: route.maxCapacity,
        occupiedSeats,
        availableSeats,
        isAvailable,
        exclusivityGroup: route.exclusivityGroup,
      });
    }

    return summaries;
  }

  /**
   * Consulta el desglose detallado de asistentes inscritos a una ruta turistica.
   * @param routeId Identificador de la ruta.
   * @param documentId Documento del usuario que realiza la consulta administrativa.
   * @returns IRouteDetailReport con los nombres y documentos de los votantes registrados.
   * @throws ForbiddenException Si el documento no esta en la lista blanca administrativa.
   * @throws NotFoundException Si la ruta no existe en el sistema.
   */
  async findRouteAttendees(
    routeId: number,
    documentId?: string,
  ): Promise<IRouteDetailReport> {
    const isAuthorized =
      documentId &&
      ADMIN_DOCUMENTS_WHITELIST.includes(documentId.trim());

    if (!isAuthorized) {
      throw new ForbiddenException(
        'El documento no cuenta con autorizacion para consultar el listado detallado de asistentes.',
      );
    }

    const route = await this.routesRepository.findOne({
      where: { id: routeId },
    });

    if (!route) {
      throw new NotFoundException('La ruta turistica solicitada no existe.');
    }

    const votes = await this.votesRepository.find({
      where: { routeId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    const attendees: IRouteAttendeeItem[] = votes.map((vote) => ({
      documentId: vote.user.documentId,
      fullName: vote.user.fullName,
      confirmedAt: vote.createdAt.toISOString(),
    }));

    return {
      routeId: route.id,
      slug: route.slug,
      name: route.name,
      dayNumber: route.dayNumber,
      maxCapacity: route.maxCapacity,
      occupiedSeats: votes.length,
      attendees,
    };
  }
}
