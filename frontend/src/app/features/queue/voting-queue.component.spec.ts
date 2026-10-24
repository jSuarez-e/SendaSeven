/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para VotingQueueComponent.
 * [I/O]: Evalua la inicializacion, filtrado reactivo de items, interaccion con QueueService y modal de confirmacion.
 * [Edge Cases]: Busqueda sin coincidencias, cambios de pestaña y apertura/cierre de modal.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { VotingQueueComponent } from './voting-queue.component';
import { QueueService } from '../../core/services/queue.service';
import {
  IVotingQueueItem,
  IVotingQueueSummary,
} from '@shared/models/voting-queue.interface';

/**
 * Interface auxiliar tipada para el mock de QueueService en pruebas unitarias.
 */
interface IMockQueueService {
  /** Senal con el resumen. */
  summary: WritableSignal<IVotingQueueSummary | null>;
  /** Senal de carga. */
  isLoading: WritableSignal<boolean>;
  /** Senal de error. */
  error: WritableSignal<string | null>;
  /** Senal de total en cola. */
  totalInQueue: WritableSignal<number>;
  /** Senal de pendientes. */
  pendingCount: WritableSignal<number>;
  /** Senal de votados. */
  votedCount: WritableSignal<number>;
  /** Senal del votante actual. */
  currentVoter: WritableSignal<IVotingQueueItem | null>;
  /** Senal del turno actual. */
  currentTurnNumber: WritableSignal<number | null>;
  /** Senal de items. */
  items: WritableSignal<IVotingQueueItem[]>;
  /** Metodo simulado loadQueue. */
  loadQueue: ReturnType<typeof vi.fn>;
  /** Metodo simulado generateDraw. */
  generateDraw: ReturnType<typeof vi.fn>;
}

describe('VotingQueueComponent', () => {
  let component: VotingQueueComponent;
  let fixture: ComponentFixture<VotingQueueComponent>;
  let mockQueueService: IMockQueueService;

  const sampleItems: IVotingQueueItem[] = [
    {
      id: 'turn-1',
      turnNumber: 1,
      userId: 'user-1',
      documentId: '1098765432',
      fullName: 'Carlos Gomez',
      status: 'VOTED',
      createdAt: '2026-10-21T10:00:00.000Z',
      votedAt: '2026-10-21T10:15:00.000Z',
    },
    {
      id: 'turn-2',
      turnNumber: 2,
      userId: 'user-2',
      documentId: '1098654321',
      fullName: 'Ana Ramirez',
      status: 'PENDING',
      createdAt: '2026-10-21T10:00:00.000Z',
      votedAt: null,
    },
  ];

  beforeEach(async () => {
    mockQueueService = {
      summary: signal<IVotingQueueSummary | null>({
        totalInQueue: 2,
        pendingCount: 1,
        votedCount: 1,
        currentTurnNumber: 2,
        currentVoter: sampleItems[1],
        items: sampleItems,
      }),
      isLoading: signal<boolean>(false),
      error: signal<string | null>(null),
      totalInQueue: signal<number>(2),
      pendingCount: signal<number>(1),
      votedCount: signal<number>(1),
      currentVoter: signal<IVotingQueueItem | null>(sampleItems[1]),
      currentTurnNumber: signal<number | null>(2),
      items: signal<IVotingQueueItem[]>(sampleItems),
      loadQueue: vi.fn(),
      generateDraw: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VotingQueueComponent],
      providers: [
        provideRouter([]),
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente y cargar la cola en ngOnInit', () => {
    expect(component).toBeTruthy();
    expect(mockQueueService.loadQueue).toHaveBeenCalledTimes(1);
  });

  it('debe filtrar los turnos por texto de busqueda (nombre o documento)', () => {
    component.onSearchInput('Ana');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].fullName).toBe('Ana Ramirez');

    component.onSearchInput('1098765432');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].documentId).toBe('1098765432');

    component.clearSearch();
    expect(component.filteredItems().length).toBe(2);
  });

  it('debe filtrar los turnos segun la pestaña activa', () => {
    component.setFilterTab('PENDING');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].status).toBe('PENDING');

    component.setFilterTab('VOTED');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].status).toBe('VOTED');

    component.setFilterTab('ALL');
    expect(component.filteredItems().length).toBe(2);
  });

  it('debe mostrar el dialogo de confirmacion cuando ya existen turnos y se pulsa sortear', () => {
    component.onDrawClick();
    expect(component.showConfirmDrawDialog()).toBe(true);

    component.cancelConfirmDraw();
    expect(component.showConfirmDrawDialog()).toBe(false);
    expect(mockQueueService.generateDraw).not.toHaveBeenCalled();
  });

  it('debe ejecutar el sorteo cuando se confirma en el dialogo', () => {
    component.onDrawClick();
    component.executeDraw();

    expect(component.showConfirmDrawDialog()).toBe(false);
    expect(mockQueueService.generateDraw).toHaveBeenCalledTimes(1);
  });
});
