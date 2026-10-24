/**
 * @sdd
 * [Objetivo]: Componente dumb/presentacional para renderizar tarjetas de ruta turistica con estados visuales reactivos (RouteCardComponent).
 * [I/O - Reusabilidad]: Input: viewModel (IRouteCardViewModel). Output: selectRoute (emite routeId: number). Cero inyeccion de servicios.
 * [Edge Cases - UI]: Representacion de los 6 estados visuales (AVAILABLE, SELECTED, VOTED_BY_ME, LOCKED_EXCLUSION, LOCKED_FULL, LOCKED_MAX_SELECTED).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IRouteCardViewModel } from '@shared/models/route.interface';

/**
 * Componente presentacional de tarjeta de ruta turistica.
 */
@Component({
  selector: 'app-route-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './route-card.component.html',
  styleUrl: './route-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteCardComponent {
  /** Modelo de vista reactivo de la ruta. */
  readonly viewModel = input.required<IRouteCardViewModel>();

  /** Evento emitido al pulsar para seleccionar o desmarcar la ruta. */
  readonly selectRoute = output<number>();

  /** Porcentaje de ocupacion de cupos de la ruta (0 a 100). */
  readonly progressPercent = computed<number>(() => {
    const model = this.viewModel();
    return Math.min(100, (model.occupiedSeats / model.maxCapacity) * 100);
  });

  /** Clase modificadora BEM segun el estado visual de la ruta. */
  readonly statusModifierClass = computed<string>(() => {
    const status = this.viewModel().visualStatus;
    switch (status) {
      case 'SELECTED':
        return 'route-card--selected';
      case 'VOTED_BY_ME':
        return 'route-card--voted-by-me';
      case 'LOCKED_EXCLUSION':
        return 'route-card--locked-exclusion';
      case 'LOCKED_FULL':
        return 'route-card--locked-full';
      case 'LOCKED_MAX_SELECTED':
        return 'route-card--locked-max-selected';
      case 'AVAILABLE':
      default:
        return 'route-card--available';
    }
  });

  /** Indica si la tarjeta permite accion interactiva de seleccion/deseleccion. */
  readonly isInteractive = computed<boolean>(() => {
    const status = this.viewModel().visualStatus;
    return status === 'AVAILABLE' || status === 'SELECTED';
  });

  /**
   * Maneja el clic sobre el boton o tarjeta para emitir el evento al contenedor inteligente.
   */
  onSelect(): void {
    if (this.isInteractive()) {
      this.selectRoute.emit(this.viewModel().id);
    }
  }
}
