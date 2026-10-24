/**
 * @sdd
 * [Objetivo]: Servicio de logica de negocio para la generacion aleatoria y administracion de turnos de votacion.
 * [I/O]: getQueueSummary() retorna IVotingQueueSummary; generateRandomQueue() baraja usuarios no votantes y persiste el orden; markUserAsVoted() actualiza el turno completado.
 * [Edge Cases]: Exclusion estricta de usuarios con votos registrados (RN-04); barajado criptograficamente seguro; transaccion atomica para regeneracion.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { UserEntity } from '../../entities/user.entity.js';
import { VotingQueueEntity } from '../../entities/voting-queue.entity.js';
import {
  IVotingQueueItem,
  IVotingQueueSummary,
} from '../../../../shared/models/voting-queue.interface.js';
import { REQUIRED_VOTES_COUNT } from '../../../../shared/constants/routes.constants.js';

/**
 * Servicio encargado de la gestion y sorteo aleatorio de la cola de votacion.
 */
@Injectable()
export class QueueService {
  /**
   * Inyeccion del repositorio de cola y de la fuente de datos TypeORM.
   * @param queueRepository Repositorio de la entidad VotingQueueEntity.
   * @param dataSource Fuente de datos para ejecucion de transacciones atomicas.
   */
  constructor(
    @InjectRepository(VotingQueueEntity)
    private readonly queueRepository: Repository<VotingQueueEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Obtiene el resumen actual de la cola de votacion, ordenado por numero de turno ascendente.
   * @returns Promesa con el resumen consolidado de participantes y turnos.
   */
  async getQueueSummary(): Promise<IVotingQueueSummary> {
    const queueRecords = await this.queueRepository.find({
      relations: { user: { votes: true } },
      order: { turnNumber: 'ASC' },
    });

    const items: IVotingQueueItem[] = queueRecords.map((record) => {
      // Sincroniza dinamicamente el estado si el usuario ya completo sus 2 votos
      const userVotesCount = (record.user?.votes ?? []).length;
      const isActuallyVoted =
        record.status === 'VOTED' || userVotesCount >= REQUIRED_VOTES_COUNT;

      return {
        id: record.id,
        turnNumber: record.turnNumber,
        userId: record.userId,
        documentId: record.user?.documentId ?? 'N/A',
        fullName: record.user?.fullName ?? 'Usuario Desconocido',
        status: isActuallyVoted ? 'VOTED' : 'PENDING',
        createdAt: record.createdAt.toISOString(),
        votedAt: record.votedAt ? record.votedAt.toISOString() : null,
      };
    });

    const pendingItems = items.filter((item) => item.status === 'PENDING');
    const votedItems = items.filter((item) => item.status === 'VOTED');
    const currentVoter = pendingItems.length > 0 ? pendingItems[0] : null;

    return {
      totalInQueue: items.length,
      pendingCount: pendingItems.length,
      votedCount: votedItems.length,
      currentTurnNumber: currentVoter ? currentVoter.turnNumber : null,
      currentVoter,
      items,
    };
  }

  /**
   * Genera de forma aleatoria y controlada el orden de votacion con los usuarios registrados
   * que no hayan votado aun, preservando el historico de los que ya votaron.
   * @returns Promesa con el nuevo resumen consolidado tras el sorteo.
   */
  async generateRandomQueue(): Promise<IVotingQueueSummary> {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Obtener todos los usuarios registrados con sus votos existentes
        const allUsers = await transactionalEntityManager.find(UserEntity, {
          relations: { votes: true },
          order: { createdAt: 'ASC' },
        });

        // 2. Separar usuarios que completaron sus votos y usuarios pendientes
        const completedUsers = allUsers.filter(
          (registeredUser) =>
            (registeredUser.votes ?? []).length >= REQUIRED_VOTES_COUNT,
        );
        const pendingUsers = allUsers.filter(
          (registeredUser) =>
            (registeredUser.votes ?? []).length < REQUIRED_VOTES_COUNT,
        );

        // 3. Sincronizar usuarios que ya votaron en la BD para que queden guardados con status VOTED
        const existingVotedRecords = await transactionalEntityManager.find(
          VotingQueueEntity,
          {
            where: { status: 'VOTED' },
            order: { turnNumber: 'ASC' },
          },
        );

        const existingVotedUserIds = new Set(
          existingVotedRecords.map((item) => item.userId),
        );

        let nextAssignedTurn = existingVotedRecords.length;
        for (const completedUser of completedUsers) {
          if (!existingVotedUserIds.has(completedUser.id)) {
            nextAssignedTurn += 1;
            const firstVoteDate =
              (completedUser.votes ?? [])[0]?.createdAt ?? new Date();
            const votedQueueRecord = transactionalEntityManager.create(
              VotingQueueEntity,
              {
                turnNumber: nextAssignedTurn,
                userId: completedUser.id,
                status: 'VOTED',
                votedAt: firstVoteDate,
              },
            );
            await transactionalEntityManager.save(
              VotingQueueEntity,
              votedQueueRecord,
            );
          }
        }

        // 4. Eliminar turnos pendientes antiguos para reasignar el nuevo orden sorteado
        await transactionalEntityManager.delete(VotingQueueEntity, {
          status: 'PENDING',
        });

        // 5. Total de usuarios completados para secuenciar los turnos pendientes
        const totalVotedCount = await transactionalEntityManager.count(
          VotingQueueEntity,
          { where: { status: 'VOTED' } },
        );

        // 6. Algoritmo Fisher-Yates criptograficamente seguro para barajar a los pendientes
        const shuffledPendingUsers = [...pendingUsers];
        for (
          let currentIndex = shuffledPendingUsers.length - 1;
          currentIndex > 0;
          currentIndex -= 1
        ) {
          const randomIndex = randomInt(currentIndex + 1);
          const temporaryUser = shuffledPendingUsers[currentIndex];
          shuffledPendingUsers[currentIndex] =
            shuffledPendingUsers[randomIndex];
          shuffledPendingUsers[randomIndex] = temporaryUser;
        }

        // 7. Insertar los nuevos turnos sorteados para los pendientes
        const newQueueEntities: VotingQueueEntity[] = [];
        for (
          let userIndex = 0;
          userIndex < shuffledPendingUsers.length;
          userIndex += 1
        ) {
          const selectedUser = shuffledPendingUsers[userIndex];
          const queueEntity = transactionalEntityManager.create(
            VotingQueueEntity,
            {
              turnNumber: totalVotedCount + userIndex + 1,
              userId: selectedUser.id,
              status: 'PENDING',
              votedAt: null,
            },
          );
          newQueueEntities.push(queueEntity);
        }

        if (newQueueEntities.length > 0) {
          await transactionalEntityManager.save(
            VotingQueueEntity,
            newQueueEntities,
          );
        }

        // 7. Retornar el resumen actualizado tras el sorteo
        const refreshedRecords = await transactionalEntityManager.find(
          VotingQueueEntity,
          {
            relations: { user: { votes: true } },
            order: { turnNumber: 'ASC' },
          },
        );

        const mappedItems: IVotingQueueItem[] = refreshedRecords.map(
          (record) => ({
            id: record.id,
            turnNumber: record.turnNumber,
            userId: record.userId,
            documentId: record.user?.documentId ?? 'N/A',
            fullName: record.user?.fullName ?? 'Usuario Desconocido',
            status: record.status,
            createdAt: record.createdAt.toISOString(),
            votedAt: record.votedAt ? record.votedAt.toISOString() : null,
          }),
        );

        const pendingList = mappedItems.filter(
          (item) => item.status === 'PENDING',
        );
        const votedList = mappedItems.filter((item) => item.status === 'VOTED');
        const currentVoter = pendingList.length > 0 ? pendingList[0] : null;

        return {
          totalInQueue: mappedItems.length,
          pendingCount: pendingList.length,
          votedCount: votedList.length,
          currentTurnNumber: currentVoter ? currentVoter.turnNumber : null,
          currentVoter,
          items: mappedItems,
        };
      },
    );
  }

  /**
   * Marca el turno de un usuario como completado (VOTED) al registrar exitosamente sus votos.
   * @param userId Identificador UUID del usuario que confirmo su voto.
   */
  async markUserAsVoted(userId: string): Promise<void> {
    const queueRecord = await this.queueRepository.findOne({
      where: { userId },
    });

    if (queueRecord) {
      queueRecord.status = 'VOTED';
      queueRecord.votedAt = new Date();
      await this.queueRepository.save(queueRecord);
    }
  }
}
