/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para RoutesService validando privacidad por diseno y calculo de cupos (RN-02, RN-03, RN-06).
 * [I/O]: Simula repositorio TypeORM y evalua el retorno anonimo de IRoutePublicSummary[].
 * [Edge Cases]: Rutas con cupo lleno (isAvailable=false), cero exposicion de votantes.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { RoutesService } from './routes.service.js';
import { TouristRouteEntity } from '../../entities/tourist-route.entity.js';
import { VoteEntity } from '../../entities/vote.entity.js';
import { ADMIN_DOCUMENTS_WHITELIST } from '../../../../shared/constants/routes.constants.js';

describe('RoutesService', () => {
  let routesService: RoutesService;
  let mockRoutesRepository: Repository<TouristRouteEntity>;
  let mockVotesRepository: Repository<VoteEntity>;
  let mockFind: ReturnType<typeof vi.fn>;
  let mockCount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFind = vi.fn();
    mockCount = vi.fn();

    mockRoutesRepository = {
      find: mockFind,
      findOne: vi.fn(),
      create: vi.fn((payload: unknown) => payload),
      save: vi.fn((payload: unknown) => Promise.resolve(payload)),
    } as unknown as Repository<TouristRouteEntity>;

    mockVotesRepository = {
      count: mockCount,
      find: vi.fn(),
    } as unknown as Repository<VoteEntity>;

    routesService = new RoutesService(mockRoutesRepository, mockVotesRepository);
  });

  it('debe calcular los cupos ocupados y disponibles sin exponer datos de votantes (RN-06)', async () => {
    mockFind.mockResolvedValue([
      {
        id: 1,
        slug: 'giron',
        name: 'Girón',
        dayNumber: 4,
        maxCapacity: 7,
        exclusivityGroup: null,
      },
    ]);

    mockCount.mockResolvedValue(5);

    const summaries = await routesService.findAllPublicSummaries();

    expect(summaries).toHaveLength(1);
    expect(summaries[0].occupiedSeats).toBe(5);
    expect(summaries[0].availableSeats).toBe(2);
    expect(summaries[0].isAvailable).toBe(true);
    // Verificacion estricta de privacidad: no existen campos de usuarios
    expect('votes' in summaries[0]).toBe(false);
    expect('users' in summaries[0]).toBe(false);
  });

  it('debe marcar isAvailable como false cuando la ruta alcanza los 7 cupos (RN-03)', async () => {
    mockFind.mockResolvedValue([
      {
        id: 2,
        slug: 'barichara',
        name: 'Barichara',
        dayNumber: 8,
        maxCapacity: 7,
        exclusivityGroup: 'VILLANUEVA_BARICHARA',
      },
    ]);

    mockCount.mockResolvedValue(7);

    const summaries = await routesService.findAllPublicSummaries();

    expect(summaries[0].occupiedSeats).toBe(7);
    expect(summaries[0].availableSeats).toBe(0);
    expect(summaries[0].isAvailable).toBe(false);
  });

  it('debe rechazar la consulta de asistentes con ForbiddenException si el documento no esta autorizado', async () => {
    await expect(
      routesService.findRouteAttendees(1, 'DOC-NO-AUTORIZADO'),
    ).rejects.toThrow();
  });

  it('debe retornar el reporte detallado con los asistentes cuando el documento esta autorizado', async () => {
    (mockRoutesRepository.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      exclusivityGroup: null,
    });

    (mockVotesRepository.find as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'vote-1',
        routeId: 1,
        createdAt: new Date('2026-10-21T10:00:00.000Z'),
        user: {
          documentId: 'DOC-001',
          fullName: 'Juan Perez',
        },
      },
    ]);

    const report = await routesService.findRouteAttendees(
      1,
      ADMIN_DOCUMENTS_WHITELIST[0],
    );

    expect(report.routeId).toBe(1);
    expect(report.occupiedSeats).toBe(1);
    expect(report.attendees).toHaveLength(1);
    expect(report.attendees[0].documentId).toBe('DOC-001');
    expect(report.attendees[0].fullName).toBe('Juan Perez');
  });
});
