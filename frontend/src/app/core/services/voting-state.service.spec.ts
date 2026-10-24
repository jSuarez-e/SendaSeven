/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para VotingStateService verificando exhaustivamente la maquina de estados reactiva de las 12 rutas.
 * [I/O]: Simula ApiService y evalua cardViewModels() para AVAILABLE, SELECTED, VOTED_BY_ME, LOCKED_EXCLUSION, LOCKED_FULL y LOCKED_MAX_SELECTED.
 * [Edge Cases]: Exclusion mutua reactiva instantanea Villanueva/Barichara y verificacion del limite de 2 selecciones.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VotingStateService } from './voting-state.service';
import { ApiService } from './api.service';
import {
  IRouteDetailReport,
  IRoutePublicSummary,
} from '@shared/models/route.interface';
import {
  ADMIN_DOCUMENTS_WHITELIST,
  EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA,
} from '@shared/constants/routes.constants';

describe('VotingStateService', () => {
  let service: VotingStateService;
  let mockApiService: ApiService;

  const sampleRoutes: IRoutePublicSummary[] = [
    {
      id: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      occupiedSeats: 2,
      availableSeats: 5,
      isAvailable: true,
      exclusivityGroup: null,
    },
    {
      id: 2,
      slug: 'piedecuesta',
      name: 'Piedecuesta',
      dayNumber: 5,
      maxCapacity: 7,
      occupiedSeats: 7, // LLENA
      availableSeats: 0,
      isAvailable: false,
      exclusivityGroup: null,
    },
    {
      id: 4,
      slug: 'villanueva',
      name: 'Villanueva',
      dayNumber: 7,
      maxCapacity: 7,
      occupiedSeats: 1,
      availableSeats: 6,
      isAvailable: true,
      exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA,
    },
    {
      id: 5,
      slug: 'barichara',
      name: 'Barichara',
      dayNumber: 8,
      maxCapacity: 7,
      occupiedSeats: 3,
      availableSeats: 4,
      isAvailable: true,
      exclusivityGroup: EXCLUSIVITY_GROUP_VILLANUEVA_BARICHARA,
    },
    {
      id: 6,
      slug: 'contratacion',
      name: 'Contratación',
      dayNumber: 9,
      maxCapacity: 7,
      occupiedSeats: 0,
      availableSeats: 7,
      isAvailable: true,
      exclusivityGroup: null,
    },
  ];

  beforeEach(() => {
    mockApiService = {
      login: vi.fn(),
      getRoutes: vi.fn().mockReturnValue(of(sampleRoutes)),
      confirmVotes: vi.fn(),
      getRouteAttendees: vi.fn(),
    } as unknown as ApiService;

    TestBed.configureTestingModule({
      providers: [
        VotingStateService,
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(VotingStateService);
    service.routes.set(sampleRoutes);
  });

  it('debe calcular estado AVAILABLE para rutas con cupo y sin restricciones', () => {
    const cards = service.cardViewModels();
    const gironCard = cards.find((card) => card.id === 1);

    expect(gironCard).toBeDefined();
    expect(gironCard?.visualStatus).toBe('AVAILABLE');
  });

  it('debe calcular estado LOCKED_FULL para rutas con 7 cupos ocupados', () => {
    const cards = service.cardViewModels();
    const piedecuestaCard = cards.find((card) => card.id === 2);

    expect(piedecuestaCard?.visualStatus).toBe('LOCKED_FULL');
    expect(piedecuestaCard?.exclusionMessage).toContain('Cupo Lleno');
  });

  it('debe calcular estado SELECTED con orden 1 al marcar la primera ruta', () => {
    service.toggleRouteSelection(1);

    const cards = service.cardViewModels();
    const gironCard = cards.find((card) => card.id === 1);

    expect(gironCard?.visualStatus).toBe('SELECTED');
    expect(gironCard?.selectionOrder).toBe(1);
    expect(service.selectedCount()).toBe(1);
    expect(service.canConfirm()).toBe(false);
  });

  it('debe bloquear Barichara con LOCKED_EXCLUSION si se selecciona Villanueva (RN-05)', () => {
    // Seleccionar Villanueva (ID 4)
    service.toggleRouteSelection(4);

    const cards = service.cardViewModels();
    const villanuevaCard = cards.find((card) => card.id === 4);
    const baricharaCard = cards.find((card) => card.id === 5);

    expect(villanuevaCard?.visualStatus).toBe('SELECTED');
    expect(baricharaCard?.visualStatus).toBe('LOCKED_EXCLUSION');
    expect(baricharaCard?.exclusionMessage).toBe(
      'Bloqueada por selección de Villanueva',
    );
  });

  it('debe calcular LOCKED_MAX_SELECTED en las demas rutas al alcanzar 2 selecciones y habilitar canConfirm', () => {
    service.currentUser.set({
      id: 'uuid-1',
      documentId: '1098765432',
      fullName: 'Carlos Santana',
      hasVoted: false,
      votedRouteIds: [],
    });

    service.toggleRouteSelection(1);
    service.toggleRouteSelection(6);

    const cards = service.cardViewModels();
    const gironCard = cards.find((card) => card.id === 1);
    const contratacionCard = cards.find((card) => card.id === 6);
    const villanuevaCard = cards.find((card) => card.id === 4);

    expect(gironCard?.selectionOrder).toBe(1);
    expect(contratacionCard?.selectionOrder).toBe(2);
    expect(villanuevaCard?.visualStatus).toBe('LOCKED_MAX_SELECTED');
    expect(service.canConfirm()).toBe(true);
  });

  it('debe calcular estado VOTED_BY_ME para rutas confirmadas previamente por el usuario', () => {
    service.currentUser.set({
      id: 'uuid-1',
      documentId: '1098765432',
      fullName: 'Carlos Santana',
      hasVoted: true,
      votedRouteIds: [1, 4],
    });

    const cards = service.cardViewModels();
    const gironCard = cards.find((card) => card.id === 1);
    const villanuevaCard = cards.find((card) => card.id === 4);

    expect(gironCard?.visualStatus).toBe('VOTED_BY_ME');
    expect(villanuevaCard?.visualStatus).toBe('VOTED_BY_ME');
  });

  it('debe calcular isAdmin como true solo para documentos en lista blanca', () => {
    expect(service.isAdmin()).toBe(false);

    service.currentUser.set({
      id: 'uuid-1',
      documentId: 'DOC-REGULAR',
      fullName: 'Usuario Comun',
      hasVoted: false,
      votedRouteIds: [],
    });
    expect(service.isAdmin()).toBe(false);

    service.currentUser.set({
      id: 'uuid-2',
      documentId: ADMIN_DOCUMENTS_WHITELIST[0],
      fullName: 'Administrador',
      hasVoted: false,
      votedRouteIds: [],
    });
    expect(service.isAdmin()).toBe(true);
  });

  it('debe obtener asistentes con loadRouteAttendees si el usuario es admin', async () => {
    service.currentUser.set({
      id: 'uuid-2',
      documentId: ADMIN_DOCUMENTS_WHITELIST[0],
      fullName: 'Administrador',
      hasVoted: false,
      votedRouteIds: [],
    });

    const mockReport: IRouteDetailReport = {
      routeId: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      occupiedSeats: 1,
      attendees: [
        {
          documentId: '1098765432',
          fullName: 'Carlos Santana',
          confirmedAt: '2026-10-21T18:00:00.000Z',
        },
      ],
    };

    vi.mocked(mockApiService.getRouteAttendees).mockReturnValue(of(mockReport));

    const result = await service.loadRouteAttendees(1);
    expect(result).toEqual(mockReport);
    expect(mockApiService.getRouteAttendees).toHaveBeenCalledWith(
      1,
      ADMIN_DOCUMENTS_WHITELIST[0],
    );
  });

  it('debe retornar null en loadRouteAttendees si el usuario no es admin', async () => {
    service.currentUser.set({
      id: 'uuid-1',
      documentId: 'DOC-REGULAR',
      fullName: 'Usuario Comun',
      hasVoted: false,
      votedRouteIds: [],
    });

    const result = await service.loadRouteAttendees(1);
    expect(result).toBeNull();
    expect(mockApiService.getRouteAttendees).not.toHaveBeenCalled();
  });

  it('debe obtener todos los reportes de rutas con loadAllRouteAttendees si el usuario es admin', async () => {
    service.currentUser.set({
      id: 'uuid-2',
      documentId: ADMIN_DOCUMENTS_WHITELIST[0],
      fullName: 'Administrador',
      hasVoted: false,
      votedRouteIds: [],
    });

    const mockReport: IRouteDetailReport = {
      routeId: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      occupiedSeats: 1,
      attendees: [],
    };

    vi.mocked(mockApiService.getRouteAttendees).mockReturnValue(of(mockReport));

    const results = await service.loadAllRouteAttendees();
    expect(results).toHaveLength(service.routes().length);
    expect(mockApiService.getRouteAttendees).toHaveBeenCalled();
  });

  it('debe retornar null en loadAllRouteAttendees si el usuario no es admin', async () => {
    service.currentUser.set({
      id: 'uuid-1',
      documentId: 'DOC-REGULAR',
      fullName: 'Usuario Comun',
      hasVoted: false,
      votedRouteIds: [],
    });

    const results = await service.loadAllRouteAttendees();
    expect(results).toBeNull();
  });
});
