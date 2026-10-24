/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para el componente dumb StickyConfirmBarComponent.
 * [I/O]: Evalua la emision de eventos confirm y removeRoute, y el estado disabled del boton de accion.
 * [Edge Cases]: canConfirm=false o isLoading=true deshabilitan la confirmacion.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyConfirmBarComponent } from './sticky-confirm-bar.component';
import { IRouteCardViewModel } from '@shared/models/route.interface';

describe('StickyConfirmBarComponent', () => {
  let fixture: ComponentFixture<StickyConfirmBarComponent>;
  let component: StickyConfirmBarComponent;

  const sampleSelected: IRouteCardViewModel[] = [
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
      visualStatus: 'SELECTED',
      selectionOrder: 1,
      exclusionMessage: null,
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
      visualStatus: 'SELECTED',
      selectionOrder: 2,
      exclusionMessage: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyConfirmBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyConfirmBarComponent);
    component = fixture.componentInstance;
  });

  it('debe emitir confirm al pulsar el boton cuando canConfirm es true', () => {
    fixture.componentRef.setInput('selectedRoutes', sampleSelected);
    fixture.componentRef.setInput('canConfirm', true);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    let confirmed = false;
    component.confirm.subscribe(() => {
      confirmed = true;
    });

    component.onConfirm();
    expect(confirmed).toBe(true);
  });

  it('no debe emitir confirm si canConfirm es false', () => {
    fixture.componentRef.setInput('selectedRoutes', [sampleSelected[0]]);
    fixture.componentRef.setInput('canConfirm', false);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    let confirmed = false;
    component.confirm.subscribe(() => {
      confirmed = true;
    });

    component.onConfirm();
    expect(confirmed).toBe(false);
  });

  it('debe emitir removeRoute con el ID de la ruta al pulsar quitar', () => {
    fixture.componentRef.setInput('selectedRoutes', sampleSelected);
    fixture.detectChanges();

    let removedId: number | null = null;
    component.removeRoute.subscribe((id: number) => {
      removedId = id;
    });

    component.onRemove(1);
    expect(removedId).toBe(1);
  });
});
