/**
 * @sdd
 * [Objetivo]: Componente dumb/presentacional para la barra inferior fija de confirmacion de votos (StickyConfirmBarComponent).
 * [I/O - Reusabilidad]: Inputs: selectedRoutes, canConfirm, isLoading. Outputs: confirm, removeRoute. Cero inyeccion de servicios.
 * [Edge Cases - UI]: Barra sticky inferior; deshabilitacion en carga; remocion individual de rutas en borrador.
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IRouteCardViewModel } from '@shared/models/route.interface';

/**
 * Componente presentacional de barra inferior fija de confirmacion.
 */
@Component({
  selector: 'app-sticky-confirm-bar',
  imports: [MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './sticky-confirm-bar.component.html',
  styleUrl: './sticky-confirm-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyConfirmBarComponent {
  /** Listado de rutas actualmente seleccionadas en borrador. */
  readonly selectedRoutes = input.required<IRouteCardViewModel[]>();

  /** Bandera que habilita el boton de confirmacion (exactamente 2 rutas validas). */
  readonly canConfirm = input<boolean>(false);

  /** Indica si la transaccion se encuentra en proceso en el backend. */
  readonly isLoading = input<boolean>(false);

  /** Evento emitido al pulsar 'Confirmar mis rutas'. */
  readonly confirm = output<void>();

  /** Evento emitido al desmarcar una ruta desde la barra inferior. */
  readonly removeRoute = output<number>();

  /**
   * Dispara el evento de confirmacion.
   */
  onConfirm(): void {
    if (this.canConfirm() && !this.isLoading()) {
      this.confirm.emit();
    }
  }

  /**
   * Dispara la remocion de una ruta individual.
   * @param routeId Identificador de la ruta a retirar.
   */
  onRemove(routeId: number): void {
    this.removeRoute.emit(routeId);
  }
}
