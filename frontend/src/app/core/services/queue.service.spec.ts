/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para QueueService en el frontend.
 * [I/O]: Simula ApiService y evalua senales de summary, loading, error, y derivadas.
 * [Edge Cases]: Estados de error de red, cola vacia y actualizacion tras sorteo.
 */
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QueueService } from './queue.service';
import { ApiService } from './api.service';
import { IVotingQueueSummary } from '@shared/models/voting-queue.interface';

/** Interface auxiliar tipada para simular ApiService sin alertar linter de JSDoc. */
interface IMockApiService {
  /** Metodo simulado getQueueSummary. */
  getQueueSummary: ReturnType<typeof vi.fn>;
  /** Metodo simulado generateDraw. */
  generateDraw: ReturnType<typeof vi.fn>;
}

describe('QueueService', () => {
  let service: QueueService;
  let mockApiService: IMockApiService;

  const sampleSummary: IVotingQueueSummary = {
    totalInQueue: 2,
    pendingCount: 1,
    votedCount: 1,
    currentTurnNumber: 2,
    currentVoter: {
      id: 'item-2',
      turnNumber: 2,
      userId: 'user-2',
      documentId: '1098654321',
      fullName: 'Ana Ramirez',
      status: 'PENDING',
      createdAt: '2026-10-21T10:00:00.000Z',
      votedAt: null,
    },
    items: [
      {
        id: 'item-1',
        turnNumber: 1,
        userId: 'user-1',
        documentId: '1098765432',
        fullName: 'Carlos Gomez',
        status: 'VOTED',
        createdAt: '2026-10-21T10:00:00.000Z',
        votedAt: '2026-10-21T10:15:00.000Z',
      },
      {
        id: 'item-2',
        turnNumber: 2,
        userId: 'user-2',
        documentId: '1098654321',
        fullName: 'Ana Ramirez',
        status: 'PENDING',
        createdAt: '2026-10-21T10:00:00.000Z',
        votedAt: null,
      },
    ],
  };

  beforeEach(() => {
    mockApiService = {
      getQueueSummary: vi.fn().mockReturnValue(of(sampleSummary)),
      generateDraw: vi.fn().mockReturnValue(of(sampleSummary)),
    };

    TestBed.configureTestingModule({
      providers: [
        QueueService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(QueueService);
  });

  it('debe inicializarse con estado vacio por defecto', () => {
    expect(service.summary()).toBeNull();
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.totalInQueue()).toBe(0);
    expect(service.pendingCount()).toBe(0);
    expect(service.votedCount()).toBe(0);
    expect(service.currentVoter()).toBeNull();
    expect(service.currentTurnNumber()).toBeNull();
    expect(service.items()).toEqual([]);
  });

  it('debe cargar la cola y actualizar las senales reactivas', async () => {
    await service.loadQueue();

    expect(mockApiService.getQueueSummary).toHaveBeenCalledTimes(1);
    expect(service.summary()).toEqual(sampleSummary);
    expect(service.totalInQueue()).toBe(2);
    expect(service.pendingCount()).toBe(1);
    expect(service.votedCount()).toBe(1);
    expect(service.currentTurnNumber()).toBe(2);
    expect(service.currentVoter()?.documentId).toBe('1098654321');
    expect(service.isLoading()).toBe(false);
  });

  it('debe registrar el error cuando la carga de la cola falla', async () => {
    mockApiService.getQueueSummary.mockReturnValue(
      throwError(() => new Error('Error de red')),
    );

    await service.loadQueue();

    expect(service.error()).toBe('Error de red');
    expect(service.isLoading()).toBe(false);
  });

  it('debe generar el sorteo y actualizar el resumen de la cola', async () => {
    await service.generateDraw();

    expect(mockApiService.generateDraw).toHaveBeenCalledTimes(1);
    expect(service.summary()).toEqual(sampleSummary);
    expect(service.isLoading()).toBe(false);
  });
});
