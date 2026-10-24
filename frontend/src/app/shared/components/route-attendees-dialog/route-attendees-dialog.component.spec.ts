/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para el componente modal RouteAttendeesDialogComponent.
 * [I/O]: Simula MAT_DIALOG_DATA con IRouteDetailReport y valida el renderizado de la tabla y llamada a dialogRef.close().
 * [Edge Cases]: Renderizado condicional del mensaje de vacio cuando no hay personas inscritas.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RouteAttendeesDialogComponent } from './route-attendees-dialog.component';
import { IRouteDetailReport } from '@shared/models/route.interface';

describe('RouteAttendeesDialogComponent', () => {
  let component: RouteAttendeesDialogComponent;
  let fixture: ComponentFixture<RouteAttendeesDialogComponent>;
  let mockDialogRef: MatDialogRef<RouteAttendeesDialogComponent>;

  const sampleReportWithAttendees: IRouteDetailReport = {
    routeId: 1,
    slug: 'giron',
    name: 'Girón',
    dayNumber: 4,
    maxCapacity: 7,
    occupiedSeats: 2,
    attendees: [
      {
        documentId: '1098765432',
        fullName: 'Carlos Santana',
        confirmedAt: '2026-10-21T14:00:00.000Z',
      },
      {
        documentId: 'DOC-002',
        fullName: 'Maria Rodriguez',
        confirmedAt: '2026-10-21T14:05:00.000Z',
      },
    ],
  };

  const sampleEmptyReport: IRouteDetailReport = {
    routeId: 2,
    slug: 'piedecuesta',
    name: 'Piedecuesta',
    dayNumber: 5,
    maxCapacity: 7,
    occupiedSeats: 0,
    attendees: [],
  };

  /**
   * Helper para inicializar el componente de pruebas con datos simulados del diálogo.
   * @param data Datos del reporte de ruta para el diálogo.
   */
  const createComponentWithData = async (data: IRouteDetailReport) => {
    mockDialogRef = {
      close: vi.fn(),
    } as unknown as MatDialogRef<RouteAttendeesDialogComponent>;

    await TestBed.configureTestingModule({
      imports: [RouteAttendeesDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteAttendeesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('debe desplegar el nombre de la ruta, día y tabla con asistentes registrados', async () => {
    await createComponentWithData(sampleReportWithAttendees);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.attendees-dialog__title')?.textContent).toContain('Girón');
    expect(compiled.querySelector('.attendees-dialog__badge')?.textContent).toContain('Día 4');
    expect(compiled.querySelectorAll('.attendees-dialog__table tbody tr').length).toBe(2);
    expect(compiled.textContent).toContain('Carlos Santana');
    expect(compiled.textContent).toContain('Maria Rodriguez');
  });

  it('debe desplegar mensaje de vacío si no hay inscritos', async () => {
    await createComponentWithData(sampleEmptyReport);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.attendees-dialog__empty-text')?.textContent).toContain(
      'No hay personas inscritas aún',
    );
    expect(compiled.querySelector('.attendees-dialog__table')).toBeNull();
  });

  it('debe invocar dialogRef.close al presionar el botón de cerrar', async () => {
    await createComponentWithData(sampleReportWithAttendees);

    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });
});
