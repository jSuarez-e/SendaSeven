/**
 * @sdd
 * [Objetivo]: Vista inteligente para la administracion y visualizacion del sorteo aleatorio controlado de turnos de votacion.
 * [I/O]: Consume QueueService; expone senales filtradas por documento/nombre y estado (ALL, PENDING, VOTED); gestiona ejecucion de sorteo.
 * [Edge Cases]: Cola no inicializada, todos votaron, busqueda sin coincidencias, confirmacion de regeneracion de sorteo.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { QueueService } from '../../core/services/queue.service';
import {
  IVotingQueueItem,
  VotingQueueStatus,
} from '@shared/models/voting-queue.interface';

/** Tipo de filtro de visualizacion para los turnos. */
export type QueueFilterTab = 'ALL' | 'PENDING' | 'VOTED';

/**
 * Componente de administracion y visualizacion de la cola y sorteo de votacion.
 */
@Component({
  selector: 'app-voting-queue',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './voting-queue.component.html',
  styleUrl: './voting-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotingQueueComponent implements OnInit {
  /** Servicio reactivo de cola inyectado. */
  readonly queueService = inject(QueueService);

  /** Criterio de busqueda textual por nombre o documento. */
  readonly searchQuery = signal<string>('');

  /** Pestaña de filtro activa (ALL, PENDING, VOTED). */
  readonly activeFilterTab = signal<QueueFilterTab>('ALL');

  /** Bandera para mostrar confirmacion antes de regenerar el sorteo si ya existen turnos. */
  readonly showConfirmDrawDialog = signal<boolean>(false);

  /** Listado de turnos filtrados dinamicamente por busqueda y pestaña. */
  readonly filteredItems = computed<IVotingQueueItem[]>(() => {
    const rawItems = this.queueService.items();
    const query = this.searchQuery().trim().toLowerCase();
    const activeTab = this.activeFilterTab();

    return rawItems.filter((item) => {
      // Filtro por pestaña
      const matchesTab =
        activeTab === 'ALL' || item.status === (activeTab as VotingQueueStatus);

      if (!matchesTab) {
        return false;
      }

      // Filtro por texto de busqueda
      if (!query) {
        return true;
      }

      const matchesDoc = item.documentId.toLowerCase().includes(query);
      const matchesName = item.fullName.toLowerCase().includes(query);
      const matchesTurn = item.turnNumber.toString() === query;

      return matchesDoc || matchesName || matchesTurn;
    });
  });

  /**
   * Carga inicial del estado de la cola al montar el componente.
   */
  ngOnInit(): void {
    this.queueService.loadQueue();
  }

  /**
   * Actualiza el termino de busqueda.
   * @param query Termino ingresado por el usuario.
   */
  onSearchInput(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Limpia el campo de busqueda.
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * Cambia la pestaña de filtro activa.
   * @param tab Pestaña seleccionada.
   */
  setFilterTab(tab: QueueFilterTab): void {
    this.activeFilterTab.set(tab);
  }

  /**
   * Recarga manualmente los datos de la cola.
   */
  onRefresh(): void {
    this.queueService.loadQueue();
  }

  /**
   * Solicita confirmacion o ejecuta el sorteo aleatorio controlado.
   */
  onDrawClick(): void {
    const totalItems = this.queueService.totalInQueue();
    if (totalItems > 0) {
      this.showConfirmDrawDialog.set(true);
    } else {
      this.executeDraw();
    }
  }

  /**
   * Cancela el dialogo de confirmacion del sorteo.
   */
  cancelConfirmDraw(): void {
    this.showConfirmDrawDialog.set(false);
  }

  /**
   * Ejecuta el sorteo llamando al servicio y cierra el dialogo de confirmacion.
   */
  executeDraw(): void {
    this.showConfirmDrawDialog.set(false);
    this.queueService.generateDraw();
  }
}
