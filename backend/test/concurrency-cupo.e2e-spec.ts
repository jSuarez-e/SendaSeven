/**
 * @sdd
 * [Objetivo]: Test de estres de concurrencia e2e sobre el limite estricto de 7 cupos por ruta (test/concurrency-cupo.e2e-spec.ts).
 * [I/O]: 20 solicitudes HTTP POST /api/votes simultaneas hacia la ruta Barichara; evalua respuestas 201 vs 409.
 * [Edge Cases]: Condicion de carrera mitigada por bloqueo pesimista ordenado; exactamente 7 cupos asignados y 13 conflictos.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, EntityManager } from 'typeorm';
import { VotesController } from '../src/modules/votes/votes.controller.js';
import { VotesService } from '../src/modules/votes/votes.service.js';
import { UserEntity } from '../src/entities/user.entity.js';
import { TouristRouteEntity } from '../src/entities/tourist-route.entity.js';
import { VoteEntity } from '../src/entities/vote.entity.js';
import {
  getQATestRoutes,
  getQATestUsers,
  IQATestRoute,
  IQATestUser,
} from './fixtures/qa-test-dataset.js';

/**
 * Registro de voto en memoria para la simulacion concurrente.
 */
interface IInMemoryVoteRecord {
  /** Identificador UUID del voto. */
  id: string;
  /** Identificador UUID del usuario votante. */
  userId: string;
  /** Identificador numerico de la ruta votada. */
  routeId: number;
  /** Fecha y hora de creacion del voto. */
  createdAt: Date;
}

/**
 * Filtro de busqueda de usuario por documento.
 */
interface IUserWhereFilter {
  /** Documento de identidad a buscar. */
  documentId?: string;
}

/**
 * Opciones de busqueda de usuario.
 */
interface IUserQueryOptions {
  /** Filtro where. */
  where?: IUserWhereFilter;
}

/**
 * Parametros de consulta de rutas turisticas.
 */
interface IRouteQueryParams {
  /** Lista de identificadores de rutas ordenadas. */
  sortedRouteIds?: number[];
}

/**
 * Filtro de conteo de votos por ruta.
 */
interface IVoteCountFilter {
  /** Identificador de la ruta. */
  routeId?: number;
}

/**
 * Opciones de conteo de votos.
 */
interface IVoteCountOptions {
  /** Filtro where. */
  where?: IVoteCountFilter;
}

/**
 * Payload de creacion de voto.
 */
interface IVoteCreatePayload {
  /** Identificador del usuario. */
  userId: string;
  /** Identificador de la ruta. */
  routeId: number;
}

describe('Prueba de Concurrencia de Cupos (e2e)', () => {
  let app: INestApplication;
  let testUsers: IQATestUser[];
  let testRoutes: IQATestRoute[];
  let inMemoryVotes: IInMemoryVoteRecord[];

  beforeEach(async () => {
    testUsers = getQATestUsers();
    testRoutes = getQATestRoutes();
    inMemoryVotes = [];

    // Cola FIFO asincrona para simular la serializacion de transacciones bajo bloqueo pesimista en PostgreSQL
    let transactionMutex: Promise<unknown> = Promise.resolve();

    const mockDataSource = {
      transaction: vi.fn(async (callback: (entityManager: EntityManager) => Promise<unknown>) => {
        /**
         * Ejecuta la transaccion serializada dentro del mutex de pruebas.
         * @returns Resultado de la transaccion.
         */
        async function executeTransaction(): Promise<unknown> {
          // Creacion del mock de EntityManager para el ambito de la transaccion
          const mockTransactionalEntityManager = {
            findOne: vi.fn(async (entityClass: unknown, queryOptions: IUserQueryOptions) => {
              if (entityClass === UserEntity && queryOptions.where?.documentId) {
                const targetDocument = queryOptions.where.documentId.trim();
                const matchedUser = testUsers.find((user) => user.documentId === targetDocument);
                if (!matchedUser) {
                  return null;
                }
                const userVotes = inMemoryVotes.filter((vote) => vote.userId === matchedUser.id);
                return {
                  ...matchedUser,
                  votes: userVotes,
                } as unknown as UserEntity;
              }
              return null;
            }),

            createQueryBuilder: vi.fn((entityClass: unknown) => {
              if (entityClass === TouristRouteEntity) {
                let queriedIds: number[] = [];
                return {
                  setLock: vi.fn().mockReturnThis(),
                  where: vi.fn((_clause: string, parameters: IRouteQueryParams) => {
                    if (parameters?.sortedRouteIds) {
                      queriedIds = parameters.sortedRouteIds;
                    }
                    return {
                      orderBy: vi.fn().mockReturnThis(),
                      getMany: vi.fn(async () => {
                        return testRoutes
                          .filter((route) => queriedIds.includes(route.id))
                          .sort((firstRoute, secondRoute) => firstRoute.id - secondRoute.id) as unknown as TouristRouteEntity[];
                      }),
                    };
                  }),
                };
              }
              return {};
            }),

            count: vi.fn(async (entityClass: unknown, countOptions: IVoteCountOptions) => {
              if (entityClass === VoteEntity && countOptions.where?.routeId !== undefined) {
                const targetRouteId = countOptions.where.routeId;
                return inMemoryVotes.filter((vote) => vote.routeId === targetRouteId).length;
              }
              return 0;
            }),

            create: vi.fn((_entityClass: unknown, payload: IVoteCreatePayload) => {
              return {
                id: `vote-${Math.random().toString(36).substring(2, 9)}`,
                userId: payload.userId,
                routeId: payload.routeId,
                createdAt: new Date(),
              } as unknown as VoteEntity;
            }),

            save: vi.fn(async (_entityClass: unknown, rawVotes: VoteEntity | VoteEntity[]) => {
              const arrayToSave = Array.isArray(rawVotes) ? rawVotes : [rawVotes];
              for (const rawVote of arrayToSave) {
                const voteRecord: IInMemoryVoteRecord = {
                  id: rawVote.id,
                  userId: rawVote.userId,
                  routeId: rawVote.routeId,
                  createdAt: rawVote.createdAt ?? new Date(),
                };
                inMemoryVotes.push(voteRecord);
              }
              return rawVotes;
            }),
          } as unknown as EntityManager;

          return await callback(mockTransactionalEntityManager);
        }

        const scheduledPromise = transactionMutex.then(executeTransaction, executeTransaction);
        transactionMutex = scheduledPromise.then(() => undefined, () => undefined);
        return await scheduledPromise;
      }),
    } as unknown as DataSource;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        VotesService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('debe otorgar exactamente 7 respuestas 201 y 13 respuestas 409 ante 20 solicitudes concurrentes sobre Barichara', async () => {
    // ARRANGE: Identificar la ruta Barichara y una ruta complementaria sin conflicto (Giron)
    const baricharaRoute = testRoutes.find((route) => route.slug === 'barichara');
    const gironRoute = testRoutes.find((route) => route.slug === 'giron');

    expect(baricharaRoute).toBeDefined();
    expect(gironRoute).toBeDefined();

    if (!baricharaRoute || !gironRoute) {
      throw new Error('Rutas necesarias para el test no encontradas en el dataset');
    }

    // Tomar 20 usuarios de prueba distintos (DOC-001 a DOC-020)
    const activeTestUsers = testUsers.slice(0, 20);
    expect(activeTestUsers).toHaveLength(20);

    // ACT: Lanzar 20 peticiones concurrentes simultaneas exactamente en la misma rafaga
    const concurrentRequests = activeTestUsers.map((user) => {
      return request(app.getHttpServer())
        .post('/api/votes')
        .send({
          documentId: user.documentId,
          routeIds: [baricharaRoute.id, gironRoute.id],
        });
    });

    const responses = await Promise.all(concurrentRequests);

    // ASSERT: Analisis empirico de resultados
    const createdResponses = responses.filter((res) => res.status === 201);
    const conflictResponses = responses.filter((res) => res.status === 409);

    // 1. Exactamente 7 usuarios logran confirmar cupo
    expect(createdResponses).toHaveLength(7);

    // 2. Exactamente 13 usuarios son rechazados con 409 Conflict por sobrecupo
    expect(conflictResponses).toHaveLength(13);

    // 3. El total de votos persistidos en la base de datos para Barichara es exactamente 7
    const baricharaVotesCount = inMemoryVotes.filter(
      (vote) => vote.routeId === baricharaRoute.id,
    ).length;
    expect(baricharaVotesCount).toBe(7);

    // 4. El total de votos persistidos en la base de datos para Giron es exactamente 7
    const gironVotesCount = inMemoryVotes.filter(
      (vote) => vote.routeId === gironRoute.id,
    ).length;
    expect(gironVotesCount).toBe(7);

    // 5. Los mensajes de los 13 rechazados contienen la explicacion de capacidad maxima
    for (const conflictResponse of conflictResponses) {
      expect(conflictResponse.body.message).toContain('capacidad maxima estricta de 7 cupos');
    }
  });

  it('debe rechazar con 400 Bad Request si un usuario intenta votar simultaneamente por Barichara y Villanueva (RN-05)', async () => {
    // ARRANGE: Rutas en conflicto de exclusion mutua
    const baricharaRoute = testRoutes.find((route) => route.slug === 'barichara');
    const villanuevaRoute = testRoutes.find((route) => route.slug === 'villanueva');

    expect(baricharaRoute).toBeDefined();
    expect(villanuevaRoute).toBeDefined();

    if (!baricharaRoute || !villanuevaRoute) {
      throw new Error('Rutas de exclusion no encontradas');
    }

    // ACT: Envio de voto invalido por pertenecer al mismo grupo de exclusividad
    const response = await request(app.getHttpServer())
      .post('/api/votes')
      .send({
        documentId: 'DOC-025',
        routeIds: [baricharaRoute.id, villanuevaRoute.id],
      });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('grupo de exclusividad');
  });
});
