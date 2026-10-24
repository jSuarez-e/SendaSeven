/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para ApiService validando las peticiones HTTP y resolucion de endpoints hacia environment.apiUrl.
 * [I/O]: Evalua llamadas login, getRoutes, confirmVotes, getRouteAttendees, getQueueSummary y generateDraw contra HttpTestingController.
 * [Edge Cases]: Verificacion de rutas relativas al baseUrl configurado y parametros de consulta en getRouteAttendees.
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { environment as prodEnvironment } from '../../../environments/environment.prod';
import { IAuthUserResponse } from '@shared/models/user.interface';
import {
  IRouteDetailReport,
  IRoutePublicSummary,
} from '@shared/models/route.interface';
import {
  IVoteConfirmationResponse,
  IVoteSubmissionPayload,
} from '@shared/models/vote.interface';
import { IVotingQueueSummary } from '@shared/models/voting-queue.interface';

describe('ApiService', () => {
  let service: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debe crearse correctamente e inicializar baseUrl desde environment.apiUrl', () => {
    expect(service).toBeTruthy();
    expect(environment.apiUrl).toBeDefined();
    expect(prodEnvironment.apiUrl).toBe('https://sendaseven.onrender.com/api');
    expect(prodEnvironment.production).toBe(true);
  });

  it('debe ejecutar POST login con el documento del usuario', () => {
    const mockResponse: IAuthUserResponse = {
      id: 'user-1',
      documentId: '1098700001',
      fullName: 'Andrea Carolina Rojas',
      hasVoted: false,
      votedRouteIds: [],
    };

    service.login('1098700001').subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/auth/login`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ documentId: '1098700001' });
    req.flush(mockResponse);
  });

  it('debe ejecutar GET routes para obtener catalogo anonimo', () => {
    const mockRoutes: IRoutePublicSummary[] = [
      {
        id: 1,
        slug: 'giron',
        name: 'Girón Colonial',
        dayNumber: 1,
        maxCapacity: 7,
        occupiedSeats: 3,
        availableSeats: 4,
        isAvailable: true,
        exclusivityGroup: null,
      },
    ];

    service.getRoutes().subscribe((routes) => {
      expect(routes).toEqual(mockRoutes);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/routes`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockRoutes);
  });

  it('debe ejecutar POST confirmVotes con el lote de 2 votos', () => {
    const mockConfirmation: IVoteConfirmationResponse = {
      success: true,
      message: 'Votos confirmados con exito',
      votedRouteIds: [1, 2],
      confirmedAt: '2026-10-23T22:00:00.000Z',
    };

    const payload: IVoteSubmissionPayload = {
      documentId: '1098700001',
      routeIds: [1, 2],
    };

    service.confirmVotes('1098700001', [1, 2]).subscribe((response) => {
      expect(response).toEqual(mockConfirmation);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/votes`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockConfirmation);
  });

  it('debe ejecutar GET route attendees con documentId opcional para administradores', () => {
    const mockReport: IRouteDetailReport = {
      routeId: 1,
      slug: 'giron',
      name: 'Girón Colonial',
      dayNumber: 1,
      maxCapacity: 7,
      occupiedSeats: 1,
      attendees: [
        {
          documentId: '1098700001',
          fullName: 'Andrea Carolina Rojas',
          confirmedAt: '2026-10-23T22:00:00.000Z',
        },
      ],
    };

    service.getRouteAttendees(1, '1098700001').subscribe((report) => {
      expect(report).toEqual(mockReport);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/routes/1/attendees?documentId=1098700001`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockReport);
  });

  it('debe ejecutar GET queue summary', () => {
    const mockQueue: IVotingQueueSummary = {
      totalInQueue: 1,
      pendingCount: 1,
      votedCount: 0,
      currentTurnNumber: 1,
      currentVoter: null,
      items: [],
    };

    service.getQueueSummary().subscribe((summary) => {
      expect(summary).toEqual(mockQueue);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/queue`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockQueue);
  });

  it('debe ejecutar POST queue draw para nuevo sorteo', () => {
    const mockQueue: IVotingQueueSummary = {
      totalInQueue: 1,
      pendingCount: 1,
      votedCount: 0,
      currentTurnNumber: 1,
      currentVoter: null,
      items: [],
    };

    service.generateDraw().subscribe((summary) => {
      expect(summary).toEqual(mockQueue);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/queue/draw`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockQueue);
  });
});
