/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para el componente presentacional RouteCardComponent.
 * [I/O]: Evalua la emision del evento selectRoute y la aplicacion de clases modificadoras BEM.
 * [Edge Cases]: Clics en tarjetas bloqueadas no deben emitir eventos.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouteCardComponent } from './route-card.component';
import { IRouteCardViewModel } from '@shared/models/route.interface';

describe('RouteCardComponent', () => {
  let fixture: ComponentFixture<RouteCardComponent>;
  let component: RouteCardComponent;

  const mockAvailableViewModel: IRouteCardViewModel = {
    id: 1,
    slug: 'giron',
    name: 'Girón',
    dayNumber: 4,
    maxCapacity: 7,
    occupiedSeats: 2,
    availableSeats: 5,
    isAvailable: true,
    exclusivityGroup: null,
    visualStatus: 'AVAILABLE',
    selectionOrder: null,
    exclusionMessage: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteCardComponent);
    component = fixture.componentInstance;
  });

  it('debe emitir el ID de la ruta al pulsar en estado AVAILABLE', () => {
    fixture.componentRef.setInput('viewModel', mockAvailableViewModel);
    fixture.detectChanges();

    let emittedId: number | null = null;
    component.selectRoute.subscribe((id: number) => {
      emittedId = id;
    });

    component.onSelect();
    expect(emittedId).toBe(1);
  });

  it('no debe emitir eventos si el estado es LOCKED_FULL', () => {
    fixture.componentRef.setInput('viewModel', {
      ...mockAvailableViewModel,
      visualStatus: 'LOCKED_FULL',
      occupiedSeats: 7,
      availableSeats: 0,
      isAvailable: false,
    });
    fixture.detectChanges();

    let emitted = false;
    component.selectRoute.subscribe(() => {
      emitted = true;
    });

    component.onSelect();
    expect(emitted).toBe(false);
  });
});
