/**
 * @sdd
 * [Objetivo]: Vista inteligente del tablero de votacion interactivo de 12 rutas (VotingBoardComponent).
 * [I/O]: Consume VotingStateService; orquesta el grid de RouteCardComponent y la barra StickyConfirmBarComponent.
 * [Edge Cases]: Carga inicial de rutas, renderizado adaptativo de los 6 estados visuales, gestion de notificaciones de exito y error.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VotingStateService } from '../../core/services/voting-state.service';
import { RouteCardComponent } from '../../shared/components/route-card/route-card.component';
import { StickyConfirmBarComponent } from '../../shared/components/sticky-confirm-bar/sticky-confirm-bar.component';
import { IRouteCardViewModel } from '@shared/models/route.interface';

/**
 * Componente contenedor inteligente para el tablero de votacion.
 */
@Component({
  selector: 'app-voting-board',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouteCardComponent,
    StickyConfirmBarComponent,
  ],
  templateUrl: './voting-board.component.html',
  styleUrl: './voting-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotingBoardComponent implements OnInit {
  /** Servicio central de estado reactivo. */
  protected readonly state = inject(VotingStateService);

  /** Modelos de vista de las tarjetas actualmente seleccionadas en borrador. */
  protected readonly selectedCards = computed<IRouteCardViewModel[]>(() => {
    return this.state
      .cardViewModels()
      .filter((card) => card.visualStatus === 'SELECTED');
  });

  /**
   * Carga inicial del catalogo de rutas.
   */
  async ngOnInit(): Promise<void> {
    await this.state.loadRoutes();
  }

  /**
   * Ejecuta la confirmacion atomica de las 2 rutas seleccionadas.
   */
  async onConfirmVotes(): Promise<void> {
    await this.state.confirmVotes();
  }

  /**
   * Alterna la seleccion de una ruta.
   * @param routeId Identificador de la ruta a alternar.
   */
  onToggleRoute(routeId: number): void {
    this.state.toggleRouteSelection(routeId);
  }
}
