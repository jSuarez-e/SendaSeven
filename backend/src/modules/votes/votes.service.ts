/**
 * @sdd
 * [Objetivo]: Motor transaccional de confirmacion de votos con bloqueo pesimista y prevencion de deadlocks (RN-03, RN-04, RN-05).
 * [I/O]: confirmVotes(dto) ejecuta transaccion atomica con SELECT ... FOR UPDATE ordenado (id ASC) y retorna IVoteConfirmationResponse.
 * [Edge Cases]: Sobrecupos concurrentes abortados con ConflictException; deadlocks prevenidos por orden ascendente; rollback automatico.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../entities/user.entity.js';
import { TouristRouteEntity } from '../../entities/tourist-route.entity.js';
import { VoteEntity } from '../../entities/vote.entity.js';
import { VotingQueueEntity } from '../../entities/voting-queue.entity.js';
import { SubmitVoteDto } from './dto/submit-vote.dto.js';
import {
  EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA,
  REQUIRED_VOTES_COUNT,
} from '../../../../shared/constants/routes.constants.js';
import { IVoteConfirmationResponse } from '../../../../shared/models/vote.interface.js';

/**
 * Servicio transaccional de procesamiento y confirmacion de votos.
 */
@Injectable()
export class VotesService {
  /**
   * Inyeccion de dependencias del DataSource de TypeORM para control transaccional.
   * @param dataSource Fuente de datos TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Procesa de forma atomica la confirmacion de 2 votos por usuario previniendo condiciones de carrera (RN-03, RN-04, RN-05).
   * @param submitVoteDto DTO con el documentId y el par de routeIds.
   * @returns Confirmacion de la transaccion completada.
   * @throws BadRequestException Si las rutas son iguales, son del grupo excluyente, o no cumplen la regla.
   * @throws NotFoundException Si el usuario o las rutas no existen.
   * @throws ConflictException Si el usuario ya voto o si una ruta alcanzo su cupo maximo (7).
   */
  async confirmVotes(
    submitVoteDto: SubmitVoteDto,
  ): Promise<IVoteConfirmationResponse> {
    const { documentId, routeIds } = submitVoteDto;
    const [firstRouteId, secondRouteId] = routeIds;

    // RN-04: Un usuario no puede votar dos veces por la misma ruta
    if (firstRouteId === secondRouteId) {
      throw new BadRequestException(
        'No esta permitido seleccionar la misma ruta dos veces. Debe elegir 2 rutas distintas.',
      );
    }

    // Prevencion de Deadlocks: Ordenamiento ascendente estricto de IDs antes del bloqueo pesimista
    const sortedRouteIds = [firstRouteId, secondRouteId].sort(
      (firstId, secondId) => firstId - secondId,
    );

    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // RN-01: Validacion de existencia del usuario precargado
        const user = await transactionalEntityManager.findOne(UserEntity, {
          where: { documentId: documentId.trim() },
          relations: { votes: true },
        });

        if (!user) {
          throw new NotFoundException(
            'El usuario con el documento indicado no se encuentra registrado en el censo oficial.',
          );
        }

        // RN-04: Maximo 2 votos totales por usuario (no puede votar mas de una vez)
        if ((user.votes ?? []).length >= REQUIRED_VOTES_COUNT) {
          throw new ConflictException(
            'El usuario ya ha ejercido la totalidad de sus votos permitidos (2 rutas).',
          );
        }

        // Verificacion de duplicado respecto a votos anteriores
        const existingVotedRouteIds = new Set(
          (user.votes ?? []).map((vote) => vote.routeId),
        );
        if (
          existingVotedRouteIds.has(firstRouteId) ||
          existingVotedRouteIds.has(secondRouteId)
        ) {
          throw new ConflictException(
            'El usuario ya posee un voto registrado para alguna de las rutas seleccionadas.',
          );
        }

        // Bloqueo Pesimista FOR UPDATE en orden ascendente (Garantiza serializacion e integridad)
        const lockedRoutes = await transactionalEntityManager
          .createQueryBuilder(TouristRouteEntity, 'route')
          .setLock('pessimistic_write')
          .where('route.id IN (:...sortedRouteIds)', { sortedRouteIds })
          .orderBy('route.id', 'ASC')
          .getMany();

        if (lockedRoutes.length !== REQUIRED_VOTES_COUNT) {
          throw new NotFoundException(
            'Una o ambas rutas turisticas seleccionadas no existen en el catalogo.',
          );
        }

        // RN-05: Exclusion Mutua Villanueva / Barichara
        const isVillanuevaBaricharaConflict = lockedRoutes.every(
          (route) =>
            route.exclusivityGroup === EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA,
        );
        if (isVillanuevaBaricharaConflict) {
          throw new BadRequestException(
            'Las rutas Villanueva y Barichara pertenecen al mismo grupo de exclusividad. No se puede votar por ambas.',
          );
        }

        // RN-03: Capacidad Estricta (max_capacity = 7) verificada bajo el bloqueo pesimista
        for (const route of lockedRoutes) {
          const currentOccupiedSeats = await transactionalEntityManager.count(
            VoteEntity,
            {
              where: { routeId: route.id },
            },
          );

          if (currentOccupiedSeats >= route.maxCapacity) {
            throw new ConflictException(
              `La ruta '${route.name}' ya ha alcanzado su capacidad maxima estricta de ${route.maxCapacity} cupos.`,
            );
          }
        }

        // Insercion atomica de los 2 registros de voto
        const votesToCreate = lockedRoutes.map((route) =>
          transactionalEntityManager.create(VoteEntity, {
            userId: user.id,
            routeId: route.id,
          }),
        );

        await transactionalEntityManager.save(VoteEntity, votesToCreate);

        // Actualizacion atomica del turno en la cola de sorteo a VOTED
        await transactionalEntityManager.update(
          VotingQueueEntity,
          { userId: user.id },
          { status: 'VOTED', votedAt: new Date() },
        );

        return {
          success: true,
          message: 'Votacion confirmada exitosamente.',
          votedRouteIds: lockedRoutes.map((route) => route.id),
          confirmedAt: new Date().toISOString(),
        };
      },
    );
  }
}
