/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para QueueService (sorteo y cola de votacion).
 * [I/O]: Evalua getQueueSummary, generateRandomQueue y markUserAsVoted con mocks de TypeORM.
 * [Edge Cases]: Exclusion de usuarios con votos completos, orden de turnos, y actualizacion de estado a VOTED.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueService } from './queue.service.js';
import { VotingQueueEntity } from '../../entities/voting-queue.entity.js';
import { UserEntity } from '../../entities/user.entity.js';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueueRepository: Record<string, unknown>;
  let mockDataSource: Record<string, unknown>;

  beforeEach(() => {
    mockQueueRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
    };

    mockDataSource = {
      transaction: vi.fn(),
    };

    service = new QueueService(
      mockQueueRepository as never,
      mockDataSource as never,
    );
  });

  describe('getQueueSummary', () => {
    it('debe retornar el resumen con metricas y el primer votante pendiente como turno actual', async () => {
      const mockRecords: Partial<VotingQueueEntity>[] = [
        {
          id: 'queue-uuid-1',
          turnNumber: 1,
          userId: 'user-uuid-1',
          status: 'VOTED',
          createdAt: new Date('2026-10-21T10:00:00Z'),
          votedAt: new Date('2026-10-21T10:15:00Z'),
          user: {
            id: 'user-uuid-1',
            documentId: '1098765432',
            fullName: 'Carlos Gomez',
            createdAt: new Date(),
            votes: [{ id: 'vote-1' } as never, { id: 'vote-2' } as never],
          } as UserEntity,
        },
        {
          id: 'queue-uuid-2',
          turnNumber: 2,
          userId: 'user-uuid-2',
          status: 'PENDING',
          createdAt: new Date('2026-10-21T10:00:00Z'),
          votedAt: null,
          user: {
            id: 'user-uuid-2',
            documentId: '1098654321',
            fullName: 'Ana Ramirez',
            createdAt: new Date(),
            votes: [],
          } as UserEntity,
        },
      ];

      (mockQueueRepository.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRecords,
      );

      const summary = await service.getQueueSummary();

      expect(summary.totalInQueue).toBe(2);
      expect(summary.votedCount).toBe(1);
      expect(summary.pendingCount).toBe(1);
      expect(summary.currentTurnNumber).toBe(2);
      expect(summary.currentVoter?.documentId).toBe('1098654321');
    });

    it('debe retornar currentVoter como null cuando todos han votado', async () => {
      const mockRecords: Partial<VotingQueueEntity>[] = [
        {
          id: 'queue-uuid-1',
          turnNumber: 1,
          userId: 'user-uuid-1',
          status: 'VOTED',
          createdAt: new Date('2026-10-21T10:00:00Z'),
          votedAt: new Date('2026-10-21T10:15:00Z'),
          user: {
            id: 'user-uuid-1',
            documentId: '1098765432',
            fullName: 'Carlos Gomez',
            createdAt: new Date(),
            votes: [{ id: 'vote-1' } as never, { id: 'vote-2' } as never],
          } as UserEntity,
        },
      ];

      (mockQueueRepository.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRecords,
      );

      const summary = await service.getQueueSummary();

      expect(summary.pendingCount).toBe(0);
      expect(summary.currentTurnNumber).toBeNull();
      expect(summary.currentVoter).toBeNull();
    });
  });

  describe('generateRandomQueue', () => {
    it('debe filtrar a los usuarios que ya votaron y sortear a los pendientes', async () => {
      const mockUsers: Partial<UserEntity>[] = [
        {
          id: 'user-voted',
          documentId: 'DOC-VOTED',
          fullName: 'Usuario Ya Voto',
          votes: [{ id: 'vote-1' } as never, { id: 'vote-2' } as never],
        },
        {
          id: 'user-pending-1',
          documentId: 'DOC-PEND-1',
          fullName: 'Usuario Pendiente 1',
          votes: [],
        },
        {
          id: 'user-pending-2',
          documentId: 'DOC-PEND-2',
          fullName: 'Usuario Pendiente 2',
          votes: [],
        },
      ];

      const mockTransactionalManager = {
        find: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        create: vi
          .fn()
          .mockImplementation((_entityClass, dto) => ({ ...dto, id: 'gen-id' })),
        save: vi.fn().mockResolvedValue([]),
      };

      // Primer find para allUsers, segundo find para existingVotedRecords, tercer find para refreshedRecords
      mockTransactionalManager.find
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'gen-id-1',
            turnNumber: 1,
            userId: 'user-pending-1',
            status: 'PENDING',
            createdAt: new Date(),
            votedAt: null,
            user: mockUsers[1],
          },
        ]);

      (mockDataSource.transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (callback: (entityManager: unknown) => Promise<unknown>) => {
          return await callback(mockTransactionalManager);
        },
      );

      const result = await service.generateRandomQueue();

      expect(mockTransactionalManager.delete).toHaveBeenCalledWith(
        VotingQueueEntity,
        { status: 'PENDING' },
      );
      expect(result.items.length).toBe(1);
    });
  });

  describe('markUserAsVoted', () => {
    it('debe actualizar el estado del turno a VOTED con fecha', async () => {
      const existingQueueItem = {
        id: 'q-1',
        userId: 'u-1',
        status: 'PENDING',
        votedAt: null,
      };

      (mockQueueRepository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        existingQueueItem,
      );

      await service.markUserAsVoted('u-1');

      expect(existingQueueItem.status).toBe('VOTED');
      expect(existingQueueItem.votedAt).toBeInstanceOf(Date);
      expect(mockQueueRepository.save).toHaveBeenCalledWith(existingQueueItem);
    });
  });
});
