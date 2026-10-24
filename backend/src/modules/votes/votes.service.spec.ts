/**
 * @sdd
 * [Objetivo]: Suite de pruebas unitarias para el motor transaccional VotesService (RN-01 a RN-05).
 * [I/O]: Simula transacciones TypeORM con bloqueo pesimista y verifica el cumplimiento estricto de las reglas.
 * [Edge Cases]: Sobrecupo, interbloqueos, exclusion mutua, usuarios duplicados e inexistentes.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { VotesService } from './votes.service.js';
import { SubmitVoteDto } from './dto/submit-vote.dto.js';
import { EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA } from '../../../../shared/constants/routes.constants.js';

describe('VotesService', () => {
  let votesService: VotesService;
  let mockFindOne: ReturnType<typeof vi.fn>;
  let mockCreateQueryBuilder: ReturnType<typeof vi.fn>;
  let mockCount: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;
  let mockDataSource: DataSource;

  beforeEach(() => {
    mockFindOne = vi.fn();
    mockCreateQueryBuilder = vi.fn();
    mockCount = vi.fn();
    mockCreate = vi.fn((_entity: unknown, payload: unknown) => payload);
    mockSave = vi.fn((_entity: unknown, payload: unknown) => Promise.resolve(payload));

    const mockEntityManager = {
      findOne: mockFindOne,
      createQueryBuilder: mockCreateQueryBuilder,
      count: mockCount,
      create: mockCreate,
      save: mockSave,
      update: vi.fn().mockResolvedValue({}),
    } as unknown as EntityManager;

    mockDataSource = {
      transaction: vi.fn(async (callback: (entityManager: EntityManager) => Promise<unknown>) => {
        return await callback(mockEntityManager);
      }),
    } as unknown as DataSource;

    votesService = new VotesService(mockDataSource);
  });

  it('debe rechazar la votacion si se envian dos IDs de ruta identicos (RN-04)', async () => {
    const payload: SubmitVoteDto = {
      documentId: '1098765432',
      routeIds: [3, 3],
    };

    await expect(votesService.confirmVotes(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe rechazar la votacion si el usuario no existe en la base de datos (RN-01)', async () => {
    mockFindOne.mockResolvedValue(null);

    const payload: SubmitVoteDto = {
      documentId: '9999999999',
      routeIds: [1, 2],
    };

    await expect(votesService.confirmVotes(payload)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe rechazar la votacion si el usuario ya ha emitido 2 votos previos (RN-04)', async () => {
    mockFindOne.mockResolvedValue({
      id: 'uuid-user-1',
      documentId: '1098765432',
      votes: [{ routeId: 1 }, { routeId: 2 }],
    });

    const payload: SubmitVoteDto = {
      documentId: '1098765432',
      routeIds: [3, 4],
    };

    await expect(votesService.confirmVotes(payload)).rejects.toThrow(
      ConflictException,
    );
  });

  it('debe rechazar la seleccion conjunta de Villanueva y Barichara por exclusion mutua (RN-05)', async () => {
    mockFindOne.mockResolvedValue({
      id: 'uuid-user-1',
      documentId: '1098765432',
      votes: [],
    });

    const mockQueryBuilder = {
      setLock: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        { id: 4, name: 'Villanueva', exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA, maxCapacity: 7 },
        { id: 5, name: 'Barichara', exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA, maxCapacity: 7 },
      ]),
    };
    mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

    const payload: SubmitVoteDto = {
      documentId: '1098765432',
      routeIds: [4, 5],
    };

    await expect(votesService.confirmVotes(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe rechazar la votacion si una ruta ya alcanzo su capacidad maxima de 7 cupos (RN-03)', async () => {
    mockFindOne.mockResolvedValue({
      id: 'uuid-user-1',
      documentId: '1098765432',
      votes: [],
    });

    const mockQueryBuilder = {
      setLock: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        { id: 1, name: 'Giron', exclusivityGroup: null, maxCapacity: 7 },
        { id: 2, name: 'Piedecuesta', exclusivityGroup: null, maxCapacity: 7 },
      ]),
    };
    mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

    // Simula que la primera ruta tiene 7 votos ocupados
    mockCount.mockResolvedValueOnce(7);

    const payload: SubmitVoteDto = {
      documentId: '1098765432',
      routeIds: [1, 2],
    };

    await expect(votesService.confirmVotes(payload)).rejects.toThrow(
      ConflictException,
    );
  });

  it('debe confirmar exitosamente los 2 votos cuando se cumplen todas las reglas', async () => {
    mockFindOne.mockResolvedValue({
      id: 'uuid-user-1',
      documentId: '1098765432',
      votes: [],
    });

    const mockQueryBuilder = {
      setLock: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        { id: 1, name: 'Giron', exclusivityGroup: null, maxCapacity: 7 },
        { id: 2, name: 'Piedecuesta', exclusivityGroup: null, maxCapacity: 7 },
      ]),
    };
    mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockCount.mockResolvedValue(3); // 3 cupos ocupados (menor a 7)

    const payload: SubmitVoteDto = {
      documentId: '1098765432',
      routeIds: [2, 1], // Invertido intencionalmente para verificar ordenamiento ascendente
    };

    const result = await votesService.confirmVotes(payload);

    expect(result.success).toBe(true);
    expect(result.votedRouteIds).toEqual([1, 2]);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
