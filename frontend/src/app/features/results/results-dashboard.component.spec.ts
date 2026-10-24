/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para ResultsDashboardComponent verificando el renderizado de conteo anonimo, apertura modal y exportacion a Excel.
 * [I/O]: Simula VotingStateService, MatDialog y ReportExportService; valida que solo las cedulas en lista blanca tengan acceso a auditoria y exportacion.
 * [Edge Cases]: Acceso denegado/oculto para usuarios estandar (RN-06), apertura exitosa de dialog y llamada a exportRoutesAndAttendees.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResultsDashboardComponent } from './results-dashboard.component';
import { VotingStateService } from '../../core/services/voting-state.service';
import { ReportExportService } from '../../core/services/report-export.service';
import { RouteAttendeesDialogComponent } from '../../shared/components/route-attendees-dialog/route-attendees-dialog.component';
import { IRouteDetailReport, IRoutePublicSummary } from '@shared/models/route.interface';

describe('ResultsDashboardComponent', () => {
  /** Componente bajo prueba. */
  let component: ResultsDashboardComponent;
  /** Fixture de pruebas. */
  let fixture: ComponentFixture<ResultsDashboardComponent>;
  /** Mock del servicio MatDialog. */
  let mockDialog: Partial<MatDialog>;
  /** Mock del servicio VotingStateService. */
  let mockVotingStateService: Partial<VotingStateService>;
  /** Mock del servicio ReportExportService. */
  let mockReportExportService: Partial<ReportExportService>;

  /** Datos de prueba con rutas de muestra. */
  const sampleRoutes: IRoutePublicSummary[] = [
    {
      id: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      occupiedSeats: 3,
      availableSeats: 4,
      isAvailable: true,
      exclusivityGroup: null,
    },
    {
      id: 2,
      slug: 'piedecuesta',
      name: 'Piedecuesta',
      dayNumber: 5,
      maxCapacity: 7,
      occupiedSeats: 7,
      availableSeats: 0,
      isAvailable: false,
      exclusivityGroup: null,
    },
  ];

  /** Datos simulados de reporte detallado con asistentes. */
  const sampleReport: IRouteDetailReport = {
    routeId: 1,
    slug: 'giron',
    name: 'Girón',
    dayNumber: 4,
    maxCapacity: 7,
    occupiedSeats: 3,
    attendees: [
      {
        documentId: 'DOC-001',
        fullName: 'Usuario Admin',
        confirmedAt: '2026-10-21T10:00:00.000Z',
      },
    ],
  };

  /**
   * Inicializa el entorno de prueba configurando el estado de autorizacion administrativo.
   * @param isAdmin Valor booleano para simular permisos de administrador.
   */
  const setupComponent = async (isAdmin: boolean) => {
    mockDialog = {
      open: vi.fn(),
    };

    mockReportExportService = {
      exportRoutesAndAttendees: vi.fn().mockResolvedValue(undefined),
    };

    mockVotingStateService = {
      routes: signal(sampleRoutes),
      isLoading: signal(false),
      loadRoutes: vi.fn().mockResolvedValue(undefined),
      loadRouteAttendees: vi.fn().mockResolvedValue(sampleReport),
      loadAllRouteAttendees: vi.fn().mockResolvedValue([sampleReport]),
      isAdmin: signal(isAdmin),
    };

    await TestBed.configureTestingModule({
      imports: [ResultsDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: VotingStateService, useValue: mockVotingStateService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ReportExportService, useValue: mockReportExportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('debe renderizar el tablero de resultados con tarjetas de rutas en modo público estándar', async () => {
    await setupComponent(false);

    expect(component).toBeDefined();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.results-page__title')?.textContent).toContain(
      'Resultados de la selección de Rutas.',
    );
    expect(compiled.querySelectorAll('.results-card').length).toBe(2);
    // El badge de auditoria no debe existir para usuarios no autorizados
    expect(compiled.querySelector('.results-page__admin-badge')).toBeNull();
    // Los botones de detalle no deben existir
    expect(compiled.querySelector('.results-card__detail-btn')).toBeNull();
    // El boton de exportar a Excel no debe existir
    expect(compiled.querySelector('.results-page__export-btn')).toBeNull();
  });

  it('debe renderizar botón de Ver Inscritos, badge de auditoría y botón de exportar Excel cuando isAdmin es true', async () => {
    await setupComponent(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.results-page__admin-badge')).not.toBeNull();
    expect(compiled.querySelector('.results-page__export-btn')).not.toBeNull();

    const detailButtons = compiled.querySelectorAll('.results-card__detail-btn');
    expect(detailButtons.length).toBe(2);
    expect(detailButtons[0].textContent).toContain('Ver Inscritos (3)');
  });

  it('debe abrir la modal RouteAttendeesDialogComponent al pulsar Ver Inscritos', async () => {
    await setupComponent(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const firstDetailButton = compiled.querySelector(
      '.results-card__detail-btn',
    ) as HTMLButtonElement;

    firstDetailButton.click();
    await fixture.whenStable();

    expect(mockVotingStateService.loadRouteAttendees).toHaveBeenCalledWith(1);
    expect(mockDialog.open).toHaveBeenCalledWith(RouteAttendeesDialogComponent, {
      data: sampleReport,
      width: '640px',
      maxWidth: '95vw',
    });
  });

  it('debe invocar la exportacion a Excel al presionar el boton Exportar Excel', async () => {
    await setupComponent(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const exportButton = compiled.querySelector(
      '.results-page__export-btn',
    ) as HTMLButtonElement;

    expect(exportButton).not.toBeNull();
    exportButton.click();
    await fixture.whenStable();

    expect(mockVotingStateService.loadAllRouteAttendees).toHaveBeenCalledTimes(1);
    expect(mockReportExportService.exportRoutesAndAttendees).toHaveBeenCalledWith([
      sampleReport,
    ]);
  });
});
